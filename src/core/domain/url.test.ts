import { describe, expect, it } from 'vitest';
import { LIMITS } from '../../shared/constants';
import {
  hostOf,
  isAllowedScheme,
  isOversizedUrl,
  normalizeUrlKey,
  safeHref,
  sanitizeFaviconUrl,
} from './url';

describe('normalizeUrlKey', () => {
  it('keeps the original URL untouched but normalizes comparison key', () => {
    expect(normalizeUrlKey('https://Example.com/Path/?b=2&a=1#section')).toBe(
      'https://example.com/Path?a=1&b=2',
    );
  });

  it('keeps client-side route fragments but drops anchors', () => {
    expect(normalizeUrlKey('https://example.com/app#/users/1')).toContain('#/users/1');
    expect(normalizeUrlKey('https://example.com/app#users')).not.toContain('#');
  });

  it('strips known tracking parameters when asked', () => {
    expect(normalizeUrlKey('https://example.com/?utm_source=x&gclid=y&q=1')).toBe(
      'https://example.com/?q=1',
    );
    expect(normalizeUrlKey('https://example.com/?utm_source=x&gclid=y&q=1', false)).toContain(
      'utm_source',
    );
  });

  it('drops one trailing slash on bare paths without query or hash', () => {
    expect(normalizeUrlKey('https://example.com/docs/')).toBe('https://example.com/docs');
    expect(normalizeUrlKey('https://example.com/')).toBe('https://example.com/');
  });

  it('never treats http and https as equal, and keeps www', () => {
    expect(normalizeUrlKey('http://example.com/')).not.toBe(
      normalizeUrlKey('https://example.com/'),
    );
    expect(normalizeUrlKey('https://www.example.com/')).not.toBe(
      normalizeUrlKey('https://example.com/'),
    );
  });

  it('is idempotent and total for unparseable input', () => {
    const link = 'not a url ';
    expect(normalizeUrlKey(link)).toBe('not a url');
    const once = normalizeUrlKey('https://example.com/a/?utm_medium=x');
    expect(normalizeUrlKey(once)).toBe(once);
  });
});

describe('scheme helpers', () => {
  it('allows only safe schemes', () => {
    expect(isAllowedScheme('https://example.com')).toBe(true);
    expect(isAllowedScheme('http://example.com')).toBe(true);
    expect(isAllowedScheme('file:///tmp/a')).toBe(true);
    expect(isAllowedScheme('javascript:alert(1)')).toBe(false);
    expect(isAllowedScheme('chrome://settings')).toBe(false);
    expect(safeHref('javascript:alert(1)')).toBeNull();
  });

  it('flags oversized urls', () => {
    expect(isOversizedUrl(`https://example.com/${'a'.repeat(40_000)}`)).toBe(true);
  });

  it('extracts host labels', () => {
    expect(hostOf('https://www.example.com/a')).toBe('example.com');
    expect(hostOf('nonsense')).toBe('');
  });
});

describe('sanitizeFaviconUrl', () => {
  it('accepts https and data:image sources', () => {
    expect(sanitizeFaviconUrl(' https://example.com/icon.png ')).toBe(
      'https://example.com/icon.png',
    );
    expect(sanitizeFaviconUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
  });

  it('rejects everything a page could use to run code', () => {
    expect(sanitizeFaviconUrl('javascript:alert(1)')).toBeUndefined();
    expect(sanitizeFaviconUrl('data:text/html,<script>')).toBeUndefined();
    expect(sanitizeFaviconUrl('http://example.com/icon.png')).toBeUndefined();
    expect(sanitizeFaviconUrl(undefined)).toBeUndefined();
  });

  it('drops icons beyond the stored size cap', () => {
    expect(
      sanitizeFaviconUrl(`data:image/png;base64,${'A'.repeat(LIMITS.favicon)}`),
    ).toBeUndefined();
  });
});
