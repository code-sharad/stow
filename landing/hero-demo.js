/**
 * Stow hero demo — a code-only, 12s looping screen recording.
 *
 * The story, in one breath: forty tabs are open and three of them are being used.
 * One click stows the window, the strip drains into the toolbar icon, and the
 * library opens with everything kept. A search finds the same trip tab across two
 * lists, and Restore all brings the Trip list back into a clean strip.
 *
 * Everything is a single 1280×720 stage (a 440×550 crop on phones) transformed
 * with one CSS transform per frame, so the whole loop is compositor work: no
 * video, no runtime images (only the real 32px icon as a data URI), no layout
 * thrash. Every beat is a function of `t`, and beat 7 fades a static duplicate of
 * frame zero over the stage so the 12s loop seam is pixel-identical.
 */
const ICON_32 = 'data:image/png;base64,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';
/* ---------- content: forty everyday tabs in three lists ---------- */

const LISTS = [
  {
    name: 'Trip',
    color: 'var(--sd-blue)',
    tabs: [
      { title: 'Lisbon flights – Google Flights', domain: 'google.com', fav: 'flights' },
      { title: 'Airbnb · Lisbon lofts', domain: 'airbnb.com', fav: 'airbnb' },
      { title: 'Booking.com – Lisbon', domain: 'booking.com', fav: 'booking' },
      { title: 'Lisbon – Google Maps', domain: 'maps.google.com', fav: 'maps' },
      { title: 'Time Out Lisbon', domain: 'timeout.com', fav: 'timeout' },
      { title: 'r/Lisbon – Reddit', domain: 'reddit.com', fav: 'reddit' },
      { title: 'Tripadvisor – Lisbon hotels', domain: 'tripadvisor.com', fav: 'tripadvisor' },
      { title: 'TAP Air Portugal', domain: 'flytap.com', fav: 'tap' },
      { title: 'Lisbon weather – 10 day', domain: 'weather.com', fav: 'weather' },
      { title: 'Tram 28 route guide', domain: 'lisbon.net', fav: 'tram' },
      { title: 'Hotel da Baixa', domain: 'hoteldabaixa.com', fav: 'hotel' },
    ],
  },
  {
    name: 'Work',
    color: 'var(--sd-pink)',
    tabs: [
      { title: 'Gmail – Inbox', domain: 'mail.google.com', fav: 'gmail' },
      { title: 'Slack – Stow', domain: 'slack.com', fav: 'slack' },
      { title: 'Q3 planning – Google Docs', domain: 'docs.google.com', fav: 'docs' },
      { title: 'Notion – Team wiki', domain: 'notion.so', fav: 'notion' },
      { title: 'Concur – flights and expenses', domain: 'concur.com', fav: 'concur' },
      { title: 'Google Calendar', domain: 'calendar.google.com', fav: 'calendar' },
      { title: 'Zoom – Meetings', domain: 'zoom.us', fav: 'zoom' },
      { title: 'Google Drive', domain: 'drive.google.com', fav: 'drive' },
      { title: 'Asana – Launch plan', domain: 'asana.com', fav: 'asana' },
      { title: 'Miro – Sprint board', domain: 'miro.com', fav: 'miro' },
      { title: 'Dropbox – Contracts', domain: 'dropbox.com', fav: 'dropbox' },
      { title: '1Password', domain: '1password.com', fav: 'onepw' },
      { title: 'Xero – Invoices', domain: 'xero.com', fav: 'xero' },
      { title: 'LinkedIn', domain: 'linkedin.com', fav: 'linkedin' },
    ],
  },
  {
    name: 'Shopping',
    color: 'var(--sd-green)',
    tabs: [
      { title: 'Amazon – Orders', domain: 'amazon.com', fav: 'amazon' },
      { title: 'IKEA – Desks', domain: 'ikea.com', fav: 'ikea' },
      { title: 'Zara', domain: 'zara.com', fav: 'zara' },
      { title: 'Uniqlo', domain: 'uniqlo.com', fav: 'uniqlo' },
      { title: 'eBay – Watchlist', domain: 'ebay.com', fav: 'ebay' },
      { title: 'Etsy – Prints', domain: 'etsy.com', fav: 'etsy' },
      { title: 'Apple', domain: 'apple.com', fav: 'apple' },
      { title: 'Wayfair – Rugs', domain: 'wayfair.com', fav: 'wayfair' },
      { title: 'Nike', domain: 'nike.com', fav: 'nike' },
      { title: 'Muji', domain: 'muji.com', fav: 'muji' },
      { title: 'Target', domain: 'target.com', fav: 'target' },
      { title: 'Argos', domain: 'argos.co.uk', fav: 'argos' },
      { title: 'John Lewis', domain: 'johnlewis.com', fav: 'johnlewis' },
      { title: 'H&M', domain: 'hm.com', fav: 'hm' },
      { title: 'Decathlon', domain: 'decathlon.com', fav: 'decathlon' },
    ],
  },
];

const TRIP_TABS = LISTS[0].tabs.map((tab) => ({ ...tab, color: LISTS[0].color }));
const MESS_TABS = LISTS.flatMap((list) => list.tabs.map((tab) => ({ ...tab, color: list.color })));
const TOTAL_TABS = MESS_TABS.length;
const LAYER_RESULT = [LISTS[0].tabs[0], LISTS[1].tabs[4]];

/* ---------- timeline (seconds) ---------- */

const DURATION = 12;
const STATIC_AT = 1.6;
const MOBILE_QUERY = '(max-width: 1024px)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const T_CUT = 5; // hard cut from the browser into the library
const STAGGER_MESS = 0.026;
const STAGGER_RESTORE = 0.05;
const QUERY = 'flights';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const seg = (t, start, end) => clamp((t - start) / (end - start));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const win = (t, a, b) => easeOut(seg(t, a, b));

