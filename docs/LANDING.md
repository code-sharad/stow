# Stow landing page specification

Status: build-ready. The landing page is a separate static site; it is not shipped inside the
extension. It follows the same console language as the Library: flat rules, one accent, real
product screenshots, and authored stills for the moments a screenshot cannot show.

## 1. Job

One page, one decision: install Stow.

- Audience: people with 30–300 tabs open who already use a terminal or a keyboard-driven editor.
- Promise: close the tabs, keep the work, never send it anywhere.
- Primary CTA: **Load unpacked** (until a store listing exists).
- Secondary CTA: **Read the source**.
- Non-goals: account creation, newsletter, pricing, testimonials, comparison table, AI claims.

## 2. Page flow

```text
┌──────────────────────────────────────────────────────────────┐
│ ▪ stow        01 the parts   02 the ledger   local-only [load] │  52px bar
├──────────────────────────────────────────────────────────────┤
│  ❯ stow --save                                               │
│  Close the tabs.            ┌ stow --window        demo ┐    │
│  Keep the work.             │ tabs open             23  │    │
│                             │ stacks saved           4  │    │
│  Stow saves a whole window  │ tabs closed           23  │    │
│  as searchable stacks…      │ network requests       0  │    │
│                             └ every tab written…       ┘    │
│  [ load unpacked ]  $ read the source                        │
│  Chrome 120+ · works offline after install                   │
│                                                              │
│  ┌ library.html ───────────────────── the actual library ┐   │
│  │ [real Library screenshot, light and dark]            │   │
│  └──────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│ 01 / THE PARTS                                               │
│ The tabs you close are still there.                          │
│ ┌───────────────┬───────────┐                                │
│ │ stow still    │ 0 network │                                │
│ ├───────┬───────┼───────────┤                                │
│ │ find  │ safe  │ move in   │                                │
│ ├───────────────┴─┬─────────┤                                │
│ │ groups still    │ keys    │                                │
│ └─────────────────┴─────────┘                                │
├──────────────────────────────────────────────────────────────┤
│ 02 / THE LEDGER                                              │
│ It never leaves this machine.                                │
│ [data table]                                                 │
├──────────────────────────────────────────────────────────────┤
│ 03 / INSTALL                                                 │
│ Three steps. No account.                                     │
├──────────────────────────────────────────────────────────────┤
│ ▪ stow   local-only   source   privacy   changelog           │  32px footer
└──────────────────────────────────────────────────────────────┘
```

## 3. Copy deck

Use these strings as written. Keep labels lowercase and prose sentence case.

### Status strip

- Left: `[icon] stow` in a 26px outlined tile.
- Center: `01 the parts` / `02 the ledger`; the active section gets a 2px `accent` underline.
- Right: `local-only` with a 5px accent square, then `[ load unpacked ]`.
- Mobile: brand and `menu`; the panel lists `01 the parts`, `02 the ledger`, `03 install`, a full-width
  `[ load unpacked ]`, and `v0.1.0 · local-only`.
- Footer meta: `v0.1.0 · local-only · 2026`.

### Hero

- Kicker: `❯ stow --save`
- H1: `Close the tabs.` / `Keep the work.`
- Lede: `Stow saves a whole window as searchable stacks, closes every tab, and brings back exactly what you need. Local-first. No account, no sync, no network.`
- Primary: `load unpacked`
- Secondary: `$ read the source`
- Note under CTA: `Chrome 120+ · works offline after install`

### Receipt

A decorative, `aria-hidden` summary of one stow. Label it `demo` so the numbers never read as a
measured claim.

```text
stow --window                                        demo
tabs open                                              23
stacks saved                                            4
tabs closed                                            23
network requests                                        0
every tab written and read back before Chrome closes it
```

### Hero screenshot

- Bar: `library.html` / `the actual library`
- Image: the real Library in the reader’s color scheme; mobile uses the 750×1000 capture.
- Alt: `The Stow library: a dark console with three stacks named Docs, Design, and Build, each holding a list of saved tabs.`

### Parts section

- Label: `01 / THE PARTS`
- H2: `The tabs you close are still there.`
- Lede: `Stow is one gesture and one search box. Everything else exists so nothing gets lost on the way back.`

