import type { ChangeSet } from '../core/db/changes';
import {
  createStackWithTabs,
  dedupeStack,
  emptyTrash,
  importBackup,
  importTabs,
  moveTabs,
  renameStack,
  reorderStack,
  softDeleteStack,
  softDeleteTabs,
  undo,
  updateStack,
} from '../core/db/repo';
import type { Id, SavedTab, Stack, StowScope } from '../core/domain/types';
import { buildFullBackup, type FullBackup, parseImport } from '../core/io/formats';
import type { Settings } from '../core/settings/schema';
import { getSettings } from '../core/settings/store';
import { send } from '../messaging/protocol';
import { LIMITS } from '../shared/constants';
import { stackAsMarkdown, stackAsText, stackTitle } from './format';
import { plural, t } from './i18n';
import { useLibrary } from './state/library';
import { toastError, useToasts } from './state/toasts';

function push(message: string, action?: { label: string; onClick: () => void }): void {
  useToasts.getState().push(message, action ? { action } : {});
}

/** BroadcastChannel does not deliver to the context that sent it, so local writes apply directly. */
function apply(change: ChangeSet | null): void {
  if (change) useLibrary.getState().accept(change);
}

function undoAction(opId: Id): { label: string; onClick: () => void } {
  return {
    label: t('undo'),
    onClick: () => {
      void undo(opId).then(apply);
    },
  };
}

export async function stowScope(scope: StowScope): Promise<boolean> {
  try {
    const result = await send('stow', { scope });
    if (!result.ok) {
      if (result.error.code === 'empty') push(t('stowedNoStacks'));
      else toastError(t('saveFailed'));
      return false;
    }
    if (result.saved === 0) {
      push(t('stowedNoStacks'));
      return false;
    }
    const message = t('stowed', {
      n: result.saved,
      m: result.stacks,
      tabs: plural(result.saved, 'tab', 'tabs'),
      lists: plural(result.stacks, 'list', 'lists'),
    });
    push(message);
    if (result.closeFailed > 0) {
      useToasts.getState().push(t('closeFailed', { n: result.saved, k: result.closeFailed }), {
        tone: 'error',
        timeout: 6000,
      });
    }
    return true;
  } catch {
    toastError(t('saveFailed'));
    return false;
  }
}

export async function restoreTabs(
  ids: Id[],
  options: {
    window?: 'current' | 'new';
    background?: boolean;
    invertRemove?: boolean;
    by?: 'tab' | 'selection';
  } = {},
): Promise<void> {
  if (ids.length === 0) return;
  try {
    const result = await send('restore', {
      by: options.by ?? 'tab',
      ids,
      window: options.window ?? 'current',
      background: options.background ?? false,
      invertRemove: options.invertRemove ?? false,
    });
    if (!result.ok) {
      toastError(t('restoreFailed'));
      return;
    }
    if (result.failed > 0) {
      useToasts.getState().push(t('restoredPartial', { n: result.opened, k: result.failed }), {
        tone: 'error',
      });
    } else {
      push(t('restored', { n: result.opened }));
    }
  } catch {
    toastError(t('restoreFailed'));
  }
}

export async function deleteTabs(ids: Id[]): Promise<void> {
  if (ids.length === 0) return;
  const result = await softDeleteTabs(ids);
  if (!result) return;
  apply(result.change);
  useLibrary.getState().clearSelection();
  const deleted = result.change.tabsUpserted.filter((tab) => tab.deletedAt > 0).length;
  if (deleted === 0) {
    push(t('nothingDeleted'));
    return;
  }
  push(t('deletedTabs', { n: deleted }), undoAction(result.opId));
}

export async function deleteStack(stack: Stack): Promise<void> {
  const result = await softDeleteStack(stack.id);
  apply(result.change);
  push(t('deletedStack'), undoAction(result.opId));
}

export async function reorder(stack: Stack, beforeId: Id | null): Promise<void> {
  apply(await reorderStack(stack.id, beforeId));
}

export async function rename(stack: Stack, title: string): Promise<void> {
  const trimmed = title.trim();
  if (trimmed === stack.title || trimmed.length === 0) return;
  apply(await renameStack(stack.id, trimmed));
}

