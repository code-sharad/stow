import { commitStow, getLockedStackIds, liveUrlIndex, log, verifyStow } from '../core/db/repo';
import { classify } from '../core/domain/ignore';
import { buildStowPlan } from '../core/domain/plan';
import type { SkipCounts, StowScope } from '../core/domain/types';
import { normalizeUrlKey } from '../core/domain/url';
import { getSettings } from '../core/settings/store';
import { describeGroups, removeInBatches, resolveScope } from '../platform/tabs';
import { ensureSurvival, libraryUrl } from '../platform/windows';
import { refresh } from './badge';
import { enqueue } from './queue';

export interface StowSuccess {
  ok: true;
  saved: number;
  stacks: number;
  merged: number;
  closeFailed: number;
  skipped: SkipCounts;
}

export interface StowFailure {
  ok: false;
  error: { code: string; message: string };
}

export type StowResult = StowSuccess | StowFailure;

const USER_ERRORS: Record<string, string> = {
  quota: 'Could not save tabs: storage is full. Nothing was closed.',
  write: "Couldn't save tabs. Nothing was closed.",
  verify: "Couldn't confirm the save. Nothing was closed.",
};

async function stowNow(scope: StowScope): Promise<StowResult> {
  const settings = await getSettings();
  const tabs = await resolveScope(scope);
  const { eligible, skipped } = classify(tabs, settings, { libraryUrl: libraryUrl() });

  if (eligible.length === 0) {
    return {
      ok: true,
      saved: 0,
      stacks: 0,
      merged: 0,
      closeFailed: 0,
      skipped,
    };
  }

  const groups = settings.preserveBrowserGroups ? await describeGroups(eligible) : new Map();
  const existing =
    settings.dedupe === 'global'
      ? await liveUrlIndex(
          eligible.map((tab) => normalizeUrlKey(tab.url, settings.stripTrackingForDedupe)),
        )
      : new Map();
  const locked = settings.dedupe === 'global' ? await getLockedStackIds() : new Set<string>();

  const plan = buildStowPlan({
    eligible,
    groups,
    settings,
    existing,
    lockedStackIds: locked,
    now: Date.now(),
  });

  let committed = false;
  try {
    await commitStow(plan);
    committed = true;
    await verifyStow(plan);
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    const code = /quota/i.test(name) ? 'quota' : committed ? 'verify' : 'write';
    await log('error', `stow-${code}`, name);
    await refresh();
    return { ok: false, error: { code, message: USER_ERRORS[code] ?? USER_ERRORS.write ?? '' } };
  }

  const originWindow = eligible[0]?.windowId;
  try {
    await ensureSurvival(plan.closeTabIds, settings, originWindow);
  } catch {
    await log('warn', 'survival-failed');
  }

  let closeFailed = 0;
  try {
    const result = await removeInBatches(plan.closeTabIds, 50);
    closeFailed = result.failed;
  } catch {
    await log('warn', 'close-failed');
  }

  await refresh();
  return {
    ok: true,
    saved: plan.summary.savedTabs,
    stacks: plan.summary.stacks,
    merged: plan.summary.merged,
    closeFailed,
    skipped,
  };
}

export function stow(scope: StowScope): Promise<StowResult> {
  return enqueue(() => stowNow(scope), {
    onError: async (error) => {
      const name = error instanceof Error ? error.name : 'unknown';
      await log('error', 'stow-unhandled', name);
      await refresh();
      return {
        ok: false,
        error: { code: 'unexpected', message: "Couldn't stow tabs. Nothing was closed." },
      } satisfies StowFailure;
    },
  });
}

export async function eligibleCount(scope: StowScope): Promise<number> {
  const settings = await getSettings();
  const tabs = await resolveScope(scope);
  return classify(tabs, settings, { libraryUrl: libraryUrl() }).eligible.length;
}
