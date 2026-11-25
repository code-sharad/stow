import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const extensionPath = path.join(root, '.output/chrome-mv3');
const out = path.join(root, 'landing/assets');
mkdirSync(out, { recursive: true });

const profile = `/tmp/stow-landing-${Date.now()}`;
const browser = await chromium.launchPersistentContext(profile, {
  headless: false,
  executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  viewport: { width: 1600, height: 1000 },
  colorScheme: 'dark',
});

const worker = browser.serviceWorkers()[0] ?? (await browser.waitForEvent('serviceworker'));
const id = new URL(worker.url()).host;
const page = await browser.newPage();
const libraryUrl = `chrome-extension://${id}/library.html#/`;
const popupUrl = `chrome-extension://${id}/popup.html`;

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

await page.goto(libraryUrl);
await page.waitForSelector('.topbar');
await page
  .getByRole('banner')
  .getByRole('button', { name: /stow this window/i })
  .click();
await page.waitForSelector('.tab-row');
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

const save = async (name, buffer) => {
  const png = path.join(out, `${name}.png`);
  writeFileSync(png, buffer);
  execFileSync('magick', [png, '-quality', '82', path.join(out, `${name}.webp`)]);
  rmSync(png);
  const dims = execFileSync('identify', ['-format', '%wx%h', path.join(out, `${name}.webp`)], {
    encoding: 'utf8',
  });
  console.log(`landing/assets/${name}.webp  ${dims}`);
};

const openLibrary = async (width, height, scheme) => {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto(libraryUrl);
  await page.reload();
  await page.waitForSelector('.tab-row');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
};

const shootLibrary = async (name, width, height, scheme) => {
  await openLibrary(width, height, scheme);
  await save(name, await page.screenshot());
};

await shootLibrary('library-dark', 1440, 900, 'dark');
await shootLibrary('library-light', 1440, 900, 'light');
await shootLibrary('library-mobile-dark', 390, 844, 'dark');
await shootLibrary('library-mobile-light', 390, 844, 'light');

const shootSearch = async (name, width, height, scheme) => {
  await openLibrary(width, height, scheme);
  await page.locator('.search-input').fill('web');
  await page.waitForTimeout(800);
  await save(name, await page.screenshot());
};

await shootSearch('search-step-dark', 720, 520, 'dark');
await shootSearch('search-step-light', 720, 520, 'light');
await shootSearch('search-mobile-dark', 390, 844, 'dark');
await shootSearch('search-mobile-light', 390, 844, 'light');

const shootRestore = async (name, width, height, scheme) => {
  await openLibrary(width, height, scheme);
  await page.locator('.tab-row input[type=checkbox]').first().check();
  await page.waitForSelector('.bulk-bar');
  await page.waitForTimeout(300);
  await save(name, await page.screenshot());
};

await shootRestore('restore-step-dark', 720, 520, 'dark');
await shootRestore('restore-step-light', 720, 520, 'light');
await shootRestore('restore-mobile-dark', 390, 844, 'dark');
await shootRestore('restore-mobile-light', 390, 844, 'light');

await worker.evaluate(async () => {
  const win = await chrome.windows.getCurrent();
  for (let index = 0; index < 7; index += 1) {
    await chrome.tabs.create({
      url: `https://example.com/?tab=${index + 1}`,
      active: false,
      windowId: win.id,
    });
  }
});

await page.setViewportSize({ width: 360, height: 800 });
await page.emulateMedia({ colorScheme: 'dark' });
await page.goto(popupUrl);
await page.waitForSelector('.popup-action');
await page.evaluate(() => document.fonts.ready);
console.log(
  'popup actions:',
  (await page.locator('.popup-actions').textContent())?.replace(/\n/g, ' | '),
);
await save('popup-dark', await page.locator('.popup').screenshot());

await page.emulateMedia({ colorScheme: 'light' });
await page.reload();
await page.waitForSelector('.popup-action');
await page.evaluate(() => document.fonts.ready);
await save('popup-light', await page.locator('.popup').screenshot());

for (const stale of [
  'lead-dark.webp',
  'lead-light.webp',
  'lead-compact-dark.webp',
  'lead-compact-light.webp',
  'groups-dark.webp',
  'groups-light.webp',
  'groups-compact-dark.webp',
  'groups-compact-light.webp',
  'undo-dark.webp',
  'undo-light.webp',
  'import-dark.webp',
  'import-light.webp',
  'search-dark.webp',
  'search-light.webp',
  'restore-dark.webp',
  'restore-light.webp',
]) {
  rmSync(path.join(out, stale), { force: true });
}

await browser.close();
rmSync(profile, { recursive: true, force: true });
