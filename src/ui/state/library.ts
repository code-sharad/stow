import { create } from 'zustand';
import type { ChangeSet } from '../../core/db/changes';
import { needsResync, subscribeChanges } from '../../core/db/changes';
import { getLiveTabs, getMeta, getStacks } from '../../core/db/repo';
import type { Id, SavedTab, Stack } from '../../core/domain/types';

function sortStacks(a: Stack, b: Stack): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0;
}

function sortTabs(a: SavedTab, b: SavedTab): number {
  return a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0;
}

export interface LibraryData {
  rev: number;
  stacks: Stack[];
  tabsByStack: Record<Id, SavedTab[]>;
  tabIndex: Record<Id, SavedTab>;
}

interface LibraryState extends LibraryData {
  loaded: boolean;
  error: string | null;
  selected: Set<Id>;
  focusedId: Id | null;
  lastStowStackIds: Id[];
  init: () => Promise<void>;
  reload: () => Promise<void>;
  accept: (change: ChangeSet) => void;
  setSelected: (ids: Iterable<Id>) => void;
  toggleSelected: (id: Id, additive?: boolean) => void;
  clearSelection: () => void;
  setFocused: (id: Id | null) => void;
  markStowed: (ids: Id[]) => void;
}

function groupTabs(tabs: SavedTab[]): Pick<LibraryData, 'tabsByStack' | 'tabIndex'> {
  const tabsByStack: Record<Id, SavedTab[]> = {};
  const tabIndex: Record<Id, SavedTab> = {};
  for (const tab of tabs) {
    if (tab.deletedAt !== 0) continue;
    tabIndex[tab.id] = tab;
    const list = tabsByStack[tab.stackId] ?? [];
    list.push(tab);
    tabsByStack[tab.stackId] = list;
  }
  for (const list of Object.values(tabsByStack)) list.sort(sortTabs);
  return { tabsByStack, tabIndex };
}

function derive(stacks: Stack[], tabs: SavedTab[]): LibraryData {
  const live = stacks.filter((stack) => stack.deletedAt === 0).sort(sortStacks);
  return { rev: 0, stacks: live, ...groupTabs(tabs) };
}

let unsubscribe: (() => void) | null = null;

export const useLibrary = create<LibraryState>((set, get) => ({
  rev: 0,
  stacks: [],
  tabsByStack: {},
  tabIndex: {},
  loaded: false,
  error: null,
  selected: new Set(),
  focusedId: null,
  lastStowStackIds: [],
  init: async () => {
    if (unsubscribe) return;
    await get().reload();
    unsubscribe = subscribeChanges((change) => get().accept(change));
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void get().reload();
      });
    }
  },
  reload: async () => {
    try {
      const [stacks, tabs, rev] = await Promise.all([
        getStacks(),
        getLiveTabs(),
        getMeta<number>('rev'),
      ]);
      const data = derive(stacks, tabs);
      set({ ...data, rev: rev ?? 0, loaded: true, error: null });
    } catch (error) {
      set({
        loaded: true,
        error: error instanceof Error ? error.name : 'unknown',
      });
    }
  },
  accept: (change) => {
    const state = get();
    if (needsResync({ rev: state.rev, stacks: new Map(), tabs: new Map() }, change)) {
      void get().reload();
      return;
    }
    const stacks = new Map(state.stacks.map((stack) => [stack.id, stack]));
    const tabs = new Map(Object.entries(state.tabIndex));
    for (const stack of change.stacksUpserted) stacks.set(stack.id, stack);
    for (const id of change.stacksDeletedIds) stacks.delete(id);
    for (const tab of change.tabsUpserted) tabs.set(tab.id, tab);
    for (const id of change.tabsDeletedIds) tabs.delete(id);
    const liveStacks = [...stacks.values()]
      .filter((stack) => stack.deletedAt === 0)
      .sort(sortStacks);
    const liveTabs = [...tabs.values()].filter((tab) => tab.deletedAt === 0);
    const selected = new Set([...state.selected].filter((id) => tabs.get(id)?.deletedAt === 0));
    set({ ...derive(liveStacks, liveTabs), rev: change.rev, selected });
  },
  setSelected: (ids) => set({ selected: new Set(ids) }),
  toggleSelected: (id, additive = true) => {
    const selected = new Set(additive ? get().selected : []);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    set({ selected });
  },
  clearSelection: () => set({ selected: new Set() }),
  setFocused: (id) => set({ focusedId: id }),
  markStowed: (ids) => set({ lastStowStackIds: ids }),
}));

export function useStackTabs(stackId: Id): SavedTab[] {
  return useLibrary((state) => state.tabsByStack[stackId] ?? []);
}
