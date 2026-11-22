import type { Id, SavedTab, Stack } from '../domain/types';

export interface ChangeSet {
  rev: number;
  stacksUpserted: Stack[];
  stacksDeletedIds: Id[];
  tabsUpserted: SavedTab[];
  tabsDeletedIds: Id[];
}

export interface NormalizedState {
  rev: number;
  stacks: Map<Id, Stack>;
  tabs: Map<Id, SavedTab>;
}

export function emptyState(): NormalizedState {
  return { rev: 0, stacks: new Map(), tabs: new Map() };
}

export function applyChangeSet(state: NormalizedState, change: ChangeSet): NormalizedState {
  const stacks = new Map(state.stacks);
  const tabs = new Map(state.tabs);
  for (const stack of change.stacksUpserted) stacks.set(stack.id, stack);
  for (const id of change.stacksDeletedIds) stacks.delete(id);
  for (const tab of change.tabsUpserted) tabs.set(tab.id, tab);
  for (const id of change.tabsDeletedIds) tabs.delete(id);
  return { rev: change.rev, stacks, tabs };
}

export function needsResync(state: NormalizedState, change: ChangeSet): boolean {
  return state.rev !== 0 && change.rev !== state.rev + 1;
}

const CHANNEL = 'stow:changes';

let channel: BroadcastChannel | null = null;

function bus(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  channel ??= new BroadcastChannel(CHANNEL);
  return channel;
}

export function publishChange(change: ChangeSet): void {
  bus()?.postMessage(change);
}

export function subscribeChanges(listener: (change: ChangeSet) => void): () => void {
  const bc = bus();
  if (!bc) return () => {};
  const handler = (event: MessageEvent<ChangeSet>) => listener(event.data);
  bc.addEventListener('message', handler);
  return () => bc.removeEventListener('message', handler);
}
