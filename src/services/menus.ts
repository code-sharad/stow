import type { StowScope } from '../core/domain/types';
import { stow } from './stow';

const ITEMS: { id: string; titleKey: string; contexts: string[] }[] = [
  { id: 'stow-tab', titleKey: 'menuStowTab', contexts: ['page'] },
  { id: 'stow-window', titleKey: 'menuStowWindow', contexts: ['page', 'action'] },
  { id: 'stow-others', titleKey: 'menuStowOthers', contexts: ['page'] },
  { id: 'stow-left', titleKey: 'menuStowLeft', contexts: ['page'] },
  { id: 'stow-right', titleKey: 'menuStowRight', contexts: ['page'] },
  { id: 'stow-highlighted', titleKey: 'menuStowSelected', contexts: ['page', 'action'] },
  { id: 'stow-all-windows', titleKey: 'menuStowAll', contexts: ['page', 'action'] },
  { id: 'open-library', titleKey: 'menuOpenLibrary', contexts: ['page', 'action'] },
];

export async function createMenus(): Promise<void> {
  await chrome.contextMenus.removeAll();
  for (const item of ITEMS) {
    const props: chrome.contextMenus.CreateProperties = {
      id: item.id,
      title: chrome.i18n.getMessage(item.titleKey) || item.titleKey,
      contexts: item.contexts as chrome.contextMenus.CreateProperties['contexts'],
    };
    chrome.contextMenus.create(props);
  }
}

export function scopeForMenu(id: string, tab?: chrome.tabs.Tab): StowScope | null {
  if (id === 'open-library') return null;
  if (id === 'stow-all-windows') return { kind: 'all-windows' };
  if (id === 'stow-window') {
    return tab?.windowId !== undefined
      ? { kind: 'window', windowId: tab.windowId }
      : { kind: 'window' };
  }
  if (id === 'stow-highlighted') {
    return tab?.windowId !== undefined
      ? { kind: 'highlighted', windowId: tab.windowId }
      : { kind: 'highlighted' };
  }
  if (!tab?.id) return null;
  switch (id) {
    case 'stow-tab':
      return { kind: 'tab', tabId: tab.id };
    case 'stow-others':
      return { kind: 'others', tabId: tab.id };
    case 'stow-left':
      return { kind: 'left', tabId: tab.id };
    case 'stow-right':
      return { kind: 'right', tabId: tab.id };
    default:
      return null;
  }
}

export async function onMenuClicked(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab,
): Promise<void> {
  if (info.menuItemId === 'open-library') {
    const { focusOrCreate } = await import('../platform/windows');
    await focusOrCreate();
    return;
  }
  const scope = scopeForMenu(String(info.menuItemId), tab);
  if (!scope) return;
  await stow(scope);
}