const svg = (body, size = 16, viewBox = '0 0 16 16') =>
  `<svg width="${size}" height="${size}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const IC = {
  back: svg('<path d="M10.5 3.5 5.5 8l5 4.5"/>'),
  forward: svg('<path d="M5.5 3.5 10.5 8l-5 4.5"/>'),
  reload: svg('<path d="M13 8a5 5 0 1 1-1.6-3.7"/><path d="M13 2.5V5h-2.5"/>'),
  star: svg('<path d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2.2 6.5l4-.6L8 2.2Z"/>'),
  puzzle: svg('<path d="M3 3h3.5a1.5 1.5 0 1 1 3 0H13v3.5a1.5 1.5 0 1 0 0 3V13H3V3Z"/>'),
  menu: svg('<path d="M2.5 5h11M2.5 8h11M2.5 11h11"/>'),
  lock: svg('<rect x="3.5" y="7" width="9" height="6" rx="1.5"/><path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7"/>', 14),
  chev: svg('<path d="M4 6.5 8 10l4-3.5"/>'),
  chevRight: svg('<path d="M6.5 4 10 8l-3.5 4"/>'),
  plus: svg('<path d="M8 3.5v9M3.5 8h9"/>'),
  layers: svg('<path d="M8 2.5 14 6l-6 3.5L2 6l6-3.5Z"/><path d="M2.5 9.5 8 12.7l5.5-3.2"/>'),
  pin: svg('<path d="M9.5 2.5 13.5 6.5l-1.6.5-2.4 2.4-.4 2.6-3.8-3.8 2.6-.4L10.3 5.4l-.8-2.9Z"/>'),
  trash: svg('<path d="M3.5 5h9M6.5 5V3.5h3V5M5 5l.6 8h4.8L11 5"/>'),
  settings: svg('<circle cx="8" cy="8" r="2"/><path d="M8 2v1.6M8 12.4V14M2 8h1.6M12.4 8H14M3.8 3.8l1.1 1.1M11.1 11.1l1.1 1.1M12.2 3.8l-1.1 1.1M4.9 11.1l-1.1 1.1"/>'),
  shield: svg('<path d="M8 2.2 13 4v4.2c0 3-2.1 5-5 5.6-2.9-.6-5-2.6-5-5.6V4l5-1.8Z"/>'),
  arrowDown: svg('<path d="M8 3v9M4.5 8.5 8 12l3.5-3.5"/>'),
  search: svg('<circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/>'),
  ellipsis: svg('<circle cx="3.5" cy="8" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="12.5" cy="8" r="1"/>'),
  copy: svg('<rect x="5.5" y="5.5" width="8" height="8" rx="1"/><path d="M10.5 5.5v-2h-8v8h2"/>'),
  external: svg('<path d="M9 3h4v4M13 3 7.5 8.5"/><path d="M11.5 9.5V13H3V4.5h3.5"/>'),
  x: svg('<path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/>', 12),
};

const CURSOR = `<svg viewBox="0 0 24 28" aria-hidden="true"><path d="M2 2v19.2l5.1-4.8 3.1 7.4 3-1.2-3.1-7.2h6.7L2 2Z" fill="#0b0b0c" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

const CHROME_LOGO = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#fff"/><path d="M12 12 2.4 6.5A12 12 0 0 1 21.6 6.5L12 12Z" fill="#ea4335"/><path d="M12 12 21.6 6.5A12 12 0 0 1 12 24V12Z" fill="#fbbc05"/><path d="M12 12v12A12 12 0 0 1 2.4 6.5L12 12Z" fill="#34a853"/><circle cx="12" cy="12" r="5.2" fill="#fff"/><circle cx="12" cy="12" r="4" fill="#4285f4"/></svg>`;

/* ---------- favicons (micro tiles at 14px — a real 16px icon is mush) ---------- */

const FAVS = {
  flights: { bg: '#1a73e8', text: '✈', fs: 8 },
  airbnb: { bg: '#ff5a5f', text: 'A' },
  booking: { bg: '#003580', text: 'B' },
  maps: { bg: '#34a853', text: 'M' },
  timeout: { bg: '#d71921', text: 'T' },
  reddit: { bg: '#ff4500', text: 'r' },
  tripadvisor: { bg: '#34e0a1', text: 'T', fg: '#04392a' },
  tap: { bg: '#00a859', text: 'T' },
  weather: { bg: '#1a73e8', text: 'W' },
  tram: { bg: '#b3352b', text: 'T' },
  hotel: { bg: '#6b5a3e', text: 'H' },
  gmail: { bg: '#ea4335', text: 'M' },
  slack: { bg: '#4a154b', text: 'S' },
  docs: { bg: '#4285f4', text: 'D', fg: '#000000' },
  notion: { bg: '#2f2f2f', text: 'N', fg: '#ffffff' },
  concur: { bg: '#0057b8', text: 'C', fg: '#ffffff' },
  calendar: { bg: '#4285f4', text: 'C', fg: '#000000' },
  zoom: { bg: '#2d8cff', text: 'Z', fg: '#000000' },
  drive: { bg: '#fbbc05', text: 'D', fg: '#3c2d00' },
  asana: { bg: '#f06a6a', text: 'A', fg: '#000000' },
  miro: { bg: '#ffd02f', text: 'M', fg: '#3a2f00' },
  dropbox: { bg: '#0061ff', text: 'D', fg: '#ffffff' },
  onepw: { bg: '#1a8cff', text: '1', fg: '#000000' },
  xero: { bg: '#13b5ea', text: 'X', fg: '#04303a' },
  linkedin: { bg: '#0a66c2', text: 'in', fg: '#ffffff', fs: 6 },
  amazon: { bg: '#ff9900', text: 'a', fg: '#2b1a00' },
  ikea: { bg: '#0058a3', text: 'I', fg: '#ffffff' },
  zara: { bg: '#1a1a1a', text: 'Z', fg: '#ffffff' },
  uniqlo: { bg: '#ff0000', text: 'U', fg: '#000000' },
  ebay: { bg: '#e53238', text: 'e', fg: '#000000' },
  etsy: { bg: '#f1641e', text: 'E', fg: '#000000' },
  apple: { bg: '#1a1a1a', text: 'A', fg: '#ffffff' },
  wayfair: { bg: '#7f187f', text: 'W', fg: '#ffffff' },
  nike: { bg: '#1a1a1a', text: 'N', fg: '#ffffff' },
  muji: { bg: '#7f0019', text: 'M', fg: '#ffffff' },
  target: { bg: '#cc0000', text: 'T', fg: '#ffffff' },
  argos: { bg: '#e01a22', text: 'A', fg: '#ffffff' },
  johnlewis: { bg: '#1a1a1a', text: 'JL', fg: '#ffffff', fs: 6 },
  hm: { bg: '#e50010', text: 'H', fg: '#ffffff' },
  decathlon: { bg: '#0082c3', text: 'D', fg: '#000000' },
  youtube: { bg: '#ff0000', text: 'Y', fg: '#000000' },
  newtab: { bg: '#5f6368', text: '', fg: '#ffffff' },
  stow: { img: true },
};

