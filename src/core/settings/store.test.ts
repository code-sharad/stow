import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from './schema';
import { getSettings, resetSettings, saveSettings, subscribeSettings } from './store';

interface FakeStorage {
  data: Record<string, unknown>;
  listeners: ((changes: Record<string, { newValue?: unknown }>, area: string) => void)[];
}

function installChrome(storage: FakeStorage): void {
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: async (key: string) => ({ [key]: storage.data[key] }),
        set: async (values: Record<string, unknown>) => {
          const changes: Record<string, { newValue?: unknown }> = {};
          for (const [key, value] of Object.entries(values)) {
            storage.data[key] = value;
            changes[key] = { newValue: value };
          }
          for (const listener of storage.listeners) listener(changes, 'local');
        },
      },
      onChanged: {
        addListener: (listener: FakeStorage['listeners'][number]) =>
          storage.listeners.push(listener),
        removeListener: (listener: FakeStorage['listeners'][number]) => {
          storage.listeners = storage.listeners.filter((entry) => entry !== listener);
        },
      },
    },
  });
}

let storage: FakeStorage;

beforeEach(() => {
  storage = { data: {}, listeners: [] };
  installChrome(storage);
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('settings store', () => {
  it('returns defaults when nothing is stored', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('opens the popup on a toolbar click by default', async () => {
    expect(await getSettings()).toMatchObject({ toolbarClick: 'popup' });
  });

  it('saves a patch and mirrors appearance', async () => {
    const next = await saveSettings({ theme: 'dark', density: 'compact', trashRetentionDays: 7 });
    expect(next.theme).toBe('dark');
    expect(next.density).toBe('compact');
    expect(next.trashRetentionDays).toBe(7);
    expect(localStorage.getItem('stow.theme')).toBe('dark');
    expect(await getSettings()).toMatchObject({ theme: 'dark', density: 'compact' });
  });

  it('resets to defaults', async () => {
    await saveSettings({ pinLibraryTab: true });
    const next = await resetSettings();
    expect(next.pinLibraryTab).toBe(false);
  });

  it('notifies subscribers and unsubscribes', async () => {
    const seen: string[] = [];
    const off = subscribeSettings((settings) => seen.push(settings.theme));
    await saveSettings({ theme: 'light' });
    off();
    await saveSettings({ theme: 'dark' });
    expect(seen).toEqual(['light']);
    expect(storage.listeners).toHaveLength(0);
  });
});
