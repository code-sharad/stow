# Stow landing page

Status: implemented. The page is a static site in `landing/`, separate from the extension bundle.
The design brief is [`docs/brand/stow-landing-page-spec.md`](brand/stow-landing-page-spec.md); this
file records the shipped copy, screenshots, and checks.

## Job

One page, one decision: add Stow from the browser's extension store.

- Audience: people with 30–300 tabs open who want to clear them without losing the work.
- Promise: close the tabs, keep the work, keep it local.
- Primary CTA: **Add to Chrome** / **Add to Firefox** — a browser-aware store link in the hero,
  header, and mobile panel.
- Secondary CTA: **View source**.
- Non-goals: account creation, newsletter, pricing, testimonials, comparison tables, AI claims.

## Page flow

```text
header: stow · how it works · features · privacy · [Add to Chrome / Firefox]
hero:   Close every tab. / Keep every page.
        centered copy · store CTA + view source · trust line · compatibility
        full-width live 18s hero demo (real UI, no video, no labels)
benefits: three columns — only the tabs you're using / a lighter browser / nothing lost
        (outcome strip between the demo and how-it-works)
how:    three rows — Stow / Find / Restore, each with a real UI capture
        A calmer browser in three steps.
features: six-cell grid — Capture / Search / Organize / Restore / Import-export / Keyboard
questions: six-question list — Stow vs Chrome, saving all tabs, tab groups, sync, uninstalling,
        importing an OneTab list (matches the FAQPage JSON-LD word for word)
privacy: three promises + local-only ledger table (no screenshot)
footer: stow · local-first tab manager · source · questions · privacy · changelog · v0.1.0
```

The ordering is deliberate: the questions section sits between features and privacy because
people who are evaluating a tab manager ask exactly these things, and the answers are the
factual core the page is competing on. It is a definition list, not a FAQ accordion: nothing is
hidden behind a click, so the text is in the initial HTML for readers and crawlers alike.

## Copy deck

Keep labels lowercase and prose in sentence case. Use **list**, not "stack", in reader-facing copy.

### Header

- Brand: `stow`
- Desktop nav: `how it works`, `features`, `privacy`
- CTA: `Add to Chrome` / `Add to Firefox` — browser-aware; the store link is in the header,
  hero, and mobile panel. The extension is not listed yet, so `main.js` points at the Chrome
  Web Store and Firefox Add-ons search results until the two published listing URLs are set.
- Mobile: `menu` / `close`, panel with numbered links, full-width store CTA

### Hero

- Kicker: `A local-first tab manager` — a centered square badge above the H1 (hero only; no
  dash; section eyebrows keep their left-aligned orange dash).
- Title tag: `Stow — a local-first Chrome tab manager` — the keyword title stays; the H1 carries
  the promise. Do not put the slogan back in the title (the SEO audit explains why).
- H1: `Close every tab.` / `Keep every page.` — the promise, not the demo, and concrete on both
  halves: "every" removes the fear of losing a tab, "page" names what you keep. The lede says how.
  Both lines are 16 characters, so the centered hero stays balanced.
- Lede: `Forty tabs open, three you're actually using. Stow is a browser extension that saves the
  whole window as one searchable list, closes the tabs, and restores any of them later — one page,
  a selection, or all of them.`
- Why the lede opens on the pain: the visitor arrives with too many tabs, not with curiosity about
  a browser extension. Name the situation first, then the product category, then the mechanic,
  then the restore. Keep `browser extension` in the sentence — it is the query language the
  title cannot hold.
- Layout: centered copy above the full-width demo; no right-column illustration and no labels
  around the animation.
- Primary: `Add to Chrome` / `Add to Firefox`
- Secondary: `View source ↗`
- Trust line: `No account · No cloud · No tracking`
- Compatibility: `Chrome 120+ · Firefox 140+ · Works offline`

### Benefits strip

- Sits directly after the hero demo, before `how it works`: three outcome cells in one bordered
  band, no heading (a definition list, so it adds no h3 before the first h2).
- Cells:
  1. `Only the tabs you're using.` — the working window stops competing with the tabs saved for
     later.
  2. `A lighter browser.` — Stow closes the tab rather than hiding it, so saved pages stop using
     memory.
  3. `Nothing lost.` — every tab is saved with title, URL, and favicon before it closes.
- Copy rule: benefits describe what changes for the person, features describe what the extension
  does. Do not repeat the three steps here.

### Hero demo

- Files: `landing/hero-demo.js`, `landing/hero-demo.css`, `landing/demo.html`; usage and timing
  knobs are in `landing/HERO-DEMO.md`.
