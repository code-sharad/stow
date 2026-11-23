/**
 * Stow hero demo — a code-only, 18s looping screen recording.
 *
 * Design canvas 1280 x 720. Everything is DOM + CSS: no video, no external
 * images (the Stow mark is the real 32px icon, inlined). The component exposes
 * mountStowDemo(host, options) and self-mounts [data-stow-demo] elements.
 *
 * Motion contract: the timeline below is absolute (seconds). Only transform and
 * opacity are written per frame. The opening frame is duplicated in a reset
 * layer so the 18s loop seam is pixel-identical.
 */

const ICON_32 = 'data:image/png;base64,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';
const QUERY = 'indexeddb';
const DURATION = 18;
const MOBILE_QUERY = '(max-width: 1024px)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const STATIC_AT = 13.6;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const seg = (t, start, end) => clamp((t - start) / (end - start));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const win = (t, a, b) => easeOut(seg(t, a, b));

/* ---------------------------------------------------------------- icons --- */

const svg = (body, size = 16, viewBox = '0 0 16 16') =>
  `<svg width="${size}" height="${size}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const IC = {
  back: svg('<path d="M10 3 5 8l5 5"/>'),
  forward: svg('<path d="m6 3 5 5-5 5"/>'),
  reload: svg('<path d="M13 8a5 5 0 1 1-1.4-3.5"/><path d="M13 3.5V7H9.5"/>'),
  star: svg('<path d="m8 2.6 1.7 3.4 3.7.6-2.7 2.6.6 3.7L8 11.2l-3.3 1.7.6-3.7-2.7-2.6 3.7-.6L8 2.6Z"/>'),
  puzzle: svg('<path d="M6 2h4v3a2 2 0 0 0 2 2h3v4h-3a2 2 0 0 0-2 2v3H6v-3a2 2 0 0 0-2-2H1V7h3a2 2 0 0 0 2-2V2Z"/>'),
  menu: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="3.2" r="1.25"/><circle cx="8" cy="8" r="1.25"/><circle cx="8" cy="12.8" r="1.25"/></svg>',
  lock: svg('<rect x="3.5" y="7" width="9" height="6.5" rx="1"/><path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7"/>', 12),
  chev: svg('<path d="m4 6 4 4 4-4"/>', 14),
  chevRight: svg('<path d="m6 4 4 4-4 4"/>', 14),
  plus: svg('<path d="M8 3v10M3 8h10"/>', 15),
  layers: svg('<path d="m8 2 6 3-6 3-6-3 6-3Z"/><path d="m2 8 6 3 6-3"/><path d="m2 11 6 3 6-3"/>', 14),
  pin: svg('<path d="M6 2h4l-.5 4 2.5 2v1H4V8l2.5-2L6 2Z"/><path d="M8 9v5"/>', 14),
  trash: svg('<path d="M3 4h10M6 4V2.8h4V4M4.5 4l.6 9h5.8l.6-9"/>', 14),
  settings: svg('<circle cx="8" cy="8" r="2.2"/><path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M12.4 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1"/>', 14),
  shield: svg('<path d="M8 1.8 13 4v4.2c0 3-2.2 5-5 6-2.8-1-5-3-5-6V4l5-2.2Z"/><path d="m5.8 8 1.5 1.5 3-3"/>', 12),
  arrowDown: svg('<path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M3 13.5h10"/>', 15),
  search: svg('<circle cx="7" cy="7" r="4.2"/><path d="m10.2 10.2 3 3"/>', 12),
  ellipsis: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="3.5" cy="8" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="12.5" cy="8" r="1.2"/></svg>',
  copy: svg('<rect x="5" y="5" width="7" height="8" rx="1"/><path d="M10 5V3.5A1.5 1.5 0 0 0 8.5 2h-4A1.5 1.5 0 0 0 3 3.5v6A1.5 1.5 0 0 0 4.5 11H5"/>', 13),
  external: svg('<path d="M9 3h4v4M13 3 7.5 8.5"/><path d="M12 9.5v3A1.5 1.5 0 0 1 10.5 14h-7A1.5 1.5 0 0 1 2 12.5v-7A1.5 1.5 0 0 1 3.5 4h3"/>', 13),
  x: svg('<path d="m4 4 8 8M12 4l-8 8"/>', 13),
};

const CURSOR = `<svg viewBox="0 0 24 28" aria-hidden="true"><path d="M2 2v19.2l5.1-4.8 3.1 7.4 3-1.2-3.1-7.2h6.7L2 2Z" fill="#0b0b0c" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

const CHROME_LOGO = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#fff"/><path d="M12 12 2.4 6.5A12 12 0 0 1 21.6 6.5L12 12Z" fill="#ea4335"/><path d="M12 12 21.6 6.5A12 12 0 0 1 12 24V12Z" fill="#fbbc05"/><path d="M12 12v12A12 12 0 0 1 2.4 6.5L12 12Z" fill="#34a853"/><circle cx="12" cy="12" r="5.2" fill="#fff"/><circle cx="12" cy="12" r="4" fill="#4285f4"/></svg>`;

