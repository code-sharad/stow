import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../settings/schema';
import {
  detectFormat,
  parseFullBackup,
  parseImport,
  parseMarkdown,
  parseNetscapeHtml,
  parseOneTabText,
  parseStowJson,
  serializeFullBackup,
  serializeMarkdown,
  serializeNetscapeHtml,
  serializeOneTabText,
  serializeStowJson,
} from './formats';

describe('OneTab text', () => {
  it('preserves order, titles and blank-line stack boundaries', () => {
    const result = parseOneTabText(
      '# Work\nhttps://a.example/1 | First\nhttps://b.example/2\n\nhttps://c.example/3 | Third',
    );
    expect(result.stacks).toHaveLength(2);
    expect(result.stacks[0]?.title).toBe('Work');
    expect(result.stacks[0]?.tabs.map((tab) => tab.url)).toEqual([
      'https://a.example/1',
      'https://b.example/2',
    ]);
    expect(result.stacks[1]?.tabs[0]).toEqual({ url: 'https://c.example/3', title: 'Third' });
  });

  it('skips invalid URLs and disallowed schemes with line numbers', () => {
    const result = parseOneTabText('javascript:alert(1)\nnot a url\nhttps://ok.example/');
    expect(result.skipped.map((issue) => issue.reason)).toEqual(['scheme', 'url']);
    expect(result.stacks[0]?.tabs).toHaveLength(1);
  });

  it('round-trips through the serializer', () => {
    const source = [
      { title: 'One', tabs: [{ url: 'https://one.example/', title: 'One | tab' }] },
      { title: 'Two', tabs: [{ url: 'https://two.example/', title: '' }] },
    ];
    const parsed = parseOneTabText(serializeOneTabText(source, true));
    expect(parsed.stacks).toEqual(source);
  });
});

describe('Markdown', () => {
  it('parses headings and links, skipping unsafe links', () => {
    const result = parseMarkdown(
      '## Reading\n- [Article](https://example.com/a)\n- [Bad](javascript:alert(1))\n\n## Empty',
    );
    expect(result.stacks).toHaveLength(1);
    expect(result.stacks[0]?.tabs).toEqual([{ url: 'https://example.com/a', title: 'Article' }]);
    expect(result.skipped[0]?.reason).toBe('scheme');
  });

  it('escapes titles when serializing', () => {
    const text = serializeMarkdown([
      { title: 'A [bracket]', tabs: [{ url: 'https://example.com/a_(b)', title: 'x [y]' }] },
    ]);
    expect(text).toContain('## A \\[bracket\\]');
    expect(text).toContain('- [x \\[y\\]](https://example.com/a_(b))');
  });

  it('round-trips escaped titles and balanced parentheses in URLs', () => {
    const source = [
      {
        title: 'A [bracket] \\ backslash',
        tabs: [{ url: 'https://example.com/a_(b)/c_(d)', title: 'x [y] (z) \\ w' }],
      },
    ];
    expect(parseMarkdown(serializeMarkdown(source)).stacks).toEqual(source);
  });
});

describe('Netscape HTML', () => {
  const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
  <DT><H3>Folder</H3>
  <DL><p>
    <DT><A HREF="https://example.com/a">Alpha</A>
    <DT><A HREF="https://example.org/b">Beta</A>
  </DL><p>
  <DT><A HREF="https://unfiled.example/">Loose</A>
</DL><p>`;

  it('maps folders to stacks and ignores junk', () => {
    const result = parseNetscapeHtml(html);
    expect(result.stacks).toHaveLength(2);
    expect(result.stacks[0]?.title).toBe('Folder');
    expect(result.stacks[0]?.tabs.map((tab) => tab.title)).toEqual(['Alpha', 'Beta']);
    expect(result.stacks[1]?.tabs[0]?.url).toBe('https://unfiled.example/');
  });

  it('round-trips folders and links', () => {
    const parsed = parseNetscapeHtml(
      serializeNetscapeHtml([
        { title: 'Folder & more', tabs: [{ url: 'https://example.com/?a=1&b=2', title: 'A & B' }] },
      ]),
    );
    expect(parsed.stacks[0]?.title).toBe('Folder & more');
    expect(parsed.stacks[0]?.tabs[0]?.url).toBe('https://example.com/?a=1&b=2');
  });
});

describe('Stow JSON', () => {
  it('round-trips losslessly and refuses future versions', () => {
    const stacks = [
      { title: 'One', createdAt: 123, tabs: [{ url: 'https://example.com/', title: 'X' }] },
    ];
    const parsed = parseStowJson(serializeStowJson(stacks, 456));
    expect(parsed.stacks).toEqual(stacks);
    expect(() => parseStowJson('{"formatVersion":2,"stacks":[]}')).toThrow('future-version');
  });

  it('rejects malformed payloads and unsafe tabs', () => {
    expect(() => parseStowJson('not json')).toThrow('invalid-json');
    const parsed = parseStowJson(
      '{"stacks":[{"title":"x","tabs":[{"url":"chrome://settings"},{"url":"https://ok.example"}]}]}',
    );
    expect(parsed.stacks[0]?.tabs).toHaveLength(1);
    expect(parsed.skipped[0]?.reason).toBe('scheme');
  });
});

describe('detectFormat / parseImport', () => {
  it('detects every supported format', () => {
    expect(detectFormat('{"app":"stow","stacks":[]}')).toBe('json');
    expect(detectFormat('<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><p>')).toBe('html');
    expect(detectFormat('## Heading\n- [A](https://a.example)')).toBe('markdown');
    expect(detectFormat('https://a.example | A')).toBe('onetab');
    expect(parseImport('https://a.example | A').format).toBe('onetab');
  });

  it('detects a titled OneTab export as OneTab, not Markdown', () => {
    const text = serializeOneTabText(
      [{ title: 'Work', tabs: [{ url: 'https://a.example', title: 'A' }] }],
      true,
    );
    expect(detectFormat(text)).toBe('onetab');
    expect(parseImport(text).stacks[0]?.title).toBe('Work');
  });

  it('detects a Markdown document with a heading and no links as Markdown', () => {
    expect(detectFormat('## Notes\n\nSome prose.')).toBe('markdown');
  });

  it('round-trips a full v2 backup through serialize and parse', () => {
    const backup = {
      app: 'stow' as const,
      formatVersion: 2 as const,
      exportedAt: '2026-01-01T00:00:00.000Z',
      settings: { ...DEFAULT_SETTINGS },
      stacks: [
        {
          title: 'One',
          orderKey: 'a1',
          pinned: true,
          locked: true,
          collapsed: true,
          color: 'blue' as const,
          createdAt: 1,
          updatedAt: 2,
          tabs: [
            {
              url: 'https://example.com/',
              title: 'X',
              orderKey: 'a1',
              wasPinned: true,
              createdAt: 1,
              favicon: 'data:image/png;base64,AA==',
            },
          ],
        },
      ],
    };
    const parsed = parseImport(serializeFullBackup(backup));
    expect(parsed.backup).toEqual(backup);
    expect(parsed.format).toBe('json');
  });

  it('fails closed on unknown fields and future versions', () => {
    const base = {
      app: 'stow',
      formatVersion: 2,
      exportedAt: 'x',
      settings: { ...DEFAULT_SETTINGS },
      stacks: [],
    };
    expect(() => parseFullBackup(JSON.stringify({ ...base, unknown: true }))).toThrow(
      'invalid-backup',
    );
    expect(() => parseFullBackup(JSON.stringify({ ...base, formatVersion: 3 }))).toThrow(
      'future-version',
    );
  });
});