- Stage: 1280×720. At desktop it is 16:9; at ≤1024px it becomes a 4:5 host with a 440×550 camera
  crop that follows the action. The library keeps the real grid: rail 220px, topbar 60px, status
  26px, reading text x=346 through x=1154, stack heads 34px, rows 30px.
- Story: fifteen crowded tabs → Stow toolbar click (the default stows the whole window, no popup) →
  the library auto-opens → `indexeddb` search → `2 matches in 2 lists` → Docs `Restore all` →
  `Restored 5 tabs.` → the restored Docs tab → clean browser. A duplicate opening frame crossfades
  in at 16.9–17.75s, so the 18/0 seam is effectively pixel-identical.
- Presentation: no shot bar or caption. The copy above carries the explanation and the animation
  is the whole visual; the figure keeps its thin border.
- No-JS and first paint use the real library screenshot fallback; the module replaces it and pauses
  offscreen. On `file://`, Chrome blocks the module, so the inline `.is-file` class keeps the fallback
  visible and adds a “serve over HTTP” note. Reduced motion renders the static payoff at 13.6s. The
  host is a labelled `role="img"`; the stage is `aria-hidden` and contains no focusable controls.
- This is a scripted reconstruction from the real components and tokens, not a capture. It must
  stay in sync with them; do not add UI Stow does not have.

### How it works

- Eyebrow: `How it works`
- H2: `A calmer browser in three steps.`
- Lede: `Stow saves every tab in the window as one list you can search. Find any of them later,
  then restore one tab or the whole list.`

1. **Stow** — `Save every tab in the window.`
   `Every eligible tab is saved into Stow as one list, and the window closes. Pinned tabs stay
   exactly where you put them.` · `Alt Shift S — save window`
2. **Find** — `Find any tab you saved.`
   `All the tabs you save live in Stow, searchable by title, URL, domain, or list name. The index
   stays in your browser, so results appear as you type.` · `Ctrl/Cmd K — search from anywhere`
3. **Restore** — `Bring back one tab, or the whole list.`
   `Restore a single tab, a selection, or an entire list to the current window or a new one. Remove
   it from Stow afterward if you like.` · `Alt Shift L — open library`

### Features

- Eyebrow: `Features`
- H2: `Everything you need to put tabs away—and find them again.`
- Lede: `A small set of tools for the whole life of a tab in Chrome and Firefox: capture it,
  organize it, search it, and put it back.`

| Label | H3 | Body |
| --- | --- | --- |
| Capture | Save the whole window. | One shortcut saves every eligible tab as a list and closes the clutter. Pinned tabs stay open. |
| Search | Find it from half a memory. | Search titles, URLs, domains, and list names. No account, no server round trip, no waiting. |
| Organize | Keep related tabs together. | Shape a list around a project, then keep it out of the way. Your structure survives restarts and updates. |
| Restore | Pick up where you left off. | Bring back one page, selected tabs, or a complete list. Choose the current window or a fresh one. |
| Import / export | Bring your existing tabs with you. | Import a OneTab list, bookmarks HTML, or Markdown, or export everything as a JSON backup whenever you want a copy you own. |
| Keyboard | Keep your hands on the keys. | The library is built to be driven from the keyboard, from the first capture to the final restore. |

Shortcut rows: `Alt Shift S` save window, `Alt Shift T` save this tab, `Ctrl/Cmd K` commands,
`/` focus search, `Alt Shift L` open library, `Esc` clear search or selection.

Organize capabilities: rename, pin, lock, and collapse; reorder lists and move tabs between them;
dedupe saved tabs.
Restore capabilities: restore one tab or a selection; restore a whole list; copy links.
Import formats: OneTab, Markdown, Bookmarks HTML, Stow JSON.

### Questions

- Eyebrow: `Questions`
- H2: `Questions, answered.`
- Lede: `Short answers to what people ask before they move forty tabs into Stow.`
- Shape: `<div class="faq">` with `<div class="faq-item"><h3>` / `<p>` rows; one column below
  768px, a 34%/1fr grid above it. Headings, not `<dl>`, because a `<dt>` may not contain heading
  content and these questions need to sit in the document outline.

