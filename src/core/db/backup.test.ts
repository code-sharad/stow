import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildStowPlan } from '../domain/plan';
import type { TabCandidate } from '../domain/types';
import { buildFullBackup, parseFullBackup, serializeFullBackup } from '../io/formats';
import { DEFAULT_SETTINGS } from '../settings/schema';
import {
  commitStow,
  getLiveTabs,
  getStacks,
  importBackup,
  resetLibraryData,
  updateStack,
} from './repo';
import { db, StowDB, setDbForTests } from './schema';

let dbCount = 0;

beforeEach(async () => {
  dbCount += 1;
  setDbForTests(new StowDB(`stow-backup-roundtrip-${dbCount}`));
  await db().open();
});

afterEach(async () => {
  await db().delete();
  setDbForTests(null);
});

function tab(id: number, index: number, faviconUrl?: string): TabCandidate {
  return {
    id,
    windowId: 1,
    index,
    url: `https://example.com/${id}`,
    title: `Tab ${id}`,
    pinned: id === 1,
    incognito: false,
    groupId: -1,
    windowType: 'normal',
    ...(faviconUrl ? { faviconUrl } : {}),
  };
}

async function stowLibrary(): Promise<void> {
  const plan = buildStowPlan({
    eligible: [tab(1, 0, 'data:image/png;base64,AA=='), tab(2, 1), tab(3, 2)],
    groups: new Map(),
    settings: { preserveBrowserGroups: true, dedupe: 'off', stripTrackingForDedupe: true },
    existing: new Map(),
    lockedStackIds: new Set(),
    now: Date.now(),
  });
  await commitStow(plan);
  const stacks = await getStacks();
  const first = stacks[0];
  if (first) {
    await updateStack(first.id, {
      title: 'First',
      pinned: true,
      collapsed: true,
      color: 'blue',
    });
  }
}

describe('importBackup', () => {
  it('restores every stack and tab field with the original order keys', async () => {
    await stowLibrary();
    const before = buildFullBackup(await getStacks(), await getLiveTabs(), {
      ...DEFAULT_SETTINGS,
      theme: 'dark',
      trashRetentionDays: 90,
    });

    await resetLibraryData();
    expect(await getStacks()).toHaveLength(0);

    const result = await importBackup(parseFullBackup(serializeFullBackup(before)));
    expect(result.importedStacks).toBe(before.stacks.length);
    expect(result.importedTabs).toBe(3);
    expect(result.skipped).toHaveLength(0);

    const after = buildFullBackup(await getStacks(), await getLiveTabs(), {
      ...DEFAULT_SETTINGS,
      theme: 'dark',
      trashRetentionDays: 90,
    });
    expect(after.stacks).toEqual(before.stacks);
  });

  it('skips unsafe URLs instead of fabricating rows', async () => {
    const backup = {
      app: 'stow' as const,
      formatVersion: 2 as const,
      exportedAt: '2026-01-01T00:00:00.000Z',
      settings: { ...DEFAULT_SETTINGS },
      stacks: [
        {
          title: 'Mixed',
          orderKey: 'a1',
          pinned: false,
          locked: false,
          collapsed: false,
          color: null,
          createdAt: 1,
          updatedAt: 1,
          tabs: [
            {
              url: 'chrome://settings',
              title: 'Unsafe',
              orderKey: 'a1',
              wasPinned: false,
              createdAt: 1,
            },
            {
              url: 'https://ok.example/',
              title: 'Safe',
              orderKey: 'a2',
              wasPinned: false,
              createdAt: 1,
            },
          ],
        },
      ],
    };
    const result = await importBackup(backup);
    expect(result.importedTabs).toBe(1);
    expect(result.skipped[0]?.reason).toBe('scheme');
    expect((await getLiveTabs())[0]?.url).toBe('https://ok.example/');
  });
});
