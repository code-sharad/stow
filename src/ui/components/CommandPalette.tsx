import { ArrowDownToLine, Layers, Pin, Search, Settings2, Trash2 } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Id, Stack } from '../../core/domain/types';
import { stackTitle } from '../format';
import { t } from '../i18n';

type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  run: () => void;
};

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  stacks,
  onStack,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: 'all' | 'pinned' | 'trash' | 'settings' | 'stow-window' | 'stow-all') => void;
  stacks: Stack[];
  onStack: (id: Id) => void;
}): ReactNode {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      {
        id: 'stow-window',
        label: t('stowWindow'),
        hint: 'Alt+Shift+S',
        icon: <ArrowDownToLine size={16} />,
        run: () => onNavigate('stow-window'),
      },
      {
        id: 'stow-all',
        label: t('stowAllWindows'),
        icon: <Layers size={16} />,
        run: () => onNavigate('stow-all'),
      },
      { id: 'all', label: t('allTabs'), icon: <Layers size={16} />, run: () => onNavigate('all') },
      {
        id: 'pinned',
        label: t('pinned'),
        icon: <Pin size={16} />,
        run: () => onNavigate('pinned'),
      },
      {
        id: 'trash',
        label: t('trash'),
        icon: <Trash2 size={16} />,
        run: () => onNavigate('trash'),
      },
      {
        id: 'settings',
        label: t('settings'),
        icon: <Settings2 size={16} />,
        run: () => onNavigate('settings'),
      },
    ];
    const value = query.trim().toLowerCase();
    const stackCommands: Command[] = stacks
      .filter((stack) => !value || stackTitle(stack).toLowerCase().includes(value))
      .slice(0, 8)
      .map((stack) => ({
        id: `stack-${stack.id}`,
        label: stackTitle(stack),
        hint: t('tabCountOther', { n: stack.tabCount }),
        icon: <span className="rail-dot" style={{ background: `var(--grp-${stack.color})` }} />,
        run: () => onStack(stack.id),
      }));
    const filteredBase = base.filter(
      (command) => !value || command.label.toLowerCase().includes(value),
    );
    return [...filteredBase, ...stackCommands];
  }, [query, stacks, onNavigate, onStack]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((index) => Math.min(index + 1, commands.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((index) => Math.max(index - 1, 0));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        commands[active]?.run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, commands, active, onClose]);

  if (!open) return null;

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click is optional; Escape is handled.
    <div className="palette-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label={t('paletteActions')}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="palette-search">
          <Search size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-list" role="listbox">
          {commands.length === 0 ? (
            <div className="palette-empty">{t('noMatches', { query })}</div>
          ) : null}
          {commands.map((command, index) => (
            <button
              key={command.id}
              type="button"
              role="option"
              aria-selected={index === active}
              className={`palette-item${index === active ? ' is-active' : ''}`}
              onMouseEnter={() => setActive(index)}
              onClick={command.run}
            >
              <span className="palette-icon">{command.icon}</span>
              <span>{command.label}</span>
              {command.hint ? <span className="meta">{command.hint}</span> : null}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