/* --------------------------------------------------------------- tabs --- */

const GROUPS = [
  {
    name: 'Docs',
    color: 'var(--sd-blue)',
    tabs: [
      { title: 'Chrome extensions', domain: 'developer.chrome.com', fav: 'docs' },
      { title: 'Extensions: Getting started', domain: 'developer.chrome.com', fav: 'docs' },
      { title: 'chrome.tabs API', domain: 'developer.chrome.com', fav: 'docs' },
      { title: 'IndexedDB API', domain: 'developer.mozilla.org', fav: 'mdn' },
      { title: 'Chrome Web Store', domain: 'chromewebstore.google.com', fav: 'store' },
    ],
  },
  {
    name: 'Design',
    color: 'var(--sd-pink)',
    tabs: [
      { title: 'Design system', domain: 'figma.com', fav: 'design' },
      { title: 'Figma – Stow', domain: 'figma.com', fav: 'design' },
      { title: 'Dribbble', domain: 'dribbble.com', fav: 'dribbble' },
      { title: 'Awwwards', domain: 'awwwards.com', fav: 'awwwards' },
      { title: 'Mobbin', domain: 'mobbin.com', fav: 'mobbin' },
      { title: 'Linear', domain: 'linear.app', fav: 'linear' },
    ],
  },
  {
    name: 'Build',
    color: 'var(--sd-green)',
    tabs: [
      { title: 'GitHub – stow', domain: 'github.com', fav: 'build' },
      { title: 'npm', domain: 'npmjs.com', fav: 'npm' },
      { title: 'Vite', domain: 'vite.dev', fav: 'vite' },
      { title: 'Dexie.js — IndexedDB in the browser', domain: 'dexie.org', fav: 'dexie' },
    ],
  },
];

const FAVS = {
  docs: { bg: '#4285f4', text: 'D', fs: 7 },
  design: { bg: '#1e1e1e', text: 'F', fs: 7 },
  build: { bg: '#24292f', text: 'G', fs: 7 },
  mdn: { bg: '#1b1b1b', text: 'M', fs: 6 },
  store: { bg: '#34a853', text: 'C', fs: 7 },
  npm: { bg: '#cb3837', text: 'n', fs: 7 },
  vite: { bg: '#646cff', text: 'V', fs: 7 },
  dexie: { bg: '#0b7dda', text: 'D', fs: 7 },
  dribbble: { bg: '#ea4c89', text: 'D', fs: 7 },
  awwwards: { bg: '#111111', text: 'A', fs: 7 },
  mobbin: { bg: '#191919', text: 'M', fs: 7 },
  linear: { bg: '#5e6ad2', text: 'L', fs: 7 },
  stow: { img: true },
};

function fav(kind, cls) {
  const f = FAVS[kind] || FAVS.docs;
  if (f.img) {
    return `<span class="${cls}"><img src="${ICON_32}" width="13" height="13" alt=""></span>`;
  }
  return `<span class="${cls}" style="background:${f.bg};font-size:${f.fs}px">${f.text}</span>`;
}

function tabHTML(tab, { x, w, active, attrs = '', group = false, stow = false }) {
  return `<div class="sd-tab${active ? ' is-active' : ''}" style="left:${x}px;width:${w}px" ${attrs}>
    <span class="sd-tab__bg"></span>
    ${fav(tab.fav, 'sd-tab__fav')}
    <span class="sd-tab__title">${tab.title}</span>
    <span class="sd-tab__x">${IC.x}</span>
    ${group ? `<span class="sd-tab__line" style="--g:${group}"></span>` : ''}
  </div>`;
}

function initialTabsHTML(live) {
  let x = 0;
  let i = 0;
  let html = '';
  GROUPS.forEach((group, gi) => {
    const attrs = live ? `data-chip-initial data-gi="${gi}"` : '';
    html += `<div class="sd-group" style="left:${x}px;width:60px;--g:${group.color}" ${attrs}><span class="sd-group__dot"></span>${group.name}</div>`;
    x += 61;
    group.tabs.forEach((tab, ti) => {
      const active = gi === 0 && ti === 0;
      html += tabHTML(tab, {
        x,
        w: 65,
        active,
        group: group.color,
        attrs: live ? `data-tab-initial data-i="${i}"` : '',
      });
      x += 66;
      i += 1;
    });
  });
  return html;
}

const DOCS_TABS = GROUPS[0].tabs;

function stowTabHTML(live) {
  return tabHTML(
    { title: 'Stow', fav: 'stow' },
    { x: 0, w: 190, active: true, attrs: live ? 'data-stow-tab' : '' },
  );
}

