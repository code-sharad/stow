import { ulid } from 'ulid';
import { LIMITS } from '../../shared/constants';
import { type Candidate, planDedupe } from './dedupe';
import { keysBetween } from './order';
import type { GroupColor, Id, NativeGroup, SavedTab, TabCandidate } from './types';
import { normalizeUrlKey } from './url';

export interface PlanSettings {
  preserveBrowserGroups: boolean;
  dedupe: 'global' | 'off';
  stripTrackingForDedupe: boolean;
}

export interface PlannedTab {
  id: Id;
  sourceTabId: number;
  url: string;
  urlKey: string;
  title: string;
  orderKey: string;
  wasPinned: boolean;
}

export interface PlannedStack {
  id: Id;
  title: string;
  color: GroupColor | null;
  orderKey: string;
  tabs: PlannedTab[];
}

export interface StowPlan {
  opId: Id;
  now: number;
  stacks: PlannedStack[];
  trashExisting: SavedTab[];
  closeTabIds: number[];
  summary: {
    savedTabs: number;
    stacks: number;
    merged: number;
    collapsedWithinBatch: number;
  };
}

export interface BuildStowPlanInput {
  eligible: readonly TabCandidate[];
  groups: ReadonlyMap<number, NativeGroup>;
  settings: PlanSettings;
  existing: ReadonlyMap<string, readonly SavedTab[]>;
  lockedStackIds: ReadonlySet<Id>;
  now: number;
  newId?: () => Id;
}

interface Bucket {
  key: string;
  title: string;
  color: GroupColor | null;
  firstIndex: number;
  tabs: Candidate[];
}

/** Pure: turns eligible browser tabs into the exact rows to write and tab ids to close. */
export function buildStowPlan(input: BuildStowPlanInput): StowPlan {
  const newId = input.newId ?? (() => ulid());
  const strip = input.settings.stripTrackingForDedupe;

  const candidates: Candidate[] = [];
  const groupKeyByTab = new Map<number, string>();

  for (const tab of input.eligible) {
    const grouped = input.settings.preserveBrowserGroups && tab.groupId >= 0;
    const groupKey = grouped ? `g:${tab.groupId}` : 'ungrouped';
    groupKeyByTab.set(tab.id, groupKey);
    candidates.push({
      sourceTabId: tab.id,
      url: tab.url,
      urlKey: normalizeUrlKey(tab.url, strip),
      title: tab.title.slice(0, LIMITS.title),
      wasPinned: tab.pinned,
      groupKey,
    });
  }

  const dedupe = planDedupe(
    candidates,
    input.existing,
    input.lockedStackIds,
    input.settings.dedupe,
  );

  const buckets = new Map<string, Bucket>();
  for (const candidate of dedupe.keep) {
    const key = groupKeyByTab.get(candidate.sourceTabId) ?? 'ungrouped';
    let bucket = buckets.get(key);
    if (!bucket) {
      const groupId = key.startsWith('g:') ? Number(key.slice(2)) : null;
      const group = groupId === null ? undefined : input.groups.get(groupId);
      const firstIndex = input.eligible.find((tab) => tab.id === candidate.sourceTabId)?.index ?? 0;
      bucket = {
        key,
        title: (group?.title ?? '').slice(0, LIMITS.stackTitle),
        color: group?.color ?? null,
        firstIndex,
        tabs: [],
      };
      buckets.set(key, bucket);
    }
    bucket.tabs.push(candidate);
  }

  const ordered = [...buckets.values()].sort((a, b) => a.firstIndex - b.firstIndex);
  const stacks: PlannedStack[] = ordered.map((bucket) => {
    const tabKeys = keysBetween(null, null, bucket.tabs.length);
    return {
      id: newId(),
      title: bucket.title,
      color: bucket.color,
      orderKey: '',
      tabs: bucket.tabs.map((candidate, index) => ({
        id: newId(),
        sourceTabId: candidate.sourceTabId,
        url: candidate.url,
        urlKey: candidate.urlKey,
        title: candidate.title,
        orderKey: tabKeys[index] ?? tabKeys[tabKeys.length - 1] ?? 'a0',
        wasPinned: candidate.wasPinned,
      })),
    };
  });

  const savedTabs = stacks.reduce((sum, stack) => sum + stack.tabs.length, 0);

  return {
    opId: newId(),
    now: input.now,
    stacks,
    trashExisting: dedupe.trashExisting,
    closeTabIds: input.eligible.map((tab) => tab.id),
    summary: {
      savedTabs,
      stacks: stacks.length,
      merged: dedupe.trashExisting.length,
      collapsedWithinBatch: dedupe.collapsedWithinBatch,
    },
  };
}
