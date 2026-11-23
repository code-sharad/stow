# Stow landing page

Status: implemented. The page is a static site in `landing/`, separate from the extension bundle.
The design brief is [`docs/brand/stow-landing-page-spec.md`](brand/stow-landing-page-spec.md); this
file records the shipped copy, screenshots, and checks.

## Job

One page, one decision: install Stow.

- Audience: people with 30–300 tabs open who want to clear them without losing the work.
- Promise: close the tabs, keep the work, keep it local.
- Primary CTA: **Download for Chrome** → latest GitHub release.
- Secondary CTA: **View source**.
- Non-goals: account creation, newsletter, pricing, testimonials, comparison tables, AI claims.

## Page flow

```text
header: stow · how it works · features · privacy · install · local-only · [Download]
hero:   Close the tabs. / Keep the work.
        copy · CTAs · trust line · compatibility
        example receipt (tabs captured, saved lists, restored, storage, network 0)
        real Library screenshot
how:    three rows — Stow / Find / Restore, each with a real UI capture
        A calmer browser in three steps.
features: six-cell grid — Capture / Search / Organize / Restore / Import-export / Keyboard
privacy: copy + local-only callout + data table + real settings capture
install: Chromium package card + Firefox source card
footer: stow · local-first tab manager · source · privacy · changelog · v0.1.0
```

## Copy deck

Keep labels lowercase and prose in sentence case. Use **list**, not "stack", in reader-facing copy.

### Header

- Brand: `stow`
- Desktop nav: `how it works`, `features`, `privacy`, `install`
- Status: `local-only`
- CTA: `Download for Chrome`
- Mobile: `menu` / `close`, panel with numbered links, full-width CTA, `v0.1.0 · local-only`

### Hero

- Kicker: `A local-first tab manager`
- H1: `Close the tabs.` / `Keep the work.`
- Lede: `Stow saves your open tabs as searchable lists, so you can clear the clutter and return to
  what matters whenever you need it.`
- Primary: `Download for Chrome`
- Secondary: `View source ↗`
- Trust line: `No account · No cloud · No tracking`
- Compatibility: `Chrome 120+ · Firefox 140+ from source · Works offline after install`

### Receipt

A decorative, `example`-labelled summary. These are example values, not a measured claim.

```text
stow --example                                      example
tabs captured                                            11
saved lists                                               3
tabs restored                                             6
storage                                       browser profile
network requests                                          0
Example values. Nothing leaves this browser.
```

### Hero screenshot

- Strip: `library.html` / `actual extension UI`
- Source: current build, light/dark, desktop and mobile crop
- Alt: `Stow's library showing saved tabs grouped into three lists: Docs, Design, and Build.`
- Caption: `Library — Your saved tabs, grouped into searchable lists.`

### How it works

- Eyebrow: `How it works`
- H2: `A calmer browser in three steps.`
- Lede: `Save the window. Find the page. Put it back. Stow stays out of the way in between.`

1. **Stow** — `Save the whole window.`
   `Capture every eligible tab as one list and close the clutter. Pinned tabs stay exactly where you
   put them.` · `Alt Shift S — save window`
2. **Find** — `Find it from half a memory.`
   `Search titles, URLs, domains, and list names. The index lives in your browser, so results arrive
   as you type.` · `Ctrl/Cmd K — search from anywhere`
3. **Restore** — `Bring back the page, or the whole list.`
   `Restore one tab, a selection, or an entire list. Send it to the current window or a new one, and
   remove it from Stow afterward if you like.` · `Alt Shift L — open library`

### Features

- Eyebrow: `Features`
- H2: `Everything you need to put tabs away—and find them again.`
- Lede: `A small set of tools for the whole life of a tab: capture it, organize it, search it, and put
  it back.`

| Label | H3 | Body |
| --- | --- | --- |
| Capture | Save the whole window. | One shortcut saves every eligible tab as a list and closes the clutter. Pinned tabs stay open. |
| Search | Find it from half a memory. | Search titles, URLs, domains, and list names. No account, no server round trip, no waiting. |
| Organize | Keep related tabs together. | Shape a list around a project, then keep it out of the way. Your structure survives restarts and updates. |
| Restore | Pick up where you left off. | Bring back one page, selected tabs, or a complete list. Choose the current window or a fresh one. |
| Import / export | Bring your existing tabs with you. | Import an existing shelf, or export everything as a JSON backup whenever you want a copy you own. |
| Keyboard | Keep your hands on the keys. | The library is built to be driven from the keyboard, from the first capture to the final restore. |

Shortcut rows: `Alt Shift S` save window, `Alt Shift T` save this tab, `Ctrl/Cmd K` commands,
`/` focus search, `Alt Shift L` open library, `Esc` clear search or selection.