function finalTabsHTML(live) {
  let html = `<div class="sd-group" style="left:192px;width:60px;--g:var(--sd-blue)" ${live ? 'data-final-chip' : ''}><span class="sd-group__dot"></span>Docs</div>`;
  DOCS_TABS.forEach((tab, i) => {
    html += tabHTML(tab, {
      x: 254 + i * 187,
      w: 186,
      active: false,
      group: 'var(--sd-blue)',
      attrs: live ? `data-final-tab data-i="${i}"` : '',
    });
  });
  return html;
}

/* --------------------------------------------------------------- chrome --- */

function chromeHTML(live) {
  const plus = live
    ? `<div class="sd-plus" data-plus style="transform:translate3d(1180px,0,0)">${IC.plus}</div>`
    : `<div class="sd-plus" style="transform:translate3d(1180px,0,0)">${IC.plus}</div>`;
  return `<div class="sd-chrome">
    <div class="sd-tabstrip">
      ${initialTabsHTML(live)}
      ${live ? stowTabHTML(true) : ''}
      ${live ? finalTabsHTML(true) : ''}
      ${plus}
      <div class="sd-tabsearch">${IC.chev}</div>
    </div>
    <div class="sd-toolbar">
      <span class="sd-tb">${IC.back}</span>
      <span class="sd-tb">${IC.forward}</span>
      <span class="sd-tb">${IC.reload}</span>
      <div class="sd-url">
        <span class="sd-url__lock" style="display:flex;color:var(--sd-dim)">${IC.lock}</span>
        <span class="sd-url__text">
          <span ${live ? 'data-url-docs' : ''}>developer.chrome.com/docs/extensions</span>
          <span ${live ? 'data-url-lib' : ''} style="opacity:0">chrome-extension://abcdefghijklmnopabcdefghijklmnop/library</span>
        </span>
        <span class="sd-url__star">${IC.star}</span>
      </div>
      <span class="sd-tb">${IC.puzzle}</span>
      <span class="sd-tb sd-tb--stow" ${live ? 'data-stow-btn' : ''}>
        ${live ? '<span class="sd-hover" data-stow-hover></span>' : ''}
        <img src="${ICON_32}" width="18" height="18" alt="">
      </span>
      <span class="sd-profile sd-profile--light">S</span>
      <span class="sd-tb">${IC.menu}</span>
    </div>
  </div>`;
}

/* --------------------------------------------------------------- library --- */

function rowHTML(tab, d) {
  return `<div class="sd-row" data-r data-d="${d}">
    <span class="sd-check"></span>
    ${fav(tab.fav, 'sd-fav')}
    <span class="sd-title">${tab.title}</span>
    <span class="sd-domain">${tab.domain}</span>
    <span class="sd-rowactions">${IC.copy}${IC.external}${IC.x}</span>
  </div>`;
}

function stackHTML({ name, color, tabs, open = true, fresh = false, base, rowBase, live = true, kind = 'all' }) {
  const rows = open
    ? `<div class="sd-tabs-list">${tabs.map((tab, i) => rowHTML(tab, rowBase + i * 0.045)).join('')}</div>`
    : '';
  const isDocsAll = kind === 'all' && name === 'Docs';
  return `<section class="sd-stack">
    <div class="sd-stackhead" ${live ? `data-r data-d="${base}"` : ''}>
      ${fresh ? '<span class="sd-fresh" data-fresh></span>' : ''}
      <span class="sd-check"></span>
      <span class="sd-chev">${open ? IC.chev : IC.chevRight}</span>
      <span class="sd-stacktitle">${name}</span>
      <span class="sd-stackmeta"><span>${tabs.length} ${tabs.length === 1 ? 'tab' : 'tabs'}</span><span>·</span><span>Nov ${name === 'Docs' ? '23' : name === 'Design' ? '22' : '21'}</span></span>
      <span class="sd-stackactions" ${isDocsAll ? 'data-restore-actions' : ''}>
        <span class="sd-restoreall" ${isDocsAll ? 'data-restore-all' : ''}>Restore all</span>
        <span class="sd-ellipsis">${IC.ellipsis}</span>
      </span>
    </div>
    ${rows}
  </section>`;
}

const RESULTS = {
  docs: [DOCS_TABS[3]],
  build: [GROUPS[2].tabs[3]],
};

