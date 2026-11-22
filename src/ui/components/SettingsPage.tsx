import { Download, RotateCcw, ShieldCheck, Upload } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { resetLibraryData } from '../../core/db/repo';
import type { Settings } from '../../core/settings/schema';
import { send } from '../../messaging/protocol';
import { buildExport, downloadJson, importFile } from '../actions';
import { t } from '../i18n';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { useToasts } from '../state/toasts';
import { Button, ConfirmDialog } from './controls';

function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <section className="settings-section">
      <h2>{title}</h2>
      <div className="settings-rows">{children}</div>
    </section>
  );
}

function Row({
  label,
  help,
  children,
  htmlFor,
}: {
  label: string;
  help?: string;
  children: ReactNode;
  htmlFor?: string;
}): ReactNode {
  return (
    <div className="settings-row">
      <div className="settings-label">
        <label htmlFor={htmlFor}>{label}</label>
        {help ? <p>{help}</p> : null}
      </div>
      <div className="settings-control">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}): ReactNode {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-thumb" />
    </button>
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
  id,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  id: string;
}): ReactNode {
  return (
    <select
      id={id}
      className="select"
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SettingsPage(): ReactNode {
  const settings = useSettings((state) => state.settings);
  const update = useSettings((state) => state.update);
  const stacks = useLibrary((state) => state.stacks);
  const tabsByStack = useLibrary((state) => state.tabsByStack);
  const push = useToasts((state) => state.push);
  const fileRef = useRef<HTMLInputElement>(null);
  const [sites, setSites] = useState<string | null>(null);
  const [usage, setUsage] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  useEffect(() => {
    void navigator.storage?.estimate?.().then((estimate) => {
      if (estimate.usage !== undefined) setUsage(formatBytes(estimate.usage));
    });
  }, []);
  if (!settings) return null;

  const set = <K extends keyof Settings>(key: K, value: Settings[K]): void => {
    void update({ [key]: value } as Partial<Settings>);
  };

  const exportAll = (): void => {
    downloadJson(
      `stow-library-${new Date().toISOString().slice(0, 10)}.json`,
      buildExport(stacks, tabsByStack),
    );
  };

  return (
    <div className="page settings-page">
      <h1 className="page-title">{t('settings')}</h1>

      <Section title={t('general')}>
        <Row label={t('theme')} help={t('themeHelp')} htmlFor="theme">
          <Select
            id="theme"
            value={settings.theme}
            onChange={(value) => set('theme', value)}
            options={[
              { value: 'system', label: t('themeSystem') },
              { value: 'light', label: t('themeLight') },
              { value: 'dark', label: t('themeDark') },
            ]}
          />
        </Row>
        <Row label={t('density')} help={t('densityHelp')} htmlFor="density">
          <Select
            id="density"
            value={settings.density}
            onChange={(value) => set('density', value)}
            options={[
              { value: 'comfortable', label: t('comfortable') },
              { value: 'compact', label: t('compact') },
            ]}
          />
        </Row>
        <Row label={t('toolbarClick')} help={t('toolbarClickHelp')} htmlFor="toolbar">
          <Select
            id="toolbar"
            value={settings.toolbarClick}
            onChange={(value) => set('toolbarClick', value)}
            options={[
              { value: 'stow-window', label: t('stowWindow') },
              { value: 'popup', label: t('openMenu') },
              { value: 'library', label: t('openLibrary') },
            ]}
          />
        </Row>
        <Row label={t('openLibraryOnStartup')}>
          <Toggle
            checked={settings.openLibraryOnStartup}
            label={t('openLibraryOnStartup')}
            onChange={(value) => set('openLibraryOnStartup', value)}
          />
        </Row>
        <Row label={t('showBadge')}>
          <Toggle
            checked={settings.showBadge}
            label={t('showBadge')}
            onChange={(value) => set('showBadge', value)}
          />
        </Row>
      </Section>

      <Section title={t('stowing')}>
        <Row label={t('afterStow')} htmlFor="after-stow">
          <Select
            id="after-stow"
            value={settings.afterStow}
            onChange={(value) => set('afterStow', value)}
            options={[
              { value: 'show-library', label: t('showLibrary') },
              { value: 'stay', label: t('stay') },
            ]}
          />
        </Row>
        <Row label={t('ignorePinnedTabs')}>
          <Toggle
            checked={settings.ignorePinnedTabs}
            label={t('ignorePinnedTabs')}
            onChange={(value) => set('ignorePinnedTabs', value)}
          />
        </Row>
        <Row label={t('stowIncognito')} help={t('stowIncognitoHelp')}>
          <Toggle
            checked={settings.stowIncognito}
            label={t('stowIncognito')}
            onChange={(value) => set('stowIncognito', value)}
          />
        </Row>
        <Row label={t('preserveBrowserGroups')}>
          <Toggle
            checked={settings.preserveBrowserGroups}
            label={t('preserveBrowserGroups')}
            onChange={(value) => set('preserveBrowserGroups', value)}
          />
        </Row>
        <Row label={t('dedupe')} help={t('dedupeHelp')} htmlFor="dedupe">
          <Select
            id="dedupe"
            value={settings.dedupe}
            onChange={(value) => set('dedupe', value)}
            options={[
              { value: 'global', label: t('dedupeGlobal') },
              { value: 'off', label: t('dedupeOff') },
            ]}
          />
        </Row>
        <Row label={t('stripTracking')}>
          <Toggle
            checked={settings.stripTrackingForDedupe}
            label={t('stripTracking')}
            onChange={(value) => set('stripTrackingForDedupe', value)}
          />
        </Row>
        <Row label={t('ignoredSites')} help={t('ignoredSitesHelp')}>
          <textarea
            className="textarea"
            rows={5}
            spellCheck={false}
            placeholder={'*.example.com/*\nmail.google.com'}
            value={sites ?? settings.ignoredSites.join('\n')}
            onChange={(event) => setSites(event.target.value)}
            onBlur={() => {
              if (sites !== null) {
                set(
                  'ignoredSites',
                  sites
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean),
                );
                setSites(null);
              }
            }}
          />
        </Row>
      </Section>

      <Section title={t('restoring')}>
        <Row label={t('restoreTarget')} htmlFor="restore-target">
          <Select
            id="restore-target"
            value={settings.restoreTarget}
            onChange={(value) => set('restoreTarget', value)}
            options={[
              { value: 'current-window', label: t('currentWindow') },
              { value: 'new-window', label: t('newWindow') },
            ]}
          />
        </Row>
        <Row label={t('removeOnRestore')}>
          <Toggle
            checked={settings.removeOnRestore}
            label={t('removeOnRestore')}
            onChange={(value) => set('removeOnRestore', value)}
          />
        </Row>
        <Row label={t('restorePinned')}>
          <Toggle
            checked={settings.restorePinned}
            label={t('restorePinned')}
            onChange={(value) => set('restorePinned', value)}
          />
        </Row>
        <Row label={t('restoreGroups')}>
          <Toggle
            checked={settings.restoreGroups}
            label={t('restoreGroups')}
            onChange={(value) => set('restoreGroups', value)}
          />
        </Row>
        <Row label={t('pinLibraryTab')}>
          <Toggle
            checked={settings.pinLibraryTab}
            label={t('pinLibraryTab')}
            onChange={(value) => set('pinLibraryTab', value)}
          />
        </Row>
      </Section>

      <Section title={t('data')}>
        <Row label={t('storageUsed')} help={t('storageUsedHelp')}>
          <span className="meta">{usage ?? t('storageUnavailable')}</span>
        </Row>
        <Row label={t('trashRetentionLabel')} htmlFor="retention">
          <Select
            id="retention"
            value={String(settings.trashRetentionDays)}
            onChange={(value) =>
              set('trashRetentionDays', Number(value) as Settings['trashRetentionDays'])
            }
            options={[
              { value: '7', label: t('days7') },
              { value: '30', label: t('days30') },
              { value: '90', label: t('days90') },
              { value: '0', label: t('never') },
            ]}
          />
        </Row>
        <Row label={t('autoBackup')} help={t('autoBackupHelp')} htmlFor="backup">
          <div className="inline-control">
            <Select
              id="backup"
              value={settings.autoBackup}
              onChange={(value) => set('autoBackup', value)}
              options={[
                { value: 'off', label: t('off') },
                { value: 'daily', label: t('daily') },
                { value: 'weekly', label: t('weekly') },
              ]}
            />
            <Button
              variant="secondary"
              onClick={() => {
                void send('requestBackupPermission', {}).then((result) => {
                  push(result.granted ? t('permissionGranted') : t('permissionDenied'));
                });
              }}
            >
              {t('allowDownloads')}
            </Button>
          </div>
        </Row>
        <Row label={t('importExport')} help={t('importExportHelp')}>
          <div className="inline-control">
            <input
              ref={fileRef}
              type="file"
              accept=".json,.txt,.md,.html,.htm,text/plain,application/json,text/html,text/markdown"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void importFile(file)
                    .then(() => {
                      if (fileRef.current) fileRef.current.value = '';
                    })
                    .catch(() => push(t('importFailed'), { tone: 'error' }));
                }
              }}
            />
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={15} /> {t('importTitle')}
            </Button>
            <Button variant="secondary" onClick={exportAll}>
              <Download size={15} /> {t('exportTitle')}
            </Button>
          </div>
        </Row>
        <Row label={t('resetLibrary')} help={t('resetLibraryHelp')}>
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            <RotateCcw size={15} /> {t('reset')}
          </Button>
        </Row>
      </Section>

      <Section title={t('shortcuts')}>
        <div className="shortcut-grid">
          <span>{t('stowWindow')}</span>
          <kbd>Alt+Shift+S</kbd>
          <span>{t('stowThisTab')}</span>
          <kbd>Alt+Shift+T</kbd>
          <span>{t('openLibrary')}</span>
          <kbd>Alt+Shift+L</kbd>
        </div>
        <p className="muted small">{t('shortcutsHelp')}</p>
      </Section>

      <Section title={t('about')}>
        <div className="about-block">
          <p>
            <strong>Stow</strong>{' '}
            <span className="meta">v{chrome.runtime.getManifest().version}</span>
          </p>
          <p className="muted">
            <ShieldCheck size={14} /> {t('privacyLine')}
          </p>
        </div>
      </Section>
      <ConfirmDialog
        open={resetOpen}
        title={t('resetLibrary')}
        body={t('resetConfirm')}
        confirmLabel={t('reset')}
        danger
        onConfirm={() => void resetLibraryData().then(() => push(t('libraryReset')))}
        onClose={() => setResetOpen(false)}
      />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
