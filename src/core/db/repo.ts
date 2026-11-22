import { ulid } from 'ulid';
import { LIMITS } from '../../shared/constants';
import { keyBetween, keysAfter, keysBefore } from '../domain/order';
import type { StowPlan } from '../domain/plan';
import type { Id, Operation, OperationKind, SavedTab, Stack } from '../domain/types';
import { type ChangeSet, publishChange } from './changes';
import { db } from './schema';

export class RepoError extends Error {
  readonly code: string;
  constructor(code: string, message = code) {
    super(message);
    this.name = 'RepoError';
    this.code = code;
  }
}

export interface MutationResult {
  change: ChangeSet;
  opId: Id;
}

const now = () => Date.now();

function sortStacks(a: Stack, b: Stack): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0;
}

function sortTabs(a: SavedTab, b: SavedTab): number {
  return a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0;
}

async function liveStacks(): Promise<Stack[]> {
  return (
    await db()
      .stacks.filter((s) => s.deletedAt === 0)
      .toArray()
  ).sort(sortStacks);
}

async function liveTabsForStacks(stackIds: readonly Id[]): Promise<SavedTab[]> {
  if (stackIds.length === 0) return [];
  const rows = await db()
    .tabs.where('stackId')
    .anyOf([...stackIds])
    .toArray();
  return rows.filter((tab) => tab.deletedAt === 0).sort(sortTabs);
}

async function bumpRev(): Promise<number> {
  const row = await db().meta.get('rev');
  const current = typeof row?.value === 'number' ? row.value : 0;
  const next = current + 1;
  await db().meta.put({ key: 'rev', value: next });
  return next;
}

async function recomputeCounts(stackIds: Iterable<Id>): Promise<Stack[]> {
  const ids = [...new Set(stackIds)];
  if (ids.length === 0) return [];
  const rows = await db().tabs.where('stackId').anyOf(ids).toArray();
  const counts = new Map<Id, number>();
  for (const tab of rows) {
    if (tab.deletedAt === 0) counts.set(tab.stackId, (counts.get(tab.stackId) ?? 0) + 1);
  }
  const updated: Stack[] = [];
  for (const id of ids) {
    const stack = await db().stacks.get(id);
    if (!stack) continue;
    const tabCount = counts.get(id) ?? 0;
    if (stack.tabCount !== tabCount) {
      const next = { ...stack, tabCount, updatedAt: now() };
      await db().stacks.put(next);
      updated.push(next);
    } else {
      updated.push(stack);
    }
  }
  return updated;
}

async function lockedStackIds(): Promise<Set<Id>> {
  const stacks = await liveStacks();
  return new Set(stacks.filter((stack) => stack.locked).map((stack) => stack.id));
}

async function createOp(
  kind: OperationKind,
  counts: { tabs: number; stacks: number },
): Promise<Operation> {
  const op: Operation = {
    id: ulid(),
    kind,
    createdAt: now(),
    counts,
    undoneAt: 0,
  };
  await db().ops.put(op);
  return op;
}

