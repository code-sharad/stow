import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type UserManifest } from 'wxt';

/**
 * AMO identity for the Firefox build. Changing it breaks signed updates, so it
 * is fixed here rather than derived from the package name.
 */
const GECKO_ID = 'stow-tabs@code-sharad.github.io';

/**
 * `favicon` is a Chromium-only permission; Firefox has no `_favicon/` endpoint
 * and the AMO validator rejects the key.
 */
const PERMISSIONS = [
  'tabs',
  'tabGroups',
  'storage',
  'unlimitedStorage',
  'contextMenus',
  'favicon',
  'alarms',
];

const firefoxManifest = {
  browser_specific_settings: {
    gecko: {
      id: GECKO_ID,
      // First release with the data collection consent schema in the manifest.
      strict_min_version: '140.0',
      data_collection_permissions: { required: ['none'] },
    },
    // Android learned the consent schema two releases after desktop, so the
    // desktop 140 floor cannot be reused there.
    gecko_android: {
      strict_min_version: '142.0',
    },
  },
} satisfies UserManifest;

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  zip: {
    // Test coverage is not build input. Excluding it keeps the AMO sources
    // archive to what a reviewer actually needs to reproduce the build.
    excludeSources: ['coverage/**'],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    ...(browser === 'firefox' ? firefoxManifest : { minimum_chrome_version: '123' }),
    permissions:
      browser === 'firefox'
        ? PERMISSIONS.filter((permission) => permission !== 'favicon')
        : PERMISSIONS,
    optional_permissions: ['downloads'],
    action: {
      default_title: '__MSG_actionTitle__',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
        64: 'icon/64.png',
        128: 'icon/128.png',
      },
    },
    commands: {
      'stow-window': {
        suggested_key: { default: 'Alt+Shift+S' },
        description: '__MSG_cmdStowWindow__',
      },
      'stow-tab': {
        suggested_key: { default: 'Alt+Shift+T' },
        description: '__MSG_cmdStowTab__',
      },
      'open-library': {
        suggested_key: { default: 'Alt+Shift+L' },
        description: '__MSG_cmdOpenLibrary__',
      },
      'stow-all-windows': { description: '__MSG_cmdStowAll__' },
    },
    incognito: 'spanning',
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  }),
});
