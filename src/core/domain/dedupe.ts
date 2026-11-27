import type { Id, SavedTab } from './types';

export interface Candidate {
  sourceTabId: number;
  url: string;
  urlKey: string;
  title: string;
  wasPinned: boolean;
  favicon?: string;
  groupKey: string;
}

export interface DedupeResult {
  keep: Candidate[];
  collapsedWithinBatch: number;
  trashExisting: SavedTab[];
  skippedBecauseLocked: number;
}

export function planDedupe(
  incoming: readonly Candidate[],
  existing: ReadonlyMap<string, readonly SavedTab[]>,
  lockedStackIds: ReadonlySet<Id>,
  policy: 'global' | 'off',
): DedupeResult {
  const seen = new Set<string>();
  const keep: Candidate[] = [];
  let collapsedWithinBatch = 0;

  for (const candidate of incoming) {
    if (seen.has(candidate.urlKey)) {
      collapsedWithinBatch++;
      continue;
    }
    seen.add(candidate.urlKey);
    keep.push(candidate);
  }

  const trashExisting: SavedTab[] = [];
  let skippedBecauseLocked = 0;

  if (policy === 'global') {
    const trashedIds = new Set<Id>();
    for (const candidate of keep) {
      for (const old of existing.get(candidate.urlKey) ?? []) {
        if (old.deletedAt !== 0) continue;
        if (lockedStackIds.has(old.stackId)) {
          skippedBecauseLocked++;
          continue;
        }
        if (trashedIds.has(old.id)) continue;
        trashedIds.add(old.id);
        trashExisting.push(old);
      }
    }
  }

  return { keep, collapsedWithinBatch, trashExisting, skippedBecauseLocked };
}