function fav(kind, cls) {
  const f = FAVS[kind] || FAVS.newtab;
  if (f.img) {
    return `<span class="${cls}" aria-hidden="true"><img src="${ICON_32}" alt="" width="14" height="14" /></span>`;
  }
  const style = `background:${f.bg};color:${f.fg};${f.fs ? `font-size:${f.fs}px;` : ''}`;
  return `<span class="${cls}" aria-hidden="true" style="${style}">${f.text}</span>`;
}

/* ---------- browser chrome ---------- */

const MESS_W = 28;
const MESS_STEP = 29;
const PLUS_PAGE = 1180;
const PLUS_LIB = 196;
const RESTORE_X = 298;
const RESTORE_W = 71;
const RESTORE_STEP = 72;

function tabHTML(tab, { x, w, active, attrs = '', group = false, bare = false }) {
  return `<span class="sd-tab${active ? ' is-active' : ''}${bare ? ' sd-tab--mess' : ''}${group ? ' sd-tab--group' : ''}" style="left:${x}px;width:${w}px${
    group ? `;--g:${tab.color}` : ''
  }"${attrs}>
    <span class="sd-tab__bg"></span>
    ${fav(tab.fav, 'sd-tab__fav')}
    ${bare ? '' : `<span class="sd-tab__title">${tab.title}</span>`}
    ${bare ? '' : `<span class="sd-tab__x">${IC.x}</span>`}
    ${group ? '<span class="sd-tab__line"></span>' : ''}
  </span>`;
}

function messTabsHTML(live) {
  return MESS_TABS.map((tab, i) =>
    tabHTML(tab, {
      x: i * MESS_STEP,
      w: MESS_W,
      active: i === 0,
      bare: true,
      attrs: live ? ` data-mess="${i}"` : '',
    }),
  ).join('');
}

function restoredTabsHTML(live) {
  return TRIP_TABS.map((tab, i) =>
    tabHTML(tab, {
      x: RESTORE_X + i * RESTORE_STEP,
      w: RESTORE_W,
      group: true,
      attrs: live ? ` data-restored="${i}"` : '',
    }),
  ).join('');
}

function libTabHTML() {
  return `<span class="sd-libtab" data-libtab>
    <span class="sd-tab__bg"></span>
    <span class="sd-libtab__fresh">${fav('newtab', 'sd-tab__fav')}<span class="sd-tab__title">New tab</span></span>
    <span class="sd-libtab__stow">${fav('stow', 'sd-tab__fav')}<span class="sd-tab__title">Stow</span></span>
  </span>`;
}

function restoreChipHTML() {
  return `<span class="sd-group" data-restore-chip style="left:236px;width:58px;--g:var(--sd-blue)"><span class="sd-group__dot"></span>Trip</span>`;
}

function chromeHTML(live, reset = false) {
  return `<div class="sd-chrome">
    <div class="sd-tabstrip">
      ${messTabsHTML(live && !reset)}
      ${reset ? '' : libTabHTML()}
      ${reset ? '' : restoredTabsHTML(live)}
      ${reset ? '' : restoreChipHTML()}
      <span class="sd-plus"${live && !reset ? ' data-plus' : ''} style="transform:translate3d(${PLUS_PAGE}px,0,0)">${IC.plus}</span>
    </div>
    <div class="sd-toolbar">
      <span class="sd-tb">${IC.back}</span>
      <span class="sd-tb">${IC.forward}</span>
      <span class="sd-tb">${IC.reload}</span>
      <span class="sd-url">
        <span class="sd-lock">${IC.lock}</span>
        <span class="sd-url__text">
          <span class="sd-url__page"${live && !reset ? ' data-url-page' : ''}>google.com/travel/flights</span>
          <span class="sd-url__lib"${live && !reset ? ' data-url-lib' : ''}>stow</span>
        </span>
        <span class="sd-url__star">${IC.star}</span>
      </span>
      <span class="sd-tb">${IC.puzzle}</span>
      <span class="sd-tb sd-tb--stow"${live && !reset ? ' data-stow-btn' : ''}><span class="sd-hover"${live && !reset ? ' data-stow-hover' : ''}></span><img src="${ICON_32}" alt="" aria-hidden="true" width="18" height="18" /></span>
      <span class="sd-profile">S</span>
      <span class="sd-tb">${IC.menu}</span>
    </div>
  </div>`;
}

/* ---------- the everyday page under the tabs ---------- */

const GOOGLE_WORD = [
  ['G', '#4285f4'],
  ['o', '#ea4335'],
  ['o', '#fbbc05'],
  ['g', '#4285f4'],
  ['l', '#34a853'],
  ['e', '#ea4335'],
]
  .map(([letter, color]) => `<span style="color:${color}">${letter}</span>`)
  .join('');

