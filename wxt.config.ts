import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    minimum_chrome_version: '123',
    permissions: [
      'tabs',
      'tabGroups',
      'storage',
      'unlimitedStorage',
      'contextMenus',
      'favicon',
      'alarms',
    ],
    optional_permissions: ['downloads'],
    action: {
      default_title: '__MSG_actionTitle__',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
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
  },
});
