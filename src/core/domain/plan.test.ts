import { beforeEach, describe, expect, it } from 'vitest';
import { buildStowPlan } from './plan';
import type { NativeGroup, TabCandidate } from './types';

let next = 0;
const newId = () => `id-${++next}`;

const tab = (id: number, index: number, overrides: Partial<TabCandidate> = {}): TabCandidate => ({
  id,
  windowId: 1,
  index,
  url: `https://example.com/${id}`,
  title: `Tab ${id}`,
  pinned: false,
  incognito: false,
  groupId: -1,
  windowType: 'normal',
  ...overrides,
});

const settings = {
  preserveBrowserGroups: true,
  dedupe: 'global' as const,
  stripTrackingForDedupe: true,
};

beforeEach(() => {
  next = 0;
});

describe('buildStowPlan', () => {
  it('creates one stack per native group and one for ungrouped tabs', () => {
    const groups = new Map<number, NativeGroup>([[7, { id: 7, title: 'Work', color: 'blue' }]]);
    const plan = buildStowPlan({
      eligible: [tab(1, 0, { groupId: 7 }), tab(2, 1, { groupId: 7 }), tab(3, 2)],
      groups,
      settings,
      existing: new Map(),
      lockedStackIds: new Set(),
      now: 100,
      newId,
    });
    expect(plan.stacks).toHaveLength(2);
    expect(plan.stacks[0]?.title).toBe('Work');
    expect(plan.stacks[0]?.color).toBe('blue');
    expect(plan.stacks[0]?.tabs).toHaveLength(2);
    expect(plan.stacks[1]?.tabs).toHaveLength(1);
    expect(plan.closeTabIds).toEqual([1, 2, 3]);
    expect(plan.summary).toMatchObject({ savedTabs: 3, stacks: 2, merged: 0 });
  });

  it('puts everything in one stack when group preservation is off', () => {
    const groups = new Map<number, NativeGroup>([[7, { id: 7, title: 'Work', color: 'blue' }]]);
    const plan = buildStowPlan({
      eligible: [tab(1, 0, { groupId: 7 }), tab(2, 1)],
      groups,
      settings: { ...settings, preserveBrowserGroups: false },
      existing: new Map(),
      lockedStackIds: new Set(),
      now: 100,
      newId,
    });
    expect(plan.stacks).toHaveLength(1);
  });

  it('preserves order and trims long titles', () => {
    const plan = buildStowPlan({
      eligible: [tab(1, 0, { title: 'x'.repeat(3000) })],
      groups: new Map(),
      settings,
      existing: new Map(),
      lockedStackIds: new Set(),
      now: 100,
      newId,
    });
    expect(plan.stacks[0]?.tabs[0]?.title).toHaveLength(2000);
  });

  it('normalizes duplicate keys within one batch', () => {
    const plan = buildStowPlan({
      eligible: [
        tab(1, 0, { url: 'https://example.com/a' }),
        tab(2, 1, { url: 'https://example.com/a/' }),
      ],
      groups: new Map(),
      settings,
      existing: new Map(),
      lockedStackIds: new Set(),
      now: 100,
      newId,
    });
    expect(plan.summary.savedTabs).toBe(1);
    expect(plan.summary.collapsedWithinBatch).toBe(1);
  });
});
