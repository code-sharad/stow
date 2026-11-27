import {
  beginRestoreOp,
  getRestoreOp,
  getStacks,
  loadForRestore,
  log,
  markRestoreRows,
  removeRestored,
} from '../core/db/repo';
import type { Id, RestoreRequest, SavedTab } from '../core/domain/types';
import { isAllowedScheme } from '../core/domain/url';
import { getSettings } from '../core/settings/store';
import { BATCH_CLOSE, BATCH_RESTORE } from '../shared/constants';
import { refresh } from './badge';
import { enqueue } from './queue';

export interface RestoreSuccess {
  ok: boolean;
  opened: number;
  failed: number;
}

export interface RestoreFailure {
  ok: false;
  error: { code: string; message: string };
}

export type RestoreResult = RestoreSuccess | RestoreFailure;

interface OpenOptions {
  target: 'current' | 'new';
  background: boolean;
  restorePinned: boolean;
  restoreGroups: boolean;
}

interface OpenedTab {
  tab: SavedTab;
  tabId: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function openTabs(
  opId: Id,
  tabs: readonly SavedTab[],
  stacks: Map<string, { title: string; color: string | null }>,
  options: OpenOptions,
): Promise<{ opened: OpenedTab[]; failed: number }> {
  let windowId: number | undefined;
  const opened: OpenedTab[] = [];
  const failures: SavedTab[] = [];

  if (options.target === 'new' && tabs[0]) {
    try {
      const win = await chrome.windows.create({ url: tabs[0].url, focused: true });
      if (!win || win.id === undefined) throw new Error('window-create-failed');
      windowId = win.id;
      const tabId = win.tabs?.[0]?.id;
      if (tabId !== undefined) opened.push({ tab: tabs[0], tabId });
      else failures.push(tabs[0]);
    } catch {
      failures.push(tabs[0]);
    }
  } else {
    try {
      windowId = (await chrome.windows.getLastFocused({ windowTypes: ['normal'] })).id;
    } catch {
      windowId = undefined;
    }
  }

  const remainder = options.target === 'new' ? tabs.slice(1) : tabs;
  for (let index = 0; index < remainder.length; index += BATCH_RESTORE) {
    const chunk = remainder.slice(index, index + BATCH_RESTORE);
    const results = await Promise.allSettled(
      chunk.map((tab) => {
        const props: chrome.tabs.CreateProperties = {
          url: tab.url,
          active: !options.background && opened.length === 0,
          pinned: options.restorePinned && tab.wasPinned,
        };
        if (windowId !== undefined) props.windowId = windowId;
        return chrome.tabs.create(props);
      }),
    );
    const recorded: { tabId: Id; state: 'opened'; browserTabId?: number }[] = [];
    results.forEach((result, offset) => {
      const tab = chunk[offset];
      if (!tab) return;
      if (result.status === 'fulfilled' && result.value.id !== undefined) {
        opened.push({ tab, tabId: result.value.id });
        recorded.push({ tabId: tab.id, state: 'opened', browserTabId: result.value.id });
      } else {
        failures.push(tab);
      }
    });
    await markRestoreRows(opId, recorded);
    await delay(120);
  }

  if (options.restoreGroups && typeof chrome.tabs.group === 'function') {
    const byStack = new Map<string, { tabIds: number[]; title: string; color: string | null }>();
    for (const item of opened) {
      const stack = stacks.get(item.tab.stackId);
      if (!stack?.color) continue;
      const row = byStack.get(item.tab.stackId) ?? {
        tabIds: [],
        title: stack.title,
        color: stack.color,
      };
      row.tabIds.push(item.tabId);
      byStack.set(item.tab.stackId, row);
    }
    for (const row of byStack.values()) {
      if (row.tabIds.length === 0) continue;
      try {
        const groupId = await chrome.tabs.group({ tabIds: row.tabIds as [number, ...number[]] });
        await chrome.tabGroups.update(groupId, {
          title: row.title,
          color: row.color as chrome.tabGroups.Color,
        });
      } catch {
        // Best effort.
      }
    }
  }

  return { opened, failed: failures.length };
}

async function removeOpened(opId: Id, opened: readonly OpenedTab[]): Promise<number> {
  if (opened.length === 0) return 0;
  const stackIds = [...new Set(opened.map((item) => item.tab.stackId))];
  const result = await removeRestored(
    opened.map((item) => item.tab.id),
    stackIds,
  );
  const removed = result?.change.tabsUpserted.filter((tab) => tab.deletedAt > 0) ?? [];
  const removedIds = new Set(removed.map((tab) => tab.id));
  await markRestoreRows(
    opId,
    opened.map((item) => ({
      tabId: item.tab.id,
      state: removedIds.has(item.tab.id) ? ('removed' as const) : ('opened' as const),
    })),
  );
  return removed.length;
}

async function restoreNow(req: RestoreRequest): Promise<RestoreResult> {
  const settings = await getSettings();
  const loaded = await loadForRestore({ by: req.by, ids: req.ids });
  if (loaded.tabs.length === 0) return { ok: true, opened: 0, failed: 0 };

  const safe = loaded.tabs.filter((tab) => isAllowedScheme(tab.url));
  const unsafe = loaded.tabs.length - safe.length;
  const stackById = new Map(loaded.stacks.map((stack) => [stack.id, stack]));
  const target = req.window ?? (settings.restoreTarget === 'new-window' ? 'new' : 'current');
  const background = req.background ?? true;
  const remove = settings.removeOnRestore && !req.invertRemove;

  const op = await beginRestoreOp({
    stackIds: [...new Set(safe.map((tab) => tab.stackId))],
    tabIds: safe.map((tab) => tab.id),
    remove,
    target,
    background,
  });

  const { opened, failed: openFailures } = await openTabs(op.id, safe, stackById, {
    target,
    background,
    restorePinned: settings.restorePinned,
    restoreGroups: settings.restoreGroups,
  });

  if (remove) await removeOpened(op.id, opened);

  await refresh();
  const failed = openFailures + unsafe;
  return { ok: failed === 0, opened: opened.length, failed };
}

/** Continue a restore that a dead or suspended worker left with pending rows. */
async function resumeNow(opId: Id): Promise<RestoreResult> {
  const op = await getRestoreOp(opId);
  if (!op?.restore) return { ok: true, opened: 0, failed: 0 };
  const pendingIds = op.restore.rows
    .filter((row) => row.state === 'pending')
    .map((row) => row.tabId);

  const stacks = await getStacks();
  const stackById = new Map(stacks.map((stack) => [stack.id, stack]));
  const rows = await Promise.all(pendingIds.map((id) => loadForRestore({ by: 'tab', ids: [id] })));
  const tabs = rows
    .flatMap((row) => row.tabs)
    .filter((tab) => isAllowedScheme(tab.url) && stackById.has(tab.stackId));

  const { opened, failed } = await openTabs(opId, tabs, stackById, {
    target: op.restore.target,
    background: op.restore.background,
    restorePinned: true,
    restoreGroups: true,
  });

  if (op.restore.remove) {
    const current = await getRestoreOp(opId);
    const openIds = new Set(
      (current?.restore?.rows ?? [])
        .filter((row) => row.state === 'opened')
        .map((row) => row.tabId),
    );
    const openRows = await Promise.all(
      [...openIds].map((id) => loadForRestore({ by: 'tab', ids: [id] })),
    );
    await removeOpened(
      opId,
      opened.concat(
        openRows.flatMap((row) =>
          row.tabs.map((tab) => ({
            tab,
            tabId: current?.restore?.rows.find((r) => r.tabId === tab.id)?.browserTabId ?? 0,
          })),
        ),
      ),
    );
  }

  await refresh();
  return { ok: failed === 0, opened: opened.length, failed };
}

export function restore(req: RestoreRequest): Promise<RestoreResult> {
  return enqueue(() => restoreNow(req), {
    onError: async (error) => {
      await log('error', 'restore-unhandled', error instanceof Error ? error.name : 'unknown');
      await refresh();
      return {
        ok: false,
        error: { code: 'unexpected', message: "Couldn't restore those tabs." },
      } satisfies RestoreFailure;
    },
  });
}

export function resumeRestore(opId: Id): Promise<RestoreResult> {
  return enqueue(() => resumeNow(opId), {
    onError: async (error) => {
      await log('error', 'resume-unhandled', error instanceof Error ? error.name : 'unknown');
      await refresh();
      return {
        ok: false,
        error: { code: 'unexpected', message: "Couldn't resume that restore." },
      } satisfies RestoreFailure;
    },
  });
}

export function chunkForClose<T>(items: readonly T[]): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += BATCH_CLOSE) {
    chunks.push(items.slice(index, index + BATCH_CLOSE));
  }
  return chunks;
}
