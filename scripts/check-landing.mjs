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

      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        h1: document.querySelector('h1')?.textContent?.trim() ?? '',
        images: [...document.images].map((image) => ({
          src: image.currentSrc,
          loaded: image.complete && image.naturalWidth > 0,
        })),
        font: getComputedStyle(document.body).fontFamily,
        shots: document.querySelectorAll('.tile-shot img').length,
      }));

      if (metrics.overflow > 1)
        failures.push(`${width}/${scheme}: horizontal overflow ${metrics.overflow}px`);
      if (!metrics.h1.startsWith('Close 100 tabs')) failures.push(`${width}/${scheme}: missing h1`);
      if (metrics.shots < 5) failures.push(`${width}/${scheme}: feature stills missing`);
      if (!metrics.font.includes('Inter')) failures.push(`${width}/${scheme}: Inter not active`);
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
    'library-dark.webp',
    'library-light.webp',
    'lead-dark.webp',
    'lead-light.webp',
    'lead-compact-dark.webp',
    'lead-compact-light.webp',
    'search-dark.webp',
    'search-light.webp',
    'undo-dark.webp',
    'undo-light.webp',
    'import-dark.webp',
    'import-light.webp',
    'groups-dark.webp',
    'groups-light.webp',
    'groups-compact-dark.webp',
    'groups-compact-light.webp',
  ]) {
    if (!existsSync(join(root, 'assets', asset))) failures.push(`missing ${asset}`);
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
