import { ArrowDownToLine, ShieldCheck } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import type { Id, Stack } from '../../core/domain/types';
import { moveTabsToStack, stowScope } from '../actions';
import { t } from '../i18n';
import { useLibrary } from '../state/library';
import { LibrarySearch } from '../state/search';
import { useSettings } from '../state/settings';
import { CommandPalette } from './CommandPalette';
import { Button, Modal, ToastHost } from './controls';
import { SettingsPage } from './SettingsPage';
import { BulkBar, parseRoute, Rail, type Route, routeHash, StatusBar, TopBar } from './Shell';
import { StackList } from './StackList';
import { TrashPage } from './TrashPage';

function WelcomePage({ onStow }: { onStow: () => void }): ReactNode {
  return (
    <div className="welcome">
      <p className="welcome-kicker">
        <span aria-hidden="true">❯</span> stow --welcome
      </p>
      <h1>{t('welcomeTitle')}</h1>
      <p className="welcome-lede">{t('welcomeBody')}</p>
      <ol className="welcome-steps">
        <li>
          <strong>{t('welcomeStep1')}</strong>
          <span>{t('welcomeStep1Body')}</span>
        </li>
        <li>
          <strong>{t('welcomeStep2')}</strong>
          <span>{t('welcomeStep2Body')}</span>
        </li>
        <li>
          <strong>{t('welcomeStep3')}</strong>
          <span>{t('welcomeStep3Body')}</span>
        </li>
      </ol>
      <div className="welcome-actions">
        <Button variant="primary" onClick={onStow}>
          <ArrowDownToLine size={16} /> {t('stowWindow')}
        </Button>
      </div>
      <p className="welcome-privacy">
        <ShieldCheck size={14} /> {t('localOnly')}
      </p>
    </div>
  );
}

