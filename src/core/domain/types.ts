/** Domain types for Stow. No chrome.* or React imports allowed in this layer. */

export type Id = string; // ULID

export const GROUP_COLORS = [
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange',
] as const;

export type GroupColor = (typeof GROUP_COLORS)[number];

export interface Stack {
  id: Id;
  title: string;
  orderKey: string;
  pinned: boolean;
  locked: boolean;
  collapsed: boolean;
  color: GroupColor | null;
  tabCount: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number;
  deletedBy: Id | '';
}

export interface SavedTab {
  id: Id;
  stackId: Id;
  url: string;
  urlKey: string;
  title: string;
  orderKey: string;
  wasPinned: boolean;
  /** Captured icon URL (Firefox supplies a data URL); never rendered as HTML. */
  favicon?: string;
  createdAt: number;
  deletedAt: number;
  deletedBy: Id | '';
}

export type OperationKind =
  | 'stow'
  | 'delete-tabs'
  | 'delete-stacks'
  | 'restore'
  | 'restore-remove'
  | 'dedupe-merge'
  | 'merge-stacks'
  | 'import'
  | 'empty-trash'
  | 'purge';

export type RestoreRowState = 'pending' | 'opened' | 'removed';

export interface RestoreOpRow {
  tabId: Id;
  browserTabId?: number;
  state: RestoreRowState;
}

export interface RestoreOpState {
  stackIds: Id[];
  rows: RestoreOpRow[];
  remove: boolean;
  target: 'current' | 'new';
  background: boolean;
  updatedAt: number;
}

export interface Operation {
  id: Id;
  kind: OperationKind;
  createdAt: number;
  counts: { tabs: number; stacks: number };
  undoneAt: number;
  restore?: RestoreOpState;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogRow {
  id?: number;
  ts: number;
  level: LogLevel;
  code: string;
  detail: string;
}

/** A chrome tab reduced to the fields the domain needs. */
export interface TabCandidate {
  id: number;
  windowId: number;
  index: number;
  url: string;
  title: string;
  pinned: boolean;
  incognito: boolean;
  /** -1 when not in a group. */
  groupId: number;
  /** Browser-provided icon URL, if the browser exposes one. */
  faviconUrl?: string;
  windowType: 'normal' | 'popup' | 'panel' | 'app' | 'devtools';
}

export interface NativeGroup {
  id: number;
  title: string;
  color: GroupColor;
  collapsed?: boolean;
}

export type SkipReason =
  | 'internal-scheme'
  | 'library'
  | 'blank'
  | 'pinned'
  | 'incognito'
  | 'ignored-site'
  | 'window-type'
  | 'oversized-url';

export type SkipCounts = Partial<Record<SkipReason, number>>;

export interface ClassifyResult {
  eligible: TabCandidate[];
  skipped: SkipCounts;
}

export type StowScope =
  | { kind: 'window'; windowId?: number }
  | { kind: 'all-windows' }
  | { kind: 'tab'; tabId: number }
  | { kind: 'others'; tabId: number }
  | { kind: 'left'; tabId: number }
  | { kind: 'right'; tabId: number }
  | { kind: 'highlighted'; windowId?: number };

export type RestoreTarget = 'current' | 'new';

export interface RestoreRequest {
  by: 'tab' | 'stack' | 'selection';
  ids: Id[];
  window?: RestoreTarget;
  background?: boolean;
  invertRemove?: boolean;
}
