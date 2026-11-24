/**
 * Capture the hero demo's poster frames.
 *
 * The live demo is progressive enhancement: when the ES module cannot run (or
 * the visitor asked for reduced motion before the first paint) the figure falls
 * back to a still. That still is the demo's own opening frame — the crowded tab
 * strip with the counter — so it always matches what the animation shows.
 *
 *   node scripts/capture-hero-poster.mjs
 *
 * Writes landing/assets/hero-mess-{dark,light}.webp (1440x810) and
 * landing/assets/hero-mess-mobile-{dark,light}.webp (480x600).
 */
import { execFileSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const landing = path.join(root, 'landing');
const out = path.join(landing, 'assets');

const STATIC_AT = 1.6;

const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const file = path.join(landing, url === '/' ? 'index.html' : url);
  if (!file.startsWith(landing)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    const type =
      {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.woff2': 'font/woff2',
        '.png': 'image/png',
        '.webp': 'image/webp',
      }[path.extname(file)] ?? 'application/octet-stream';
    res.writeHead(200, { 'content-type': type }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
});

const save = async (name, buffer) => {
  const png = path.join(out, `${name}.png`);
  await writeFile(png, buffer);
  execFileSync('magick', [png, '-quality', '82', path.join(out, `${name}.webp`)]);
  await rm(png);
  const dims = execFileSync('identify', ['-format', '%wx%h', path.join(out, `${name}.webp`)], {
    encoding: 'utf8',
  });
  console.log(`landing/assets/${name}.webp  ${dims}`);
};

const shoot = async (name, viewport, scheme) => {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, colorScheme: scheme });
  await page.goto(`${origin}/demo.html`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => Boolean(window.__demo));
  await page.evaluate(
    ({ at, width, height }) => {
      const demo = window.__demo;
      demo.pause();
      demo.setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      demo.seek(at);
      for (const node of document.querySelectorAll('.controls, .demo-head')) node.remove();
      const wrap = document.querySelector('.wrap');
      wrap.style.maxWidth = 'none';
      document.body.style.padding = '0';
      document.body.style.background = '#202124';
      const stage = document.getElementById('stage');
      Object.assign(stage.style, {
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: 'none',
        margin: '0',
        aspectRatio: 'auto',
      });
    },
    { at: STATIC_AT, width: viewport.width, height: viewport.height },
  );
  await page.waitForTimeout(400);
  await save(name, await page.locator('#stage').screenshot());
  await page.close();
};

await shoot('hero-mess-dark', { width: 1440, height: 810 }, 'dark');
await shoot('hero-mess-light', { width: 1440, height: 810 }, 'light');
await shoot('hero-mess-mobile-dark', { width: 480, height: 600 }, 'dark');
await shoot('hero-mess-mobile-light', { width: 480, height: 600 }, 'light');

await browser.close();
server.close();
