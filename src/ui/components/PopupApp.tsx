import { ArchiveRestore, ArrowDownToLine, ExternalLink, Layers, Settings2 } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { send } from '../../messaging/protocol';
import { restoreTabs, stowScope } from '../actions';
import { stackTitle, tabCount } from '../format';
import { t } from '../i18n';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { ToastHost } from './controls';

export function PopupApp(): ReactNode {
  const init = useLibrary((state) => state.init);
  const stacks = useLibrary((state) => state.stacks);
  const tabsByStack = useLibrary((state) => state.tabsByStack);
  const initSettings = useSettings((state) => state.init);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void initSettings();
    void init();
    void send('getEligibleCount', { scope: { kind: 'window' } }).then((result) =>
      setCount(result.count),
    );
  }, [init, initSettings]);

  const stow = (): void => {
    setBusy(true);
    void stowScope({ kind: 'window' }).then(() => window.setTimeout(() => window.close(), 150));
  };

  const openLibrary = (hash?: string): void => {
    void send('openLibrary', hash ? { hash } : {}).then(() => window.close());
  };

  return (
    <div className="popup">
      <div className="popup-head">
        <img className="brand-mark" src="/icon/128.png" alt="" width={20} height={20} />
        <strong>stow</strong>
        <span className="popup-mode">popup</span>
        <span className="spacer" />
        <button
          type="button"
          className="icon-btn"
          aria-label={t('settings')}
          onClick={() => openLibrary('/settings')}
        >
          <Settings2 size={16} />
        </button>
      </div>
      <div className="popup-actions">
        <button
          type="button"
          className="popup-action"
          disabled={busy || count === 0}
          onClick={stow}
        >
          <ArrowDownToLine size={16} />
          <span>{t('stowWindow')}</span>
          <span className="count">{count === null ? '…' : count}</span>
        </button>
        <button type="button" className="popup-action" onClick={() => openLibrary()}>
          <Layers size={16} />
          <span>{t('openLibrary')}</span>
        </button>
      </div>
      <div className="popup-section">
        <h3>{t('recentStacks')}</h3>
        {stacks.slice(0, 4).map((stack) => {
          const tabs = tabsByStack[stack.id] ?? [];
          return (
            <div key={stack.id} className="recent-row">
              <span className="rail-dot" style={{ background: `var(--grp-${stack.color})` }} />
              <span className="name">{stackTitle(stack)}</span>
              <span className="meta">{tabCount(tabs.length)}</span>
              <button
                type="button"
                className="icon-btn"
                aria-label={t('restore')}
                onClick={() => {
                  void restoreTabs(
                    tabs.map((tab) => tab.id),
                    { by: 'tab' },
                  );
                  window.setTimeout(() => window.close(), 150);
                }}
              >
                <ArchiveRestore size={14} />
              </button>
            </div>
          );
        })}
        {stacks.length === 0 ? <p className="muted small">{t('nothingStowed')}</p> : null}
      </div>
      <div className="popup-foot">
        <span className="meta">{t('localOnly')}</span>
        <span className="spacer" />
        <button type="button" className="link-button" onClick={() => openLibrary()}>
          {t('openLibrary')} <ExternalLink size={12} />
        </button>
      </div>
      <ToastHost />
    </div>
  );
}
