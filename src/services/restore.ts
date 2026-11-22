import { loadForRestore, log, removeRestored } from '../core/db/repo';
import type { RestoreRequest, SavedTab } from '../core/domain/types';
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  let windowId: number | undefined;
  const opened: { tab: SavedTab; tabId: number }[] = [];
  const failures: SavedTab[] = [];

  if (target === 'new' && safe[0]) {
    try {
      const win = await chrome.windows.create({ url: safe[0].url, focused: true });
      if (!win || win.id === undefined) throw new Error('window-create-failed');
      windowId = win.id;
      const tabId = win.tabs?.[0]?.id;
      if (tabId !== undefined) opened.push({ tab: safe[0], tabId });
      else failures.push(safe[0]);
    } catch {
      failures.push(safe[0]);
    }
  } else {
    try {
      windowId = (await chrome.windows.getLastFocused({ windowTypes: ['normal'] })).id;
    } catch {
      windowId = undefined;
    }
  }

  const remainder = target === 'new' ? safe.slice(1) : safe;
  for (let index = 0; index < remainder.length; index += BATCH_RESTORE) {
    const chunk = remainder.slice(index, index + BATCH_RESTORE);
    const results = await Promise.allSettled(
      chunk.map((tab) => {
        const props: chrome.tabs.CreateProperties = {
          url: tab.url,
          active: !background && opened.length === 0,
          pinned: settings.restorePinned && tab.wasPinned,
        };
        if (windowId !== undefined) props.windowId = windowId;
        return chrome.tabs.create(props);
      }),
    );
    results.forEach((result, offset) => {
      const tab = chunk[offset];
      if (!tab) return;
      if (result.status === 'fulfilled' && result.value.id !== undefined) {
        opened.push({ tab, tabId: result.value.id });
      } else {
        failures.push(tab);
      }
    });
    await delay(120);
  }

  if (settings.restoreGroups && typeof chrome.tabs.group === 'function') {
    const byStack = new Map<string, { tabIds: number[]; title: string; color: string | null }>();
    for (const item of opened) {
      const stack = stackById.get(item.tab.stackId);
      if (!stack?.color) continue;
      const row = byStack.get(stack.id) ?? { tabIds: [], title: stack.title, color: stack.color };
      row.tabIds.push(item.tabId);
      byStack.set(stack.id, row);
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

  if (opened.length > 0 && !req.invertRemove) {
    const stackIds = [...new Set(opened.map((item) => item.tab.stackId))];
    await removeRestored(
      opened.map((item) => item.tab.id),
      stackIds,
    );
  }

  await refresh();
  const failed = failures.length + unsafe;
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

export function chunkForClose<T>(items: readonly T[]): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += BATCH_CLOSE) {
    chunks.push(items.slice(index, index + BATCH_CLOSE));
  }
  return chunks;
}
