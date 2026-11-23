import {
  ArchiveRestore,
  ArrowDownToLine,
  ChevronDown,
  FolderInput,
  Layers,
  Pin,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import type { Id, Stack } from '../../core/domain/types';
import { deleteTabs, groupSelection, restoreTabs } from '../actions';
import { stackTitle } from '../format';
import { t } from '../i18n';
import { useLibrary } from '../state/library';
import { Button, ContextMenu, IconButton } from './controls';

export type Route =
  | { name: 'all' }
  | { name: 'pinned' }
  | { name: 'trash' }
  | { name: 'settings' }
  | { name: 'welcome' }
  | { name: 'stack'; id: Id };

export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#/, '');
  if (clean.startsWith('/trash')) return { name: 'trash' };
  if (clean.startsWith('/settings')) return { name: 'settings' };
  if (clean.startsWith('/welcome')) return { name: 'welcome' };
  if (clean.startsWith('/pinned')) return { name: 'pinned' };
  const match = /^\/stack\/(.+)$/.exec(clean);
  if (match?.[1]) return { name: 'stack', id: decodeURIComponent(match[1]) };
  return { name: 'all' };
}

export function routeHash(route: Route): string {
  switch (route.name) {
    case 'trash':
      return '#/trash';
    case 'settings':
      return '#/settings';
    case 'welcome':
      return '#/welcome';
    case 'pinned':
      return '#/pinned';
    case 'stack':
      return `#/stack/${encodeURIComponent(route.id)}`;
    default:
      return '#/';
  }
}

function Brand(): ReactNode {
  return (
    <div className="brand">
      <img className="brand-mark" src="/icon/128.png" alt="" width={20} height={20} />
      <span className="brand-name">stow</span>
      <span className="brand-path">v{chrome.runtime.getManifest().version}</span>
    </div>
  );
}

export function Rail({
  route,
  onNavigate,
  stackCount,
  tabTotal,
}: {
  route: Route;
  onNavigate: (route: Route) => void;
  stackCount: number;
  tabTotal: number;
}): ReactNode {
  const stacks = useLibrary((state) => state.stacks);
  const tabsByStack = useLibrary((state) => state.tabsByStack);
  const top = stacks.slice(0, 8);

  return (
    <aside className="rail" aria-label="Library">
      <div className="rail-group">
        <div className="rail-label">views</div>
        <nav>
          <button
            type="button"
            className="rail-item"
            aria-current={route.name === 'all' ? 'page' : undefined}
            onClick={() => onNavigate({ name: 'all' })}
          >
            <Layers size={16} />
            <span>{t('allTabs')}</span>
            <span className="count">{tabTotal}</span>
          </button>
          <button
            type="button"
            className="rail-item"
            aria-current={route.name === 'pinned' ? 'page' : undefined}
            onClick={() => onNavigate({ name: 'pinned' })}
          >
            <Pin size={16} />
            <span>{t('pinned')}</span>
          </button>
          <button
            type="button"
            className="rail-item"
            aria-current={route.name === 'trash' ? 'page' : undefined}
            onClick={() => onNavigate({ name: 'trash' })}
          >
            <Trash2 size={16} />
            <span>{t('trash')}</span>
          </button>
        </nav>
      </div>

      <div className="rail-group">
        <div className="rail-label">
          {t('stacks')} <span className="meta">{stackCount}</span>
        </div>
        {top.map((stack: Stack) => {
          const count = tabsByStack[stack.id]?.length ?? 0;
          return (
            <button
              key={stack.id}
              type="button"
              className="rail-stack"
              aria-current={route.name === 'stack' && route.id === stack.id ? 'page' : undefined}
              onClick={() => onNavigate({ name: 'stack', id: stack.id })}
              title={stackTitle(stack)}
            >
              <span className="rail-dot" style={{ background: `var(--grp-${stack.color})` }} />
              <span className="rail-stack-title">{stackTitle(stack)}</span>
              <span className="count">{count}</span>
            </button>
          );
        })}
        {stacks.length > top.length ? (
          <div className="rail-more meta">{stacks.length - top.length} more</div>
        ) : null}
      </div>

      <div className="rail-foot">
        <button
          type="button"
          className="rail-item"
          aria-current={route.name === 'settings' ? 'page' : undefined}
          onClick={() => onNavigate({ name: 'settings' })}
        >
          <Settings2 size={16} />
          <span>{t('settings')}</span>
        </button>
        <div className="privacy-line">
          <ShieldCheck size={13} />
          <span>{t('localOnly')}</span>
        </div>
      </div>
    </aside>
  );
}