Organize capabilities: rename, pin, lock, and collapse; reorder lists and move tabs between them;
dedupe saved tabs.
Restore capabilities: restore one tab or a selection; restore a whole list; copy links.
Import formats: OneTab, Markdown, Bookmarks HTML, Stow JSON.

### Privacy

- Eyebrow: `Privacy`
- H2: `Your tabs stay on your device.`
- Lede: `Stow is designed to keep your browsing library local to your browser profile. It does not
  need an account or a Stow-hosted server to save and restore your tabs.`
- Callout: `local only` — `No account. No server. No network requests.`
- Footnote: `Uninstalling Stow removes its library. Export a JSON backup first if you want a copy.`

| Data | Where it is stored | Sent to Stow servers |
| --- | --- | --- |
| Saved tabs and lists | Browser extension storage (IndexedDB) | No |
| Preferences | Browser-local storage | No |
| Optional backup files | A download location you choose | No |
| Favicons | Your browser's local favicon cache | No |

Caption: `In the product — The privacy promise is part of the settings, not just the marketing page.`

### Install

- Eyebrow: `Install`
- H2: `Get started in a minute.`
- Lede: `Download the packaged build for Chrome, or build the Firefox package from source. Both keep
  the same library local to that browser.`

Chromium card:

1. Download the latest release and unzip `stow-0.1.0-chrome.zip`.
2. Open `chrome://extensions` and turn on Developer mode.
3. Choose **Load unpacked** and select the unzipped folder.
4. Pin Stow and press `Alt Shift S` to save a window.

CTA: `Download for Chrome` · meta `v0.1.0 · Chrome 120+`

Firefox card:

```sh
pnpm install
pnpm zip:firefox
```

1. The build lands in `.output/firefox-mv3`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Choose **Load Temporary Add-on** and open the manifest.

CTA: `Build instructions ↗` · meta `Firefox 140+ · temporary add-on`

Note: `Both builds use the same local database. Nothing syncs between browsers—or anywhere else.`

Firefox is source-only until it is publicly listed. Do not present a Firefox install button.

### Footer

`stow` · `local-first tab manager` · `source` · `privacy` · `changelog` · `v0.1.0 · © 2026 Stow`

## Screenshots

All content images are current-build captures, not reconstructions. They are stored in
`landing/assets/` as WebP with explicit `width`/`height` attributes.

| File | Size | Shows | Used in |
| --- | --- | --- | --- |
| `library-dark.webp`, `library-light.webp` | 1440×900 | Library with Docs, Design, Build | Hero, desktop |
| `library-mobile-dark.webp`, `library-mobile-light.webp` | 390×844 | Library mobile crop | Hero, ≤639px |
| `popup-dark.webp`, `popup-light.webp` | 360×274 | Quick capture popup | Step 01 |
| `search-step-dark.webp`, `search-step-light.webp` | 720×520 | Search `web`, 4 matches in 2 lists | Step 02, desktop |
| `search-mobile-dark.webp`, `search-mobile-light.webp` | 390×844 | Search mobile crop | Step 02, ≤639px |
| `restore-step-dark.webp`, `restore-step-light.webp` | 720×520 | Tab selected, bulk restore bar | Step 03, desktop |
| `restore-mobile-dark.webp`, `restore-mobile-light.webp` | 390×844 | Restore mobile crop | Step 03, ≤639px |
| `privacy-dark.webp`, `privacy-light.webp` | 374×79 | Settings About block | Privacy |
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
reintroduce fake browser chrome or mocked library content.

## Implementation notes

- Files: `landing/index.html`, `landing/styles.css`, `landing/main.js`, `landing/sitemap.xml`.
- Static HTML/CSS plus a small script for the mobile menu, current year, scrollspy, and reveals.
  All content is visible without JavaScript; on small screens a static `<noscript>` nav replaces the
  menu toggle. The page works from `file://` apart from smooth anchors.
- Tokens, type scale, spacing, and the one-accent rule follow the branding spec. Inter is
  self-hosted from `landing/assets/inter-var.woff2`; mono is system UI mono.
- No analytics, cookies, third-party embeds, or network calls after load.
- Header is 56px desktop / 52px mobile and sticky. Content is capped at 1120px with 32/20px gutters.
- Hero, step, feature, privacy, and install layouts collapse at 959, 767, and 639px. The privacy
  table becomes labelled rows below 640px.
- Reveals are opacity/translate only, 180ms, and removed under `prefers-reduced-motion`. Images
  below the fold are lazy-loaded.
- Accessibility: one H1, semantic landmarks, skip link, descriptive alt text, visible focus, menu
  `aria-expanded`/`aria-controls`, Escape closes the menu and restores focus, table headers and
  mobile data labels, WCAG 2.2 AA contrast.

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

The page is ready to deploy as-is once the captures and checks pass. Keep `docs/brand` as the
source of truth; update this file when shipped copy or screenshots change.