/** Insert all planned rows, trash older duplicates, and record the operation in ONE transaction. */
export async function commitStow(plan: StowPlan): Promise<ChangeSet> {
  const change = await db().transaction(
    'rw',
    db().stacks,
    db().tabs,
    db().ops,
    db().meta,
    async () => {
      const existing = await liveStacks();
      const firstUnpinned = existing.find((stack) => !stack.pinned);
      const stackKeys = keysBefore(firstUnpinned?.orderKey ?? null, plan.stacks.length);
      const op = await createOp('stow', {
        tabs: plan.summary.savedTabs,
        stacks: plan.stacks.length,
      });

      const upsertedStacks: Stack[] = [];
      const upsertedTabs: SavedTab[] = [];

      plan.stacks.forEach((planned, index) => {
        const stack: Stack = {
          id: planned.id,
          title: planned.title,
          orderKey: stackKeys[index] ?? '',
          pinned: false,
          locked: false,
          collapsed: false,
          color: planned.color,
          tabCount: planned.tabs.length,
          createdAt: plan.now,
          updatedAt: plan.now,
          deletedAt: 0,
          deletedBy: '',
        };
        upsertedStacks.push(stack);
      });

      for (const planned of plan.stacks) {
        for (const tab of planned.tabs) {
          upsertedTabs.push({
            id: tab.id,
            stackId: planned.id,
            url: tab.url,
            urlKey: tab.urlKey,
            title: tab.title,
            orderKey: tab.orderKey,
            wasPinned: tab.wasPinned,
            createdAt: plan.now,
            deletedAt: 0,
            deletedBy: '',
          });
        }
      }

      await db().stacks.bulkPut(upsertedStacks);
      await db().tabs.bulkPut(upsertedTabs);

      const affected = new Set<Id>();
      for (const old of plan.trashExisting) {
        if (old.deletedAt !== 0) continue;
        await db().tabs.put({ ...old, deletedAt: plan.now, deletedBy: op.id });
        affected.add(old.stackId);
        upsertedTabs.push({ ...old, deletedAt: plan.now, deletedBy: op.id });
      }
      const recomputed = await recomputeCounts(affected);
      for (const stack of recomputed) {
        const at = upsertedStacks.findIndex((candidate) => candidate.id === stack.id);
        if (at >= 0) upsertedStacks[at] = stack;
        else upsertedStacks.push(stack);
      }

      const rev = await bumpRev();
      return {
        rev,
        stacksUpserted: upsertedStacks,
        stacksDeletedIds: [],
        tabsUpserted: upsertedTabs,
        tabsDeletedIds: [],
      } satisfies ChangeSet;
    },
  );
  publishChange(change);
  return change;
}

/** Read back every written row; throw if anything is missing or mismatched (invariant 1). */
export async function verifyStow(plan: StowPlan): Promise<void> {
  const expectedTabIds = plan.stacks.flatMap((stack) => stack.tabs.map((tab) => tab.id));
  if (expectedTabIds.length === 0) return;
  const rows = await db().tabs.bulkGet(expectedTabIds);
  const present = rows.filter((row): row is SavedTab => Boolean(row));
  if (present.length !== expectedTabIds.length) {
    throw new RepoError('verify-mismatch', 'Saved rows could not be read back');
  }
  for (const planned of plan.stacks) {
    const stack = await db().stacks.get(planned.id);
    if (stack?.deletedAt !== 0) {
      throw new RepoError('verify-mismatch', 'Saved stack could not be read back');
    }
  }
  for (const row of present) {
    if (row.deletedAt !== 0) throw new RepoError('verify-mismatch', 'Saved row was deleted');
    if (row.url.length > LIMITS.url) throw new RepoError('verify-mismatch', 'Saved row is corrupt');
  }
}

export async function liveUrlIndex(urlKeys: readonly string[]): Promise<Map<string, SavedTab[]>> {
  const index = new Map<string, SavedTab[]>();
  if (urlKeys.length === 0) return index;
  const keys = [...new Set(urlKeys)];
  const rows = await db()
    .tabs.where('[deletedAt+urlKey]')
    .anyOf(keys.map((key) => [0, key] as [number, string]))
    .toArray();
  for (const row of rows) {
    const list = index.get(row.urlKey) ?? [];
    list.push(row);
    index.set(row.urlKey, list);
  }
  return index;
}

export async function getLockedStackIds(): Promise<Set<Id>> {
  return lockedStackIds();
}

export async function getStacks(includeDeleted = false): Promise<Stack[]> {
  const stacks = await db().stacks.toArray();
  return stacks.filter((stack) => includeDeleted || stack.deletedAt === 0).sort(sortStacks);
}

export async function getTabsForStacks(
  stackIds: readonly Id[],
  liveOnly = true,
): Promise<SavedTab[]> {
  const rows = await liveTabsForStacks(stackIds);
  if (liveOnly) return rows;
  const all = await db()
    .tabs.where('stackId')
    .anyOf([...stackIds])
    .toArray();
  return all.sort(sortTabs);
}

