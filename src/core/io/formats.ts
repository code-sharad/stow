import { z } from 'zod';
import { ALLOWED_SCHEMES, LIMITS } from '../../shared/constants';
import { GROUP_COLORS, type GroupColor, type Id, type SavedTab, type Stack } from '../domain/types';
import { type Settings, settingsSchema } from '../settings/schema';

export interface ImportedTab {
  url: string;
  title: string;
}

export interface ImportedStack {
  title: string;
  tabs: ImportedTab[];
  createdAt?: number;
}

export interface ImportIssue {
  line: number;
  text: string;
  reason: 'url' | 'scheme' | 'oversized';
}

export interface ImportResult {
  stacks: ImportedStack[];
  skipped: ImportIssue[];
}

const MAX_LINES = 500_000;

function accepted(url: string): ImportIssue['reason'] | null {
  if (url.length > LIMITS.url) return 'oversized';
  try {
    const parsed = new URL(url);
    if (!ALLOWED_SCHEMES.has(parsed.protocol)) return 'scheme';
    return null;
  } catch {
    return 'url';
  }
}

function cleanTitle(title: string): string {
  return title.trim().slice(0, LIMITS.title);
}

/** OneTab text: `URL | Title`, blank line between stacks, optional `# Title` lines. */
export function parseOneTabText(text: string): ImportResult {
  const stacks: ImportedStack[] = [];
  const skipped: ImportIssue[] = [];
  let current: ImportedStack | null = null;
  const lines = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .slice(0, MAX_LINES);

  const flush = (): void => {
    if (current && current.tabs.length > 0) stacks.push(current);
    current = null;
  };

  for (const [index, raw] of lines.entries()) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith('#')) {
      flush();
      current = { title: cleanTitle(line.replace(/^#+\s*/, '')), tabs: [] };
      continue;
    }
    current ??= { title: '', tabs: [] };
    const match = /^(\S+?)\s*(?:\|\s*(.*))?$/.exec(line);
    const url = match?.[1] ?? '';
    const reason = accepted(url);
    if (reason) {
      skipped.push({ line: index + 1, text: line.slice(0, 300), reason });
      continue;
    }
    current.tabs.push({ url, title: cleanTitle(match?.[2] ?? '') });
  }
  flush();
  return { stacks, skipped };
}

export function serializeOneTabText(
  stacks: readonly ImportedStack[],
  includeTitles = false,
): string {
  return stacks
    .map((stack) => {
      const heading = includeTitles && stack.title ? `# ${stack.title}\n` : '';
      return heading + stack.tabs.map((tab) => `${tab.url} | ${tab.title}`).join('\n');
    })
    .join('\n\n');
}

/** Markdown: `## Stack` followed by `- [Title](url)` lines. */
export function parseMarkdown(text: string): ImportResult {
  const stacks: ImportedStack[] = [];
  const skipped: ImportIssue[] = [];
  let current: ImportedStack | null = null;
  const lines = text.replace(/\r\n?/g, '\n').split('\n').slice(0, MAX_LINES);

  for (const [index, raw] of lines.entries()) {
    const line = raw.trim();
    if (!line) continue;
    const heading = /^#{1,6}\s+(.+)$/.exec(line);
    if (heading?.[1]) {
      current = {
        title: cleanTitle(unescapeMarkdown(heading[1]).replace(/\s+\(\d{4}-\d{2}-\d{2}\)$/, '')),
        tabs: [],
      };
      stacks.push(current);
      continue;
    }
    const link = parseMarkdownLink(line);
    if (!link) continue;
    current ??= { title: '', tabs: [] };
    if (!stacks.includes(current)) stacks.push(current);
    const reason = accepted(link.url);
    if (reason) {
      skipped.push({ line: index + 1, text: line.slice(0, 300), reason });
      continue;
    }
    current.tabs.push({ url: link.url, title: cleanTitle(link.title) });
  }
  return { stacks: stacks.filter((stack) => stack.tabs.length > 0), skipped };
}

/** Reads `- [title](url)` with backslash escapes and balanced URL parentheses. */
function parseMarkdownLink(line: string): { title: string; url: string } | null {
  if (!/^[-*]\s+/.test(line)) return null;
  const rest = line.replace(/^[-*]\s+/, '');
  if (!rest.startsWith('[')) return null;

  let title = '';
  let index = 1;
  for (; index < rest.length; index += 1) {
    const char = rest[index];
    if (char === '\\' && index + 1 < rest.length) {
      title += rest[index + 1];
      index += 1;
      continue;
    }
    if (char === ']') break;
    title += char;
  }
  if (rest[index] !== ']' || rest[index + 1] !== '(') return null;

  let depth = 1;
  let url = '';
  for (let cursor = index + 2; cursor < rest.length; cursor += 1) {
    const char = rest[cursor];
    if (char === '\\' && cursor + 1 < rest.length) {
      url += rest[cursor + 1];
      cursor += 1;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) return url ? { title, url } : null;
    }
    url += char;
  }
  return null;
}