Tiles:

1. **stow** — `Save the whole window.`
   `One keystroke turns every tab into stacks, sorted by the groups you already made. Pinned tabs stay open.`
   Foot: `⌥⇧S stow window · ⌥⇧T stow tab`
2. **quiet by default** — `0` / `network requests`
   `No account, sync, telemetry, or favicon service. The extension asks for no host permissions.`
3. **find** — `Half a memory is enough.`
   `Search titles, URLs, and stacks as you type. Typos are fine; domain: narrows it down.`
   Foot: `⌘K from anywhere`
4. **safe** — `Nothing closes until it’s saved.`
   `Every tab is written and read back first. Change your mind and Trash holds it for 30 days.`
   Foot: `undo from the toast, or restore from Trash`
5. **move in** — `Your old shelf still works.`
   `Import OneTab, Markdown lists, bookmarks, or a Stow backup. Export the same library whenever you want.`
   Foot: `no lock-in`
6. **groups** — `Your tab groups come with you.`
   `Native names, colors, and pinned tabs survive the trip. Restore a stack into the shape it left in.`
   Foot: `Chrome tab groups · recreated on restore`
7. **keyboard** — `Hands stay on the keys.`
   `Stow, search, restore, and rename without reaching for the mouse.`
   Rows: `⌥⇧S stow window`, `⌥⇧T stow tab`, `⌥⇧L open library`, `⌘K search`

### Privacy ledger

- Label: `02 / THE LEDGER`
- H2: `It never leaves this machine.`
- Body: `There is no server to send it to. Stow requests no host permissions and makes no network calls.`
- Rows:

| Data | Lives in | Leaves device |
| --- | --- | --- |
| Tabs and stacks | IndexedDB, extension origin | No |
| Settings | IndexedDB + two localStorage mirrors | No |
| Favicons | Chromium’s local `_favicon` cache | No |
| Backups | Your Downloads folder, only if enabled | No |

- Footnote: `Uninstalling removes the data. Export a JSON backup first if you want a copy.`

### Install section

- Label: `03 / INSTALL`
- H2: `Three steps. No account.`
- Steps:
  1. `Download the latest zip.` — link the latest release.
  2. `Open the extensions page.` — enable Developer mode at `chrome://extensions`.
  3. `Load the extension.` — choose **Load unpacked** and select the unzipped folder.
- Aside: `❯ ready` / `Works in Chrome, Edge, Brave, and other Chromium browsers with Manifest V3.` / repository button / `Requires Chrome 120+ or another MV3 Chromium browser.`
- Store variant: replace the steps with one **Add to Chrome** button.

### Footer

`▪ stow` · `local-only` · `source` · `privacy` · `changelog` · `© 2026`

No social icons. No newsletter form.

## 4. Visual system

Use the extension tokens so the page and product feel like one tool.

### Color

| Token | Dark (default) | Light |
| --- | --- | --- |
| canvas | `#0C0C0C` | `#F3F1EC` |
| sheet | `#202020` | `#E9E6DF` |
| raised | `#252225` | `#F7F5F0` |
| line | `#333033` | `#CFC9BE` |
| ink | `#EEEEEE` | `#1E1D1B` |
| ink-2 | `#B8B8B8` | `#46433E` |
| ink-3 | `#8A8A8A` | `#5C5851` |
| accent | `#A5A0B6` | `#5B566E` |
| link | `#5C9CF5` | `#2F5F9E` |
| success | `#7FC7A4` | `#2F6B4F` |

Rules:

- One accent. Lavender is for labels, the receipt’s top rule, and one word at most.
- Blue is for links, not decoration.
- No gradients, glows, glass, or drop shadows.
- Borders are 1 px `line`; selected/active surfaces use a 2 px left accent rule.
- Dark is the default; honor `prefers-color-scheme: light`.

### Type

- UI and headlines: self-hosted **Inter**.
- Metadata, commands, paths, versions, keyboard hints: system monospace.
- H1: `clamp(40px, 6vw, 64px) / 0.98`, weight 600, tracking `-0.04em`.
- H2: `clamp(28px, 3.5vw, 40px) / 1.05`, weight 600, tracking `-0.03em`.
- Body: `16px / 1.65`, max `62ch`.
- Labels: `11px / 1.4` mono, uppercase, `0.14em` tracking.
- Tile body: `13.5px / 1.6`; tile headline `19px / 1.25`.

