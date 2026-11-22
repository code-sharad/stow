import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildStowPlan } from '../domain/plan';
import type { Stack, TabCandidate } from '../domain/types';
import { DEFAULT_SETTINGS } from '../settings/schema';
import {
  commitStow,
  countLiveTabs,
  createStackWithTabs,
  deleteForever,
  emptyTrash,
  getLiveTabs,
  getLogs,
  getMeta,
  getStacks,
  getTrash,
  loadForRestore,
  log,
  moveStacks,
  moveTabs,
  purgeExpired,
  reorderStack,
  resetLibraryData,
  setMeta,
  softDeleteStack,
  softDeleteTabs,
  undo,
  updateStack,
} from './repo';
import { db, StowDB, setDbForTests } from './schema';

let counter = 0;

beforeEach(async () => {
  const database = new StowDB(`stow-extra-${counter++}`);
  setDbForTests(database);
  await database.open();
});

afterEach(async () => {
  const database = db();
  await database.delete();
  setDbForTests(null);
});

function candidate(index: number, url = `https://example.com/${index}`): TabCandidate {
  return {
    id: index,
    windowId: 1,
    index,
    url,
    title: `Tab ${index}`,
    pinned: false,
    incognito: false,
    groupId: -1,
    windowType: 'normal',
  };
}

async function stow(
  count = 3,
): Promise<{ changes: Awaited<ReturnType<typeof commitStow>>; stacks: Stack[] }> {
  const plan = buildStowPlan({
    eligible: Array.from({ length: count }, (_, index) => candidate(index)),
    groups: new Map(),
    settings: { ...DEFAULT_SETTINGS },
    existing: new Map(),
    lockedStackIds: new Set(),
    now: Date.now(),
    newId: () => `01TEST${String(Math.random()).slice(2, 10)}`,
  });
  const changes = await commitStow(plan);
  return { changes, stacks: await getStacks() };
}

describe('restore loading', () => {
  it('loads a whole stack in tab order', async () => {
    await stow(3);
    const [stack] = await getStacks();
    if (!stack) throw new Error('missing stack');
    const loaded = await loadForRestore({ by: 'stack', ids: [stack.id] });
    expect(loaded.tabs).toHaveLength(3);
    expect(loaded.stacks).toHaveLength(1);
  });

  it('loads a selection, skipping deleted and unknown tabs', async () => {
    await stow(3);
    const tabs = await getLiveTabs();
    await softDeleteTabs([tabs[0]?.id ?? '']);
    const loaded = await loadForRestore({
      by: 'selection',
      ids: [...tabs.map((tab) => tab.id), 'missing'],
    });
    expect(loaded.tabs).toHaveLength(2);
  });

  it('drops stacks whose tabs are all deleted', async () => {
    await stow(1);
    const tabs = await getLiveTabs();
    await softDeleteTabs([tabs[0]?.id ?? '']);
    const loaded = await loadForRestore({ by: 'selection', ids: [tabs[0]?.id ?? ''] });
    expect(loaded.stacks).toHaveLength(0);
  });
});

describe('ordering and moving', () => {
  it('moves tabs and recreates a stack from them', async () => {
    await stow(2);
    await stow(2);
    const stacks = await getStacks();
    const target = stacks[1]?.id;
    const tabs = await getLiveTabs();
    const sourceTab = tabs.find((tab) => tab.stackId === stacks[0]?.id);
    if (!target || !sourceTab) throw new Error('missing fixture');
    const moved = await moveTabs([sourceTab.id], target);
    expect(
      moved.change.stacksUpserted.some((stack) => stack.id === target && stack.tabCount === 3),
    ).toBe(true);
    expect(await countLiveTabs()).toBe(4);

    const created = await createStackWithTabs([tabs[1]?.id ?? '', tabs[2]?.id ?? '']);
    expect(created.change.stacksUpserted.some((stack) => stack.tabCount === 2)).toBe(true);
  });

  it('reorders stacks before a target and to the top', async () => {
    await stow(1);
    await stow(1);
    await stow(1);
    const stacks = await getStacks();
    const first = stacks[0];
    const last = stacks[2];
    if (!first || !last) throw new Error('missing stacks');
    const result = await reorderStack(last.id, first.id);
    expect(result.stacksUpserted[0]?.id).toBe(last.id);
    const top = await reorderStack(last.id, null);
    expect(top.stacksUpserted).toHaveLength(1);
    const pinned = await moveStacks([last.id, first.id], true);
    expect(pinned.stacksUpserted.every((stack) => stack.pinned)).toBe(true);
  });

  it('updates presentation flags and rejects missing stacks', async () => {
    await stow(1);
    const [stack] = await getStacks();
    if (!stack) throw new Error('missing stack');
    const result = await updateStack(stack.id, { collapsed: true, color: 'purple', locked: true });
    expect(result.stacksUpserted[0]).toMatchObject({
      collapsed: true,
      color: 'purple',
      locked: true,
    });
    await expect(updateStack('missing', { collapsed: false })).rejects.toThrow('stack-missing');
  });
});

describe('retention and diagnostics', () => {
  it('purges only rows older than the retention window', async () => {
    await stow(2);
    const tabs = await getLiveTabs();
    await softDeleteTabs([tabs[0]?.id ?? '']);
    const old = Date.now() - 31 * 86_400_000;
    await db().tabs.where('deletedAt').above(0).modify({ deletedAt: old });
    await db().stacks.where('deletedAt').above(0).modify({ deletedAt: old });
    expect(await purgeExpired(30)).toBe(1);
    expect(await purgeExpired(0)).toBe(0);
  });

  it('stores metadata and caps logs at 100 rows', async () => {
    await setMeta('hello', { ok: true });
    expect(await getMeta<{ ok: boolean }>('hello')).toEqual({ ok: true });
    expect(await getMeta('missing')).toBeUndefined();
    for (let index = 0; index < 105; index++) await log('info', 'test', String(index));
    const logs = await getLogs();
    expect(logs).toHaveLength(100);
    expect(logs[0]?.detail).toBe('104');
  });

  it('resets every table', async () => {
    await stow(2);
    await setMeta('x', 1);
    await resetLibraryData();
    expect(await getStacks()).toHaveLength(0);
    expect(await countLiveTabs()).toBe(0);
    expect(await getMeta('x')).toEqual(1);
  });
});

describe('trash helpers', () => {
  it('deletes a stack and its tabs forever', async () => {
    await stow(2);
    const [stack] = await getStacks();
    if (!stack) throw new Error('missing stack');
    const deleted = await softDeleteStack(stack.id);
    expect(deleted.change.tabsUpserted).toHaveLength(2);
    const trash = await getTrash();
    expect(trash).toHaveLength(1);
    const first = trash[0];
    if (!first) throw new Error('missing trash group');
    await deleteForever(first);
    expect(await getTrash()).toHaveLength(0);
    expect(await getLiveTabs()).toHaveLength(0);
  });

  it('empties trash and cannot undo afterwards', async () => {
    await stow(2);
    const tabs = await getLiveTabs();
    const result = await softDeleteTabs([tabs[0]?.id ?? '']);
    if (!result) throw new Error('missing mutation');
    const emptied = await emptyTrash();
    expect(emptied.tabsDeletedIds.length).toBeGreaterThan(0);
    expect(await undo(result.opId)).toBeNull();
    expect(await getTrash()).toHaveLength(0);
  });
});