function unescapeMarkdown(value: string): string {
  return value.replace(/\\([\\[\]()*_`])/g, '$1');
}

export function serializeMarkdown(stacks: readonly ImportedStack[], includeDates = false): string {
  return stacks
    .map((stack) => {
      const date =
        includeDates && stack.createdAt
          ? ` (${new Date(stack.createdAt).toISOString().slice(0, 10)})`
          : '';
      const rows = stack.tabs
        .map((tab) => `- [${escapeMarkdown(tab.title || tab.url)}](${tab.url})`)
        .join('\n');
      return `## ${escapeMarkdown(stack.title || 'Saved tabs')}${date}\n\n${rows}`;
    })
    .join('\n\n');
}

export function escapeMarkdown(value: string): string {
  return value
    .replace(/([\\[\]()*_`])/g, '\\$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Netscape bookmarks HTML. Folders become stacks. */
export function parseNetscapeHtml(html: string): ImportResult {
  const skipped: ImportIssue[] = [];
  const byFolder = new Map<Element, ImportedStack>();
  const unfiled: ImportedStack = { title: 'Imported bookmarks', tabs: [] };
  const document = new DOMParser().parseFromString(html, 'text/html');
  const anchors = [...document.querySelectorAll('a[href]')].slice(0, LIMITS.importTabs);

  for (const anchor of anchors) {
    const href = anchor.getAttribute('href') ?? '';
    if (!/^https?:\/\//i.test(href)) continue;
    const reason = accepted(href);
    if (reason) {
      skipped.push({ line: 0, text: href.slice(0, 300), reason });
      continue;
    }
    const list = anchor.closest('dl');
    const parent = list?.parentElement;
    const folder = parent?.tagName === 'DT' ? parent.querySelector('h3') : null;
    let stack = unfiled;
    if (folder) {
      const existing = byFolder.get(folder);
      if (existing) stack = existing;
      else {
        stack = { title: cleanTitle(folder.textContent ?? ''), tabs: [] };
        byFolder.set(folder, stack);
      }
    }
    stack.tabs.push({ url: href, title: cleanTitle(anchor.textContent ?? '') });
  }

  const stacks = [...byFolder.values(), unfiled].filter((stack) => stack.tabs.length > 0);
  return { stacks, skipped };
}

export function serializeNetscapeHtml(stacks: readonly ImportedStack[]): string {
  const folders = stacks
    .map((stack) => {
      const rows = stack.tabs
        .map(
          (tab) =>
            `        <DT><A HREF="${escapeHtml(tab.url)}">${escapeHtml(tab.title || tab.url)}</A>`,
        )
        .join('\n');
      return `    <DT><H3>${escapeHtml(stack.title || 'Saved tabs')}</H3>\n    <DL><p>\n${rows}\n    </DL><p>`;
    })
    .join('\n');
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n${folders}\n</DL><p>\n`;
}

const tabSchema = z.object({
  url: z.string().max(LIMITS.url),
  title: z.string().max(LIMITS.title).optional().default(''),
});

const stackSchema = z.object({
  title: z.string().max(LIMITS.stackTitle).optional().default(''),
  createdAt: z.number().optional(),
  tabs: z.array(tabSchema).max(LIMITS.importTabs),
});

const jsonSchema = z.object({
  app: z.literal('stow').optional(),
  formatVersion: z.number().int().optional(),
  version: z.number().int().optional(),
  stacks: z.array(stackSchema).max(100_000),
});

export function parseStowJson(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('invalid-json');
  }
  const parsed = jsonSchema.safeParse(raw);
  if (!parsed.success) throw new Error('invalid-json');
  if ((parsed.data.formatVersion ?? parsed.data.version ?? 1) > 1)
    throw new Error('future-version');
  const skipped: ImportIssue[] = [];
  const stacks: ImportedStack[] = [];
  for (const stack of parsed.data.stacks) {
    const tabs: ImportedTab[] = [];
    for (const tab of stack.tabs) {
      const reason = accepted(tab.url);
      if (reason) skipped.push({ line: 0, text: tab.url.slice(0, 300), reason });
      else tabs.push({ url: tab.url, title: tab.title });
    }
    if (tabs.length > 0) stacks.push({ title: stack.title, createdAt: stack.createdAt, tabs });
  }
  return { stacks, skipped };
}

export function serializeStowJson(
  stacks: readonly ImportedStack[],
  exportedAt = Date.now(),
): string {
  return JSON.stringify(
    {
      app: 'stow',
      formatVersion: 1,
      exportedAt: new Date(exportedAt).toISOString(),
      stacks,
    },
    null,
    2,
  );
}

/** Full-fidelity backup (format v2). Carries every user-visible stack and tab field. */
export interface FullBackupTab {
  url: string;
  title: string;
  orderKey: string;
  wasPinned: boolean;
  createdAt: number;
  favicon?: string;
}

export interface FullBackupStack {
  title: string;
  orderKey: string;
  pinned: boolean;
  locked: boolean;
  collapsed: boolean;
  color: GroupColor | null;
  createdAt: number;
  updatedAt: number;
  tabs: FullBackupTab[];
}

export interface FullBackup {
  app: 'stow';
  formatVersion: 2;
  exportedAt: string;
  settings: Settings;
  stacks: FullBackupStack[];
}

const backupTabSchema = z
  .object({
    url: z.string().max(LIMITS.url),
    title: z.string().max(LIMITS.title).optional().default(''),
    orderKey: z.string().min(1).max(100),
    wasPinned: z.boolean().optional().default(false),
    createdAt: z.number().int().nonnegative(),
    favicon: z.string().max(LIMITS.favicon).optional(),
  })
  .strict();

const backupStackSchema = z
  .object({
    title: z.string().max(LIMITS.stackTitle).optional().default(''),
    orderKey: z.string().min(1).max(100),
    pinned: z.boolean().optional().default(false),
    locked: z.boolean().optional().default(false),
    collapsed: z.boolean().optional().default(false),
    color: z.enum(GROUP_COLORS).nullable().optional().default(null),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative(),
    tabs: z.array(backupTabSchema).max(LIMITS.importTabs),
  })
  .strict();

const backupSchema = z
  .object({
    app: z.literal('stow'),
    formatVersion: z.literal(2),
    exportedAt: z.string(),
    settings: settingsSchema.strict(),
    stacks: z.array(backupStackSchema).max(100_000),
  })
  .strict();

function sortStacksForExport(a: Stack, b: Stack): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  return a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0;
}

function sortTabsForExport(a: SavedTab, b: SavedTab): number {
  return a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0;
}

/** The one builder both the manual export and the scheduled backup use. */
export function buildFullBackup(
  stacks: readonly Stack[],
  tabs: readonly SavedTab[],
  settings: Settings,
  exportedAt = Date.now(),
): FullBackup {
  const byStack = new Map<Id, SavedTab[]>();
  for (const tab of tabs) {
    if (tab.deletedAt !== 0) continue;
    const list = byStack.get(tab.stackId) ?? [];
    list.push(tab);
    byStack.set(tab.stackId, list);
  }
  const ordered = stacks
    .filter((stack) => stack.deletedAt === 0)
    .slice()
    .sort(sortStacksForExport);
  return {
    app: 'stow',
    formatVersion: 2,
    exportedAt: new Date(exportedAt).toISOString(),
    settings: { ...settings },
    stacks: ordered.map((stack) => ({
      title: stack.title,
      orderKey: stack.orderKey,
      pinned: stack.pinned,
      locked: stack.locked,
      collapsed: stack.collapsed,
      color: stack.color,
      createdAt: stack.createdAt,
      updatedAt: stack.updatedAt,
      tabs: (byStack.get(stack.id) ?? [])
        .slice()
        .sort(sortTabsForExport)
        .map((tab) => ({
          url: tab.url,
          title: tab.title,
          orderKey: tab.orderKey,
          wasPinned: tab.wasPinned,
          createdAt: tab.createdAt,
          ...(tab.favicon ? { favicon: tab.favicon } : {}),
        })),
    })),
  };
}

export function serializeFullBackup(backup: FullBackup): string {
  return JSON.stringify(backup, null, 2);
}

/** Validate a complete v2 document at the boundary; unknown fields fail closed. */
export function parseFullBackup(text: string): FullBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('invalid-json');
  }
  const version = backupVersionOf(raw);
  if (version > 2) throw new Error('future-version');
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) throw new Error('invalid-backup');
  return parsed.data;
}

