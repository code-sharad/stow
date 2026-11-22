const LIBRARY_FILE = 'library.html';

export function libraryUrl(hash = ''): string {
  const base = chrome.runtime.getURL(LIBRARY_FILE);
  return hash ? `${base}#${hash.replace(/^#/, '')}` : base;
}

export interface FocusOptions {
  hash?: string;
  windowId?: number;
  pinned?: boolean;
}

/** Focus the existing Library tab (first match) or create one. */
export async function focusOrCreate(options: FocusOptions = {}): Promise<chrome.tabs.Tab | null> {
  const base = libraryUrl();
  const all = await chrome.tabs.query({});
  const matches = all.filter((tab) => typeof tab.url === 'string' && tab.url.startsWith(base));
  const hash = options.hash?.replace(/^#/, '');
  if (matches.length > 0) {
    const tab = matches[0];
    if (!tab?.id) return null;
    const url = hash ? `${base}#${hash}` : undefined;
    const updated = await chrome.tabs.update(tab.id, {
      active: true,
      ...(url ? { url } : {}),
    });
    if (tab.windowId !== undefined) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
    return updated ?? tab;
  }
  const createOptions: chrome.tabs.CreateProperties = {
    url: libraryUrl(hash),
    active: true,
    ...(options.windowId !== undefined ? { windowId: options.windowId } : {}),
    ...(options.pinned ? { pinned: true } : {}),
  };
  const created = await chrome.tabs.create(createOptions);
  if (created.windowId !== undefined) {
    await chrome.windows.update(created.windowId, { focused: true });
  }
  return created;
}

/**
 * Ensure no window is left with zero tabs. Runs BEFORE any tabs are closed.
 * `show-library` puts/moves the Library tab into an about-to-empty window;
 * `stay` opens a New Tab page there instead.
 */
export async function ensureSurvival(
  closeTabIds: readonly number[],
  settings: { afterStow: 'show-library' | 'stay'; pinLibraryTab: boolean },
  originWindowId?: number,
): Promise<void> {
  const closing = new Set(closeTabIds);
  const all = await chrome.tabs.query({ windowType: 'normal' });
  const byWindow = new Map<number, { total: number; remaining: number }>();
  for (const tab of all) {
    const row = byWindow.get(tab.windowId) ?? { total: 0, remaining: 0 };
    row.total += 1;
    if (tab.id === undefined || !closing.has(tab.id)) row.remaining += 1;
    byWindow.set(tab.windowId, row);
  }

  for (const [windowId, counts] of byWindow) {
    if (counts.remaining > 0) continue;
    if (settings.afterStow === 'show-library') {
      await focusOrCreate({ windowId, pinned: settings.pinLibraryTab });
    } else {
      try {
        await chrome.tabs.create({ windowId, url: 'chrome://newtab/' });
      } catch {
        await chrome.tabs.create({ windowId });
      }
    }
  }

  if (settings.afterStow === 'show-library' && originWindowId !== undefined) {
    await focusOrCreate({ windowId: originWindowId, pinned: settings.pinLibraryTab });
  }
}
