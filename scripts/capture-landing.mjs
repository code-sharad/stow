import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const extensionPath = path.join(root, '.output/chrome-mv3');
const out = path.join(root, 'landing/assets');
mkdirSync(out, { recursive: true });

const browser = await chromium.launchPersistentContext(`/tmp/stow-landing-${Date.now()}`, {
  headless: false,
  executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  viewport: { width: 1600, height: 1000 },
  colorScheme: 'dark',
});

const worker = browser.serviceWorkers()[0] ?? (await browser.waitForEvent('serviceworker'));
const id = new URL(worker.url()).host;
const page = await browser.newPage();

await worker.evaluate(async () => {
  const win = await chrome.windows.getCurrent();

  const groups = [
    {
      title: 'Docs',
      color: 'blue',
      tabs: [
        ['https://developer.chrome.com/docs/extensions', 'Chrome Extensions documentation'],
        ['https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API', 'IndexedDB API'],
        ['https://web.dev/articles/bfcache', 'Back/forward cache'],
        ['https://developer.chrome.com/docs/webstore', 'Chrome Web Store'],
      ],
    },
    {
      title: 'Design',
      color: 'purple',
      tabs: [
        ['https://www.figma.com/', 'Figma'],
        ['https://fonts.google.com/specimen/Inter', 'Inter'],
        ['https://www.w3.org/WAI/WCAG22/quickref/', 'WCAG 2.2 Quick Reference'],
      ],
    },
    {
      title: 'Build',
      color: 'green',
      tabs: [
        ['https://github.com/microsoft/playwright', 'Playwright'],
        ['https://dexie.org/', 'Dexie.js'],
        ['https://zod.dev/', 'Zod'],
        ['https://www.electronjs.org/', 'Electron'],
      ],
    },
  ];

  for (const group of groups) {
    const ids = [];
    for (const [url] of group.tabs) {
      const tab = await chrome.tabs.create({ url, active: false });
      if (tab.id !== undefined) ids.push(tab.id);
    }
    const groupId = await chrome.tabs.group({
      tabIds: ids,
      createProperties: { windowId: win.id },
    });
    await chrome.tabGroups.update(groupId, { title: group.title, color: group.color });
  }
});

await new Promise((resolve) => setTimeout(resolve, 4500));

await page.goto(`chrome-extension://${id}/library.html#/`);
await page.waitForSelector('.topbar');
await page
  .getByRole('banner')
  .getByRole('button', { name: /stow this window/i })
  .click();
await page.waitForSelector('.tab-row');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

const shoot = async (name, width, height, scheme) => {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ colorScheme: scheme });
  await page.reload();
  await page.waitForSelector('.tab-row');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const png = path.join(out, `${name}.png`);
  await page.screenshot({ path: png });
  execFileSync('magick', [png, '-quality', '88', path.join(out, `${name}.webp`)]);
  execFileSync('rm', [png]);
  console.log(`landing/assets/${name}.webp`);
};

await shoot('library-dark', 1600, 1000, 'dark');
await shoot('library-light', 1600, 1000, 'light');
await shoot('library-mobile-dark', 750, 1000, 'dark');
await shoot('library-mobile-light', 750, 1000, 'light');

await browser.close();