function libraryHTML() {
  const railItem = (icon, label, count, d, on) =>
    `<div class="sd-rail__item${on ? ' is-on' : ''}" data-r data-d="${d}">${icon}<span>${label}</span><b>${count}</b></div>`;
  const railStack = (name, count, color, d) =>
    `<div class="sd-rail__stack" data-r data-d="${d}"><span class="sd-rail__dot" style="--g:${color}"></span><span>${name}</span><b>${count}</b></div>`;
  return `<div class="sd-lib" data-lib>
    <div class="sd-top">
      <div class="sd-brand" data-r data-d="4.30">
        <img src="${ICON_32}" width="20" height="20" alt="">
        <span class="sd-brand__name">stow</span>
        <span class="sd-brand__ver">v0.1.0</span>
      </div>
      <div class="sd-search" data-search data-r data-d="4.34">
        <span class="sd-search__prompt">❯</span>
        <div class="sd-search__text">
          <span class="sd-search__ph" data-ph>Search tabs and lists</span>
          <span class="sd-search__q"><span data-qtext></span><span class="sd-search__caret" data-caret></span></span>
        </div>
        <span class="sd-search__kbd">/</span>
      </div>
      <div class="sd-stowbtn" data-r data-d="4.34">
        <span class="sd-stowbtn__main">${IC.arrowDown}Stow this window</span>
        <span class="sd-stowbtn__split">${IC.chev}</span>
      </div>
    </div>
    <aside class="sd-rail">
      <div class="sd-rail__group">
        <div class="sd-rail__label" data-r data-d="4.38">views</div>
        ${railItem(IC.layers, 'All tabs', 15, 4.42, true)}
        ${railItem(IC.pin, 'Pinned', 0, 4.46, false)}
        ${railItem(IC.trash, 'Trash', 0, 4.50, false)}
      </div>
      <div class="sd-rail__group">
        <div class="sd-rail__label" data-r data-d="4.48">Lists<span>3</span></div>
        ${railStack('Docs', 5, 'var(--sd-blue)', 4.52)}
        ${railStack('Design', 6, 'var(--sd-pink)', 4.56)}
        ${railStack('Build', 4, 'var(--sd-green)', 4.60)}
      </div>
      <div class="sd-rail__foot" data-r data-d="4.56">
        <div class="sd-rail__privacy">${IC.settings}<span>Settings</span></div>
        <div class="sd-rail__privacy">${IC.shield}<span>Local only</span></div>
      </div>
    </aside>
    <main class="sd-main">
      <div class="sd-reading">
        <div class="sd-pagehead" data-r data-d="4.40">
          <div class="sd-pagetitle">All tabs</div>
          <p class="sd-pagemuted" data-status></p>
        </div>
        <div class="sd-lists">
          <div class="sd-layer sd-layer--all" data-layer-all>
            ${stackHTML({ name: 'Docs', color: 'var(--sd-blue)', tabs: GROUPS[0].tabs, open: true, fresh: true, base: 4.46, rowBase: 4.58 })}
            ${stackHTML({ name: 'Design', color: 'var(--sd-pink)', tabs: GROUPS[1].tabs, open: false, base: 4.58, rowBase: 4.58 })}
            ${stackHTML({ name: 'Build', color: 'var(--sd-green)', tabs: GROUPS[2].tabs, open: false, base: 4.66, rowBase: 4.66 })}
          </div>
          <div class="sd-layer sd-layer--res" data-layer-res>
            ${stackHTML({ name: 'Docs', color: 'var(--sd-blue)', tabs: RESULTS.docs, open: true, base: 8.62, rowBase: 8.70, kind: 'res' })}
            ${stackHTML({ name: 'Build', color: 'var(--sd-green)', tabs: RESULTS.build, open: true, base: 8.70, rowBase: 8.78, kind: 'res' })}
          </div>
        </div>
      </div>
    </main>
    <div class="sd-status" data-r data-d="4.60">
      <span class="sd-status__local"><i></i>local</span>
      <span>~/all</span>
      <span><b>3</b> lists</span>
      <span><b>15</b> tabs</span>
      <span class="sd-hints"><span><kbd>/</kbd> search</span><span><kbd>ctrl</kbd> <kbd>k</kbd> commands</span><span><kbd>esc</kbd> clear</span></span>
    </div>
    <div class="sd-toast" data-toast><span>Restored 5 tabs.</span></div>
  </div>`;
}

/* ----------------------------------------------------------------- docs --- */

function docsHTML() {
  return `<div class="sd-docs">
    <div class="sd-docs__top">
      <div class="sd-docs__brand">${CHROME_LOGO}<span>Chrome for Developers</span></div>
      <nav class="sd-docs__nav"><span class="is-on">Docs</span><span>Extensions</span><span>Blog</span><span>Community</span></nav>
      <div class="sd-docs__search">${IC.search}<span>Search docs</span></div>
    </div>
    <div class="sd-docs__body">
      <aside class="sd-docs__side">
        <p class="sd-docs__side-label">Extensions</p>
        <a class="is-on">Get started</a>
        <a>Develop</a>
        <a>Distribute</a>
        <a>Reference</a>
        <div class="sd-gap"></div>
        <p class="sd-docs__side-label">API</p>
        <a>chrome.tabs</a>
        <a>chrome.storage</a>
        <a>chrome.action</a>
      </aside>
      <main class="sd-docs__main">
        <div class="sd-docs__crumbs">Docs / Extensions / Get started</div>
        <div class="sd-docs__h1">Chrome extensions</div>
        <p class="sd-docs__lede">Extensions are small software programs that customize the browsing experience. They let users tailor Chrome's functionality and behavior.</p>
        <div class="sd-callout">Extensions are built with the same web technologies you use every day: HTML, CSS, and JavaScript.</div>
        <div class="sd-code"><span class="c">// manifest.json</span>
<span class="k">{</span>
  "manifest_version": 3,
  "name": "My extension",
  "version": "1.0"
<span class="k">}</span></div>
        <h2>Build your first extension</h2>
        <p>Create a directory for your extension, add a manifest, and load it unpacked from chrome://extensions. Changes to the manifest require a reload.</p>
        <p>The extension platform gives you APIs for tabs, windows, storage, and the action toolbar. Start with the tabs API to read the current window.</p>
      </main>
      <aside class="sd-docs__toc">
        <b>On this page</b>
        <a class="is-on">Overview</a>
        <a>Manifest</a>
        <a>Build your first extension</a>
        <a>Extension APIs</a>
        <a>Next steps</a>
      </aside>
    </div>
  </div>`;
}

