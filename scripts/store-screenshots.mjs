import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';

const output = 'docs/store-screenshots';
const fixture = 'http://127.0.0.1:4173';
const viewport = { width: 1280, height: 800 };

const pages = {
  '/design-one': 'Spacing systems that scale',
  '/design-two': 'Typography for dense interfaces',
  '/design-three': 'Colour contrast without guessing',
  '/read-one': 'The quiet web',
  '/read-two': 'Notes on building small tools',
  '/alpha-one': 'Alpha — design doc',
  '/alpha-two': 'Alpha — pull requests',
  '/one': 'One',
  '/two': 'Two',
  '/three': 'Three',
};

const server = createServer((request, response) => {
  const title = pages[new URL(request.url ?? '/', fixture).pathname] ?? 'Fixture';
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(
    `<!doctype html><html><head><title>${title}</title></head><body><h1>${title}</h1></body></html>`,
  );
});

const settings = {
  toolbarClick: 'popup',
  afterStow: 'stay',
  ignorePinnedTabs: true,
  stowIncognito: false,
  preserveBrowserGroups: true,
  ignoredSites: [],
  dedupe: 'global',
  stripTrackingForDedupe: true,
  restoreTarget: 'current-window',
  removeOnRestore: true,
  restorePinned: true,
  restoreGroups: true,
  openLibraryOnStartup: false,
  pinLibraryTab: false,
  theme: 'dark',
  density: 'comfortable',
  showFavicons: true,
  trashRetentionDays: 30,
  autoBackup: 'off',
};

const stacks = [
  {
    title: 'Design references',
    orderKey: 'a1',
    pinned: true,
    locked: false,
    collapsed: false,
    color: 'blue',
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    tabs: [
      {
        url: `${fixture}/design-one`,
        title: 'Spacing systems that scale',
        orderKey: 'a1',
        wasPinned: false,
        createdAt: 1_700_000_000_000,
      },
      {
        url: `${fixture}/design-two`,
        title: 'Typography for dense interfaces',
        orderKey: 'a2',
        wasPinned: false,
        createdAt: 1_700_000_000_000,
      },
      {
        url: `${fixture}/design-three`,
        title: 'Colour contrast without guessing',
        orderKey: 'a3',
        wasPinned: false,
        createdAt: 1_700_000_000_000,
      },
    ],
  },
  {
    title: 'Weekend reading',
    orderKey: 'a2',
    pinned: false,
    locked: false,
    collapsed: false,
    color: 'purple',
    createdAt: 1_700_000_100_000,
    updatedAt: 1_700_000_100_000,
    tabs: [
      {
        url: `${fixture}/read-one`,
        title: 'The quiet web',
        orderKey: 'b1',
        wasPinned: false,
        createdAt: 1_700_000_100_000,
      },
      {
        url: `${fixture}/read-two`,
        title: 'Notes on building small tools',
        orderKey: 'b2',
        wasPinned: false,
        createdAt: 1_700_000_100_000,
      },
    ],
  },
  {
    title: 'Project alpha',
    orderKey: 'a3',
    pinned: false,
    locked: true,
    collapsed: false,
    color: 'green',
    createdAt: 1_700_000_200_000,
    updatedAt: 1_700_000_200_000,
    tabs: [
      {
        url: `${fixture}/alpha-one`,
        title: 'Alpha — design doc',
        orderKey: 'c1',
        wasPinned: true,
        createdAt: 1_700_000_200_000,
      },
      {
        url: `${fixture}/alpha-two`,
        title: 'Alpha — pull requests',
        orderKey: 'c2',
        wasPinned: false,
        createdAt: 1_700_000_200_000,
      },
    ],
  },
];

const backup = {
  app: 'stow',
  formatVersion: 2,
  exportedAt: new Date().toISOString(),
  settings,
  stacks,
};

async function main() {
  await mkdir(output, { recursive: true });
  await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));
  const browser = await chromium.launchPersistentContext('', {
    executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
    headless: false,
    viewport,
    args: [
      `--disable-extensions-except=${process.cwd()}/.output/chrome-mv3`,
      `--load-extension=${process.cwd()}/.output/chrome-mv3`,
    ],
  });
  try {
    const worker = browser.serviceWorkers()[0] ?? (await browser.waitForEvent('serviceworker'));
    const extensionId = new URL(worker.url()).host;
    await worker.evaluate((value) => chrome.storage.local.set({ settings: value }), settings);
    const page = await browser.newPage();
    await page.setViewportSize(viewport);
    const base = `chrome-extension://${extensionId}/library.html`;

    await page.goto(`${base}#/welcome`);
    await page.locator('.welcome h1').waitFor();
    await page.screenshot({ path: `${output}/1-welcome.png` });

    await page.goto(`${base}#/settings`);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'stow-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    const apply = page.getByRole('button', { name: 'Apply' });
    await apply.waitFor();
    await apply.click();
    await page.goto(`${base}#/`);
    await page.waitForFunction(() => document.querySelectorAll('.stack-head').length === 3);
    await page.screenshot({ path: `${output}/2-library.png` });

    await page.locator('.search-input').fill('design');
    await page.waitForFunction(() => document.querySelectorAll('.tab-row').length > 0);
    await page.screenshot({ path: `${output}/3-search.png` });

    await page.locator('.search-input').fill('');
    for (const path of ['/one', '/two', '/three']) {
      const tab = await browser.newPage();
      await tab.goto(`${fixture}${path}`);
    }
    await page.bringToFront();
    await page.getByRole('button', { name: 'Stow this window' }).click();
    await page.locator('.toast').first().waitFor();
    await page.screenshot({ path: `${output}/4-stow-toast.png` });

    await page.goto(`${base}#/settings`);
    await page.locator('.settings-page, main').first().waitFor();
    await page.screenshot({ path: `${output}/5-settings.png` });

    console.log(`Wrote five screenshots to ${output}/`);
    const listing = await readFile('docs/STORE_LISTING.md', 'utf8');
    if (!listing.includes('1280×800')) throw new Error('STORE_LISTING screenshot section drifted');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
