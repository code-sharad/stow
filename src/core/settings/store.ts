import { DEFAULT_SETTINGS, parseSettings, type Settings } from './schema';

const KEY = 'settings';
const LOCAL_THEME = 'stow.theme';
const LOCAL_DENSITY = 'stow.density';

type Listener = (settings: Settings) => void;

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

export async function getSettings(): Promise<Settings> {
  if (!hasChromeStorage()) return { ...DEFAULT_SETTINGS };
  const raw = await chrome.storage.local.get(KEY);
  return parseSettings(raw[KEY]);
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = parseSettings({ ...current, ...patch });
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [KEY]: next });
  }
  mirrorAppearance(next);
  return next;
}

export async function resetSettings(): Promise<Settings> {
  return saveSettings({ ...DEFAULT_SETTINGS });
}

function mirrorAppearance(settings: Settings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_THEME, settings.theme);
  localStorage.setItem(LOCAL_DENSITY, settings.density);
}

/** Subscribe to settings changes in any context. Returns an unsubscribe function. */
export function subscribeSettings(listener: Listener): () => void {
  if (!hasChromeStorage()) return () => {};
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ): void => {
    if (areaName !== 'local' || !changes[KEY]) return;
    listener(parseSettings(changes[KEY].newValue));
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
