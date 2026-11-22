import type { ClassifyResult, SkipCounts, SkipReason, TabCandidate } from './types';
import { isOversizedUrl } from './url';

export interface IgnoreSettings {
  ignorePinnedTabs: boolean;
  stowIncognito: boolean;
  ignoredSites: readonly string[];
}

export interface ClassifyContext {
  /** Base URL of the Library page, without hash. */
  libraryUrl: string;
}

const INTERNAL_SCHEMES = new Set([
  'chrome:',
  'chrome-untrusted:',
  'chrome-extension:',
  'moz-extension:',
  'edge:',
  'brave:',
  'about:',
  'devtools:',
  'view-source:',
  'resource:',
]);

const BLANK_URLS = new Set([
  '',
  'about:blank',
  'about:newtab',
  'about:home',
  'chrome://newtab/',
  'chrome://newtab',
  'chrome-search://local-ntp/local-ntp.html',
  'edge://newtab/',
  'edge://newtab',
  'brave://newtab/',
]);

export function isBlankUrl(raw: string): boolean {
  const value = raw.trim();
  return BLANK_URLS.has(value) || value === 'chrome://startpage/';
}

/**
 * Chrome match-pattern → RegExp. Invalid patterns return null and are ignored.
 * Supports `<all_urls>`, `*://host/*`, `https://example.com/path*`.
 */
export function matchPatternToRegExp(pattern: string): RegExp | null {
  let value = pattern.trim();
  if (!value || /\s/.test(value)) return null;
  if (value === '<all_urls>') return /^(https?|ftp|file):\/\//i;
  // Accept bare hosts and globs the way people type them: example.com, *.example.com
  if (!value.includes('://')) value = `*://${value}`;
  if (!value.slice(value.indexOf('://') + 3).includes('/')) value += '/*';

  const match = /^(\*|https?|ftp|file):\/\/([^/]*)(\/.*)?$/i.exec(value);
  if (!match) return null;
  const [, scheme, host, path = '/*'] = match;
  if (host === undefined) return null;

  const schemePart = scheme === '*' ? '(?:https?)' : escapeRegExp(scheme ?? '');
  let hostPart: string;
  if (host === '*') hostPart = '[^/]+';
  else if (host.startsWith('*.')) hostPart = `(?:[^/]+\\.)?${escapeRegExp(host.slice(2))}`;
  else hostPart = escapeRegExp(host);

  const pathPart = escapeRegExp(path).replaceAll('\\*', '.*');
  return new RegExp(`^${schemePart}://${hostPart}${pathPart}$`, 'i');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function compileIgnoredSites(patterns: readonly string[]): RegExp[] {
  const compiled: RegExp[] = [];
  for (const pattern of patterns) {
    const regex = matchPatternToRegExp(pattern);
    if (regex) compiled.push(regex);
  }
  return compiled;
}

export function classify(
  tabs: readonly TabCandidate[],
  settings: IgnoreSettings,
  ctx: ClassifyContext,
): ClassifyResult {
  const eligible: TabCandidate[] = [];
  const skipped: SkipCounts = {};
  const ignored = compileIgnoredSites(settings.ignoredSites);
  const libraryBase = ctx.libraryUrl.split('#')[0] ?? ctx.libraryUrl;

  const skip = (reason: SkipReason) => {
    skipped[reason] = (skipped[reason] ?? 0) + 1;
  };

  for (const tab of tabs) {
    const raw = tab.url.trim();

    if (isBlankUrl(raw)) {
      skip('blank');
      continue;
    }

    let protocol = '';
    try {
      protocol = new URL(raw).protocol;
    } catch {
      protocol = '';
    }

    if (raw === libraryBase || raw.startsWith(`${libraryBase}#`)) {
      skip('library');
      continue;
    }

    if (INTERNAL_SCHEMES.has(protocol)) {
      skip('internal-scheme');
      continue;
    }

    if (tab.pinned && settings.ignorePinnedTabs) {
      skip('pinned');
      continue;
    }

    if (tab.incognito && !settings.stowIncognito) {
      skip('incognito');
      continue;
    }

    if (ignored.some((regex) => regex.test(raw))) {
      skip('ignored-site');
      continue;
    }

    if (tab.windowType !== 'normal') {
      skip('window-type');
      continue;
    }

    if (isOversizedUrl(raw)) {
      skip('oversized-url');
      continue;
    }

    eligible.push(tab);
  }

  return { eligible, skipped };
}