function backupVersionOf(raw: unknown): number {
  if (typeof raw !== 'object' || raw === null) return 1;
  const record = raw as { formatVersion?: unknown; version?: unknown };
  if (typeof record.formatVersion === 'number') return record.formatVersion;
  if (typeof record.version === 'number') return record.version;
  return 1;
}

export type ImportFormat = 'json' | 'html' | 'markdown' | 'onetab';

const ONETAB_ROW = /^(?:https?|ftp|file):\/\/\S+(?:\s*\|\s*.*)?$/i;

/** Content-based detection: compare how many rows each syntax would parse. */
export function detectFormat(text: string, filename = ''): ImportFormat {
  const head = text.trimStart().slice(0, 200).toLowerCase();
  if (head.startsWith('{')) return 'json';
  if (head.startsWith('<!doctype netscape') || head.includes('<dl')) return 'html';
  if (/\.(json)$/i.test(filename)) return 'json';
  if (/\.(html?|htm)$/i.test(filename)) return 'html';

  let oneTabRows = 0;
  let linkRows = 0;
  let headingRows = 0;
  for (const raw of text.slice(0, 200_000).split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (ONETAB_ROW.test(line)) oneTabRows += 1;
    if (/^[-*]\s+\[/.test(line)) linkRows += 1;
    if (/^#{1,6}\s+/.test(line)) headingRows += 1;
  }
  if (oneTabRows > 0 && oneTabRows >= linkRows) return 'onetab';
  if (linkRows > 0 || headingRows > 0) return 'markdown';
  return 'onetab';
}

export interface ParsedImport extends ImportResult {
  format: ImportFormat;
  /** Present when the file is a full-fidelity v2 backup. */
  backup?: FullBackup;
}

export function parseImport(text: string, filename = ''): ParsedImport {
  const format = detectFormat(text, filename);
  switch (format) {
    case 'json': {
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error('invalid-json');
      }
      if (backupVersionOf(raw) >= 2) {
        const backup = parseFullBackup(text);
        const skipped: ImportIssue[] = [];
        const stacks: ImportedStack[] = [];
        for (const stack of backup.stacks) {
          const tabs: ImportedTab[] = [];
          for (const tab of stack.tabs) {
            const reason = accepted(tab.url);
            if (reason) skipped.push({ line: 0, text: tab.url.slice(0, 300), reason });
            else tabs.push({ url: tab.url, title: tab.title });
          }
          if (tabs.length > 0)
            stacks.push({ title: stack.title, createdAt: stack.createdAt, tabs });
        }
        return { stacks, skipped, format, backup };
      }
      return { ...parseStowJson(text), format };
    }
    case 'html':
      return { ...parseNetscapeHtml(text), format };
    case 'markdown':
      return { ...parseMarkdown(text), format };
    default:
      return { ...parseOneTabText(text), format };
  }
}