const FLIGHTS = [
  { airline: 'TAP Air Portugal', code: 'TAP', bg: '#00a859', dep: '07:15', arr: '10:40', dur: '4h 25m', stops: 'Nonstop', price: '€148', bar: 46 },
  { airline: 'Ryanair', code: 'RYR', bg: '#073590', dep: '06:05', arr: '09:35', dur: '4h 30m', stops: 'Nonstop', price: '€96', bar: 48 },
  { airline: 'easyJet', code: 'EZY', bg: '#ff6600', dep: '12:20', arr: '15:55', dur: '4h 35m', stops: 'Nonstop', price: '€134', bar: 50 },
  { airline: 'Lufthansa', code: 'DLH', bg: '#05164d', dep: '08:50', arr: '14:05', dur: '5h 15m', stops: '1 stop', price: '€172', bar: 62 },
  { airline: 'Air France', code: 'AFR', bg: '#002157', dep: '15:10', arr: '20:05', dur: '5h 55m', stops: '1 stop', price: '€189', bar: 74 },
];

function flightRowHTML(f) {
  return `<div class="sd-fr">
    <span class="sd-fr__air"><i style="background:${f.bg}">${f.code}</i><b>${f.airline}</b></span>
    <span class="sd-fr__leg"><b>${f.dep}</b><em>ARN</em></span>
    <span class="sd-fr__bar"><i style="width:${f.bar}%"></i></span>
    <span class="sd-fr__leg"><b>${f.arr}</b><em>LIS</em></span>
    <span class="sd-fr__meta">${f.dur}<em>${f.stops}</em></span>
    <span class="sd-fr__price">${f.price}</span>
  </div>`;
}

function flightsHTML() {
  return `<div class="sd-site sd-flights" data-site="flights">
    <div class="sd-site__top">
      <span class="sd-wordmark">${GOOGLE_WORD}</span>
      <span class="sd-site__product">Flights</span>
      <nav class="sd-site__nav">
        <span class="is-on">Flights</span>
        <span>Hotels</span>
        <span>Vacation rentals</span>
        <span>Things to do</span>
      </nav>
      <span class="sd-site__user">S</span>
    </div>
    <div class="sd-flights__form">
      <span class="sd-field"><em>From</em><b>Stockholm</b></span>
      <span class="sd-field"><em>To</em><b>Lisbon</b></span>
      <span class="sd-field"><em>Depart</em><b>Thu 12 Jun</b></span>
      <span class="sd-field"><em>Return</em><b>Mon 16 Jun</b></span>
      <span class="sd-field"><em>Travellers</em><b>1 adult</b></span>
      <span class="sd-flights__go">Search</span>
    </div>
    <div class="sd-flights__body">
      <div class="sd-flights__head"><b>Best flights</b><span>Lisbon · round trip · 1 traveller</span></div>
      ${FLIGHTS.map(flightRowHTML).join('')}
      <div class="sd-flights__foot">Prices include taxes and fees · Sorted by top flights</div>
    </div>
  </div>`;
}

const TILES = [
  ['Gmail', 'gmail'],
  ['YouTube', 'youtube'],
  ['Maps', 'maps'],
  ['Amazon', 'amazon'],
  ['Slack', 'slack'],
  ['Notion', 'notion'],
  ['IKEA', 'ikea'],
  ['Drive', 'drive'],
];

function newTabHTML() {
  return `<div class="sd-site sd-newtab" data-site="newtab">
    <div class="sd-newtab__inner">
      <span class="sd-wordmark sd-wordmark--lg">${GOOGLE_WORD}</span>
      <div class="sd-newtab__search">${IC.search}<span>Search Google or type a URL</span></div>
      <div class="sd-newtab__tiles">
        ${TILES.map(([label, kind]) => `<span class="sd-tile">${fav(kind, 'sd-tile__fav')}<b>${label}</b></span>`).join('')}
      </div>
    </div>
  </div>`;
}

/* ---------- Stow library (real UI) ---------- */

function rowHTML(tab, d) {
  return `<div class="sd-row" data-r data-d="${d.toFixed(2)}">
    <span class="sd-check"></span>
    ${fav(tab.fav, 'sd-fav')}
    <span class="sd-title">${tab.title}</span>
    <span class="sd-domain">${tab.domain}</span>
    <span class="sd-rowactions">${IC.pin}${IC.trash}</span>
  </div>`;
}

function stackHTML({ name, color, tabs, open = true, fresh = false, base, rowBase = base, live = true, kind = 'all' }) {
  const rows = open ? `<div class="sd-tabs-list">${tabs.map((tab, i) => rowHTML(tab, rowBase + i * 0.035)).join('')}</div>` : '';
  const actions = live && kind === 'all' && fresh ? ' data-restore-actions' : '';
  const restore = live && kind === 'all' && fresh ? ' data-restore-all' : '';
  return `<section class="sd-stack"${live ? ' data-r' : ''} data-d="${base.toFixed(2)}">
    <div class="sd-stackhead">
      ${fresh ? `<span class="sd-fresh"${live ? ' data-fresh' : ''}></span>` : ''}
      <span class="sd-check"></span>
      <span class="sd-chev">${open ? IC.chev : IC.chevRight}</span>
      <span class="sd-stacktitle">${name}</span>
      <span class="sd-stackmeta"><span class="sd-rail__dot" style="--g:${color}"></span>${tabs.length} tabs</span>
      <span class="sd-stackactions"${actions}>
        <span class="sd-restoreall"${restore}>Restore all</span>
        <span class="sd-ellipsis">${IC.ellipsis}</span>
      </span>
    </div>
    ${rows}
  </section>`;
}