/* -------------------------------------------------------------- timeline --- */

const CURSOR_KEYS = [
  { t: 0, x: 1080, y: 520 },
  { t: 1.55, x: 1006, y: 300, cx: 1132, cy: 410 },
  { t: 2.45, x: 1193, y: 60, cx: 1040, cy: 150 },
  { t: 2.9, x: 1193, y: 60 },
  { t: 3.9, x: 980, y: 470, cx: 1150, cy: 230 },
  { t: 5.7, x: 938, y: 518, cx: 966, cy: 500 },
  { t: 6.3, x: 938, y: 518 },
  { t: 7.25, x: 520, y: 110, cx: 742, cy: 170 },
  { t: 7.45, x: 520, y: 110 },
  { t: 8.4, x: 520, y: 110 },
  { t: 8.9, x: 700, y: 260, cx: 590, cy: 150 },
  { t: 9.75, x: 1080, y: 218, cx: 900, cy: 200 },
  { t: 9.95, x: 1080, y: 218 },
  { t: 11.7, x: 347, y: 20, cx: 800, cy: 48 },
  { t: 12.15, x: 347, y: 20 },
  { t: 12.9, x: 900, y: 520, cx: 600, cy: 310 },
  { t: 15.4, x: 900, y: 520 },
  { t: 16.7, x: 1080, y: 520, cx: 990, cy: 545 },
  { t: 18, x: 1080, y: 520 },
];

const CAM_KEYS = [
  { t: 0, x: 840, y: 0 },
  { t: 2.9, x: 840, y: 0 },
  { t: 4.6, x: 320, y: 80 },
  { t: 6.4, x: 320, y: 80 },
  { t: 7.4, x: 346, y: 80 },
  { t: 8.9, x: 346, y: 80 },
  { t: 9.7, x: 840, y: 140 },
  { t: 10.6, x: 840, y: 140 },
  { t: 11.6, x: 0, y: 0 },
  { t: 15.4, x: 0, y: 0 },
  { t: 16.9, x: 840, y: 0 },
  { t: 18, x: 840, y: 0 },
];

const CLICKS = [
  { t: 2.9, x: 1193, y: 60 },
  { t: 7.35, x: 520, y: 110 },
  { t: 9.9, x: 1080, y: 218 },
  { t: 12.05, x: 347, y: 20 },
];

function cursorAt(t) {
  let a = CURSOR_KEYS[0];
  for (let i = 1; i < CURSOR_KEYS.length; i += 1) {
    const b = CURSOR_KEYS[i];
    if (t <= b.t) {
      const p = easeInOut(seg(t, a.t, b.t));
      const cx = b.cx == null ? (a.x + b.x) / 2 : b.cx;
      const cy = b.cy == null ? (a.y + b.y) / 2 : b.cy;
      const q = 1 - p;
      return {
        x: q * q * a.x + 2 * q * p * cx + p * p * b.x,
        y: q * q * a.y + 2 * q * p * cy + p * p * b.y,
      };
    }
    a = b;
  }
  const last = CURSOR_KEYS[CURSOR_KEYS.length - 1];
  return { x: last.x, y: last.y };
}

function camAt(t) {
  let a = CAM_KEYS[0];
  for (let i = 1; i < CAM_KEYS.length; i += 1) {
    const b = CAM_KEYS[i];
    if (t <= b.t) {
      const p = easeInOut(seg(t, a.t, b.t));
      return { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) };
    }
    a = b;
  }
  const last = CAM_KEYS[CAM_KEYS.length - 1];
  return { x: last.x, y: last.y };
}

/* ------------------------------------------------------------------ DOM --- */

function liveHTML() {
  return `<div class="sd" data-theme="dark" aria-hidden="true">
    <div class="sd-surface" data-surface>
      <div class="sd-browser">
        ${chromeHTML(true)}
        <div class="sd-page">${docsHTML()}${libraryHTML()}</div>
      </div>
      <div class="sd-ripple" data-ripple></div>
      <div class="sd-cursor" data-cursor style="opacity:.9">${CURSOR}</div>
      <div class="sd-reset" data-reset>${resetHTML()}</div>
    </div>
  </div>`;
}

