import type { NativeGroup, RestoreRequest, StowScope, TabCandidate } from '../core/domain/types';
import { BATCH_CLOSE } from '../shared/constants';

export interface TabsPort {
  resolve(scope: StowScope, settings: { openLibraryOnStartup: boolean }): Promise<TabCandidate[]>;
  removeInBatches(
    ids: readonly number[],
    batchSize: number,
  ): Promise<{ closed: number; failed: number }>;
  nearestWindowTabs(tabId: number): Promise<TabCandidate[]>;
}

function toCandidate(tab: chrome.tabs.Tab): TabCandidate {
  const candidate: TabCandidate = {
    id: tab.id ?? -1,
    windowId: tab.windowId,
    index: tab.index,
    url: tab.url ?? tab.pendingUrl ?? '',
    title: tab.title ?? '',
    pinned: Boolean(tab.pinned),
    incognito: Boolean(tab.incognito),
    groupId: tab.groupId ?? -1,
    windowType: 'normal',
  };
  if (tab.pendingUrl && !tab.url) candidate.url = tab.pendingUrl;
  return candidate;
}

async function isNormalWindow(windowId: number): Promise<boolean> {
  try {
    const win = await chrome.windows.get(windowId);
    return win.type === 'normal';
  } catch {
    return false;
  }
}

async function queryWindow(windowId: number): Promise<TabCandidate[]> {
  const tabs = await chrome.tabs.query({ windowId });
  return tabs.filter((tab) => tab.id !== undefined).map(toCandidate);
}

export async function resolveScope(scope: StowScope): Promise<TabCandidate[]> {
  switch (scope.kind) {
    case 'window': {
      const windowId =
        scope.windowId ?? (await chrome.windows.getLastFocused({ windowTypes: ['normal'] })).id;
      if (windowId === undefined) return [];
      if (!(await isNormalWindow(windowId))) return [];
      return queryWindow(windowId);
    }
    case 'all-windows': {
      const tabs = await chrome.tabs.query({ windowType: 'normal' });
      return tabs.filter((tab) => tab.id !== undefined).map(toCandidate);
    }
    case 'tab': {
      const tab = await chrome.tabs.get(scope.tabId);
      if (!(await isNormalWindow(tab.windowId))) return [];
      return [toCandidate(tab)];
    }
    case 'others': {
      const tab = await chrome.tabs.get(scope.tabId);
      if (!(await isNormalWindow(tab.windowId))) return [];
      return (await queryWindow(tab.windowId)).filter((candidate) => candidate.id !== scope.tabId);
    }
    case 'left': {
      const tab = await chrome.tabs.get(scope.tabId);
      if (!(await isNormalWindow(tab.windowId))) return [];
      return (await queryWindow(tab.windowId)).filter((candidate) => candidate.index < tab.index);
    }
    case 'right': {
      const tab = await chrome.tabs.get(scope.tabId);
      if (!(await isNormalWindow(tab.windowId))) return [];
      return (await queryWindow(tab.windowId)).filter((candidate) => candidate.index > tab.index);
    }
    case 'highlighted': {
      const query: chrome.tabs.QueryInfo = { highlighted: true };
      if (scope.windowId !== undefined) query.windowId = scope.windowId;
      else query.windowType = 'normal';
      const tabs = await chrome.tabs.query(query);
      return tabs.filter((tab) => tab.id !== undefined).map(toCandidate);
    }
    default:
      return [];
  }
}

export async function removeInBatches(
  ids: readonly number[],
  batchSize = BATCH_CLOSE,
): Promise<{ closed: number; failed: number }> {
  let closed = 0;
  let failed = 0;
  for (let index = 0; index < ids.length; index += batchSize) {
    const chunk = ids.slice(index, index + batchSize);
    try {
      await chrome.tabs.remove(chunk);
      closed += chunk.length;
    } catch {
      for (const id of chunk) {
        try {
          await chrome.tabs.remove(id);
          closed += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (!/no tab with id/i.test(message)) failed += 1;
        }
      }
    }
  }
  return { closed, failed };
}

export async function getTab(tabId: number): Promise<chrome.tabs.Tab | null> {
  try {
    return await chrome.tabs.get(tabId);
  } catch {
    return null;
  }
}

export async function getAllNormalTabs(): Promise<TabCandidate[]> {
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  return tabs.filter((tab) => tab.id !== undefined).map(toCandidate);
}

export async function describeGroups(
  tabs: readonly TabCandidate[],
): Promise<Map<number, NativeGroup>> {
  const groupIds = [...new Set(tabs.map((tab) => tab.groupId).filter((id) => id >= 0))];
  const map = new Map<number, NativeGroup>();
  for (const groupId of groupIds) {
    try {
      const group = await chrome.tabGroups.get(groupId);
      map.set(groupId, {
        id: group.id,
        title: group.title ?? '',
        color: (group.color ?? 'grey') as NativeGroup['color'],
        collapsed: group.collapsed,
      });
    } catch {
      // A group can disappear between query and describe.
    }
  }
  return map;
}

export async function openTabs(
  items: readonly { url: string; wasPinned: boolean }[],
  target: RestoreRequest['window'],
  settings: { restoreGroups: boolean; openInBackground: boolean },
): Promise<{ windowId: number; opened: { url: string; tabId?: number; wasPinned: boolean }[] }> {
  const opened: { url: string; tabId?: number; wasPinned: boolean }[] = [];
  let windowId: number | undefined;
  const active = !settings.openInBackground;

  if (target === 'new') {
    const first = items[0];
    const win = await chrome.windows.create({
      url: first ? first.url : undefined,
      focused: true,
    });
    if (!win) throw new Error('window-create-failed');
    windowId = win.id;
    if (windowId === undefined) throw new Error('window-create-failed');
    if (first && win.tabs?.[0]?.id !== undefined) {
      opened.push({ url: first.url, tabId: win.tabs[0].id, wasPinned: first.wasPinned });
    }
    for (const item of items.slice(1)) {
      try {
        const tab = await chrome.tabs.create({
          windowId,
          url: item.url,
          active: false,
          pinned: item.wasPinned,
        });
        opened.push({ url: item.url, tabId: tab.id, wasPinned: item.wasPinned });
      } catch {
        // Keep going; the caller counts missing entries as failures.
      }
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    return { windowId: windowId ?? -1, opened };
  }

  windowId = (await chrome.windows.getLastFocused({ windowTypes: ['normal'] })).id;
  for (const item of items) {
    try {
      const tab = await chrome.tabs.create({
        windowId,
        url: item.url,
        active: active && opened.length === 0,
        pinned: item.wasPinned,
      });
      opened.push({ url: item.url, tabId: tab.id, wasPinned: item.wasPinned });
    } catch {
      // Counted by caller.
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return { windowId: windowId ?? -1, opened };
}

export async function recreateGroups(
  groups: readonly { title: string; color: NativeGroup['color'] | null; tabIds: number[] }[],
): Promise<void> {
  for (const group of groups) {
    const ids = group.tabIds.filter((id) => id >= 0);
    if (ids.length < 1) continue;
    try {
      const groupId = await chrome.tabs.group({ tabIds: ids as [number, ...number[]] });
      if (group.color) {
        await chrome.tabGroups.update(groupId, {
          title: group.title,
          color: group.color,
        });
      }
    } catch {
      // Group recreation is best-effort; tabs are already open.
    }
  }
}