export async function getLiveTabs(): Promise<SavedTab[]> {
  return db()
    .tabs.filter((tab) => tab.deletedAt === 0)
    .toArray();
}

export interface RestoreLoad {
  tabs: SavedTab[];
  stacks: Stack[];
}

export async function loadForRestore(req: {
  by: 'tab' | 'stack' | 'selection';
  ids: readonly Id[];
}): Promise<RestoreLoad> {
  const stacks = await getStacks();
  const stackById = new Map(stacks.map((stack) => [stack.id, stack]));
  let tabs: SavedTab[] = [];

  if (req.by === 'stack') {
    tabs = await liveTabsForStacks(req.ids);
  } else {
    const rows = await db().tabs.bulkGet([...req.ids]);
    tabs = rows.filter((tab): tab is SavedTab => tab !== undefined && tab.deletedAt === 0);
    tabs = tabs.filter((tab) => stackById.has(tab.stackId));
    tabs.sort((a, b) => {
      const sa = stackById.get(a.stackId);
      const sb = stackById.get(b.stackId);
      if (sa && sb && sa.id !== sb.id) return sortStacks(sa, sb);
      return sortTabs(a, b);
    });
  }

  const usedStacks = [...new Set(tabs.map((tab) => tab.stackId))]
    .map((id) => stackById.get(id))
    .filter((stack): stack is Stack => Boolean(stack));

  return { tabs, stacks: usedStacks };
}

/** Soft-delete restored tabs AFTER their browser tabs opened (invariant 2). */
export async function removeRestored(
  tabIds: readonly Id[],
  stackIdsForCleanup: readonly Id[],
): Promise<MutationResult | null> {
  if (tabIds.length === 0) return null;
  const result = await db().transaction(
    'rw',
    db().stacks,
    db().tabs,
    db().ops,
    db().meta,
    async () => {
      const locked = await lockedStackIds();
      const rows = await db().tabs.bulkGet([...tabIds]);
      const op = await createOp('restore-remove', { tabs: 0, stacks: 0 });
      const upserted: SavedTab[] = [];
      const affected = new Set<Id>();

      for (const row of rows) {
        if (row?.deletedAt !== 0) continue;
        if (locked.has(row.stackId)) continue;
        const next = { ...row, deletedAt: now(), deletedBy: op.id };
        await db().tabs.put(next);
        upserted.push(next);
        affected.add(row.stackId);
      }

      const stackUpserts = await recomputeCounts(affected);
      const stacksDeletedIds: Id[] = [];
      for (const stackId of stackIdsForCleanup) {
        if (!affected.has(stackId) || locked.has(stackId)) continue;
        const stack = await db().stacks.get(stackId);
        if (stack?.deletedAt !== 0) continue;
        if (stack.tabCount > 0) continue;
        if (stack.title || stack.pinned || stack.locked) continue;
        const next = { ...stack, deletedAt: now(), deletedBy: op.id };
        await db().stacks.put(next);
        stacksDeletedIds.push(stackId);
        stackUpserts.push(next);
      }

      const opCounts = { tabs: upserted.length, stacks: stacksDeletedIds.length };
      await db().ops.put({ ...op, counts: opCounts });
      const rev = await bumpRev();
      return {
        rev,
        stacksUpserted: stackUpserts,
        stacksDeletedIds,
        tabsUpserted: upserted,
        tabsDeletedIds: [],
      } satisfies ChangeSet;
    },
  );
  publishChange(result);
  return { change: result, opId: result.tabsUpserted[0]?.deletedBy ?? '' };
}

