# Stow landing page specification

Status: build-ready. The landing page is a separate static site; it is not shipped inside the
extension. It follows the same OpenCode console language as the Library: terminal first, one
accent, flat rules, visible keyboard affordances.

## 1. Job

One page, one decision: install Stow.

- Audience: people with 30–300 tabs open who already use a terminal or a keyboard-driven editor.
- Promise: close the tabs, keep the work, never send it anywhere.
- Primary CTA: **Add to Chrome**. Before a store listing exists, use **Load unpacked** and link to
  the README install steps.
- Secondary CTA: **Read the source**.
- Non-goals: account creation, newsletter, pricing, testimonials, comparison table, AI claims.

## 2. Page flow

```text
┌──────────────────────────────────────────────────────────────┐
│ ▪ stow   v0.1.0   local-only          [add to chrome]        │  44px status strip
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ❯ stow --save                                               │
│  Close the tabs.                                             │
│  Keep the work.                                              │
│                                                              │
│  A local-first tab shelf for Chrome. Stow a window into      │
│  searchable stacks, get the memory back, restore when you    │
│  need it.                                                    │
│                                                              │
│  [ add to chrome ]   $ read the source                       │
│                                                              │
│  ┌ terminal demo ─────────────────────────────────────────┐  │
│  │ $ stow --window                                       │  │
│  │ scanning 23 tabs…                                     │  │
│  │ saved 23 tabs → 4 stacks                              │  │
│  │ closed 23 tabs · library updated                      │  │
│  │ ✓ no network requests                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Saved before closed │ No network │ Keyboard native           │  3-up proof row
├──────────────────────────────────────────────────────────────┤
│ 01 / THE STACK                                               │
│ A shelf, not a second tab bar.                               │
│ [annotated stack diagram]                                    │
├──────────────────────────────────────────────────────────────┤
│ 02 / THE LEDGER                                              │
│ What leaves your machine: nothing.                           │
│ [data table]                                                 │
├──────────────────────────────────────────────────────────────┤
│ 03 / THE EXIT                                                │
│ Your tabs are not a lock-in.                                 │
│ OneTab · Markdown · bookmarks HTML · JSON                    │
├──────────────────────────────────────────────────────────────┤
│ 04 / INSTALL                                                 │
│ Three steps. No account.                                     │
├──────────────────────────────────────────────────────────────┤
│ ▪ stow   local-only   source   privacy   changelog           │  32px footer
└──────────────────────────────────────────────────────────────┘
```

## 3. Copy deck

Use these strings as written. Keep labels lowercase and prose sentence case.

### Status strip

- Left: `▪ stow` / `v0.1.0` / `local-only`
- Right: `[ add to chrome ]`
- Mobile: brand and CTA only; version moves into the footer.

### Hero

- Kicker: `❯ stow --save`
- H1: `Close the tabs.` / `Keep the work.`
- Lede: `A local-first tab shelf for Chrome. Stow a window into searchable stacks, get the memory back, restore when you need it.`
- Primary: `add to chrome`
- Secondary: `$ read the source`
- Note under CTA: `No account. No sync. No network.`

### Terminal demo

```text
$ stow --window
scanning 23 tabs…
saved 23 tabs → 4 stacks
closed 23 tabs · library updated
✓ no network requests
```

The cursor should blink at the end of the last line. The numbers may change; never invent a
memory-saved claim.

### Proof row

1. **Saved before closed**
   Every tab is written to IndexedDB and read back before Chrome closes a single one.
2. **No network**
   No account, no sync, no telemetry, no favicon service.
3. **Keyboard native**
   Stow, search, restore, and rename without leaving the keys.

### Stack section

- Label: `01 / THE STACK`
- H2: `A shelf, not a second tab bar.`
- Body: `Native groups become stacks. Names and colors carry over. Pin the work you are not done with; lock the stacks you never want to lose.`
- Diagram labels: `group color`, `stack title`, `tab count`, `locked`, `restore all`.
- Command hint: `F2 rename · ⌘K commands · / search`

### Privacy ledger

- Label: `02 / THE LEDGER`
- H2: `What leaves your machine: nothing.`
- Body: `Stow has no server to send anything to. The extension requests no host permissions.`
- Rows:

| Data | Lives in | Leaves device |
| --- | --- | --- |
| Tabs and stacks | IndexedDB, extension origin | No |
| Settings | IndexedDB + two localStorage mirrors | No |
| Favicons | Chromium’s local `_favicon` cache | No |
| Backups | Your Downloads folder, only if enabled | No |

