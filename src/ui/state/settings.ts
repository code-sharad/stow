import { create } from 'zustand';
import type { Settings } from '../../core/settings/schema';
import { getSettings, saveSettings, subscribeSettings } from '../../core/settings/store';
import { syncBackupAlarm } from '../../services/backup';
import { applyMetrics } from '../layout/metrics';

interface SettingsState {
  settings: Settings | null;
  init: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export function applyAppearance(settings: Settings): void {
  document.documentElement.dataset.theme = settings.theme;
  applyMetrics(settings.density);
  try {
    localStorage.setItem('stow.theme', settings.theme);
    localStorage.setItem('stow.density', settings.density);
  } catch {
    // Storage can be unavailable in private contexts.
  }
}

export const useSettings = create<SettingsState>((set, _get) => ({
  settings: null,
  init: async () => {
    const settings = await getSettings();
    applyAppearance(settings);
    set({ settings });
    subscribeSettings((next) => {
      applyAppearance(next);
      set({ settings: next });
    });
  },
  update: async (patch) => {
    const next = await saveSettings(patch);
    applyAppearance(next);
    set({ settings: next });
    if (patch.autoBackup !== undefined) void syncBackupAlarm(next.autoBackup);
  },
}));

export function useSetting<K extends keyof Settings>(key: K): Settings[K] | undefined {
  return useSettings((state) => state.settings?.[key]);
}

export function settingsReady(): boolean {
  return useSettings.getState().settings !== null;
}

export function currentSettings(): Settings {
  const settings = useSettings.getState().settings;
  if (!settings) throw new Error('Settings not loaded');
  return settings;
}