function libraryHTML() {
  const [trip, work, shop] = LISTS;
  return `<div class="sd-lib" data-lib>
    <header class="sd-top">
      <div class="sd-brand">
        <img src="${ICON_32}" alt="" aria-hidden="true" width="20" height="20" />
        <span class="sd-brand__name">stow</span>
        <span class="sd-brand__ver">v0.1.0</span>
      </div>
      <div class="sd-search" data-search>
        <span class="sd-search__prompt">&gt;</span>
        <span class="sd-search__text">
          <span class="sd-search__ph" data-ph>Search ${TOTAL_TABS} tabs…</span>
          <span class="sd-search__q" data-qtext></span>
          <span class="sd-search__caret"></span>
        </span>
        <span class="sd-search__kbd">/</span>
      </div>
      <span class="sd-stowbtn">
        <span class="sd-stowbtn__main">${IC.arrowDown}Stow this window</span>
        <span class="sd-stowbtn__split">${IC.chev}</span>
      </span>
    </header>
    <aside class="sd-rail">
      <div class="sd-rail__group">
        <div class="sd-rail__label">views<span>3</span></div>
        <div class="sd-rail__item is-on">${IC.layers}<span>All tabs</span><b>${TOTAL_TABS}</b></div>
        <div class="sd-rail__item">${IC.pin}<span>Pinned</span><b>2</b></div>
        <div class="sd-rail__item">${IC.trash}<span>Archive</span><b>9</b></div>
      </div>
      <div class="sd-rail__group">
        <div class="sd-rail__label">lists<span>3</span></div>
        ${LISTS.map(
          (list) => `<div class="sd-rail__stack"><span class="sd-rail__dot" style="--g:${list.color}"></span><span>${list.name}</span><b>${list.tabs.length}</b></div>`,
        ).join('')}
      </div>
      <div class="sd-rail__foot">
        <div class="sd-rail__privacy">${IC.shield}<span>On this device only</span></div>
      </div>
    </aside>
    <main class="sd-main">
      <div class="sd-reading">
        <div class="sd-pagehead" data-r data-d="5.08">
          <p class="sd-pagetitle">All tabs</p>
          <p class="sd-pagemuted" data-status>${TOTAL_TABS} tabs · 3 lists</p>
        </div>
        <div class="sd-lists">
          <div class="sd-layer sd-layer--all">
            ${stackHTML({ name: trip.name, color: trip.color, tabs: trip.tabs, fresh: true, base: 5.16, rowBase: 5.24 })}
            ${stackHTML({ name: work.name, color: work.color, tabs: work.tabs, open: false, base: 5.26 })}
            ${stackHTML({ name: shop.name, color: shop.color, tabs: shop.tabs, open: false, base: 5.34 })}
          </div>
          <div class="sd-layer sd-layer--res">
            ${stackHTML({ name: trip.name, color: trip.color, tabs: [LAYER_RESULT[0]], base: 5.2, rowBase: 5.3 })}
            ${stackHTML({ name: work.name, color: work.color, tabs: [LAYER_RESULT[1]], base: 5.3, rowBase: 5.4 })}
          </div>
        </div>
      </div>
    </main>
    <footer class="sd-status">
      <span class="sd-status__local"><i></i>Local</span>
      <b>~/stow</b>
      <span>${TOTAL_TABS} tabs</span>
      <span>3 lists</span>
      <span class="sd-hints"><span><kbd>/</kbd> search</span><span><kbd>↵</kbd> restore</span></span>
    </footer>
    <div class="sd-toast" data-toast-lib>Restored ${trip.tabs.length} tabs · ${trip.name}</div>
  </div>`;
}

/* ---------- HUD: the tab count and one caption per beat ---------- */

const CAPTIONS = [
  { text: '40 tabs open. 3 you’re using.', from: 0.06, to: 2.15 },
  { text: 'One click. Clean window.', from: 3.45, to: 4.95 },
  { text: 'Nothing lost.', from: 5.1, to: 6.95 },
  { text: 'Find anything.', from: 7, to: 9.35 },
  { text: 'Pick up where you left off.', from: 9.4, to: 10.85 },
];

function hudHTML() {
  return `<div class="sd-hud" data-hud style="opacity:0">
    <div class="sd-hud__count"><b data-count>12</b><span>tabs open</span></div>
    <div class="sd-hud__caps">
      ${CAPTIONS.map(
        (cap) => `<span class="sd-hud__cap" data-cap data-from="${cap.from}" data-to="${cap.to}" style="opacity:0">${cap.text}</span>`,
      ).join('')}
    </div>
  </div>`;
}

/* ---------- cursor + camera ---------- */

// `cx`/`cy` are the quadratic control point of the segment that STARTS at that key, not the one
// that arrives: a curve into (1193, 62) puts its control on the key before (1193, 62).
const CURSOR_KEYS = [
  { t: 0, x: 980, y: 260 },
  { t: 2.0, x: 986, y: 262, cx: 1130, cy: 250 },
  { t: 2.78, x: 1193, y: 62 },
  { t: 3.1, x: 1188, y: 68, cx: 1120, cy: 180 },
  { t: 4.35, x: 1030, y: 300 },
  { t: 4.9, x: 980, y: 330 },
  { t: 5.6, x: 900, y: 420, cx: 700, cy: 380 },
  { t: 6.75, x: 520, y: 96 },
  { t: 7.9, x: 560, y: 100, cx: 800, cy: 200 },
  { t: 9.4, x: 1080, y: 218 },
  { t: 9.9, x: 1078, y: 220 },
  { t: 10.7, x: 980, y: 330, cx: 1030, cy: 260 },
  { t: 11.4, x: 980, y: 260 },
  { t: 12, x: 980, y: 260 },
];

const CAM_KEYS_DESKTOP = [
  { t: 0, x: 640, y: 0, z: 2 },
  { t: 2.3, x: 636, y: 0, z: 2 },
  { t: 3.4, x: 634, y: 0, z: 2 },
  { t: 4.15, x: 0, y: 0, z: 1 },
  { t: 12, x: 0, y: 0, z: 1 },
];