Do not use a second display face. Do not set paragraphs in monospace except metadata and the
receipt.

### Layout

- Max width: `1120px`.
- Outer margin: `32px` desktop, `28px` at 1119, `20px` at 639.
- Baseline: 8 px.
- Section padding: `64–88px` desktop, `28px` head gap on mobile.
- Hero: 7 columns text / 5 columns receipt; the full-width screenshot spans both below.
- Bento: 3 columns; the lead and groups tiles span 2. Cells are divided by 1 px rules, not cards.
- No rounded cards. Panels are rectangles with 1 px borders.

## 5. Components

### Status strip

- Height `52px` (`48px` below 768px), sticky at top. At the top of the page it is `canvas`; after 4px of
  scroll it becomes `sheet` with a bottom 1 px rule.
- Left: 26px outlined icon tile + `stow` wordmark. Center: numbered section links in mono; the active
  link is `ink` with a 2px `accent` underline and `aria-current="location"`. Right: `local-only` status
  LED + `[ load unpacked ]`.
- Below 768px the links and CTA collapse into a `menu` disclosure. The panel is full height, `canvas`,
  with 1 px row rules; the page scroll is locked and `main`/`footer` are inert while it is open.
- Do not animate its height on scroll.

### Receipt

- `sheet` panel, 1 px border, 36 px title row, 2 px accent top rule (inside the panel).
- Mono rows; the final value of `network requests` uses `success`.
- Height follows the hero copy; it is not stretched to match.
- The whole panel is `aria-hidden`; the copy beside it carries the message.

### Hero screenshot

- Real Library capture in a 1 px frame with a 34 px bar.
- Light and dark sources; mobile gets the 750×1000 capture below 640.
- The bar’s right label is `the actual library`; never label a still as the real product.

### Bento tiles

- Each cell: label, headline, body, still, foot. The still sits at the bottom; the foot is a
  1 px rule with keyboard hints or a qualifier.
- The still is a complete composition, not a window inside another card. Do not add a second
  frame or plate around it.
- Lead/groups stills are authored at `720×220–300`; square tiles at `358×240`. All are exported
  at 2×. Below 640 use the `*-compact-*` recomposition, never a squeezed desktop still.
- The stat tile carries the `0` at `clamp(72px, 9vw, 104px)`; the keyboard tile uses real `<kbd>`
  elements, not an image.

### Privacy ledger

- A table, not cards.
- Header row mono 11 px, body 14 px, 1 px row rules.
- “Leaves device” cells read `No` in `success` text.

### Install steps

- Ordered list with mono numbers `01`, `02`, `03`.
- Code fragments (`chrome://extensions`, `stow-0.1.0-chrome.zip`) in `<code>` with a `raised`
  background.
- One primary CTA repeated, no new tab.

## 6. Interaction and motion

- Only two motions: button hover and section reveal.
- Section reveal: opacity 0→1, translateY 8px→0, `180ms` ease-out, once, at 15% intersection.
- The hero screenshot reveals with the rest of the hero.
- No type-on, parallax, marquee, carousel, or scroll-jacking.
- Respect `prefers-reduced-motion: reduce`: show the final state immediately; keep focus and
  hover states.
- The page must be fully usable with JavaScript disabled: every `reveal` is visible by default
  before the `js` class is applied.

## 7. Responsive

| Width | Behavior |
| --- | --- |
| ≥ 1120 | Hero 7/5, 3-column bento, 1056 content |
| 960–1119 | Same structure, 28 px margin |
| 640–959 | Hero stacked, bento 2 columns, wide tiles span 2, keyboard spans 2 |
| < 640 | Single column, compact lead/groups stills, mobile Library capture, table becomes rows |

No horizontal scroll at 320 px. Test at 320, 375, 640, 768, 1440.

## 8. Accessibility

- Light and dark both meet WCAG AA for text and UI.
- One `<h1>`; sections use `<h2>`; tiles use `<h3>`.
- Skip link to `#main`.
- Status strip CTA is a real link; the `menu` button uses `aria-expanded`/`aria-controls`, closes on
  Escape, and returns focus to itself.