export async function softDeleteTabs(tabIds: readonly Id[]): Promise<MutationResult | null> {
  if (tabIds.length === 0) return null;
  const result = await db().transaction(
    'rw',
    db().stacks,
    db().tabs,
    db().ops,
    db().meta,
    async () => {
      const locked = await lockedStackIds();
      const rows = await db().tabs.bulkGet([...tabIds]);
      const op = await createOp('delete-tabs', { tabs: 0, stacks: 0 });
      const upserted: SavedTab[] = [];
      const affected = new Set<Id>();
      for (const row of rows) {
        if (row?.deletedAt !== 0) continue;
        if (locked.has(row.stackId)) continue;
        const next = { ...row, deletedAt: now(), deletedBy: op.id };
        await db().tabs.put(next);
        upserted.push(next);
        affected.add(row.stackId);
      }
      const stackUpserts = await recomputeCounts(affected);
      await db().ops.put({ ...op, counts: { tabs: upserted.length, stacks: 0 } });
      const rev = await bumpRev();
      return {
        rev,
        stacksUpserted: stackUpserts,
        stacksDeletedIds: [],
        tabsUpserted: upserted,
        tabsDeletedIds: [],
      } satisfies ChangeSet;
    },
  );
  publishChange(result);
  return { change: result, opId: result.tabsUpserted[0]?.deletedBy ?? '' };
}

export async function softDeleteStack(stackId: Id): Promise<MutationResult> {
  const result = await db().transaction(
    'rw',
    db().stacks,
    db().tabs,
    db().ops,
    db().meta,
    async () => {
      const stack = await db().stacks.get(stackId);
      if (stack?.deletedAt !== 0) throw new RepoError('stack-missing');
      if (stack.locked) throw new RepoError('stack-locked', 'Unlock to delete');
      const tabs = await liveTabsForStacks([stackId]);
      const op = await createOp('delete-stacks', { tabs: tabs.length, stacks: 1 });
      const stamp = now();
      const tabsNext = tabs.map((tab) => ({ ...tab, deletedAt: stamp, deletedBy: op.id }));
      const stackNext = { ...stack, deletedAt: stamp, deletedBy: op.id };
      await db().tabs.bulkPut(tabsNext);
      await db().stacks.put(stackNext);
      const rev = await bumpRev();
      return {
        rev,
        stacksUpserted: [stackNext],
        stacksDeletedIds: [],
        tabsUpserted: tabsNext,
        tabsDeletedIds: [],
      } satisfies ChangeSet;
    },
  );
  publishChange(result);
  return { change: result, opId: result.stacksUpserted[0]?.deletedBy ?? '' };
}

export async function undo(opId: Id): Promise<ChangeSet | null> {
  const result = await db().transaction(
    'rw',
    db().stacks,
    db().tabs,
    db().ops,
    db().meta,
    async () => {
      const op = await db().ops.get(opId);
      if (op?.undoneAt !== 0) return null;

      const tabs = await db()
        .tabs.filter((tab) => tab.deletedBy === opId)
        .toArray();
      const stacks = await db()
        .stacks.filter((stack) => stack.deletedBy === opId)
        .toArray();
      if (tabs.length === 0 && stacks.length === 0) return null;
      const tabsNext = tabs.map((tab) => ({ ...tab, deletedAt: 0, deletedBy: '' }));
      const stacksNext = stacks.map((stack) => ({ ...stack, deletedAt: 0, deletedBy: '' }));
      await db().tabs.bulkPut(tabsNext);
      await db().stacks.bulkPut(stacksNext);
      const counts = await recomputeCounts([
        ...tabsNext.map((tab) => tab.stackId),
        ...stacksNext.map((stack) => stack.id),
      ]);
      await db().ops.put({ ...op, undoneAt: now() });
      const rev = await bumpRev();
      return {
        rev,
        stacksUpserted: [...stacksNext, ...counts],
        stacksDeletedIds: [],
        tabsUpserted: tabsNext,
        tabsDeletedIds: [],
      } satisfies ChangeSet;
    },
  );
  if (result) publishChange(result);
  return result;
}

