import { describe, expect, it } from 'vitest';
import { classify, isBlankUrl, matchPatternToRegExp } from './ignore';
import type { TabCandidate } from './types';

const base: TabCandidate = {
  id: 1,
  windowId: 1,
  index: 0,
  url: 'https://example.com/page',
  title: 'Page',
  pinned: false,
  incognito: false,
  groupId: -1,
  windowType: 'normal',
};

const settings = {
  ignorePinnedTabs: true,
  stowIncognito: false,
  ignoredSites: [] as string[],
};

const ctx = { libraryUrl: 'chrome-extension://abc/library.html' };

describe('classify', () => {
  it('keeps normal web tabs', () => {
    const result = classify([base], settings, ctx);
    expect(result.eligible).toHaveLength(1);
    expect(result.skipped).toEqual({});
  });

  it('skips internal, blank, library, pinned, and incognito tabs', () => {
    const tabs: TabCandidate[] = [
      { ...base, id: 1, url: 'chrome://settings' },
      { ...base, id: 2, url: 'about:blank' },
      { ...base, id: 3, url: 'chrome-extension://abc/library.html#/trash' },
      { ...base, id: 4, pinned: true },
      { ...base, id: 5, incognito: true },
    ];
    const result = classify(tabs, settings, ctx);
    expect(result.eligible).toHaveLength(0);
    expect(result.skipped).toMatchObject({
      'internal-scheme': 1,
      blank: 1,
      library: 1,
      pinned: 1,
      incognito: 1,
    });
  });

  it('honors ignored site match patterns', () => {
    const result = classify([base], { ...settings, ignoredSites: ['*.example.com/*'] }, ctx);
    expect(result.skipped['ignored-site']).toBe(1);
  });

  it('skips non-normal windows and oversized urls', () => {
    const result = classify(
      [
        { ...base, id: 1, windowType: 'popup' },
        { ...base, id: 2, url: `https://example.com/${'x'.repeat(33_000)}` },
      ],
      settings,
      ctx,
    );
    expect(result.skipped['window-type']).toBe(1);
    expect(result.skipped['oversized-url']).toBe(1);
  });

  it('respects pinned and incognito settings when disabled', () => {
    const result = classify(
      [
        { ...base, pinned: true },
        { ...base, id: 2, incognito: true },
      ],
      { ...settings, ignorePinnedTabs: false, stowIncognito: true },
      ctx,
    );
    expect(result.eligible).toHaveLength(2);
  });
});

describe('matchPatternToRegExp', () => {
  it('supports all urls, wildcard hosts, and paths', () => {
    expect(matchPatternToRegExp('<all_urls>')?.test('https://a.test/x')).toBe(true);
    expect(matchPatternToRegExp('*://example.com/*')?.test('https://example.com/a')).toBe(true);
    expect(matchPatternToRegExp('*://*.example.com/*')?.test('https://deep.example.com/a')).toBe(
      true,
    );
    expect(
      matchPatternToRegExp('https://example.com/docs*')?.test('https://example.com/docs/a'),
    ).toBe(true);
    expect(
      matchPatternToRegExp('https://example.com/docs*')?.test('https://example.com/other'),
    ).toBe(false);
    expect(matchPatternToRegExp('not a pattern')).toBeNull();
  });

  it('detects blank urls', () => {
    expect(isBlankUrl('about:newtab')).toBe(true);
    expect(isBlankUrl('https://example.com')).toBe(false);
  });
});
