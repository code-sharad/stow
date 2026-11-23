import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const root = resolve('landing');
const port = 4178;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = normalize(join(root, relative));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': types[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
});

await new Promise((done) => server.listen(port, '127.0.0.1', done));
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
});

const failures = [];
const log = (message) => console.log(message);

try {
  for (const width of [320, 375, 640, 768, 1440]) {
    for (const scheme of ['dark', 'light']) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        colorScheme: scheme,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('requestfailed', (request) => errors.push(`failed: ${request.url()}`));

      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((done) => setTimeout(done, 60));
        }
        window.scrollTo(0, 0);
      });
      try {
        await page.waitForFunction(
          () => [...document.images].every((image) => image.complete),
          undefined,
          { timeout: 5000 },
        );
      } catch {
        errors.push('images did not finish loading');
      }

      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        h1Count: document.querySelectorAll('h1').length,
        title: document.title,
        description:
          document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
        lang: document.documentElement.lang,
        images: [...document.images].map((image) => ({
          src: image.currentSrc,
          loaded: image.complete && image.naturalWidth > 0,
        })),
        font: getComputedStyle(document.body).fontFamily,
        shots: document.querySelectorAll('.hero-shot img, .step-media img, .privacy-shot img')
          .length,
        missingAlt: [...document.images]
          .filter((image) => image.getAttribute('alt') === null)
          .map((image) => image.currentSrc || image.src),
        emptyAlt: [...document.images]
          .filter(
            (image) =>
              image.getAttribute('alt') === '' &&
              image.closest('.brand') === null &&
              image.closest('[aria-hidden="true"]') === null,
          )
          .map((image) => image.currentSrc || image.src),
        missingDims: [...document.images]
          .filter((image) => !image.getAttribute('width') || !image.getAttribute('height'))
          .map((image) => image.currentSrc || image.src),
      }));

      if (metrics.overflow > 1)
        failures.push(`${width}/${scheme}: horizontal overflow ${metrics.overflow}px`);
      if (!metrics.h1.startsWith('Fifteen tabs.'))
        failures.push(`${width}/${scheme}: missing h1`);
      if (metrics.h1Count !== 1) failures.push(`${width}/${scheme}: h1 count ${metrics.h1Count}`);
      if (metrics.title !== 'Stow — Close the tabs. Keep the work.')
        failures.push(`${width}/${scheme}: title mismatch`);
      if (
        metrics.description !==
        'Save browser tabs as searchable lists. Close the clutter, find pages later, and restore only what you need. Local-first, with no account or cloud sync.'
      )
        failures.push(`${width}/${scheme}: description mismatch`);
      if (metrics.canonical !== 'https://code-sharad.github.io/stow/')
        failures.push(`${width}/${scheme}: canonical mismatch`);
      if (metrics.lang !== 'en') failures.push(`${width}/${scheme}: lang ${metrics.lang}`);
      if (metrics.shots < 5) failures.push(`${width}/${scheme}: screenshots missing`);
      if (!metrics.font.includes('Inter')) failures.push(`${width}/${scheme}: Inter not active`);
      if (metrics.missingAlt.length > 0)
        failures.push(`${width}/${scheme}: missing alt ${metrics.missingAlt.join(', ')}`);
      if (metrics.emptyAlt.length > 0)
        failures.push(`${width}/${scheme}: empty alt ${metrics.emptyAlt.join(', ')}`);
      if (metrics.missingDims.length > 0)
        failures.push(`${width}/${scheme}: missing dimensions ${metrics.missingDims.join(', ')}`);
      for (const image of metrics.images) {
        if (!image.loaded) failures.push(`${width}/${scheme}: image not loaded ${image.src}`);
      }

      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      for (const violation of axe.violations) {
        failures.push(
          `${width}/${scheme}: axe ${violation.id} (${violation.impact}) ${violation.nodes.length} nodes: ${violation.nodes[0]?.target.join(' ')} — ${violation.nodes[0]?.failureSummary?.split('\n')[1] ?? ''}`,
        );
      }

      if (errors.length > 0)
        failures.push(`${width}/${scheme}: console/requests: ${errors.join(' | ')}`);
      log(
        `${width}/${scheme.padEnd(5)} overflow=${metrics.overflow} images=${metrics.images.length} axe=${axe.violations.length} errors=${errors.length}`,
      );
      await context.close();
    }
  }

  for (const asset of [
    'og.png',
    'icon.png',
    'favicon.png',
    'inter-var.woff2',
    'library-dark.webp',
    'library-light.webp',
    'library-mobile-dark.webp',
    'library-mobile-light.webp',
    'popup-dark.webp',
    'popup-light.webp',
    'search-step-dark.webp',
    'search-step-light.webp',
    'search-mobile-dark.webp',
    'search-mobile-light.webp',
    'restore-step-dark.webp',
    'restore-step-light.webp',
    'restore-mobile-dark.webp',
    'restore-mobile-light.webp',
    'privacy-dark.webp',
    'privacy-light.webp',
  ]) {
    if (!existsSync(join(root, 'assets', asset))) failures.push(`missing ${asset}`);
  }

  if (!existsSync(join(root, 'sitemap.xml'))) failures.push('missing sitemap.xml');
  if (!existsSync(join(root, 'robots.txt'))) failures.push('missing robots.txt');

  {
    const context = await browser.newContext({
      viewport: { width: 375, height: 800 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
    const toggle = page.locator('.menu-toggle');
    if (!(await toggle.isVisible())) failures.push('menu: toggle not visible at 375');
    await toggle.click();
    if ((await toggle.getAttribute('aria-expanded')) !== 'true')
      failures.push('menu: aria-expanded not true after open');
    if (!(await page.locator('#nav-panel').isVisible())) failures.push('menu: panel not visible');
    await page.keyboard.press('Escape');
    if ((await toggle.getAttribute('aria-expanded')) !== 'false')
      failures.push('menu: aria-expanded not false after Escape');
    if (!(await page.locator('#nav-panel').isHidden())) failures.push('menu: panel not hidden');
    if (!(await toggle.evaluate((element) => element === document.activeElement)))
      failures.push('menu: focus not restored to toggle');
    log('menu: opens, Escape closes, focus restored');
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 375, height: 800 },
      javaScriptEnabled: false,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
    const nojs = await page.evaluate(() => ({
      menu: getComputedStyle(document.querySelector('.menu-toggle')).display,
      nav: getComputedStyle(document.querySelector('.no-js-nav')).display,
      links: document.querySelectorAll('.no-js-nav a').length,
      reveal: getComputedStyle(document.querySelector('.reveal')).opacity,
    }));
    if (nojs.menu !== 'none') failures.push(`no-js: menu toggle ${nojs.menu}`);
    if (nojs.nav !== 'flex') failures.push(`no-js: nav ${nojs.nav}`);
    if (nojs.links !== 3) failures.push(`no-js: ${nojs.links} nav links`);
    if (nojs.reveal !== '1') failures.push(`no-js: reveal opacity ${nojs.reveal}`);
    log(`no-js: static nav, no menu toggle, reveals visible`);
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('.reveal')].every(
          (element) => getComputedStyle(element).opacity === '1',
        ),
      undefined,
      { timeout: 5000 },
    );
    if (errors.length > 0) failures.push(`motion: console/requests: ${errors.join(' | ')}`);
    log(`motion/dark reveals visible, errors=${errors.length}`);
    await context.close();
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} landing check(s) failed:`);
    for (const failure of failures) console.error(` - ${failure}`);
    process.exitCode = 1;
  } else {
    log('\nlanding: all checks passed');
  }
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