export interface TrashGroup {
  opId: Id;
  kind: OperationKind;
  at: number;
  stacks: Stack[];
  tabs: SavedTab[];
}

export async function getTrash(): Promise<TrashGroup[]> {
  const [stacks, tabs] = await Promise.all([db().stacks.toArray(), db().tabs.toArray()]);
  const groups = new Map<Id, TrashGroup>();
  for (const stack of stacks) {
    if (stack.deletedAt === 0) continue;
    const key = stack.deletedBy;
    const group = groups.get(key) ?? {
      opId: key,
      kind: 'delete-stacks',
      at: stack.deletedAt,
      stacks: [],
      tabs: [],
    };
    group.stacks.push(stack);
    groups.set(key, group);
  }
  for (const tab of tabs) {
    if (tab.deletedAt === 0) continue;
    const key = tab.deletedBy;
    const group = groups.get(key) ?? {
      opId: key,
      kind: 'delete-tabs',
      at: tab.deletedAt,
      stacks: [],
      tabs: [],
    };
    group.tabs.push(tab);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.at - a.at);
}

export async function emptyTrash(): Promise<ChangeSet> {
  const result = await db().transaction(
    'rw',
    db().stacks,
    db().tabs,
    db().ops,
    db().meta,
    async () => {
      const stacks = await db()
        .stacks.filter((stack) => stack.deletedAt > 0)
        .toArray();
      const tabs = await db()
        .tabs.filter((tab) => tab.deletedAt > 0)
        .toArray();
      await createOp('empty-trash', { tabs: tabs.length, stacks: stacks.length });
      await db().tabs.bulkDelete(tabs.map((tab) => tab.id));
      await db().stacks.bulkDelete(stacks.map((stack) => stack.id));
      const rev = await bumpRev();
      return {
        rev,
        stacksUpserted: [],
        stacksDeletedIds: stacks.map((stack) => stack.id),
        tabsUpserted: [],
        tabsDeletedIds: tabs.map((tab) => tab.id),
      } satisfies ChangeSet;
    },
  );
  publishChange(result);
  return result;
}

export async function deleteForever(trash: TrashGroup): Promise<ChangeSet> {
  const tabs = await db().tabs.where('deletedBy').equals(trash.opId).toArray();
  const stacks = await db().stacks.where('deletedBy').equals(trash.opId).toArray();
  const result = await db().transaction(
    'rw',
    db().stacks,
    db().tabs,
    db().ops,
    db().meta,
    async () => {
      await db().tabs.bulkDelete(tabs.map((tab) => tab.id));
      await db().stacks.bulkDelete(stacks.map((stack) => stack.id));
      const rev = await bumpRev();
      return {
        rev,
        stacksUpserted: [],
        stacksDeletedIds: stacks.map((stack) => stack.id),
        tabsUpserted: [],
        tabsDeletedIds: tabs.map((tab) => tab.id),
      } satisfies ChangeSet;
    },
  );
  publishChange(result);
  return result;
}

export async function purgeExpired(retentionDays: number): Promise<number> {
  if (retentionDays <= 0) return 0;
  const cutoff = now() - retentionDays * 86_400_000;
  const result = await db().transaction(
    'rw',
    db().stacks,
    db().tabs,
    db().ops,
    db().meta,
    async () => {
      const stacks = await db()
        .stacks.filter((stack) => stack.deletedAt > 0 && stack.deletedAt < cutoff)
        .toArray();
      const tabs = await db()
        .tabs.filter((tab) => tab.deletedAt > 0 && tab.deletedAt < cutoff)
        .toArray();
      await db().tabs.bulkDelete(tabs.map((tab) => tab.id));
      await db().stacks.bulkDelete(stacks.map((stack) => stack.id));
      if (tabs.length || stacks.length) {
        await db().meta.put({ key: 'lastPurge', value: now() });
      }
      const rev = await bumpRev();
      return {
        rev,
        stacksUpserted: [],
        stacksDeletedIds: stacks.map((stack) => stack.id),
        tabsUpserted: [],
        tabsDeletedIds: tabs.map((tab) => tab.id),
      } satisfies ChangeSet;
    },
  );
  if (result.tabsDeletedIds.length || result.stacksDeletedIds.length) publishChange(result);
  return result.tabsDeletedIds.length;
}

