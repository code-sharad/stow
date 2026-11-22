import { ALLOWED_SCHEMES, LIMITS, TRACKING_PARAMS } from '../../shared/constants';
import type { SavedTab } from './types';

const TRACKING = new Set<string>(TRACKING_PARAMS);

/**
 * Derived comparison key. The original URL is never rewritten (invariant 6).
 * Idempotent and total: an unparseable URL falls back to its trimmed text.
 */
export function normalizeUrlKey(raw: string, stripTracking = true): string {
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return trimmed;
  }

  const hash = url.hash;
  // Keep client-side route fragments; drop anchors.
  if (!(hash.startsWith('#/') || hash.startsWith('#!'))) url.hash = '';

  if (stripTracking) {
    const kept: Array<[string, string]> = [];
    for (const [key, value] of url.searchParams.entries()) {
      if (key.startsWith('utm_') || TRACKING.has(key.toLowerCase())) continue;
      kept.push([key, value]);
    }
    kept.sort((a, b) => (a[0] === b[0] ? cmp(a[1], b[1]) : cmp(a[0], b[0])));
    url.search = '';
    for (const [key, value] of kept) url.searchParams.append(key, value);
  }

  const path = url.pathname;
  if (path !== '/' && path.endsWith('/')) url.pathname = path.slice(0, -1);
  return url.toString();
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isAllowedScheme(raw: string): boolean {
  try {
    return ALLOWED_SCHEMES.has(new URL(raw.trim()).protocol);
  } catch {
    return false;
  }
}

export function isOversizedUrl(raw: string): boolean {
  return raw.length > LIMITS.url;
}

export function hostOf(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function safeHref(raw: string): string | null {
  return isAllowedScheme(raw) ? raw : null;
}

export function urlKeyOf(tab: Pick<SavedTab, 'url'>): string {
  return normalizeUrlKey(tab.url);
}