export function LibraryApp(): ReactNode {
  const loaded = useLibrary((state) => state.loaded);
  const error = useLibrary((state) => state.error);
  const stacks = useLibrary((state) => state.stacks);
  const tabsByStack = useLibrary((state) => state.tabsByStack);
  const tabIndex = useLibrary((state) => state.tabIndex);
  const selected = useLibrary((state) => state.selected);
  const init = useLibrary((state) => state.init);
  const clearSelection = useLibrary((state) => state.clearSelection);
  const initSettings = useSettings((state) => state.init);

  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  const [query, setQuery] = useState('');
  const [moveIds, setMoveIds] = useState<Id[] | null>(null);
  const [moveTarget, setMoveTarget] = useState<Id | ''>('');
  const [palette, setPalette] = useState(false);
  const [indexVersion, setIndexVersion] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const search = useRef(new LibrarySearch());

  useEffect(() => {
    void initSettings();
    void init();
  }, [init, initSettings]);

  useEffect(() => {
    if (route.name === 'welcome' && stacks.length > 0) {
      setRoute({ name: 'all' });
      history.replaceState(null, '', '#/');
    }
  }, [route.name, stacks.length]);

  useEffect(() => {
    const onHash = (): void => setRoute(parseRoute(location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    search.current.rebuild(tabIndex, stacks);
    setIndexVersion((version) => version + 1);
  }, [tabIndex, stacks]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: indexVersion invalidates the rebuilt index
  const matches = useMemo(() => search.current.search(query), [query, indexVersion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPalette(true);
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (event.key === 'Escape') {
        const input = searchRef.current;
        if (input && target === input) {
          setQuery('');
          input.blur();
        } else if (!typing) {
          clearSelection();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearSelection]);

  const navigate = (next: Route): void => {
    location.hash = routeHash(next);
    setRoute(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const stow = (scope: 'window' | 'all-windows'): void => {
    void stowScope(scope === 'window' ? { kind: 'window' } : { kind: 'all-windows' });
  };

  const visibleStacks = useMemo(() => {
    let list = stacks;
    if (route.name === 'pinned') list = list.filter((stack) => stack.pinned);
    if (route.name === 'stack') list = list.filter((stack) => stack.id === route.id);
    if (matches) {
      list = list.filter((stack) =>
        (tabsByStack[stack.id] ?? []).some((tab) => matches.has(tab.id)),
      );
    }
    return list;
  }, [stacks, route, matches, tabsByStack]);

  const selectedIds = useMemo(
    () => [...selected].filter((id) => tabIndex[id]?.deletedAt === 0),
    [selected, tabIndex],
  );

  const total = Object.values(tabIndex).filter((tab) => tab.deletedAt === 0).length;
  const stackRoute =
    route.name === 'stack' ? stacks.find((stack) => stack.id === route.id) : undefined;

  if (error) {
    return (
      <div className="recover">
        <h1>{t('recoverTitle')}</h1>
        <p>{t('recoverBody')}</p>
        <div className="inline-control">
          <Button variant="primary" onClick={() => location.reload()}>
            {t('reload')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="library">
      <Rail route={route} onNavigate={navigate} stackCount={stacks.length} tabTotal={total} />
      <TopBar
        query={query}
        onQuery={setQuery}
        searchRef={searchRef}
        onStow={stow}
        canStow={total >= 0}
      />

      <main className="main" ref={scrollRef}>
        <div className="reading">
          {route.name === 'settings' ? (
            <SettingsPage />
          ) : route.name === 'trash' ? (
            <TrashPage />
          ) : route.name === 'welcome' ? (
            <WelcomePage onStow={() => stow('window')} />
          ) : !loaded ? (
            <div className="skeleton" role="status" aria-busy="true" aria-label={t('loading')}>
              <div />
              <div />
              <div />
              <div />
            </div>
          ) : stacks.length === 0 && !query ? (
            <WelcomePage onStow={() => stow('window')} />
          ) : (
            <div className="page">
              <div className="page-head">
                <div>
                  {stackRoute ? (
                    <>
                      <button
                        type="button"
                        className="crumb"
                        onClick={() => navigate({ name: 'all' })}
                      >
                        {t('allTabs')} /
                      </button>
                      <h1 className="page-title">{stackRoute.title || t('untitledStack')}</h1>
                    </>
                  ) : (
                    <h1 className="page-title">
                      {route.name === 'pinned' ? t('pinned') : t('allTabs')}
                    </h1>
                  )}
                  <p className="muted">
                    {matches
                      ? t('searchStatus', { n: matches.size, m: visibleStacks.length })
                      : null}
                  </p>
                </div>
              </div>
              <StackList
                stacks={visibleStacks}
                tabsByStack={tabsByStack}
                matches={matches}
                scrollRef={scrollRef}
                query={query}
                onMoveRequest={(ids) => {
                  setMoveIds(ids);
                  setMoveTarget('');
                }}
              />
            </div>
          )}
        </div>
      </main>

      {selectedIds.length > 0 ? (
        <BulkBar
          selected={selectedIds}
          stacks={stacks}
          onMove={() => {
            setMoveIds(selectedIds);
            setMoveTarget('');
          }}
          onClear={clearSelection}
        />
      ) : null}

      <Modal
        open={moveIds !== null}
        title={t('moveTo')}
        description={t('moveDescription', { n: moveIds?.length ?? 0 })}
        onClose={() => setMoveIds(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMoveIds(null)}>
              {t('cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={!moveTarget}
              onClick={() => {
                const target = stacks.find((stack) => stack.id === moveTarget);
                if (target && moveIds) void moveTabsToStack(moveIds, target);
                setMoveIds(null);
              }}
            >
              {t('move')}
            </Button>
          </>
        }
      >
        <div className="move-list">
          {stacks.map((stack: Stack) => (
            <label key={stack.id} className="move-option">
              <input
                type="radio"
                name="move-target"
                checked={moveTarget === stack.id}
                onChange={() => setMoveTarget(stack.id)}
              />
              <span className="rail-dot" style={{ background: `var(--grp-${stack.color})` }} />
              <span>{stack.title || t('untitledStack')}</span>
              <span className="meta">{stack.tabCount}</span>
            </label>
          ))}
        </div>
      </Modal>

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        onNavigate={(next) => {
          setPalette(false);
          if (next === 'stow-window') stow('window');
          else if (next === 'stow-all') stow('all-windows');
          else if (next === 'all' || next === 'pinned' || next === 'trash' || next === 'settings')
            navigate({ name: next });
        }}
        stacks={stacks}
        onStack={(id) => {
          setPalette(false);
          navigate({ name: 'stack', id });
        }}
      />
      <StatusBar
        route={route}
        stackCount={stacks.length}
        tabTotal={total}
        selected={selectedIds.length}
      />
      <ToastHost />
    </div>
  );
}