export async function togglePin(stack: Stack): Promise<void> {
  apply(await updateStack(stack.id, { pinned: !stack.pinned }));
}

export async function toggleLock(stack: Stack): Promise<void> {
  apply(await updateStack(stack.id, { locked: !stack.locked }));
}

export async function toggleCollapsed(stack: Stack): Promise<void> {
  apply(await updateStack(stack.id, { collapsed: !stack.collapsed }));
}

export async function moveTabsToStack(tabIds: Id[], target: Stack): Promise<void> {
  if (tabIds.length === 0) return;
  apply((await moveTabs(tabIds, target.id)).change);
  useLibrary.getState().clearSelection();
  push(t('movedTabs', { n: tabIds.length, list: stackTitle(target) }));
}

export async function groupSelection(): Promise<void> {
  const ids = [...useLibrary.getState().selected];
  if (ids.length === 0) return;
  apply((await createStackWithTabs(ids)).change);
  useLibrary.getState().clearSelection();
}

export async function dedupe(stack: Stack): Promise<void> {
  const result = await dedupeStack(stack.id);
  if (!result) push(t('merged', { n: 0 }));
  else {
    apply(result.change);
    push(t('merged', { n: result.change.tabsDeletedIds.length }));
  }
}

export async function copyStack(
  stack: Stack,
  tabs: SavedTab[],
  format: 'markdown' | 'text',
): Promise<void> {
  const text = format === 'markdown' ? stackAsMarkdown(stackTitle(stack), tabs) : stackAsText(tabs);
  await copyText(text);
  push(t('copiedLinks', { n: tabs.length }));
}

export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

export async function copyTabLink(tab: SavedTab): Promise<void> {
  await copyText(tab.url);
  push(t('copyLink'));
}

/** Manual export uses the same builder the scheduled backup does, so fields cannot drift. */
export async function buildExport(
  stacks: Stack[],
  tabsByStack: Record<Id, SavedTab[]>,
  settings: Settings,
): Promise<FullBackup> {
  const tabs = stacks.flatMap((stack) => tabsByStack[stack.id] ?? []);
  return buildFullBackup(stacks, tabs, settings);
}

export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportStack(stack: Stack, tabs: SavedTab[]): Promise<void> {
  const settings = await getSettings();
  const slug =
    stackTitle(stack)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'stack';
  downloadJson(`stow-${slug}.json`, buildFullBackup([stack], tabs, settings));
}

export async function emptyAllTrash(): Promise<void> {
  apply(await emptyTrash());
}

export interface ImportOutcome {
  imported: number;
  skipped: number;
  /** Settings from a full-fidelity backup; apply only after the user confirms. */
  settings?: Settings;
  /** True for a legacy JSON that could not carry settings or list fields. */
  degraded: boolean;
}

export async function importFile(file: File): Promise<ImportOutcome> {
  if (file.size > LIMITS.importBytes) throw new Error('too-large');
  const parsed = parseImport(await file.text(), file.name);

  if (parsed.backup) {
    const result = await importBackup(parsed.backup);
    apply(result.change);
    push(
      result.skipped.length > 0
        ? t('importedSkipped', { n: result.importedTabs, k: result.skipped.length })
        : t('imported', { n: result.importedTabs }),
    );
    return {
      imported: result.importedTabs,
      skipped: result.skipped.length,
      settings: parsed.backup.settings,
      degraded: false,
    };
  }

  const count = parsed.stacks.reduce((total, stack) => total + stack.tabs.length, 0);
  if (count === 0) throw new Error('empty-import');
  let imported = 0;
  for (const stack of parsed.stacks) {
    apply(await importTabs(stack.title || file.name.replace(/\.[^.]+$/, ''), stack.tabs));
    imported += stack.tabs.length;
  }
  push(
    parsed.skipped.length > 0
      ? t('importedSkipped', { n: imported, k: parsed.skipped.length })
      : t('imported', { n: imported }),
  );
  const degraded = parsed.format === 'json';
  if (degraded) push(t('importedLegacyNotice'));
  return { imported, skipped: parsed.skipped.length, degraded };
}