| H3 | Answer |
| --- | --- |
| Is Stow a Chrome extension? | Yes. Stow is a browser extension for Chrome 120+ and Firefox 140+, and it works offline. It adds no account, no cloud sync, and no analytics to your browser. |
| How do I save all open tabs in Chrome? | Press Alt Shift S, or open the Stow popup and save the window. Stow stores every eligible tab as one list, then closes those tabs; pinned tabs stay open. Chrome's own Ctrl Shift D bookmarks every tab but leaves them open and running. |
| How is Stow different from Chrome tab groups? | Tab groups organize tabs that are still open. Stow closes them: each list lives in the library, survives restarts, and restores a single tab, a selection, or the whole list. |
| Does Stow sync my tabs to another device? | No. Lists stay in your browser's own storage. There is no Stow server, so export a JSON backup and move the file yourself if you want the lists elsewhere. |
| What happens to my lists if I uninstall Stow? | Uninstalling the extension removes its storage, including every saved list. Export a JSON backup before you uninstall if you want to keep them. |
| Can I import tabs I saved with OneTab? | Yes. Stow imports OneTab exports, bookmarks HTML, Markdown lists, and its own JSON backups, so an existing shelf can move over in one step. |

Every answer states only what the extension already does. The same six answers are in the
`FAQPage` JSON-LD in `landing/index.html`, so a copy edit has to change both; `pnpm check:landing`
fails if the question sets drift apart.

### Privacy

- Eyebrow: `Privacy`
- H2: `Your tabs stay on your device.`
- Lede: `Stow keeps your library inside your browser. There is no Stow account, no cloud sync,
  and no analytics. The ledger below is the whole story.`
- Promises: `No account.` — `There is nothing to sign up for. Install Stow, save a window, and
  your library is there.`; `No cloud.` — `Lists live in your browser's own storage, not on a
  Stow server. Backups are files you choose to export.`; `No tracking.` — `No analytics, no
  telemetry. The extension contains no network code, so there is nothing to send.`
- Ledger: `local only` · `Nothing in this table leaves your browser.`
- Footnote: `Uninstalling Stow removes its library. Export a JSON backup first if you want a copy.`
- No screenshot: the three promises and the ledger carry the section.

| Data | Where it is stored | Sent to Stow servers |
| --- | --- | --- |
| Saved tabs and lists | Browser extension storage (IndexedDB) | No |
| Preferences | Browser-local storage | No |
| Optional backup files | A download location you choose | No |
| Favicons | Your browser's local favicon cache | No |

### Footer

`stow` · `local-first tab manager` · `source` · `questions` · `privacy` · `changelog` · `v0.1.0 · © 2026 Stow`

## Screenshots

The Library, popup, search, and restore images are current-build captures, not
reconstructions. They are stored in `landing/assets/` as WebP with explicit `width`/`height`
attributes. The hero demo is a scripted reconstruction from the same components and tokens; the
library images serve as its no-JS fallback. The step images remain current-build captures. The
former privacy WebPs are no longer used by the page.

| File | Size | Shows | Used in |
| --- | --- | --- | --- |
| `library-dark.webp`, `library-light.webp` | 1440×900 | Library with Docs, Design, Build | Hero demo, no-JS fallback (desktop) |
| `library-mobile-dark.webp`, `library-mobile-light.webp` | 390×844 | Library mobile crop | Hero demo, no-JS fallback (≤639px) |
| `popup-dark.webp`, `popup-light.webp` | 360×274 | Quick capture popup | Step 01 |
| `search-step-dark.webp`, `search-step-light.webp` | 720×520 | Search `web`, 4 matches in 2 lists | Step 02, desktop |
| `search-mobile-dark.webp`, `search-mobile-light.webp` | 390×844 | Search mobile crop | Step 02, ≤639px |
| `restore-step-dark.webp`, `restore-step-light.webp` | 720×520 | Tab selected, bulk restore bar | Step 03, desktop |
| `restore-mobile-dark.webp`, `restore-mobile-light.webp` | 390×844 | Restore mobile crop | Step 03, ≤639px |
| `og.png` | 1200×630 | Social card | `og:image` |
| `icon.png`, `favicon.png` | 128, 32 | Brand | Header, footer, favicon |

Regenerate the captures from the built extension:

```sh
pnpm build
node scripts/capture-landing.mjs
```

The capture script drives `.output/chrome-mv3` in Chromium, seeds grouped tabs, stows a window, and
writes light/dark desktop and mobile images. It requires Chromium at `/usr/bin/chromium` (or
`CHROMIUM_PATH`) and ImageMagick `magick`. The old authored stills are intentionally gone; do not
reintroduce fake browser chrome or mocked library content. The hero demo is the one authored
interface: it is code-built from the real components and tokens, not a capture, and must stay in
sync with them. The step images remain real captures.

## Implementation notes