export function TopBar({
  query,
  onQuery,
  searchRef,
  onStow,
  canStow,
}: {
  query: string;
  onQuery: (value: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  onStow: (scope: 'window' | 'all-windows') => void;
  canStow: boolean;
}): ReactNode {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  return (
    <header className="topbar">
      <Brand />
      <div className="search-shell">
        <Search size={16} aria-hidden="true" />
        <input
          ref={searchRef}
          className="search-input"
          type="search"
          value={query}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          onChange={(event) => onQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onQuery('');
              event.currentTarget.blur();
            }
          }}
        />
        {query ? (
          <IconButton label={t('clearSearch')} className="search-clear" onClick={() => onQuery('')}>
            <X size={14} />
          </IconButton>
        ) : (
          <span className="search-hint">
            <kbd>/</kbd>
          </span>
        )}
      </div>
      <div className="spacer" />
      <div className="stow-split">
        <Button variant="primary" onClick={() => onStow('window')} disabled={!canStow}>
          <ArrowDownToLine size={16} />
          <span>{t('stowWindow')}</span>
        </Button>
        <button
          type="button"
          className="btn btn-primary split-arrow"
          aria-label={t('more')}
          aria-haspopup="menu"
          aria-expanded={Boolean(menu)}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setMenu({ x: rect.right - 200, y: rect.bottom + 4 });
          }}
          disabled={!canStow}
        >
          <ChevronDown size={14} />
        </button>
      </div>
      {menu ? (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          label={t('stowWindow')}
          items={[
            {
              id: 'window',
              label: t('stowWindow'),
              icon: <ArrowDownToLine size={15} />,
              onSelect: () => onStow('window'),
            },
            {
              id: 'all',
              label: t('stowAllWindows'),
              icon: <Layers size={15} />,
              onSelect: () => onStow('all-windows'),
            },
          ]}
          onClose={() => setMenu(null)}
        />
      ) : null}
    </header>
  );
}

export function StatusBar({
  route,
  stackCount,
  tabTotal,
  selected,
}: {
  route: Route;
  stackCount: number;
  tabTotal: number;
  selected: number;
}): ReactNode {
  const view = route.name === 'stack' ? 'stack' : route.name === 'all' ? 'library' : route.name;
  return (
    <footer className="statusbar">
      <span className="status-mode">local</span>
      <span className="status-item">~/{view}</span>
      <span className="status-sep">·</span>
      <span className="status-item">{stackCount} stacks</span>
      <span className="status-item">{tabTotal} tabs</span>
      {selected > 0 ? (
        <span className="status-item status-selected">{selected} selected</span>
      ) : null}
      <span className="spacer" />
      <span className="status-hint">
        <kbd>/</kbd> search
      </span>
      <span className="status-hint">
        <kbd>ctrl k</kbd> commands
      </span>
      <span className="status-hint">
        <kbd>esc</kbd> clear
      </span>
    </footer>
  );
}

export function BulkBar({
  selected,
  stacks,
  onMove,
  onClear,
}: {
  selected: Id[];
  stacks: Stack[];
  onMove: () => void;
  onClear: () => void;
}): ReactNode {
  return (
    <section className="bulk-bar" aria-label={t('selected', { n: selected.length })}>
      <span className="bulk-count">{t('selected', { n: selected.length })}</span>
      <Button variant="ghost" onClick={() => void restoreTabs(selected, { by: 'selection' })}>
        <ArchiveRestore size={15} /> {t('restore')}
      </Button>
      <Button
        variant="ghost"
        onClick={() => void restoreTabs(selected, { by: 'selection', window: 'new' })}
      >
        {t('restoreInNewWindow')}
      </Button>
      <Button variant="ghost" onClick={onMove} disabled={stacks.length < 2}>
        <FolderInput size={15} /> {t('moveTo')}
      </Button>
      <Button variant="ghost" onClick={() => void groupSelection()}>
        <Layers size={15} /> {t('groupSelection')}
      </Button>
      <Button variant="ghost" onClick={() => void deleteTabs(selected)}>
        <Trash2 size={15} /> {t('delete')}
      </Button>
      <IconButton label={t('clear')} onClick={onClear}>
        <X size={15} />
      </IconButton>
    </section>
  );
}
