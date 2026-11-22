import { getLiveTabs, getStacks, log, setMeta } from '../core/db/repo';
import { type ImportedStack, serializeStowJson } from '../core/io/formats';
import { getSettings } from '../core/settings/store';

export const BACKUP_ALARM = 'stow-backup';

export async function syncBackupAlarm(mode: 'off' | 'daily' | 'weekly'): Promise<void> {
  if (mode === 'off') {
    await chrome.alarms.clear(BACKUP_ALARM);
    return;
  }
  await chrome.alarms.create(BACKUP_ALARM, {
    periodInMinutes: mode === 'daily' ? 1440 : 10_080,
    delayInMinutes: mode === 'daily' ? 1440 : 10_080,
  });
}

export async function backupNow(): Promise<boolean> {
  const settings = await getSettings();
  if (settings.autoBackup === 'off') return false;
  const granted = await chrome.permissions.contains({ permissions: ['downloads'] });
  if (!granted) return false;

  const stacks = await getStacks();
  const tabs = await getLiveTabs();
  const payload: ImportedStack[] = stacks.map((stack) => ({
    title: stack.title,
    createdAt: stack.createdAt,
    tabs: tabs
      .filter((tab) => tab.stackId === stack.id)
      .map((tab) => ({ url: tab.url, title: tab.title })),
  }));

  const json = serializeStowJson(payload);
  const filename = `stow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const url = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
  try {
    await chrome.downloads.download({ url, filename, saveAs: false, conflictAction: 'uniquify' });
    await setMeta('lastBackupAt', Date.now());
    await log('info', 'backup-complete', `${payload.length} stacks`);
    return true;
  } catch (error) {
    await log('error', 'backup-failed', error instanceof Error ? error.name : 'unknown');
    return false;
  }
}
