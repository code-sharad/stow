import { describe, expect, it } from 'vitest';
import { type Candidate, planDedupe } from './dedupe';
import type { SavedTab } from './types';

const tab = (id: string, urlKey: string, stackId = 'stack'): SavedTab => ({
  id,
  stackId,
  url: `https://${urlKey}`,
  urlKey,
  title: '',
  orderKey: 'a1',
  wasPinned: false,
  createdAt: 1,
  deletedAt: 0,
  deletedBy: '',
});

const candidate = (id: number, urlKey: string, groupKey = 'ungrouped'): Candidate => ({
  sourceTabId: id,
  url: `https://${urlKey}`,
  urlKey,
  title: '',
  wasPinned: false,
  groupKey,
});

describe('planDedupe', () => {
  it('collapses duplicates within the batch', () => {
    const result = planDedupe(
      [candidate(1, 'a'), candidate(2, 'a')],
      new Map(),
      new Set(),
      'global',
    );
    expect(result.keep).toHaveLength(1);
    expect(result.collapsedWithinBatch).toBe(1);
  });

  it('trashes live duplicates from unlocked stacks', () => {
    const existing = new Map([['a', [tab('old', 'a')]]]);
    const result = planDedupe([candidate(1, 'a')], existing, new Set(), 'global');
    expect(result.trashExisting.map((row) => row.id)).toEqual(['old']);
    expect(result.skippedBecauseLocked).toBe(0);
  });

  it('never removes tabs from locked stacks', () => {
    const existing = new Map([['a', [tab('old', 'a', 'locked')]]]);
    const result = planDedupe([candidate(1, 'a')], existing, new Set(['locked']), 'global');
    expect(result.trashExisting).toHaveLength(0);
    expect(result.skippedBecauseLocked).toBe(1);
  });

  it('keeps everything when dedupe is off', () => {
    const existing = new Map([['a', [tab('old', 'a')]]]);
    const result = planDedupe([candidate(1, 'a')], existing, new Set(), 'off');
    expect(result.trashExisting).toHaveLength(0);
    expect(result.keep).toHaveLength(1);
  });
});
