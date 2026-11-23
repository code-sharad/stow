import path from 'node:path';
import {
  type BrowserContext,
  chromium,
  expect,
  type Page,
  test,
  type Worker,
} from '@playwright/test';

const extensionPath = path.resolve(process.cwd(), '.output/chrome-mv3');

let context: BrowserContext;
let worker: Worker;
let extensionId: string;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext(`/tmp/stow-e2e-${Date.now()}`, {
    headless: false,
    executablePath: process.env.CI ? undefined : '/usr/bin/chromium',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
    viewport: { width: 1280, height: 900 },
  });
  worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  extensionId = new URL(worker.url()).host;
});

test.beforeEach(async () => {
  await worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({});
    const removable = tabs.filter((tab) => /^https?:/.test(tab.url ?? '')).map((tab) => tab.id);
    if (removable.length)
      await chrome.tabs.remove(removable.filter((id): id is number => id !== undefined));
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('stow');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const database = open.result;
        const tx = database.transaction(['stacks', 'tabs', 'ops', 'meta'], 'readwrite');
        for (const name of ['stacks', 'tabs', 'ops', 'meta']) tx.objectStore(name).clear();
        tx.oncomplete = () => {
          database.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
});

test.afterAll(async () => {
  await context?.close();
});

async function library(): Promise<Page> {
  const page = await context.newPage();
  page.on('pageerror', (error) => console.log('PAGE ERROR', error.message));
  await page.goto(`chrome-extension://${extensionId}/library.html#/`);
  await page.waitForSelector('.rail');
  return page;
}

async function makeTabs(): Promise<void> {
  await worker.evaluate(async () => {
    await chrome.tabs.create({ url: 'https://example.com/one', active: false });
    await chrome.tabs.create({ url: 'https://example.org/two?utm_source=x', active: false });
    await chrome.tabs.create({ url: 'https://example.net/three', active: false });
  });
  await new Promise((resolve) => setTimeout(resolve, 800));
}

async function stow(page: Page): Promise<void> {
  await page
    .getByRole('banner')
    .getByRole('button', { name: /stow this window/i })
    .click();
  await expect(page.locator('.tab-row')).toHaveCount(3);
}

test('stows a window, shows the list, and restores it', async () => {
  const page = await library();
  await makeTabs();
  await stow(page);

  await expect(page.locator('.stack-head')).toHaveCount(1);
  await expect(page.locator('.tab-row')).toHaveCount(3);
  await page.getByRole('button', { name: /restore all/i }).click();
  await expect(page.locator('.stack-head')).toHaveCount(0);

  await expect
    .poll(() => worker.evaluate(() => chrome.tabs.query({}).then((tabs) => tabs.length)), {
      timeout: 10_000,
    })
    .toBeGreaterThanOrEqual(5);
  await page.close();
});

test('searches tabs and persists appearance settings', async () => {
  const page = await library();
  await makeTabs();
  await stow(page);

  const search = page.getByPlaceholder(/search/i).first();
  await search.fill('org');
  await expect(page.locator('.tab-row')).toHaveCount(1);
  await expect(page.locator('.tab-row')).toContainText('example.org');
  await search.fill('');

  await page.goto(`chrome-extension://${extensionId}/library.html#/settings`);
  await page.locator('#theme').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('#density').selectOption('compact');
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  await page.close();
});

test('rebinds the toolbar popup as soon as the click setting changes', async () => {
  const page = await library();
  await page.goto(`chrome-extension://${extensionId}/library.html#/settings`);
  const toolbar = page.locator('#toolbar');

  await toolbar.selectOption('popup');
  await expect
    .poll(() => worker.evaluate(() => chrome.action.getPopup({})))
    .toMatch(/\/popup\.html$/);

  await toolbar.selectOption('stow-window');
  await expect.poll(() => worker.evaluate(() => chrome.action.getPopup({}))).toBe('');
  await page.close();
});

test('moves a list to Trash and restores it', async () => {
  const page = await library();
  await makeTabs();
  await stow(page);

  await page
    .locator('.stack-head')
    .getByRole('button', { name: /more actions/i })
    .click();
  await page.getByRole('menuitem', { name: /delete list/i }).click();
  await expect(page.locator('.stack-head')).toHaveCount(0);

  await page.getByRole('button', { name: /^trash/i }).click();
  await expect(page.locator('.trash-group')).toHaveCount(1);
  await page.getByRole('button', { name: /restore/i }).click();
  await expect(page.locator('.trash-group')).toHaveCount(0);

  await page.getByRole('button', { name: /all tabs/i }).click();
  await expect(page.locator('.stack-head')).toHaveCount(1);
  await page.close();
});

test('imports a JSON backup from Settings', async () => {
  const page = await library();
  await page.goto(`chrome-extension://${extensionId}/library.html#/settings`);
  await page.locator('input[type=file]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        app: 'stow',
        formatVersion: 1,
        stacks: [
          {
            title: 'Imported',
            tabs: [
              { url: 'https://import.example/one', title: 'One' },
              { url: 'https://import.example/two', title: 'Two' },
            ],
          },
        ],
      }),
    ),
  });
  await expect(page.getByText(/imported 2 tabs/i)).toBeVisible();
  await page.getByRole('button', { name: /^all tabs/i }).click();
  await expect(page.locator('.stack-head')).toHaveCount(1);
  await expect(page.locator('.tab-row')).toHaveCount(2);
  await page.close();
});

test('library, settings, and popup have no serious accessibility violations', async () => {
  const page = await library();
  const AxeBuilder = (await import('@axe-core/playwright')).default;
  for (const theme of ['light', 'dark']) {
    for (const hash of ['#/', '#/settings', '#/trash']) {
      await page.goto(`chrome-extension://${extensionId}/library.html${hash}`);
      await page.waitForTimeout(150);
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      );
      expect(serious, `${theme} ${hash}: ${serious.map((v) => v.id).join(', ')}`).toEqual([]);
    }
  }
  for (const theme of ['light', 'dark']) {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForTimeout(150);
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    const popup = await new AxeBuilder({ page }).analyze();
    expect(
      popup.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      ),
      `${theme} popup`,
    ).toEqual([]);
  }
  await page.close();
});