export async function renameStack(stackId: Id, title: string): Promise<ChangeSet> {
  return updateStack(stackId, { title: title.trim().slice(0, LIMITS.stackTitle) });
}

export async function updateStack(
  stackId: Id,
  patch: Partial<Pick<Stack, 'title' | 'pinned' | 'locked' | 'collapsed' | 'color'>>,
): Promise<ChangeSet> {
  const result = await db().transaction('rw', db().stacks, db().meta, async () => {
    const stack = await db().stacks.get(stackId);
    if (!stack) throw new RepoError('stack-missing');
    let next: Stack = { ...stack, ...patch, updatedAt: now() };
    if (typeof patch.pinned === 'boolean' && patch.pinned !== stack.pinned) {
      const others = (await liveStacks()).filter(
        (candidate) => candidate.id !== stackId && candidate.pinned === patch.pinned,
      );
      next = { ...next, orderKey: keysBefore(others[0]?.orderKey ?? null, 1)[0] ?? next.orderKey };
    }
    await db().stacks.put(next);
    const rev = await bumpRev();
    return {
      rev,
      stacksUpserted: [next],
      stacksDeletedIds: [],
      tabsUpserted: [],
      tabsDeletedIds: [],
    } satisfies ChangeSet;
  });
  publishChange(result);
  return result;
}

export async function moveStacks(orderedIds: readonly Id[], pinned: boolean): Promise<ChangeSet> {
  const result = await db().transaction('rw', db().stacks, db().meta, async () => {
    const keys = keysAfter(null, orderedIds.length);
    const upserts: Stack[] = [];
    for (const [index, id] of orderedIds.entries()) {
      const stack = await db().stacks.get(id);
      if (!stack) continue;
      const key = keys[index];
      if (key === undefined) continue;
      const next = { ...stack, pinned, orderKey: key, updatedAt: now() };
      await db().stacks.put(next);
      upserts.push(next);
    }
    const rev = await bumpRev();
    return {
      rev,
      stacksUpserted: upserts,
      stacksDeletedIds: [],
      tabsUpserted: [],
      tabsDeletedIds: [],
    } satisfies ChangeSet;
  });
  publishChange(result);
  return result;
}

export async function reorderStack(stackId: Id, beforeId: Id | null): Promise<ChangeSet> {
  const result = await db().transaction('rw', db().stacks, db().meta, async () => {
    const all = await liveStacks();
    const target = all.find((stack) => stack.id === stackId);
    if (!target) throw new RepoError('stack-missing');
    const section = all.filter(
      (stack) =>
        stack.id !== stackId &&
        stack.pinned ===
          (beforeId
            ? (all.find((s) => s.id === beforeId)?.pinned ?? target.pinned)
            : target.pinned),
    );
    let key: string;
    if (beforeId) {
      const at = section.findIndex((stack) => stack.id === beforeId);
      const after = at >= 0 ? section[at - 1] : section[section.length - 1];
      key = keyBetween(after?.orderKey ?? null, section[at]?.orderKey ?? null);
    } else {
      key = keysAfter(section[section.length - 1]?.orderKey ?? null, 1)[0] ?? target.orderKey;
    }
    const next = { ...target, orderKey: key, updatedAt: now() };
    await db().stacks.put(next);
    const rev = await bumpRev();
    return {
      rev,
      stacksUpserted: [next],
      stacksDeletedIds: [],
      tabsUpserted: [],
      tabsDeletedIds: [],
    } satisfies ChangeSet;
  });
  publishChange(result);
  return result;
}