- Section numerals are decorative; section links are named `the parts` / `the ledger`.
- Every still has descriptive alt text. The receipt and icon images are `aria-hidden` / empty alt.
- Keyboard focus visible on every link and button.
- Table has `<caption>`, `<th scope="col">`, and no layout tables.
- Reduced motion honored; no flashing.
- Test with axe at 320 and 1440, both themes.

## 9. Performance and privacy

- Static HTML/CSS/JS; no client framework, no hydration, no analytics, no cookies.
- Target: < 30 KB HTML+CSS+JS excluding the font; font `344 KB`, preloaded.
- `font-display: swap`.
- No third-party requests. No Google Fonts, no CDN, no embed.
- Images: WebP at 2×, explicit width/height on the real screenshot; stills have intrinsic sizes.
  Total image weight is about 160 KB.
- Lighthouse targets: Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100.

## 10. SEO and social

- Title: `Stow — close the tabs, keep the work`
- Description: `A local-first tab shelf for Chrome. Stow a window into searchable stacks, close every tab, and restore it all later. No account, sync, or network.`
- Canonical: final production URL.
- OG type `website`, OG image `1200×630`, Twitter `summary_large_image`.
- `robots.txt` allows all; `sitemap.xml` contains one URL.
- Structured data: `SoftwareApplication` with `applicationCategory: BrowserApplication`,
  `operatingSystem: Chrome`, `offers.price: 0`.

## 11. Asset checklist

- [ ] `assets/icon.svg`, `favicon.png`, `og.svg`, `og.png` 1200×630
- [ ] `assets/inter-var.woff2`
- [ ] `library-dark.webp` / `library-light.webp` 1600×1000
- [ ] `library-mobile-dark.webp` / `library-mobile-light.webp` 750×1000
- [ ] `lead-dark.webp` / `lead-light.webp` 1440×600 (720×300 at 2×)
- [ ] `lead-compact-dark.webp` / `lead-compact-light.webp` 716×480
- [ ] `search-dark.webp` / `search-light.webp` 716×480
- [ ] `undo-dark.webp` / `undo-light.webp` 716×480
- [ ] `import-dark.webp` / `import-light.webp` 716×480
- [ ] `groups-dark.webp` / `groups-light.webp` 1440×440
- [ ] `groups-compact-dark.webp` / `groups-compact-light.webp` 716×480

## 12. Build notes

```text
landing/
  index.html
  styles.css
  main.js
  assets/
```

- Copy tokens from `src/ui/styles/tokens.css`; do not import the extension stylesheet.
- `main.js` is under 1 KB: current year and the reveal observer.
- Use semantic HTML first; no component library.
- Deploy as static files. No server, no env vars, no runtime.

Still provenance: the five feature stills were authored with the
[Stageshow](https://github.com/benjitaylor/skills) kit in a throwaway Vite app under
`.tmp/stageshow/`, captured with `film.mjs --gate` in both themes, and exported to WebP:

```bash
CHROME_PATH=/usr/bin/chromium node .agents/skills/stageshow/scripts/film.mjs \
  'http://localhost:5199/?theme=dark&scene=lead' \
  --select '#lead .ss-fit' --still --out .tmp/stills/lead-dark.png --gate
magick .tmp/stills/lead-dark.png -quality 82 -define webp:method=6 \
  landing/assets/lead-dark.webp
```

Keep the stills at their design widths. A 720 px composition is not scaled down for a 375 px
phone; use `lead-compact` and `groups-compact` instead.

## 13. Do not

- Do not use a generic SaaS hero with floating cards, gradient blobs, or a dashboard mockup.
- Do not put a screenshot inside a fake browser window with traffic-light dots.
- Do not add testimonials, user counts, “trusted by”, or a logo wall.
- Do not claim a specific memory saving unless it is measured and labelled approximate.
- Do not use more than one accent or more than two typefaces.
- Do not animate anything that moves layout.
- Do not add analytics “just to see”; the product promise is no network.
- Do not label the receipt numbers as measured performance.
- Do not stretch a desktop still into a phone-sized tile; recompose it.