- Footnote: `Uninstalling removes the data. Export a JSON backup first if you want a copy.`

### Exit section

- Label: `03 / THE EXIT`
- H2: `Your tabs are not a lock-in.`
- Body: `Import OneTab text, Markdown lists, Netscape bookmarks, or a Stow JSON backup. Export the same library at any time.`
- Format line: `onetab.txt · notes.md · bookmarks.html · stow-backup.json`

### Install section

- Label: `04 / INSTALL`
- H2: `Three steps. No account.`
- Steps:
  1. `Download the latest zip.`
  2. `Open chrome://extensions and enable Developer mode.`
  3. `Choose Load unpacked and select .output/chrome-mv3.`
- Store variant: replace steps with a single **Add to Chrome** button and `Works in Chrome, Edge, Brave, and other Chromium browsers.`
- Small print: `Requires Chrome 120+ or another MV3 Chromium browser.`

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

- One accent. Lavender is for the prompt rail, active state, and one word at most.
- Blue is for links, not decoration.
- No gradients, glows, glass, or drop shadows.
- Borders are 1 px `line`; selected/active surfaces use a 2 px left accent rule.
- Dark is the default; honor `prefers-color-scheme: light` and a manual toggle only if it costs no
  layout shift.

### Type

- UI and headlines: self-hosted **Inter** (`/fonts/inter-var.woff2`).
- Metadata, commands, paths, versions, keyboard hints: system monospace.
- H1: `clamp(40px, 6vw, 64px) / 0.98`, weight 600, tracking `-0.04em`.
- H2: `clamp(28px, 3.5vw, 40px) / 1.05`, weight 600, tracking `-0.03em`.
- Body: `16px / 1.65`, max `62ch`.
- Labels: `11px / 1.4` mono, uppercase, `0.14em` tracking.
- Code/demo: `13px / 1.7` mono.

Do not use a second display face. Do not set paragraphs in monospace.

### Layout

- Max width: `1120px`.
- Grid: 12 columns, `24px` gutter, `32px` outer margin on desktop; `20px` on mobile.
- Baseline: 8 px.
- Section padding: `96px` desktop, `64px` tablet, `48px` mobile.
- Hero: 7 columns text / 5 columns terminal on desktop; stacked below `960px`.
- Rules span the full content width, not inset cards.
- No rounded cards. Panels are rectangles with 1 px borders.

### Spacing scale

`4, 8, 12, 16, 24, 32, 48, 64, 96`.

## 5. Components

### Status strip

- Height `44px`, sticky at top, `sheet` background, bottom 1 px rule.
- Brand left, version and `local-only` in mono, CTA right.
- On scroll, keep it; do not animate its height.

### Prompt kicker

- `❯` in accent, label in mono.
- Use once above the H1 and once per numbered section label. No other arrows.

### Buttons

- Height `40px`, square corners, 1 px border.
- Primary: accent background, dark text, no shadow.
- Secondary: transparent, `line` border, `ink` text, `$` prefix in mono.
- Hover: one step lighter/darker, `120ms`.
- Focus: 2 px `link` outline with 2 px offset.
- No pill buttons.

### Terminal demo

- `sheet` panel, 1 px border, 44 px title row with three 8 px squares (neutral, not macOS colors).
- Body lines in mono; prompt `$` accent; success line uses `success`.
- Min-height `240px` desktop; do not let it resize as lines type.
- Type-on animation: 18–24ms per character, start on intersection, run once, respect
  `prefers-reduced-motion` by showing the final state immediately.
- The demo is illustrative; label it `demo` in the title row at `10px` mono.

### Proof row

- Three columns separated by 1 px vertical rules, no card backgrounds.
- Number labels `01`, `02`, `03` in mono accent.
- Headline 18 px Inter; body 14 px.

### Stack diagram

- A real, cropped screenshot of the Library in a 1 px frame, with four annotation labels.
- Annotations use 1 px leader lines and mono 10 px text.
- Provide alt text describing the stack: group color, title, tabs, restore control.
- On mobile, drop annotations and show the screenshot full width with a caption.

### Privacy ledger

- A table, not cards.
- Header row mono 11 px, body 14 px, 1 px row rules.
- “No” column uses `success` text plus a small `✓`; never color alone.

### Install steps

- Ordered list with mono numbers `01`, `02`, `03`.
- Code fragments (`chrome://extensions`, `.output/chrome-mv3`) in `<code>` with a `raised`
  background and 2 px padding.
