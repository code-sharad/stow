/** Shared, framework-free constants. */

export const BRAND = {
  name: 'Stow',
  tagline: 'Close the clutter. Keep the tabs.',
} as const;

export const BADGE_COLORS = { background: '#1B6B52', text: '#FFFFFF' } as const;

export const SCHEMA_VERSION = 1;
export const URL_KEY_ALGO = 1;

export const LIMITS = {
  url: 32_768,
  title: 2_000,
  stackTitle: 200,
  importBytes: 100 * 1024 * 1024,
  importTabs: 200_000,
  favicon: 65_536,
} as const;

export const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'ftp:', 'file:']);

export const TRACKING_PARAMS = [
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'yclid',
  '_hsenc',
  '_hsmi',
  'ref_src',
] as const;

export const SKIP_REASON_LABEL: Record<string, string> = {
  'internal-scheme': 'internal pages',
  library: 'the Library',
  blank: 'blank pages',
  pinned: 'pinned tabs',
  incognito: 'private tabs',
  'ignored-site': 'ignored sites',
  'window-type': 'popups and app windows',
  'oversized-url': 'oversized links',
};

export const BATCH_CLOSE = 50;
export const BATCH_RESTORE = 8;