function resetHTML() {
  return `<div class="sd-browser">
      ${chromeHTML(false)}
      <div class="sd-page">${docsHTML()}</div>
    </div>
    <div class="sd-cursor" data-reset-cursor style="opacity:.9;transform:translate3d(1078px,518px,0)">${CURSOR}</div>`;
}

function cache(root) {
  const q = (selector) => root.querySelector(selector);
  const qa = (selector) => Array.from(root.querySelectorAll(selector));
  return {
    surface: q('[data-surface]'),
    lib: q('[data-lib]'),
    reset: q('[data-reset]'),
    cursor: q('[data-cursor]'),
    ripple: q('[data-ripple]'),
    toast: q('[data-toast]'),
    initialTabs: qa('[data-tab-initial]').map((node, index) => ({ node, index })),
    initialChips: qa('[data-chip-initial]').map((node, index) => ({ node, index })),
    stowTab: q('[data-stow-tab]'),
    stowBg: q('[data-stow-tab] .sd-tab__bg'),
    finalTabs: qa('[data-final-tab]').map((node, index) => ({
      node,
      index,
      bg: node.querySelector('.sd-tab__bg'),
    })),
    finalChip: q('[data-final-chip]'),
    plus: q('[data-plus]'),
    urlDocs: q('[data-url-docs]'),
    urlLib: q('[data-url-lib]'),
    reveals: qa('[data-r]').map((node) => ({ node, at: Number.parseFloat(node.dataset.d) || 0 })),
    fresh: q('[data-fresh]'),
    restoreActions: q('[data-restore-actions]'),
    status: q('[data-status]'),
    search: q('[data-search]'),
    ph: q('[data-ph]'),
    qtext: q('[data-qtext]'),
    layerAll: q('[data-layer-all]'),
    layerRes: q('[data-layer-res]'),
    hover: q('[data-stow-hover]'),
    stowImg: q('[data-stow-btn] img'),
    finalDocsTab: q('[data-final-tab][data-i="0"]'),
  };
}

/* --------------------------------------------------------------- mount ---- */

const DEFAULTS = {
  autoplay: true,
  loop: true,
  theme: 'auto',
  speed: 1,
  startAt: 0,
  onComplete: null,
};

