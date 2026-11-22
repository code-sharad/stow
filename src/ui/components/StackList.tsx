import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Ellipsis,
  Eraser,
  ExternalLink,
  FileText,
  FolderInput,
  Lock,
  LockOpen,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  X,
} from 'lucide-react';
import { type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import type { Id, SavedTab, Stack } from '../../core/domain/types';
import { faviconUrl, hostLabel, letterFor } from '../../platform/favicon';
import {
  copyStack,
  copyTabLink,
  dedupe,
  deleteStack,
  deleteTabs,
  exportStack,
  rename,
  reorder,
  restoreTabs,
  toggleCollapsed,
  toggleLock,
  togglePin,
} from '../actions';
import { formatDate, stackTitle, tabCount } from '../format';
import { t } from '../i18n';
import { METRICS } from '../layout/metrics';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { Button, CheckBox, ContextMenu, IconButton, type MenuItem, Modal } from './controls';

interface Row {
  kind: 'header' | 'tab' | 'gap';
  stack: Stack;
  tab?: SavedTab;
}

interface MenuState {
  x: number;
  y: number;
  stack: Stack;
  tab?: SavedTab;
}

function Favicon({ url }: { url: string }): ReactNode {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="favicon favicon-letter" aria-hidden="true">
        {letterFor(url)}
      </span>
    );
  }
  const src = faviconUrl(url);
  if (!src) {
    return (
      <span className="favicon favicon-letter" aria-hidden="true">
        {letterFor(url)}
      </span>
    );
  }
  return (
    <img
      className="favicon"
      src={src}
      alt=""
      width={16}
      height={16}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function StackHeader({
  stack,
  tabs,
  forceOpen,
  onMenu,
}: {
  stack: Stack;
  tabs: SavedTab[];
  forceOpen: boolean;
  onMenu: (event: React.MouseEvent, stack: Stack) => void;
}): ReactNode {
  const selected = useLibrary((state) => state.selected);
  const setSelected = useLibrary((state) => state.setSelected);
  const lastStow = useLibrary((state) => state.lastStowStackIds);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(stack.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const open = forceOpen || !stack.collapsed;
  const allSelected = tabs.length > 0 && tabs.every((tab) => selected.has(tab.id));
  const someSelected = tabs.some((tab) => selected.has(tab.id));

  const commit = (): void => {
    setEditing(false);
    void rename(stack, draft);
  };

  return (
    <div
      className={`stack-head${stack.pinned ? ' is-pinned' : ''}${lastStow.includes(stack.id) ? ' is-fresh' : ''}`}
    >
      <CheckBox
        checked={allSelected}
        indeterminate={someSelected}
        label={`Select ${stackTitle(stack)}`}
        onChange={() => setSelected(allSelected ? [] : tabs.map((tab) => tab.id))}
      />
      <button
        type="button"
        className="collapse-btn"
        aria-expanded={open}
        aria-label={open ? t('collapseStack') : t('expandStack')}
        onClick={() => void toggleCollapsed(stack)}
      >
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
      <span className="spine" aria-hidden="true" />
      <div className="stack-title-wrap">
        {editing ? (
          <input
            ref={inputRef}
            className="rename-input"
            value={draft}
            maxLength={200}
            aria-label={t('rename')}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
              if (event.key === 'Escape') {
                setDraft(stack.title);
                setEditing(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="stack-title"
            title={stackTitle(stack)}
            onDoubleClick={() => {
              setDraft(stack.title);
              setEditing(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'F2') {
                event.preventDefault();
                setDraft(stack.title);
                setEditing(true);
              }
            }}
            onClick={(event) => {
              if (event.detail === 2) return;
              void toggleCollapsed(stack);
            }}
          >
            {stackTitle(stack)}
          </button>
        )}
        {stack.locked ? (
          <Lock size={12} className="stack-lock" aria-label={t('lockStack')} />
        ) : null}
        {stack.pinned ? <Pin size={12} className="stack-pin" aria-label={t('pinStack')} /> : null}
      </div>
      <span className="stack-meta">
        <span>{tabCount(tabs.length)}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={new Date(stack.createdAt).toISOString()}>
          {formatDate(stack.createdAt)}
        </time>
      </span>
      <div className="stack-actions">
        <button
          type="button"
          className="text-btn"
          onClick={() =>
            void restoreTabs(
              tabs.map((tab) => tab.id),
              { by: 'tab' },
            )
          }
          disabled={tabs.length === 0}
        >
          <ArchiveRestore size={14} />
          <span>{t('restoreAll')}</span>
        </button>
        <IconButton
          label={t('more')}
          onClick={(event) => {
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            onMenu({ clientX: rect.right, clientY: rect.bottom } as React.MouseEvent, stack);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            onMenu(event, stack);
          }}
        >
          <Ellipsis size={16} />
        </IconButton>
      </div>
    </div>
  );
}

function TabRow({
  tab,
  stack,
  onMenu,
}: {
  tab: SavedTab;
  stack: Stack;
  onMenu: (event: React.MouseEvent, stack: Stack, tab: SavedTab) => void;
}): ReactNode {
  const selected = useLibrary((state) => state.selected.has(tab.id));
  const toggleSelected = useLibrary((state) => state.toggleSelected);
  const focused = useLibrary((state) => state.focusedId === tab.id);
  const setFocused = useLibrary((state) => state.setFocused);

  const moveFocus = (
    event: KeyboardEvent<HTMLDivElement>,
    direction: 1 | -1 | 'first' | 'last',
  ): void => {
    const nodes = [...document.querySelectorAll<HTMLElement>('.tab-row')];
    if (nodes.length === 0) return;
    const current = nodes.indexOf(event.currentTarget);
    const target =
      direction === 'first'
        ? nodes[0]
        : direction === 'last'
          ? nodes[nodes.length - 1]
          : nodes[current + direction];
    if (!target) return;
    event.preventDefault();
    const id = target.dataset.tabId;
    if (id) setFocused(id);
    target.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void restoreTabs([tab.id], { by: 'tab', invertRemove: true });
    } else if (event.key === ' ') {
      event.preventDefault();
      toggleSelected(tab.id, event.shiftKey);
    } else if (event.key === 'ArrowDown') {
      moveFocus(event, 1);
    } else if (event.key === 'ArrowUp') {
      moveFocus(event, -1);
    } else if (event.key === 'Home') {
      moveFocus(event, 'first');
    } else if (event.key === 'End') {
      moveFocus(event, 'last');
    }
  };

  return (
    <div
      className={`tab-row${selected ? ' is-selected' : ''}${focused ? ' is-focused' : ''}`}
      role="treeitem"
      aria-selected={selected}
      data-tab-id={tab.id}
      tabIndex={focused ? 0 : -1}
      onFocus={() => setFocused(tab.id)}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey) {
          toggleSelected(tab.id);
          return;
        }
        void restoreTabs([tab.id], { by: 'tab', invertRemove: true });
      }}
      onAuxClick={(event) => {
        if (event.button === 1)
          void restoreTabs([tab.id], { background: true, by: 'tab', invertRemove: true });
      }}
      onKeyDown={onKeyDown}
      onContextMenu={(event) => {
        event.preventDefault();
        onMenu(event, stack, tab);
      }}
    >
      <CheckBox
        checked={selected}
        label={`Select ${tab.title || tab.url}`}
        onChange={() => toggleSelected(tab.id, true)}
      />
      <Favicon url={tab.url} />
      <span className="tab-title" title={tab.title || tab.url}>
        {tab.title || tab.url}
      </span>
      <span className="tab-domain">{hostLabel(tab.url)}</span>
      <div className="tab-actions">
        <IconButton
          label={t('copyLink')}
          onClick={(event) => {
            event.stopPropagation();
            void copyTabLink(tab);
          }}
        >
          <Copy size={13} />
        </IconButton>
        <IconButton
          label={t('open')}
          onClick={(event) => {
            event.stopPropagation();
            void restoreTabs([tab.id], { by: 'tab', invertRemove: true });
          }}
        >
          <ExternalLink size={13} />
        </IconButton>
        <IconButton
          className="tab-delete"
          label={t('delete')}
          onClick={(event) => {
            event.stopPropagation();
            void deleteTabs([tab.id]);
          }}
        >
          <X size={14} />
        </IconButton>
      </div>
    </div>
  );
}