export async function moveTabs(
  tabIds: readonly Id[],
  targetStackId: Id,
  beforeTabId: Id | null = null,
): Promise<MutationResult> {
  const result = await db().transaction(
    'rw',
    db().stacks,
    db().tabs,
    db().ops,
    db().meta,
    async () => {
      const target = await db().stacks.get(targetStackId);
      if (target?.deletedAt !== 0) throw new RepoError('stack-missing');
      const siblings = (await liveTabsForStacks([targetStackId])).filter(
        (tab) => !tabIds.includes(tab.id),
      );
      const at = beforeTabId
        ? siblings.findIndex((tab) => tab.id === beforeTabId)
        : siblings.length;
      const before = siblings[at - 1];
      const after = siblings[at];
      const newKeys = (await import('../domain/order')).keysBetween(
        before?.orderKey ?? null,
        after?.orderKey ?? null,
        tabIds.length,
      );
      const op = await createOp('merge-stacks', { tabs: tabIds.length, stacks: 0 });
      const upserted: SavedTab[] = [];
      const affected = new Set<Id>([targetStackId]);
      for (const [index, id] of tabIds.entries()) {
        const tab = await db().tabs.get(id);
        if (tab?.deletedAt !== 0) continue;
        const key = newKeys[index];
        if (key === undefined) continue;
        const next = { ...tab, stackId: targetStackId, orderKey: key };
        await db().tabs.put(next);
        upserted.push(next);
        affected.add(tab.stackId);
      }
      const counts = await recomputeCounts(affected);
      const rev = await bumpRev();
      return {
        change: {
          rev,
          stacksUpserted: counts,
          stacksDeletedIds: [],
          tabsUpserted: upserted,
          tabsDeletedIds: [],
        } satisfies ChangeSet,
        opId: op.id,
      };
    },
  );
  publishChange(result.change);
  return result;
}

export async function createStackWithTabs(tabIds: readonly Id[]): Promise<MutationResult> {
  const result = await db().transaction(
    'rw',
    db().stacks,
    db().tabs,
    db().ops,
    db().meta,
    async () => {
      const stacks = await liveStacks();
      const key = keysBefore(stacks.find((stack) => !stack.pinned)?.orderKey ?? null, 1)[0] ?? '';
      const stamp = now();
      const stack: Stack = {
        id: ulid(),
        title: '',
        orderKey: key,
        pinned: false,
        locked: false,
        collapsed: false,
        color: null,
        tabCount: 0,
        createdAt: stamp,
        updatedAt: stamp,
        deletedAt: 0,
        deletedBy: '',
      };
      const rows = await db().tabs.bulkGet([...tabIds]);
      const live = rows.filter((tab): tab is SavedTab => tab !== undefined && tab.deletedAt === 0);
      const keys = (await import('../domain/order')).keysBetween(null, null, live.length);
      const upserted = live.map((tab, index) => ({
        ...tab,
        stackId: stack.id,
        orderKey: keys[index] ?? tab.orderKey,
      }));
      stack.tabCount = upserted.length;
      await db().stacks.put(stack);
      await db().tabs.bulkPut(upserted);
      const counts = await recomputeCounts([...new Set(live.map((tab) => tab.stackId))]);
      const op = await createOp('merge-stacks', { tabs: upserted.length, stacks: 1 });
      const rev = await bumpRev();
      return {
        change: {
          rev,
          stacksUpserted: [stack, ...counts],
          stacksDeletedIds: [],
          tabsUpserted: upserted,
          tabsDeletedIds: [],
        } satisfies ChangeSet,
        opId: op.id,
      };
    },
  );
  publishChange(result.change);
  return result;
}

