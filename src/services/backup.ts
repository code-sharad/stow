import { getLiveTabs, getMeta, getStacks, log, setMeta } from '../core/db/repo';
import { buildFullBackup, serializeFullBackup } from '../core/io/formats';
import { getSettings } from '../core/settings/store';

export const BACKUP_ALARM = 'stow-backup';
export const BACKUP_SCHEDULE_KEY = 'backupScheduleMode';

export type BackupMode = 'off' | 'daily' | 'weekly';

function periodFor(mode: Exclude<BackupMode, 'off'>): number {
  return mode === 'daily' ? 1440 : 10_080;
}

/**
 * Boot is not a reason to move the next backup further out. Keep an existing
 * alarm with the same schedule; only create or recreate it when the alarm is
 * missing or the user changed the setting.
 */
export async function syncBackupAlarm(mode: BackupMode): Promise<void> {
  if (mode === 'off') {
    const existing = await chrome.alarms.get(BACKUP_ALARM);
    if (existing) await chrome.alarms.clear(BACKUP_ALARM);
    if ((await getMeta<BackupMode>(BACKUP_SCHEDULE_KEY)) !== 'off') {
      await setMeta(BACKUP_SCHEDULE_KEY, 'off');
      await log('info', 'backup-alarm-synced', 'off');
    }
    return;
  }

  const [existing, storedMode] = await Promise.all([
    chrome.alarms.get(BACKUP_ALARM),
    getMeta<BackupMode>(BACKUP_SCHEDULE_KEY),
  ]);
  if (existing && storedMode === mode) return;

  const period = periodFor(mode);
  await chrome.alarms.create(BACKUP_ALARM, {
    periodInMinutes: period,
    delayInMinutes: period,
  });
  await setMeta(BACKUP_SCHEDULE_KEY, mode);
  await log('info', 'backup-alarm-synced', mode);
}

export async function backupNow(): Promise<boolean> {
  const settings = await getSettings();
  if (settings.autoBackup === 'off') return false;
  const granted = await chrome.permissions.contains({ permissions: ['downloads'] });
  if (!granted) return false;

  const [stacks, tabs] = await Promise.all([getStacks(), getLiveTabs()]);
  const payload = buildFullBackup(stacks, tabs, settings);
  const json = serializeFullBackup(payload);
  const filename = `stow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const url = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
  try {
    await chrome.downloads.download({ url, filename, saveAs: false, conflictAction: 'uniquify' });
    await setMeta('lastBackupAt', Date.now());
    await log('info', 'backup-complete', `${payload.stacks.length} stacks`);
    return true;
  } catch (error) {
    await log('error', 'backup-failed', error instanceof Error ? error.name : 'unknown');
    return false;
  }
}