export function StackList({
  stacks,
  tabsByStack,
  matches,
  scrollRef,
  query,
  onMoveRequest,
}: {
  stacks: Stack[];
  tabsByStack: Record<Id, SavedTab[]>;
  matches: Set<string> | null;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  query: string;
  onMoveRequest: (tabIds: Id[]) => void;
}): ReactNode {
  const density = useSettings((state) => state.settings?.density ?? 'comfortable');
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [renaming, setRenaming] = useState<{ stack: Stack; draft: string } | null>(null);

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const stack of stacks) {
      let tabs = tabsByStack[stack.id] ?? [];
      if (matches) tabs = tabs.filter((tab) => matches.has(tab.id));
      out.push({ kind: 'header', stack });
      if (!stack.collapsed || matches) {
        for (const tab of tabs) out.push({ kind: 'tab', stack, tab });
      }
      out.push({ kind: 'gap', stack });
    }
    return out;
  }, [stacks, tabsByStack, matches]);

  const metrics = {
    head: METRICS[density].stackHead,
    row: METRICS[density].row,
    gap: METRICS[density].stackGap,
  };

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      if (!row) return metrics.row;
      return row.kind === 'header' ? metrics.head : row.kind === 'gap' ? metrics.gap : metrics.row;
    },
    getItemKey: (index) => {
      const row = rows[index];
      if (!row) return index;
      return row.kind === 'tab' ? `t-${row.tab?.id ?? index}` : `${row.kind}-${row.stack.id}`;
    },
    overscan: 12,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer]);

  const focusedId = useLibrary((state) => state.focusedId);
  const setFocused = useLibrary((state) => state.setFocused);
  useEffect(() => {
    if (focusedId && rows.some((row) => row.tab?.id === focusedId)) return;
    const first = rows.find((row) => row.kind === 'tab')?.tab;
    if (first) setFocused(first.id);
  }, [rows, focusedId, setFocused]);

  const openMenu = (event: React.MouseEvent, stack: Stack, tab?: SavedTab): void => {
    setMenu({ x: event.clientX, y: event.clientY, stack, ...(tab ? { tab } : {}) });
  };

  const otherStacks = useLibrary((state) => state.stacks);

  const items: MenuItem[] = useMemo(() => {
    if (!menu) return [];
    const { stack, tab } = menu;
    const tabs = tabsByStack[stack.id] ?? [];
    const ids = tab ? [tab.id] : tabs.map((item) => item.id);
    const base: MenuItem[] = [
      {
        id: 'restore',
        label: tab ? t('open') : t('restoreAll'),
        icon: <ArchiveRestore size={15} />,
        onSelect: () =>
          void restoreTabs(ids, { by: 'tab', ...(tab ? { invertRemove: true } : {}) }),
      },
      {
        id: 'restore-new',
        label: t('restoreInNewWindow'),
        icon: <ArchiveRestore size={15} />,
        onSelect: () =>
          void restoreTabs(ids, {
            by: 'tab',
            window: 'new',
            ...(tab ? { invertRemove: true } : {}),
          }),
      },
    ];
    if (tab) {
      base.push({
        id: 'copy',
        label: t('copyLink'),
        icon: <Copy size={15} />,
        onSelect: () => void copyTabLink(tab),
      });
    }
    base.push({
      id: 'move',
      label: t('moveTo'),
      icon: <FolderInput size={15} />,
      onSelect: () => onMoveRequest(ids),
      separatorBefore: true,
    });
    base.push({
      id: 'copy-md',
      label: t('copyAsMarkdown'),
      icon: <FileText size={15} />,
      onSelect: () => void copyStack(stack, tabs, 'markdown'),
    });
    base.push({
      id: 'copy-text',
      label: t('copyAsText'),
      icon: <FileText size={15} />,
      onSelect: () => void copyStack(stack, tabs, 'text'),
    });
    base.push({
      id: 'export',
      label: t('exportStack'),
      icon: <Download size={15} />,
      onSelect: () => exportStack(stack, tabs),
    });
    if (!tab) {
      base.push({
        id: 'rename',
        label: t('rename'),
        icon: <Pencil size={15} />,
        onSelect: () => setRenaming({ stack, draft: stack.title }),
        separatorBefore: true,
      });
      base.push({
        id: 'pin',
        label: stack.pinned ? t('unpinStack') : t('pinStack'),
        icon: stack.pinned ? <PinOff size={15} /> : <Pin size={15} />,
        onSelect: () => void togglePin(stack),
      });
      base.push({
        id: 'lock',
        label: stack.locked ? t('unlockStack') : t('lockStack'),
        icon: stack.locked ? <LockOpen size={15} /> : <Lock size={15} />,
        onSelect: () => void toggleLock(stack),
      });
      base.push({
        id: 'top',
        label: t('moveToTop'),
        icon: <ArrowUp size={15} />,
        onSelect: () => {
          const first = otherStacks.find((candidate) => candidate.id !== stack.id);
          if (first) void reorder(stack, first.id);
        },
      });
      base.push({
        id: 'bottom',
        label: t('moveToBottom'),
        icon: <ArrowDown size={15} />,
        onSelect: () => void reorder(stack, null),
      });
      base.push({
        id: 'dedupe',
        label: t('removeDuplicates'),
        icon: <Eraser size={15} />,
        onSelect: () => void dedupe(stack),
      });
      base.push({
        id: 'delete',
        label: t('deleteStack'),
        icon: <Trash2 size={15} />,
        danger: true,
        separatorBefore: true,
        disabled: stack.locked,
        onSelect: () => void deleteStack(stack),
      });
    } else {
      base.push({
        id: 'delete-tab',
        label: t('delete'),
        icon: <Trash2 size={15} />,
        danger: true,
        separatorBefore: true,
        onSelect: () => void deleteTabs([tab.id]),
      });
    }
    return base;
  }, [menu, tabsByStack, otherStacks, onMoveRequest]);

  if (stacks.length === 0) {
    return (
      <div className="empty-state">
        <h2>{t(matches ? 'noMatches' : 'nothingStowed', { query })}</h2>
        <p>{t(matches ? 'noMatchesBody' : 'nothingStowedBody')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="virtual-list" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (!row) return null;
          return (
            <div
              key={virtualRow.key}
              className="virtual-row"
              style={{
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {row.kind === 'header' ? (
                <StackHeader
                  stack={row.stack}
                  tabs={tabsByStack[row.stack.id] ?? []}
                  forceOpen={Boolean(matches)}
                  onMenu={openMenu}
                />
              ) : row.kind === 'tab' && row.tab ? (
                <TabRow tab={row.tab} stack={row.stack} onMenu={openMenu} />
              ) : (
                <div className="stack-gap" />
              )}
            </div>
          );
        })}
      </div>
      {menu ? (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          label={menu.tab ? t('tabActions') : t('stackActions')}
          items={items}
          onClose={() => setMenu(null)}
        />
      ) : null}
      <Modal
        open={renaming !== null}
        title={t('rename')}
        onClose={() => setRenaming(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={() => {
                if (!renaming) return;
                void rename(renaming.stack, renaming.draft);
                setRenaming(null);
              }}
            >
              {t('save')}
            </Button>
          </>
        }
      >
        <input
          className="input"
          value={renaming?.draft ?? ''}
          maxLength={200}
          aria-label={t('rename')}
          // biome-ignore lint/a11y/noAutofocus: the dialog exists to rename
          autoFocus
          onChange={(event) =>
            setRenaming((current) =>
              current ? { ...current, draft: event.target.value } : current,
            )
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter' && renaming) {
              void rename(renaming.stack, renaming.draft);
              setRenaming(null);
            }
          }}
        />
      </Modal>
    </>
  );
}
