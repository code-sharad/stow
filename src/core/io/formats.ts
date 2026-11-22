import { z } from 'zod';
import { ALLOWED_SCHEMES, LIMITS } from '../../shared/constants';

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
        title: cleanTitle(heading[1].replace(/\s+\(\d{4}-\d{2}-\d{2}\)$/, '')),
        tabs: [],
      };
      stacks.push(current);
      continue;
    }
    const link = /^[-*]\s+\[([^\]]*)\]\((\S+?)\)\s*$/.exec(line);
    if (!link?.[2]) continue;
    current ??= { title: '', tabs: [] };
    if (!stacks.includes(current)) stacks.push(current);
    const reason = accepted(link[2]);
    if (reason) {
      skipped.push({ line: index + 1, text: line.slice(0, 300), reason });
      continue;
    }
    current.tabs.push({ url: link[2], title: cleanTitle(link[1] ?? '') });
  }
  return { stacks: stacks.filter((stack) => stack.tabs.length > 0), skipped };
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

export type ImportFormat = 'json' | 'html' | 'markdown' | 'onetab';

export function detectFormat(text: string, filename = ''): ImportFormat {
  const head = text.trimStart().slice(0, 200).toLowerCase();
  if (head.startsWith('{')) return 'json';
  if (head.startsWith('<!doctype netscape') || head.includes('<dl')) return 'html';
  if (/\.(json)$/i.test(filename)) return 'json';
  if (/\.(html?|htm)$/i.test(filename)) return 'html';
  if (/^#{1,6}\s+/m.test(text)) return 'markdown';
  return 'onetab';
}

export function parseImport(text: string, filename = ''): ImportResult & { format: ImportFormat } {
  const format = detectFormat(text, filename);
  switch (format) {
    case 'json':
      return { ...parseStowJson(text), format };
    case 'html':
      return { ...parseNetscapeHtml(text), format };
    case 'markdown':
      return { ...parseMarkdown(text), format };
    default:
      return { ...parseOneTabText(text), format };
  }
}