export function mountStowDemo(host, options = {}) {
  if (!host) throw new Error('mountStowDemo needs a host element');
  if (host.__stowDemo) return host.__stowDemo;

  const opts = { ...DEFAULTS, ...options };
  const state = {
    t: clamp(Number(opts.startAt) || 0, 0, DURATION),
    playing: false,
    speed: clamp(Number(opts.speed) || 1, 0.25, 4),
    loop: opts.loop !== false,
    theme: opts.theme,
    loops: 0,
    userStarted: false,
    destroyed: false,
  };

  host.innerHTML = liveHTML();
  const sd = host.querySelector('.sd');
  const el = cache(sd);
  const mqMobile = window.matchMedia(MOBILE_QUERY);
  const mqDark = window.matchMedia('(prefers-color-scheme: dark)');
  const mqReduced = window.matchMedia(REDUCED_QUERY);
  const reduced = mqReduced.matches;

  let hostWidth = host.clientWidth || 640;
  let visible = true;
  let raf = 0;
  let last = 0;
  let lastN = -1;
  let lastRes = null;
  let lastFocus = null;
  let lastSwitched = null;
  let pos = { x: 1080, y: 520 };

  function applyTheme() {
    const resolved = state.theme === 'auto' ? (mqDark.matches ? 'dark' : 'light') : state.theme;
    sd.setAttribute('data-theme', resolved === 'light' ? 'light' : 'dark');
  }

  function render(t) {
    // camera / responsive stage
    const mobile = mqMobile.matches;
    const cam = mobile ? camAt(t) : { x: 0, y: 0 };
    const s = Math.max(0.01, hostWidth / (mobile ? 440 : 1280));
    el.surface.style.transform = `translate3d(${-cam.x * s}px, ${-cam.y * s}px, 0) scale(${s})`;

    // page crossfade: the docs page sits under the library for the whole loop
    const libIn = easeOut(seg(t, 3.65, 4.5));
    const libOut = easeInOut(seg(t, 12.12, 12.72));
    el.lib.style.opacity = libIn * (1 - libOut);
    el.lib.style.transform = `translate3d(0, ${(1 - libIn) * 10 - libOut * 4}px, 0)`;

    // the fifteen tabs collapse in a 28ms wave
    el.initialTabs.forEach(({ node, index }) => {
      const start = 3 + index * 0.028;
      const p = easeOut(seg(t, start, start + 0.28));
      node.style.opacity = 1 - p;
      node.style.transform = `translate3d(0, ${-7 * p}px, 0) scale(${1 - 0.03 * p})`;
    });
    el.initialChips.forEach(({ node, index }) => {
      const start = 3 + index * 0.12;
      const p = easeOut(seg(t, start, start + 0.32));
      node.style.opacity = 1 - p;
      node.style.transform = `translate3d(0, ${-4 * p}px, 0)`;
    });

    // the library tab opens
    const stowIn = win(t, 3.45, 3.85);
    if (el.stowTab) {
      el.stowTab.style.opacity = stowIn;
      el.stowTab.style.transform = `translate3d(0, ${(1 - stowIn) * 6}px, 0)`;
      el.stowBg.style.opacity = win(t, 3.5, 3.9) * (1 - win(t, 12.05, 12.28));
    }

    // restore: the five Docs tabs slide back in
    el.finalTabs.forEach(({ node, index, bg }) => {
      const start = 10.18 + index * 0.05;
      const p = easeOut(seg(t, start, start + 0.36));
      node.style.opacity = p;
      node.style.transform = `translate3d(${(1 - p) * 22}px, 0, 0)`;
      if (index === 0) bg.style.opacity = win(t, 12.05, 12.28);
    });
    if (el.finalChip) {
      const p = win(t, 10.12, 10.46);
      el.finalChip.style.opacity = p;
      el.finalChip.style.transform = `translate3d(${(1 - p) * 12}px, 0, 0)`;
    }

    // the new-tab button follows the tab count
    let plusX = 1180;
    if (t >= 3.2 && t < 10.06) plusX = 198;
    else if (t >= 10.06) plusX = 1195;
    // never glide over the restored tabs: hide while the strip changes length
    const plusOpacity =
      t < 3 ? 1 : t < 3.2 ? 1 - easeIn(seg(t, 3, 3.2)) : t < 3.8 ? 0 : t < 4.1 ? win(t, 3.8, 4.1)
      : t < 9.92 ? 1 : t < 10.06 ? 1 - easeIn(seg(t, 9.92, 10.06)) : t < 10.7 ? 0 : win(t, 10.7, 10.95);
    if (el.plus) {
      el.plus.style.transform = `translate3d(${plusX}px, 0, 0)`;
      el.plus.style.opacity = plusOpacity;
    }

    // URL swaps with the page, not with the click
    const urlIn = win(t, 3.55, 4.15);
    const urlOut = win(t, 12.02, 12.42);
    if (el.urlDocs) el.urlDocs.style.opacity = clamp(1 - urlIn + urlOut);
    if (el.urlLib) el.urlLib.style.opacity = clamp(urlIn - urlOut);

    // library content (staggered once, never reflows)
    el.reveals.forEach(({ node, at }) => {
      const p = easeOut(seg(t, at, at + 0.44));
      node.style.opacity = p;
      node.style.transform = `translate3d(0, ${(1 - p) * 4}px, 0)`;
    });

    if (el.fresh) el.fresh.style.opacity = 0.55 * win(t, 4.65, 5.0) * (1 - win(t, 5.35, 6.0));

    if (el.restoreActions) {
      const hover = win(t, 9.5, 9.8) * (1 - win(t, 10.3, 10.65));
      el.restoreActions.style.opacity = 0.45 + 0.55 * hover;
    }

    // search: focus, type, then swap layers
    const focused = t >= 7.35 && t < 12.7;
    if (focused !== lastFocus) {
      el.search.classList.toggle('is-focus', focused);
      lastFocus = focused;
    }
    const chars = Math.floor(seg(t, 7.5, 8.38) * QUERY.length + 1e-6);
    if (chars !== lastN) {
      el.qtext.textContent = QUERY.slice(0, chars);
      el.ph.style.opacity = chars > 0 ? '0' : '1';
      lastN = chars;
    }
    const results = t >= 8.55;
    if (results !== lastRes) {
      el.status.textContent = results ? '2 matches in 2 lists' : '';
      lastRes = results;
    }
    const allOut = win(t, 8.45, 8.68);
    el.layerAll.style.opacity = 1 - allOut;
    el.layerRes.style.opacity = win(t, 8.52, 8.74);

    // toast
    const tin = win(t, 10.0, 10.24);
    const tout = easeIn(seg(t, 11.45, 11.7));
    el.toast.style.opacity = tin * (1 - tout);
    el.toast.style.transform = `translate3d(0, ${(1 - tin) * 6 + tout * 5}px, 0)`;

    // active tab moves from Stow to the restored Docs tab
    const switched = t >= 12.05;
    if (switched !== lastSwitched) {
      if (el.stowTab) el.stowTab.classList.toggle('is-active', !switched);
      if (el.finalDocsTab) el.finalDocsTab.classList.toggle('is-active', switched);
      lastSwitched = switched;
    }

    // tooltip-less hover + press on the pinned Stow action
    if (el.hover) el.hover.style.opacity = 0.1 * win(t, 2.28, 2.52) * (1 - win(t, 3.0, 3.25));
    if (el.stowImg) {
      const press = win(t, 2.86, 2.94) * (1 - win(t, 2.94, 3.1));
      el.stowImg.style.transform = `scale(${1 - 0.07 * press})`;
    }

    // cursor + ripple
    pos = cursorAt(t);
    let dip = 1;
    let ripple = null;
    CLICKS.forEach((click) => {
      const d = Math.abs(t - click.t);
      if (d < 0.14) dip = Math.min(dip, 1 - 0.16 * (1 - d / 0.14));
      const dt = t - click.t;
      if (dt >= 0 && dt <= 0.46) ripple = { click, p: dt / 0.46 };
    });
    el.cursor.style.transform = `translate3d(${pos.x - 2}px, ${pos.y - 2}px, 0) scale(${dip})`;
    if (ripple) {
      const k = 0.35 + 2.1 * easeOut(ripple.p);
      el.ripple.style.transform = `translate3d(${ripple.click.x}px, ${ripple.click.y}px, 0) scale(${k})`;
      el.ripple.style.opacity = 0.5 * (1 - easeIn(ripple.p));
    } else {
      el.ripple.style.opacity = 0;
    }

    // loop seam: a static copy of frame zero dissolves in over the payoff
    el.reset.style.opacity = easeInOut(seg(t, 16.9, 17.75));
  }

  function callComplete() {
    state.loops += 1;
    if (typeof opts.onComplete === 'function') {
      opts.onComplete({ time: state.t, loops: state.loops });
    }
  }

  function tick(now) {
    raf = 0;
    if (state.destroyed || !state.playing || !visible || document.hidden) return;
    const dt = last ? Math.min(0.06, (now - last) / 1000) : 0;
    last = now;
    state.t += dt * state.speed;
    let completed = false;
    while (state.t >= DURATION) {
      if (state.loop) {
        state.t -= DURATION;
        completed = true;
      } else {
        state.t = DURATION;
        state.playing = false;
        completed = true;
        break;
      }
    }
    render(state.t);
    if (completed) callComplete();
    if (state.playing) raf = requestAnimationFrame(tick);
  }

  function sync() {
    if (state.destroyed) return;
    const should = state.playing && visible && !document.hidden;
    if (should && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    } else if (!should && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function play() {
    if (state.destroyed) return;
    state.userStarted = true;
    if (state.t >= DURATION) state.t = 0;
    state.playing = true;
    render(state.t);
    sync();
  }

  function pause() {
    state.playing = false;
    sync();
  }

  function seek(value) {
    state.t = clamp(Number(value) || 0, 0, DURATION);
    render(state.t);
    if (state.t >= DURATION && !state.loop) {
      state.playing = false;
      sync();
    }
  }

  function setSpeed(value) {
    state.speed = clamp(Number(value) || 1, 0.25, 4);
  }

  function setLoop(value) {
    state.loop = Boolean(value);
  }

  function setTheme(value) {
    state.theme = value === 'light' || value === 'dark' ? value : 'auto';
    applyTheme();
  }

  function onLayout() {
    hostWidth = host.clientWidth || hostWidth;
    render(state.t);
  }

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      sync();
    },
    { threshold: 0.02 },
  );
  io.observe(host);

  const ro = new ResizeObserver(onLayout);
  ro.observe(host);

  const onVisibility = () => sync();
  document.addEventListener('visibilitychange', onVisibility);

  const onThemeChange = () => {
    if (state.theme === 'auto') applyTheme();
  };
  const onMotionChange = (event) => {
    if (event.matches && !state.userStarted) {
      pause();
      seek(STATIC_AT);
    }
  };
  mqDark.addEventListener?.('change', onThemeChange);
  mqMobile.addEventListener?.('change', onLayout);
  mqReduced.addEventListener?.('change', onMotionChange);

  applyTheme();
  if (reduced && opts.autoplay) state.t = STATIC_AT;
  render(state.t);

  const start = () => {
    if (state.destroyed) return;
    host.classList.add('is-ready');
    if (opts.autoplay && !reduced) {
      state.playing = true;
      sync();
    } else if (reduced) {
      state.playing = false;
    }
  };
  if (document.fonts?.ready) {
    document.fonts.ready.then(start, start);
  } else {
    start();
  }

  const controller = {
    play,
    pause,
    seek,
    setSpeed,
    setLoop,
    setTheme,
    getTime: () => state.t,
    isPlaying: () => state.playing,
    get duration() {
      return DURATION;
    },
    destroy() {
      state.destroyed = true;
      state.playing = false;
      sync();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      mqDark.removeEventListener?.('change', onThemeChange);
      mqMobile.removeEventListener?.('change', onLayout);
      mqReduced.removeEventListener?.('change', onMotionChange);
      host.innerHTML = '';
      host.classList.remove('is-ready', 'is-live');
      delete host.__stowDemo;
    },
  };

  host.__stowDemo = controller;
  host.classList.add('is-live');
  return controller;
}

function autoMount() {
  document.querySelectorAll('[data-stow-demo]:not([data-manual])').forEach((host) => {
    if (!host.__stowDemo) mountStowDemo(host);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoMount, { once: true });
} else {
  autoMount();
}

if (typeof window !== 'undefined') {
  window.StowHeroDemo = { mount: mountStowDemo };
}
