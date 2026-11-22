import { describe, expect, it } from 'vitest';
import type { SavedTab, Stack } from '../domain/types';
import { applyChangeSet, type ChangeSet, emptyState, needsResync } from './changes';

const stack: Stack = {
  id: 's1',
  title: 'One',
  orderKey: 'a0',
  pinned: false,
  locked: false,
  collapsed: false,
  color: null,
  tabCount: 1,
  createdAt: 1,
  updatedAt: 1,
  deletedAt: 0,
  deletedBy: '',
};

const tab: SavedTab = {
  id: 't1',
  stackId: 's1',
  url: 'https://example.com',
  urlKey: 'https://example.com/',
  title: 'Example',
  orderKey: 'a0',
  wasPinned: false,
  createdAt: 1,
  deletedAt: 0,
  deletedBy: '',
};

function change(overrides: Partial<ChangeSet> = {}): ChangeSet {
  return {
    rev: 1,
    stacksUpserted: [],
    stacksDeletedIds: [],
    tabsUpserted: [],
    tabsDeletedIds: [],
    ...overrides,
  };
}

describe('change sets', () => {
  it('starts empty', () => {
    const state = emptyState();
    expect(state.rev).toBe(0);
    expect(state.stacks.size).toBe(0);
    expect(state.tabs.size).toBe(0);
  });

  it('applies upserts and hard deletes', () => {
    let state = applyChangeSet(
      emptyState(),
      change({ stacksUpserted: [stack], tabsUpserted: [tab] }),
    );
    expect(state.stacks.get('s1')?.title).toBe('One');
    expect(state.tabs.get('t1')?.url).toBe('https://example.com');
    state = applyChangeSet(
      state,
      change({ rev: 2, stacksDeletedIds: ['s1'], tabsDeletedIds: ['t1'] }),
    );
    expect(state.stacks.size).toBe(0);
    expect(state.tabs.size).toBe(0);
    expect(state.rev).toBe(2);
  });

  it('keeps soft-deleted rows so the UI can animate them out', () => {
    const state = applyChangeSet(
      emptyState(),
      change({ tabsUpserted: [{ ...tab, deletedAt: 10 }] }),
    );
    expect(state.tabs.get('t1')?.deletedAt).toBe(10);
  });

  it('asks for a resync when revisions skip', () => {
    const state = { rev: 4, stacks: new Map(), tabs: new Map() };
    expect(needsResync(state, change({ rev: 5 }))).toBe(false);
    expect(needsResync(state, change({ rev: 8 }))).toBe(true);
    expect(needsResync(state, change({ rev: 4 }))).toBe(true);
  });
});