- Files: `landing/index.html`, `landing/styles.css`, `landing/main.js`, `landing/hero-demo.js`,
  `landing/hero-demo.css`, `landing/demo.html`, `landing/HERO-DEMO.md`, `landing/sitemap.xml`,
  `landing/robots.txt`, `landing/google3d833a44d7eced00.html` (Search Console verification), and
  `scripts/subset-landing-font.sh` for the font.
- Static HTML/CSS plus `main.js` for the mobile menu, current year, scrollspy, reveals, and the
  browser-aware store link, and the `hero-demo.js` module for the hero. All content is visible
  without JavaScript; without it the demo falls back to the library screenshot, and on small
  screens a static `<noscript>` nav replaces the menu toggle. The page is intended to be served
  over HTTP: from `file://` Chrome blocks external scripts and fonts, so the hero demo shows its
  library fallback plus a “serve over HTTP” note.
- Tokens, type scale, spacing, and the one-accent rule follow the branding spec. Inter is
  self-hosted from `landing/assets/inter-var.woff2`, which is a Latin subset of
  `public/fonts/inter-var.woff2` (65 KB instead of 351 KB, same 100–900 weight axis). Rebuild it
  with `./scripts/subset-landing-font.sh` after changing the unicode list in that script. Mono is
  system UI mono.
- Search metadata is part of the page, not an afterthought: the `<title>` (`Stow — a local-first
  Chrome tab manager`), the description, `robots`, canonical, Open Graph, Twitter card, and two
  JSON-LD blocks (`SoftwareApplication` and `FAQPage`) all live in `<head>`. Keep the H1 a slogan
  and put the category words in the title, description, hero lede, and questions. See
  [`docs/SEO.md`](SEO.md) for the audit and the reasoning.
- `landing/demo.html` is a development page for the hero animation and is `noindex`; publish-time
  staging in `.github/workflows/pages.yml` also drops `demo.html` and `HERO-DEMO.md` from the
  uploaded artifact, so neither is served from the live site.
- No analytics, cookies, third-party embeds, or network calls after load.
- Header is 56px desktop / 52px mobile and sticky. Content is capped at 1120px with 32/20px gutters.
- Hero, step, feature, and privacy layouts collapse at 1023, 767, and 639px. The hero demo
  switches to its 4:5 camera at 1024px (the site's compact breakpoint), max 480px wide. The privacy
  grid becomes one column at 1023px; the ledger table becomes labelled rows below 640px.
- Reveals are opacity/translate only, 180ms, and removed under `prefers-reduced-motion`. Images
  below the fold are lazy-loaded.
- Accessibility: one H1, semantic landmarks, skip link, descriptive alt text, visible focus, menu
  `aria-expanded`/`aria-controls`, Escape closes the menu and restores focus, table headers and
  mobile data labels, WCAG 2.2 AA contrast. The hero demo host is a labelled `role="img"`, its
  stage is `aria-hidden` with no focusable controls, it pauses offscreen, and reduced motion gets a
  static payoff frame.

## Checks

```sh
pnpm check:landing
```

The checker serves `landing/` on port 4178 and tests 320, 375, 640, 768, and 1440px in dark and
light with reduced motion. It asserts:

- no horizontal overflow
- the H1 and at least five content screenshots
- every content image has alt text and intrinsic dimensions
- every image loads
- Inter is active
- no console errors, page errors, or failed requests
- axe has no WCAG 2.0/2.1 A or AA violations
- the mobile menu opens, Escape closes it, and focus returns to the toggle
- without JavaScript, the static nav shows, the toggle is hidden, and reveals are visible
- reveals become visible
- search metadata: title and description length and keywords, canonical, `robots`, `og:image`,
  `twitter:card`, both JSON-LD blocks parse, `SoftwareApplication` keeps its category and price,
  the `FAQPage` questions match the visible questions in order and count, the sitemap lists only
  the canonical URL with a `lastmod`, `robots.txt` keeps its sitemap line, `demo.html` stays
  `noindex`, the `google*.html` verification file exists and holds exactly
  `google-site-verification: <its own file name>`, no heading level is skipped, no id is
  duplicated, and every `#anchor` resolves

The Search Console file must stay at the root of `landing/` (served at
`/stow/google3d833a44d7eced00.html`) and must keep its exact name, because Google compares the
body against the URL it was given. It verifies the URL-prefix property
`https://code-sharad.github.io/stow/` only.

The page is ready to deploy as-is once the captures and checks pass. Keep `docs/brand` as the
source of truth; update this file when shipped copy or screenshots change.
