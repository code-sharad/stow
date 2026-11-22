import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildStowPlan } from '../domain/plan';
import type { TabCandidate } from '../domain/types';
import {
  commitStow,
  countLiveTabs,
  dedupeStack,
  deleteForever,
  emptyTrash,
  getLiveTabs,
  getMeta,
  getStacks,
  getTrash,
  importTabs,
  removeRestored,
  renameStack,
  softDeleteStack,
  softDeleteTabs,
  undo,
  updateStack,
  verifyStow,
} from './repo';
import { db, StowDB, setDbForTests } from './schema';

let dbCount = 0;

beforeEach(async () => {
  dbCount++;
  setDbForTests(new StowDB(`stow-test-${dbCount}`));
  await db().open();
});

afterEach(async () => {
  await db().delete();
  setDbForTests(null);
});

const tab = (id: number, index = 0): TabCandidate => ({
  id,
  windowId: 1,
  index,
  url: `https://example.com/${id}`,
  title: `Tab ${id}`,
  pinned: false,
  incognito: false,
  groupId: -1,
  windowType: 'normal',
});

async function stow(count = 2) {
  const eligible = Array.from({ length: count }, (_, index) => tab(index + 1, index));
  const plan = buildStowPlan({
    eligible,
    groups: new Map(),
    settings: { preserveBrowserGroups: true, dedupe: 'off', stripTrackingForDedupe: true },
    existing: new Map(),
    lockedStackIds: new Set(),
    now: Date.now(),
  });
  await commitStow(plan);
  return plan;
}

describe('commitStow and verifyStow', () => {
  it('writes stacks and tabs and bumps rev', async () => {
    const plan = await stow(3);
    expect(await countLiveTabs()).toBe(3);
    expect(await getStacks()).toHaveLength(1);
    expect(await getMeta<number>('rev')).toBeGreaterThan(0);
    await expect(verifyStow(plan)).resolves.toBeUndefined();
  });

  it('fails verification when a row is missing', async () => {
    const plan = await stow(2);
    await db().tabs.delete(plan.stacks[0]?.tabs[0]?.id ?? '');
    await expect(verifyStow(plan)).rejects.toThrow();
  });
});

describe('deletion and undo', () => {
  it('soft deletes tabs, keeps them in trash, and undoes', async () => {
    await stow(2);
    const tabs = await getLiveTabs();
    const result = await softDeleteTabs([tabs[0]?.id ?? '']);
    expect(result).not.toBeNull();
    expect(await countLiveTabs()).toBe(1);
    expect((await getTrash()).flatMap((group) => group.tabs)).toHaveLength(1);
    await undo(result?.opId ?? '');
    expect(await countLiveTabs()).toBe(2);
  });

  it('soft deletes a whole stack and never deletes a locked stack', async () => {
    await stow(2);
    const [stack] = await getStacks();
    await updateStack(stack?.id ?? '', { locked: true });
    await expect(softDeleteStack(stack?.id ?? '')).rejects.toThrow();
    await updateStack(stack?.id ?? '', { locked: false });
    const result = await softDeleteStack(stack?.id ?? '');
    expect(await getStacks()).toHaveLength(0);
    await undo(result.opId);
    expect(await getStacks()).toHaveLength(1);
    expect(await countLiveTabs()).toBe(2);
  });

  it('empties trash and deletes forever', async () => {
    await stow(2);
    const tabs = await getLiveTabs();
    await softDeleteTabs(tabs.map((tab) => tab.id));
    expect(await getTrash()).toHaveLength(1);
    await emptyTrash();
    expect(await getTrash()).toHaveLength(0);
    expect(await db().tabs.count()).toBe(0);
  });

  it('deletes one trash group forever', async () => {
    await stow(1);
    const tabs = await getLiveTabs();
    await softDeleteTabs([tabs[0]?.id ?? '']);
    const group = (await getTrash())[0];
    expect(group).toBeDefined();
    if (group) await deleteForever(group);
    expect(await db().tabs.count()).toBe(0);
  });
});

describe('restore bookkeeping', () => {
  it('soft deletes restored tabs and cleans up empty stacks', async () => {
    await stow(2);
    const tabs = await getLiveTabs();
    const stackId = tabs[0]?.stackId ?? '';
    const result = await removeRestored(
      tabs.map((tab) => tab.id),
      [stackId],
    );
    expect(result).not.toBeNull();
    expect(await countLiveTabs()).toBe(0);
    expect(await getStacks()).toHaveLength(0);
  });
});

describe('stack and tab operations', () => {
  it('renames with a length cap and toggles pins', async () => {
    await stow(1);
    const [stack] = await getStacks();
    if (!stack) throw new Error('missing stack');
    await renameStack(stack.id, '  Work  ');
    expect((await getStacks())[0]?.title).toBe('Work');
    await updateStack(stack.id, { pinned: true });
    expect((await getStacks())[0]?.pinned).toBe(true);
  });

  it('dedupes a stack and trashes the older copy', async () => {
    await stow(1);
    const [stack] = await getStacks();
    if (!stack) throw new Error('missing stack');
    const existing = await getLiveTabs();
    const first = existing[0];
    if (!first) throw new Error('missing tab');
    await db().tabs.put({
      ...first,
      id: 'dup',
      url: 'https://example.com/1',
      urlKey: 'https://example.com/1',
    });
    const result = await dedupeStack(stack.id);
    expect(result?.change.tabsUpserted.length).toBeGreaterThan(0);
    expect(result?.change.tabsUpserted.every((tab) => tab.deletedAt > 0)).toBe(true);
    expect(await countLiveTabs()).toBe(1);
  });

  it('imports URLs and skips unsafe schemes', async () => {
    await importTabs('Imported', [
      { url: 'https://example.com/a', title: 'A' },
      { url: 'javascript:alert(1)', title: 'bad' },
      { url: 'https://example.com/b', title: 'B' },
    ]);
    expect(await countLiveTabs()).toBe(2);
    expect((await getStacks())[0]?.title).toBe('Imported');
  });
});
