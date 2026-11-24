import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const dir = '/home/sharad/dev/github/mytabs';
const page_url = `file://${dir}/landing/index.html`;
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });

for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(page_url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('header .brand, header a').first().screenshot({ path: `${dir}/.audit/icon-header-${scheme}.png` }).catch(async () => {
    await page.screenshot({ path: `${dir}/.audit/icon-header-${scheme}.png`, clip: { x: 0, y: 0, width: 400, height: 100 } });
  });
  await ctx.close();
}

const { readFileSync } = await import('node:fs');
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
const bgs = { 'page light': '#faf8f4', 'page dark': '#141312', white: '#ffffff', black: '#000000' };
const sizes = [20, 24, 32, 64, 128];
const rows = Object.entries(bgs).map(([name, bg]) => `
  <div class="row" style="background:${bg}">
    <span class="label">${name}</span>
    ${sizes.map((s) => `<img src="${b64(`${dir}/landing/assets/icon.png`)}" width="${s}" height="${s}" style="width:${s}px;height:${s}px" alt="">`).join('')}
    <img src="${b64(`${dir}/landing/assets/favicon.png`)}" width="32" height="32" alt="">
  </div>`).join('');
writeFileSync(`${dir}/.audit/icon-preview.html`, `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:24px;font:13px/1.4 system-ui;background:#fff;display:grid;gap:12px}
.row{display:flex;align-items:center;gap:20px;padding:16px;border-radius:12px}
.label{width:110px;font:600 11px ui-monospace;letter-spacing:.08em;text-transform:uppercase;color:#888}
img{display:block;image-rendering:auto}
</style>${rows}`);
const ctx = await browser.newContext({ viewport: { width: 780, height: 460 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(`file://${dir}/.audit/icon-preview.html`);
await page.screenshot({ path: `${dir}/.audit/icon-preview.png`, fullPage: true });
await ctx.close();
await browser.close();
console.log('ok');
