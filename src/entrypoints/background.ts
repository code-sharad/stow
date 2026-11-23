import { getMeta, log, purgeExpired, setMeta } from '../core/db/repo';
import { db } from '../core/db/schema';
import type { Settings } from '../core/settings/schema';
import { getSettings, subscribeSettings } from '../core/settings/store';
import { handleMessage } from '../messaging/protocol';
import { focusOrCreate } from '../platform/windows';
import { BACKUP_ALARM, backupNow, syncBackupAlarm } from '../services/backup';
import { flashError, refresh as refreshBadge } from '../services/badge';
import { createMenus, onMenuClicked } from '../services/menus';
import { stow } from '../services/stow';
import { SCHEMA_VERSION } from '../shared/constants';

function popupPathFor(toolbarClick: Settings['toolbarClick']): string {
  return toolbarClick === 'popup' ? 'popup.html' : '';
}

async function applyPopupBinding(): Promise<void> {
  const settings = await getSettings();
  await chrome.action.setPopup({ popup: popupPathFor(settings.toolbarClick) });
}

async function runPurgeIfDue(): Promise<void> {
  const settings = await getSettings();
  if (settings.trashRetentionDays === 0) return;
  const last = (await getMeta<number>('lastPurge')) ?? 0;
  if (Date.now() - last < 86_400_000) return;
  await purgeExpired(settings.trashRetentionDays);
  await setMeta('lastPurge', Date.now());
}

async function boot(): Promise<void> {
  try {
    await db().open();
    await applyPopupBinding();
    await refreshBadge();
    await chrome.alarms.create('stow-purge', { periodInMinutes: 1440 });
    await syncBackupAlarm((await getSettings()).autoBackup);
    void runPurgeIfDue();
  } catch (error) {
    await log('error', 'boot-failed', error instanceof Error ? error.name : 'unknown');
  }
}

export default defineBackground(() => {
  subscribeSettings((settings) => {
    void chrome.action
      .setPopup({ popup: popupPathFor(settings.toolbarClick) })
      .catch((error: unknown) => {
        void log('error', 'popup-binding-failed', error instanceof Error ? error.name : 'unknown');
      });
  });

  chrome.runtime.onInstalled.addListener((details) => {
    void (async () => {
      try {
        if (details.reason === 'install') {
          await setMeta('installedAt', Date.now());
          await setMeta('schemaVersion', SCHEMA_VERSION);
        }
        await createMenus();
        await boot();
        if (details.reason === 'install') await focusOrCreate({ hash: '/welcome' });
      } catch (error) {
        await log('error', 'install-failed', error instanceof Error ? error.name : 'unknown');
      }
    })();
  });

  chrome.runtime.onStartup.addListener(() => {
    void (async () => {
      const settings = await getSettings();
      await boot();
      if (settings.openLibraryOnStartup) await focusOrCreate();
    })();
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error: unknown) => {
        void log('error', 'message-failed', error instanceof Error ? error.name : 'unknown');
        sendResponse({
          ok: false,
          error: { code: 'unexpected', message: 'Something went wrong.' },
        });
      });
    return true;
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    void onMenuClicked(info, tab);
  });

  chrome.commands.onCommand.addListener((command) => {
    void (async () => {
      switch (command) {
        case 'stow-window':
          await stow({ kind: 'window' });
          break;
        case 'stow-tab': {
          const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
          if (tab?.id !== undefined) await stow({ kind: 'tab', tabId: tab.id });
          break;
        }
        case 'stow-all-windows':
          await stow({ kind: 'all-windows' });
          break;
        case 'open-library':
          await focusOrCreate();
          break;
        default:
          break;
      }
    })().catch(() => flashError());
  });

  chrome.action.onClicked.addListener(() => {
    void (async () => {
      const settings = await getSettings();
      if (settings.toolbarClick === 'library') await focusOrCreate();
      else if (settings.toolbarClick === 'stow-window') {
        const result = await stow({ kind: 'window' });
        if (!result.ok) flashError();
      }
    })();
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'stow-purge') void runPurgeIfDue();
    else if (alarm.name === BACKUP_ALARM) void backupNow();
  });

  chrome.runtime.onSuspend.addListener(() => {
    // Nothing to flush: every workflow commits before returning.
  });

  void boot();
});