export async function importTabs(
  title: string,
  items: readonly { url: string; title: string }[],
): Promise<ChangeSet> {
  const { normalizeUrlKey, isAllowedScheme, isOversizedUrl } = await import('../domain/url');
  const clean = items.filter((item) => isAllowedScheme(item.url) && !isOversizedUrl(item.url));
  const result = await db().transaction(
    'rw',
    db().stacks,
    db().tabs,
    db().ops,
    db().meta,
    async () => {
      const stacks = await liveStacks();
      const key = keysBefore(stacks.find((stack) => !stack.pinned)?.orderKey ?? null, 1)[0] ?? '';
      const stamp = now();
      const stack: Stack = {
        id: ulid(),
        title: title.slice(0, LIMITS.stackTitle),
        orderKey: key,
        pinned: false,
        locked: false,
        collapsed: false,
        color: null,
        tabCount: clean.length,
        createdAt: stamp,
        updatedAt: stamp,
        deletedAt: 0,
        deletedBy: '',
      };
      const orderKeys = keysAfter(null, clean.length);
      const rows: SavedTab[] = clean.map((item, index) => ({
        id: ulid(),
        stackId: stack.id,
        url: item.url,
        urlKey: normalizeUrlKey(item.url),
        title: item.title.slice(0, LIMITS.title),
        orderKey: orderKeys[index] ?? '',
        wasPinned: false,
        createdAt: stamp,
        deletedAt: 0,
        deletedBy: '',
      }));
      await db().stacks.put(stack);
      await db().tabs.bulkPut(rows);
      await createOp('import', { tabs: rows.length, stacks: 1 });
      const rev = await bumpRev();
      return {
        rev,
        stacksUpserted: [stack],
        stacksDeletedIds: [],
        tabsUpserted: rows,
        tabsDeletedIds: [],
      } satisfies ChangeSet;
    },
  );
  publishChange(result);
  return result;
}

export async function dedupeStack(stackId: Id): Promise<MutationResult | null> {
  const result = await db().transaction(
    'rw',
    db().stacks,
    db().tabs,
    db().ops,
    db().meta,
    async () => {
      const stack = await db().stacks.get(stackId);
      if (stack?.deletedAt !== 0) throw new RepoError('stack-missing');
      const tabs = await liveTabsForStacks([stackId]);
      const seen = new Set<string>();
      const duplicates: SavedTab[] = [];
      for (const tab of tabs) {
        if (seen.has(tab.urlKey)) duplicates.push(tab);
        else seen.add(tab.urlKey);
      }
      if (duplicates.length === 0) return null;
      const op = await createOp('dedupe-merge', { tabs: duplicates.length, stacks: 0 });
      const upserted = duplicates.map((tab) => ({ ...tab, deletedAt: now(), deletedBy: op.id }));
      await db().tabs.bulkPut(upserted);
      const counts = await recomputeCounts([stackId]);
      const rev = await bumpRev();
      return {
        change: {
          rev,
          stacksUpserted: counts,
          stacksDeletedIds: [],
          tabsUpserted: upserted,
          tabsDeletedIds: [],
        } satisfies ChangeSet,
        opId: op.id,
      };
    },
  );
  if (result) publishChange(result.change);
  return result;
}

export async function countLiveTabs(): Promise<number> {
  return db().tabs.where('deletedAt').equals(0).count();
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await db().meta.get(key);
  return row?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db().meta.put({ key, value });
}

export async function log(
  level: 'info' | 'warn' | 'error',
  code: string,
  detail = '',
): Promise<void> {
  try {
    await db().logs.add({ ts: now(), level, code, detail });
    const count = await db().logs.count();
    if (count > 100) {
      const oldest = await db()
        .logs.orderBy('ts')
        .limit(count - 100)
        .primaryKeys();
      await db().logs.bulkDelete(oldest);
    }
  } catch {
    // Diagnostics must never break a workflow.
  }
}

export async function getLogs(): Promise<import('../domain/types').LogRow[]> {
  return db().logs.orderBy('ts').reverse().limit(100).toArray();
}

export async function resetLibraryData(): Promise<void> {
  await db().transaction('rw', db().stacks, db().tabs, db().ops, db().meta, async () => {
    await db().tabs.clear();
    await db().stacks.clear();
    await db().ops.clear();
    await bumpRev();
  });
}