const CAM_KEYS_MOBILE = [
  { t: 0, x: 840, y: 0 },
  { t: 2.6, x: 848, y: 0 },
  { t: 3.6, x: 760, y: 110 },
  { t: 4.2, x: 420, y: 80 },
  { t: 5.0, x: 320, y: 80 },
  { t: 6.4, x: 320, y: 80 },
  { t: 8.2, x: 320, y: 60 },
  { t: 8.9, x: 840, y: 140 },
  { t: 9.5, x: 840, y: 140 },
  { t: 10.1, x: 200, y: 0 },
  { t: 11.4, x: 200, y: 0 },
  { t: 11.75, x: 840, y: 0 },
  { t: 12, x: 840, y: 0 },
];

const CLICKS = [
  { t: 2.9, x: 1193, y: 60 },
  { t: 6.9, x: 520, y: 96 },
  { t: 9.5, x: 1080, y: 218 },
];

function cursorAt(t) {
  let i = 0;
  while (i < CURSOR_KEYS.length - 2 && t > CURSOR_KEYS[i + 1].t) i += 1;
  const a = CURSOR_KEYS[i];
  const b = CURSOR_KEYS[i + 1];
  const p = easeInOut(seg(t, a.t, b.t));
  const cx = a.cx === undefined ? (a.x + b.x) / 2 : a.cx;
  const cy = a.cy === undefined ? (a.y + b.y) / 2 : a.cy;
  const u = 1 - p;
  return {
    x: u * u * a.x + 2 * u * p * cx + p * p * b.x,
    y: u * u * a.y + 2 * u * p * cy + p * p * b.y,
  };
}

function camAt(t, mobile) {
  const keys = mobile ? CAM_KEYS_MOBILE : CAM_KEYS_DESKTOP;
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].t) i += 1;
  const a = keys[i];
  const b = keys[i + 1];
  const p = easeInOut(seg(t, a.t, b.t));
  return {
    x: lerp(a.x, b.x, p),
    y: lerp(a.y, b.y, p),
    z: mobile ? 1 : lerp(a.z || 1, b.z || 1, p),
  };
}

/* ---------- markup ---------- */

function liveHTML() {
  return `<div class="sd">
    <div class="sd-surface">
      <div class="sd-browser">
        ${chromeHTML(true)}
        <div class="sd-page">
          ${flightsHTML()}
          ${newTabHTML()}
          ${libraryHTML()}
        </div>
        <div class="sd-toast" data-toast-win style="opacity:0">Stowed ${TOTAL_TABS} tabs · 3 lists</div>
      </div>
    </div>
    <div class="sd-ripple"></div>
    <div class="sd-cursor">${CURSOR}</div>
    ${hudHTML()}
    ${resetHTML()}
  </div>`;
}

function resetHTML() {
  return `<div class="sd-reset" data-reset style="opacity:0">
    <div class="sd-surface" data-reset-surface>
      <div class="sd-browser">
        ${chromeHTML(false, true)}
        <div class="sd-page">${flightsHTML()}</div>
      </div>
    </div>
    <div class="sd-cursor" data-reset-cursor>${CURSOR}</div>
  </div>`;
}

function cache(root) {
  const all = (sel) => [...root.querySelectorAll(sel)];
  return {
    surface: root.querySelector('.sd-surface'),
    resetSurface: root.querySelector('[data-reset-surface]'),
    resetCursor: root.querySelector('[data-reset-cursor]'),
    lib: root.querySelector('[data-lib]'),
    reset: root.querySelector('[data-reset]'),
    cursor: root.querySelector('.sd-cursor:not([data-reset-cursor])'),
    ripple: root.querySelector('.sd-ripple'),
    hud: root.querySelector('[data-hud]'),
    count: root.querySelector('[data-count]'),
    caps: all('[data-cap]').map((node) => ({ node, from: Number(node.dataset.from), to: Number(node.dataset.to) })),
    messTabs: all('[data-mess]').map((node) => ({ node, i: Number(node.dataset.mess) })),
    libtab: root.querySelector('[data-libtab]'),
    plus: root.querySelector('[data-plus]'),
    restored: all('[data-restored]').map((node) => ({ node, i: Number(node.dataset.restored) })),
    chip: root.querySelector('[data-restore-chip]'),
    flights: root.querySelector('[data-site="flights"]'),
    newtab: root.querySelector('[data-site="newtab"]'),
    toastWin: root.querySelector('[data-toast-win]'),
    toastLib: root.querySelector('[data-toast-lib]'),
    urlPage: root.querySelector('[data-url-page]'),
    urlLib: root.querySelector('[data-url-lib]'),
    reveals: all('[data-r]').map((node) => ({ node, at: Number(node.dataset.d) })),
    fresh: root.querySelector('[data-fresh]'),
    restoreActions: all('[data-restore-actions]'),
    status: root.querySelector('[data-status]'),
    search: root.querySelector('[data-search]'),
    ph: root.querySelector('[data-ph]'),
    qtext: root.querySelector('[data-qtext]'),
    layerAll: root.querySelector('.sd-layer--all'),
    layerRes: root.querySelector('.sd-layer--res'),
    hover: root.querySelector('[data-stow-hover]'),
    stowImg: root.querySelector('[data-stow-btn] img'),
  };
}

/* ---------- mount ---------- */

const DEFAULTS = {
  autoplay: true,
  loop: true,
  theme: 'auto',
  speed: 1,
  startAt: 0,
  onComplete: null,
};

