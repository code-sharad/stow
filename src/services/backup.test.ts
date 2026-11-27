import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMeta } from '../core/db/repo';
import { db, StowDB, setDbForTests } from '../core/db/schema';
import { BACKUP_ALARM, BACKUP_SCHEDULE_KEY, syncBackupAlarm } from './backup';

const alarms = new Map<string, chrome.alarms.Alarm>();
const create = vi.fn(async (name: string, info: chrome.alarms.AlarmCreateInfo) => {
  alarms.set(name, {
    name,
    scheduledTime: 0,
    periodInMinutes: info.periodInMinutes,
    persistAcrossSessions: true,
  });
});
const clear = vi.fn(async (name: string) => alarms.delete(name));

let dbCount = 0;

beforeEach(async () => {
  dbCount += 1;
  setDbForTests(new StowDB(`stow-backup-test-${dbCount}`));
  await db().open();
  alarms.clear();
  create.mockClear();
  clear.mockClear();
  vi.stubGlobal('chrome', {
    alarms: {
      get: vi.fn(async (name: string) => alarms.get(name)),
      create,
      clear,
    },
  });
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await db().delete();
  setDbForTests(null);
});

describe('backup alarm scheduling', () => {
  it('creates the alarm once when booting repeatedly with the same schedule', async () => {
    for (let boot = 0; boot < 10; boot += 1) await syncBackupAlarm('daily');
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(BACKUP_ALARM, {
      periodInMinutes: 1440,
      delayInMinutes: 1440,
    });
    expect(await getMeta(BACKUP_SCHEDULE_KEY)).toBe('daily');
  });

  it('recreates only when the schedule actually changes, and off clears it', async () => {
    await syncBackupAlarm('daily');
    await syncBackupAlarm('daily');
    await syncBackupAlarm('weekly');
    await syncBackupAlarm('weekly');
    expect(create).toHaveBeenCalledTimes(2);
    expect(alarms.get(BACKUP_ALARM)?.periodInMinutes).toBe(10_080);

    await syncBackupAlarm('off');
    expect(clear).toHaveBeenCalledWith(BACKUP_ALARM);
    expect(alarms.has(BACKUP_ALARM)).toBe(false);
    expect(await getMeta(BACKUP_SCHEDULE_KEY)).toBe('off');
  });

  it('creates the alarm again after turning the schedule back on', async () => {
    await syncBackupAlarm('off');
    await syncBackupAlarm('daily');
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenLastCalledWith(BACKUP_ALARM, {
      periodInMinutes: 1440,
      delayInMinutes: 1440,
    });
  });
});