- One primary CTA repeated, no new tab.

## 6. Interaction and motion

- Only three motions: terminal type-on, button hover, and section reveal.
- Section reveal: opacity 0→1, translateY 8px→0, `180ms` ease-out, once, at 15% intersection.
- No parallax, no marquee, no auto-rotating carousel, no scroll-jacking.
- Respect `prefers-reduced-motion: reduce`: disable type-on and reveal; keep focus and hover states.
- The page must be fully usable with JavaScript disabled: static hero, static terminal final state,
  working links.

## 7. Responsive

| Width | Behavior |
| --- | --- |
| ≥ 1120 | Full 12-column layout, 1120 max |
| 960–1119 | Hero 6/6, smaller H1, terminal still side by side |
| 640–959 | Hero stacked, terminal below copy, proof row 3 columns with smaller type |
| < 640 | Single column, status strip hides version, proof row stacks, section padding 48px, H1 40px |

No horizontal scroll at 320 px. Test at 320, 375, 768, 1024, 1440.

## 8. Accessibility

- Light and dark both meet WCAG AA for text and UI.
- One `<h1>`; sections use `<h2>`; no heading skips.
- Skip link to `#main`.
- Status strip CTA is a real link, not a div.
- Terminal demo has an accessible label and a visually hidden static transcript.
- Keyboard focus visible on every link, button, and theme toggle.
- Table has `<caption>`, `<th scope="col">`, and no layout tables.
- Screenshots have descriptive alt text; decorative rules are CSS.
- Reduced motion honored; no flashing.
- Test with axe at 320 and 1440, both themes.

## 9. Performance and privacy

- Static HTML/CSS/JS; no client framework, no hydration, no analytics, no cookies.
- Target: < 30 KB HTML+CSS+JS excluding the font; font `344 KB`, preloaded with
  `<link rel="preload" as="font" type="font/woff2" crossorigin>`.
- `font-display: swap`; system fallback matches metrics closely enough to avoid layout shift.
- No third-party requests. No Google Fonts, no CDN, no embed.
- Images: AVIF/WebP with width/height attributes; lazy-load below the fold.
- Lighthouse targets: Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100.

## 10. SEO and social

- Title: `Stow — close the tabs, keep the work`
- Description: `A local-first tab shelf for Chrome. Stow a window into searchable stacks, close the tabs, and restore them later. No account, sync, or network.`
- Canonical: final production URL.
- OG type `website`, OG image `1200×630`, Twitter `summary_large_image`.
- OG image: charcoal field, the `stack-prompt` mark at left, H1 at right, one lavender rule.
  Text is rendered as live text in the build, never baked into a generated image.
- `robots.txt` allows all; `sitemap.xml` contains one URL.
- Structured data: `SoftwareApplication` with `applicationCategory: BrowserApplication`,
  `operatingSystem: Chrome`, `offers.price: 0`.

## 11. Asset checklist

- [ ] `assets/icon.svg` and `public/icon/{16,32,48,128}.png`
- [ ] `og.png` 1200×630
- [ ] `library-light.webp` 1600×1000 and `library-dark.webp` 1600×1000
- [ ] `library-mobile.webp` 750×1000
- [ ] `favicon.ico` / `favicon.svg`
- [ ] self-hosted Inter WOFF2 + license
- [ ] static terminal transcript for no-JS and screen readers

## 12. Build notes

Suggested structure:

```text
landing/
  index.html
  styles.css
  main.js
  assets/
    og.png
    library-dark.webp
    library-light.webp
    library-mobile.webp
```

- Copy tokens from `src/ui/styles/tokens.css` into `landing/styles.css`; do not import the
  extension stylesheet.
- Inline critical CSS for the hero and status strip; defer the rest.
- Keep `main.js` under 4 KB: theme preference, terminal type-on, reveal observer, current year.
- Use semantic HTML first; no component library.
- Deploy as static files. No server, no env vars, no runtime.

## 13. Do not

- Do not use a generic SaaS hero with floating cards, gradient blobs, or a dashboard mockup.
- Do not put a screenshot inside a fake browser window with traffic-light dots.
- Do not add testimonials, user counts, “trusted by”, or a logo wall.
- Do not claim a specific memory saving unless it is measured and labelled approximate.
- Do not use more than one accent or more than two typefaces.
- Do not animate anything that moves layout.
- Do not add analytics “just to see”; the product promise is no network.