export function mountStowDemo(host, options = {}) {
  if (host.__stowDemo) return host.__stowDemo;

  const opts = { ...DEFAULTS, ...options };
  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  const reducedQuery = window.matchMedia(REDUCED_QUERY);
  const autoplay = opts.autoplay !== false && !host.hasAttribute('data-manual');

  host.innerHTML = liveHTML();
  const root = host.querySelector('.sd');
  const els = cache(root);

  let followsPage = opts.theme === 'auto';
  const state = {
    t: clamp(Number(opts.startAt) || 0, 0, DURATION),
    playing: false,
    done: false,
    raf: 0,
    last: 0,
    speed: opts.speed > 0 ? opts.speed : 1,
    loop: opts.loop !== false,
    visible: false,
    staticFrame: false,
    focus: false,
    typed: -1,
    layer: null,
    status: '',
    hover: false,
    count: -1,
  };

  const hostWidth = () => host.clientWidth || (mobileQuery.matches ? 440 : 1280);

  function pageTheme() {
    const attr = document.documentElement.dataset.theme;
    if (attr === 'light' || attr === 'dark') return attr;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(value) {
    followsPage = value === 'auto';
    root.dataset.theme = followsPage ? pageTheme() : value;
  }

  function render(t) {
    const mobile = mobileQuery.matches;
    const cam = camAt(t, mobile);
    const s = hostWidth() / (mobile ? 440 : 1280);
    const scale = s * (cam.z || 1);
    els.surface.style.transform = `translate3d(${(-cam.x * scale).toFixed(2)}px, ${(-cam.y * scale).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;

    // the seam layer holds the frame at t=0, so it takes that frame's camera, not the live one
    const cam0 = camAt(0, mobile);
    const scale0 = s * (cam0.z || 1);
    els.resetSurface.style.transform = `translate3d(${(-cam0.x * scale0).toFixed(2)}px, ${(-cam0.y * scale0).toFixed(2)}px, 0) scale(${scale0.toFixed(4)})`;
    const c0 = cursorAt(0);
    els.resetCursor.style.transform = `translate3d(${((c0.x - cam0.x) * scale0 - 2).toFixed(1)}px, ${((c0.y - cam0.y) * scale0 - 2).toFixed(1)}px, 0)`;

    // 4 — the library replaces the browser in one cut
    els.lib.style.opacity = t >= T_CUT ? '1' : '0';

    // 3 — the strip drains into the toolbar icon, right to left
    for (const { node, i } of els.messTabs) {
      const start = 3 + (TOTAL_TABS - 1 - i) * STAGGER_MESS;
      const p = easeOut(seg(t, start, start + 0.26));
      node.style.opacity = String(1 - p);
      node.style.transform = `translate3d(0, ${(-9 * p).toFixed(1)}px, 0) scale(${(1 - 0.06 * p).toFixed(3)})`;
    }

    // 3 — the one tab the window keeps, then the library opens in it
    els.libtab.style.opacity = String(win(t, 3.94, 4.04));
    els.libtab.classList.toggle('is-stow', t >= T_CUT);
    els.libtab.classList.toggle('is-active', t >= 3.94);

    // 3 — the flights tab closes, the new-tab page is what is left
    const clean = win(t, 3.86, 4.02);
    els.flights.style.opacity = String(1 - clean);
    els.newtab.style.opacity = String(clean);

    // 3 — the plus button follows the strip
    els.plus.style.transform = `translate3d(${t >= 4 ? PLUS_LIB : PLUS_PAGE}px,0,0)`;
    els.plus.style.opacity = String(1 - win(t, 3.9, 4.0) * (1 - win(t, 4.0, 4.1)));

    // 5 — search focuses, types, and the lists narrow to the matches
    const focus = t >= 6.9 && t < 10.6;
    if (focus !== state.focus) {
      els.search.classList.toggle('is-focus', focus);
      state.focus = focus;
    }
    const typed = Math.round(seg(t, 7, 7.78) * QUERY.length);
    if (typed !== state.typed) {
      els.qtext.textContent = QUERY.slice(0, typed);
      els.ph.style.opacity = typed ? '0' : '1';
      state.typed = typed;
    }
    const matched = t >= 7.9;
    if (matched !== state.layer) {
      els.layerAll.style.opacity = matched ? '0' : '1';
      els.layerRes.style.opacity = matched ? '1' : '0';
      state.layer = matched;
    }
    const status = matched ? '2 matches in 2 lists' : `${TOTAL_TABS} tabs · 3 lists`;
    if (status !== state.status) {
      if (els.status) els.status.textContent = status;
      state.status = status;
    }

    // 4 — the Trip list settles in with the accent wash
    els.fresh.style.opacity = String(win(t, 5.25, 5.75) * (1 - easeInOut(seg(t, 6.4, 6.9))));

    // 6 — Restore all comes alive under the cursor
    const hover = win(t, 9.05, 9.3) * (1 - win(t, 9.95, 10.15)) > 0.5;
    if (hover !== state.hover) {
      for (const node of els.restoreActions) node.classList.toggle('is-hover', hover);
      state.hover = hover;
    }

    // 6 — the Trip list pops back into the strip
    for (const { node, i } of els.restored) {
      const start = 9.55 + i * STAGGER_RESTORE;
      const p = easeOut(seg(t, start, start + 0.34));
      node.style.opacity = String(p);
      node.style.transform = `translate3d(0, ${(6 * (1 - p)).toFixed(1)}px, 0) scale(${(0.97 + 0.03 * p).toFixed(3)})`;
    }
    els.chip.style.opacity = String(easeOut(seg(t, 9.5, 9.8)));

    // toasts: the window one, then the library one
    const toastIn = win(t, 3.98, 4.22);
    els.toastWin.style.opacity = String(toastIn * (1 - easeIn(seg(t, 4.86, 5))));
    els.toastWin.style.transform = `translate3d(0, ${(6 * (1 - toastIn)).toFixed(1)}px, 0)`;
    els.toastLib.style.opacity = String(win(t, 9.62, 9.86) * (1 - easeIn(seg(t, 10.55, 10.8))));

    // 2/4 — the address bar stops being a site and becomes Stow
    els.urlPage.style.opacity = String(1 - win(t, 3.92, 4.02));
    els.urlLib.style.opacity = String(win(t, 4.98, 5.06));

    // 4 — the library content staggers in
    for (const { node, at } of els.reveals) {
      const p = easeOut(seg(t, at, at + 0.44));
      node.style.opacity = String(p);
      node.style.transform = `translate3d(0, ${(5 * (1 - p)).toFixed(2)}px, 0)`;
    }

    // 1/2 — the icon takes the click
    els.hover.style.opacity = String(0.12 * win(t, 2.02, 2.3) * (1 - win(t, 3.1, 3.4)));
    const press = win(t, 2.86, 2.95) * (1 - win(t, 3.0, 3.12));
    els.stowImg.style.transform = `scale(${(1 - 0.14 * press).toFixed(3)})`;

    // HUD: the count climbs to forty, then falls to zero
    els.hud.style.opacity = String(win(t, 0, 0.22) * (1 - easeIn(seg(t, 10.6, 10.85))));
    const climbed = lerp(12, TOTAL_TABS, easeOut(seg(t, 0, 1.9)));
    const value = Math.round(climbed * (1 - easeInOut(seg(t, 3.05, 4.2))));
    if (value !== state.count) {
      els.count.textContent = String(value);
      state.count = value;
    }
    for (const { node, from, to } of els.caps) {
      node.style.opacity = String(win(t, from, from + 0.2) * (1 - easeIn(seg(t, to - 0.2, to))));
    }

    // cursor + click feedback
    const c = cursorAt(t);
    let dip = 0;
    for (const click of CLICKS) {
      dip = Math.max(dip, win(t, click.t - 0.04, click.t + 0.1) * (1 - win(t, click.t + 0.1, click.t + 0.24)));
    }
    els.cursor.style.transform = `translate3d(${((c.x - cam.x) * scale - 2).toFixed(1)}px, ${((c.y - cam.y) * scale - 2).toFixed(1)}px, 0) scale(${(1 - 0.12 * dip).toFixed(3)})`;

    let ripple = null;
    for (const click of CLICKS) {
      const p = seg(t, click.t, click.t + 0.46);
      if (p > 0 && p < 1) ripple = { click, p };
    }
    if (ripple) {
      els.ripple.style.opacity = String((1 - ripple.p) * 0.7);
      els.ripple.style.transform = `translate3d(${((ripple.click.x - cam.x) * scale).toFixed(1)}px, ${((ripple.click.y - cam.y) * scale).toFixed(1)}px, 0) scale(${lerp(0.4, 2.1, easeOut(ripple.p)).toFixed(2)})`;
    } else {
      els.ripple.style.opacity = '0';
    }

    // 7 — fade frame zero back over the stage so the loop seam is invisible
    els.reset.style.opacity = String(easeInOut(seg(t, 11, 11.8)));
  }

  function tick(now) {
    state.raf = 0;
    if (!state.playing) return;
    const dt = state.last ? Math.min(0.06, (now - state.last) / 1000) : 0;
    state.last = now;
    let t = state.t + dt * state.speed;
    let finished = false;
    if (t >= DURATION) {
      if (state.loop) {
        t %= DURATION;
      } else {
        t = DURATION;
        finished = true;
      }
    }
    state.t = t;
    render(t);
    if (finished) {
      state.playing = false;
      state.done = true;
      if (typeof opts.onComplete === 'function') opts.onComplete({ time: DURATION, loops: 1 });
      return;
    }
    state.raf = requestAnimationFrame(tick);
  }

  function play() {
    if (state.playing || state.staticFrame) return;
    if (state.done && !state.loop) return;
    state.playing = true;
    state.last = 0;
    if (!state.raf) state.raf = requestAnimationFrame(tick);
  }

  function pause() {
    state.playing = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  function seek(t) {
    pause();
    state.t = ((Number(t) % DURATION) + DURATION) % DURATION;
    render(state.t);
  }

  function staticFrame() {
    state.staticFrame = true;
    pause();
    root.dataset.static = 'true';
    state.t = STATIC_AT;
    render(STATIC_AT);
  }

  if (reducedQuery.matches) staticFrame();
  else render(state.t);
  applyTheme(opts.theme);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        state.visible = entry.isIntersecting;
        if (state.visible) {
          if (autoplay && !state.staticFrame) play();
        } else if (state.playing) {
          pause();
        }
      }
    },
    { threshold: 0.02 },
  );
  io.observe(host);

  const ro = new ResizeObserver(() => render(state.t));
  ro.observe(host);

  const onReducedChange = () => {
    if (reducedQuery.matches) staticFrame();
    else if (autoplay) play();
  };
  reducedQuery.addEventListener('change', onReducedChange);

  const mo = new MutationObserver(() => {
    if (followsPage) root.dataset.theme = pageTheme();
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  if (document.fonts?.ready) document.fonts.ready.then(() => render(state.t));

  const api = {
    play,
    pause,
    seek,
    getTime: () => state.t,
    isPlaying: () => state.playing,
    duration: DURATION,
    setSpeed(value) {
      state.speed = value > 0 ? value : 1;
    },
    setLoop(value) {
      state.loop = Boolean(value);
      state.done = false;
    },
    setTheme(value) {
      applyTheme(value);
    },
    destroy() {
      pause();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      reducedQuery.removeEventListener('change', onReducedChange);
      delete host.__stowDemo;
      host.innerHTML = '';
    },
  };

  host.__stowDemo = api;
  return api;
}

function autoMount() {
  for (const host of document.querySelectorAll('[data-stow-demo]')) mountStowDemo(host);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoMount, { once: true });
} else {
  autoMount();
}

if (typeof window !== 'undefined') {
  window.StowHeroDemo = { mount: mountStowDemo, defaults: DEFAULTS };
}
