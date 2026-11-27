import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  beginRestoreOp,
  commitStow,
  getLiveTabs,
  getRestoreOp,
  getStacks,
  markRestoreRows,
} from '../core/db/repo';
import { db, StowDB, setDbForTests } from '../core/db/schema';
import { buildStowPlan } from '../core/domain/plan';
import type { TabCandidate } from '../core/domain/types';
import { restore, resumeRestore } from './restore';

let dbCount = 0;
let nextTabId = 100;
const create = vi.fn(async (_props: { url?: string }) => {
  nextTabId += 1;
  return { id: nextTabId };
});

function tab(id: number): TabCandidate {
  return {
    id,
    windowId: 1,
    index: id - 1,
    url: `https://example.com/${id}`,
    title: `Tab ${id}`,
    pinned: false,
    incognito: false,
    groupId: -1,
    windowType: 'normal',
  };
}

beforeEach(async () => {
  dbCount += 1;
  setDbForTests(new StowDB(`stow-restore-test-${dbCount}`));
  await db().open();
  create.mockClear();
  vi.stubGlobal('chrome', {
    storage: {
      local: { get: vi.fn(async () => ({})), set: vi.fn(async () => {}) },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    action: {
      setBadgeText: vi.fn(async () => {}),
      setTitle: vi.fn(async () => {}),
      setBadgeBackgroundColor: vi.fn(async () => {}),
      setBadgeTextColor: vi.fn(async () => {}),
    },
    windows: { getLastFocused: vi.fn(async () => ({ id: 1 })) },
    tabs: { create, group: vi.fn(async () => 1) },
    tabGroups: { update: vi.fn(async () => {}) },
  });
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await db().delete();
  setDbForTests(null);
});

async function seedThree(): Promise<string> {
  const plan = buildStowPlan({
    eligible: [tab(1), tab(2), tab(3)],
    groups: new Map(),
    settings: { preserveBrowserGroups: true, dedupe: 'off', stripTrackingForDedupe: true },
    existing: new Map(),
    lockedStackIds: new Set(),
    now: Date.now(),
  });
  await commitStow(plan);
  return (await getStacks())[0]?.id ?? '';
}

describe('durable restore', () => {
  it('records opened and removed rows so a normal restore is idempotent', async () => {
    await seedThree();
    const result = await restore({ by: 'stack', ids: [await stackId()] });
    expect('opened' in result ? result.opened : -1).toBe(3);
    const op = (await db().ops.toArray()).find((row) => row.kind === 'restore');
    expect(op?.restore?.rows.map((row) => row.state)).toEqual(['removed', 'removed', 'removed']);
    expect(await getLiveTabs()).toHaveLength(0);
  });

  it('never opens the same saved tab twice across concurrent requests', async () => {
    const stackId = await seedThree();
    const [a, b] = await Promise.all([
      restore({ by: 'stack', ids: [stackId] }),
      restore({ by: 'stack', ids: [stackId] }),
    ]);
    expect([a, b].map((result) => ('opened' in result ? result.opened : -1))).toEqual([3, 0]);
    const urls = create.mock.calls.map(([props]) => props?.url);
    expect(urls).toHaveLength(3);
    expect(new Set(urls).size).toBe(3);
    expect(await getLiveTabs()).toHaveLength(0);
  });

  it('resumes only pending rows after a crash and removes every saved row', async () => {
    const stackId = await seedThree();
    const tabs = await getLiveTabs();
    const op = await beginRestoreOp({
      stackIds: [stackId],
      tabIds: tabs.map((row) => row.id),
      remove: true,
      target: 'current',
      background: true,
    });
    // Simulate a worker dying after two of three creates, before any removal.
    await markRestoreRows(op.id, [
      { tabId: tabs[0]?.id ?? '', state: 'opened', browserTabId: 501 },
      { tabId: tabs[1]?.id ?? '', state: 'opened', browserTabId: 502 },
    ]);

    const resumed = await resumeRestore(op.id);
    expect('opened' in resumed ? resumed.opened : -1).toBe(1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ url: tabs[2]?.url }));
    expect(await getLiveTabs()).toHaveLength(0);
    const stored = await getRestoreOp(op.id);
    expect(stored?.restore?.rows.every((row) => row.state === 'removed')).toBe(true);
  });
});

async function stackId(): Promise<string> {
  return (await getStacks())[0]?.id ?? '';
}
