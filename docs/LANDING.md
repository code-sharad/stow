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
header: stow · how it works · features · questions · [Add to Chrome / Firefox]
hero:   Close every tab. / Keep every page.
        centered copy · store CTA + view source · one trust line
        full-width live 12s hero demo (real UI, no video, one caption)
benefits: three columns — only the tabs you're using / a lighter browser / nothing lost
        (outcome strip between the demo and how-it-works)
how:    three rows — Stow / Find / Restore, each with a real UI capture
        A calmer browser in three steps.
features: six-cell grid — Capture / Search / Organize / Restore / Import-export / Keyboard
questions: six-question list — Stow vs Chrome, saving all tabs, tab groups, sync, uninstalling,
        importing an OneTab list (matches the FAQPage JSON-LD word for word)
footer: stow · local-first tab manager · source · questions · changelog · v0.1.0
```

The ordering is deliberate: the questions section sits between features and the closing call to
action because people who are evaluating a tab manager ask exactly these things, and the answers
are the factual core the page is competing on. It is a definition list, not a FAQ accordion:
nothing is hidden behind a click, so the text is in the initial HTML for readers and crawlers
alike. The closing section follows it, since the last question is answered and the only thing left
to say is how to start.

## Copy deck

Keep labels lowercase and prose in sentence case. Use **list**, not "stack", in reader-facing copy.

### Header

- Brand: `stow`
- Desktop nav: `how it works`, `features`, `questions`
- CTA: `Add to Chrome` / `Add to Firefox` — browser-aware; the store link is in the header,
  hero, and mobile panel. The extension is not listed yet, so `main.js` points at the Chrome
  Web Store and Firefox Add-ons search results until the two published listing URLs are set.
- Mobile: `menu` / `close`, panel with numbered links, full-width store CTA

### Hero

- Kicker: none. The hero used to carry a `Free · private tab manager` badge above the H1; it was
  cut because a boxed all-caps label above the headline is decoration and the promise below says
  the same thing. Section eyebrows keep their left-aligned orange dash; the hero has none.
- Title tag: `Stow: a free, local-first Chrome tab manager` — the keyword title stays, plus `free`,
  which is the one fact the search result can carry that the H1 does not. Do not put the slogan
  back in the title (the SEO audit explains why).
- H1: `Close every tab.` / `Keep every page.` — the promise, not the demo, and concrete on both
  halves: "every" removes the fear of losing a tab, "page" names what you keep. The lede says how.
  Both lines are 16 characters, so the centered hero stays balanced.
- Lede: `Forty tabs open, three you're using. Stow is a free, open-source browser extension that
  saves your whole window as one searchable list, closes the tabs, and brings back any page when
  you need it.` — it stops at the promise. `one page, a selection, or all of them` was cut because
  step 03 says it again two screens down.
- Why the lede opens on the pain: the visitor arrives with too many tabs, not with curiosity about
  a browser extension. Name the situation first, then the product category, then the mechanic,
  then the restore. Keep `browser extension` in the sentence — it is the query language the
  title cannot hold.
- Layout: centered copy above the full-width demo; no right-column illustration and no labels
  around the animation.
- Primary: `Add to Chrome` / `Add to Firefox`
- Secondary: `See how it works ↓` — links to `#how`. It used to be `View source ↗`, which competed
  with the install button for a decision nobody makes on a landing page; the source link lives in
  the footer nav instead.
- Trust line: `No account · No cloud · No tracking · Works offline` — one row, not two. It used to
  be a four-clause line plus a compatibility line under it, eight small claims in a stack where the
  lede already says `free, open-source`. `No subscription` became `Works offline`, which is the
  claim nothing else on the page makes and the one Firefox users check first. The version numbers
  stay in the FAQ (`Chrome 120+`, `Firefox 140+`), and `main.js` still rewrites the header button to
  `Add to Firefox` when it detects Firefox, so a Firefox visitor is not reading a Chrome-only page.

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

- Files: `landing/hero-demo.js`, `landing/hero-demo.css`, `landing/demo.html`,
  `scripts/capture-hero-poster.mjs`; usage and timing knobs are in `landing/HERO-DEMO.md`.
- Stage: 1280×720. At desktop it is 16:9; at ≤1024px it becomes a 4:5 host with a 440×550 camera
  crop that follows the action. The library keeps the real grid: rail 220px, topbar 60px, status
  26px, reading text x=346 through x=1154, stack heads 34px, rows 30px.
- Story (`12s`, forwards — mess first, payoff last): forty crowded favicon tabs while the camera
  pushes in and the counter climbs → Stow toolbar click (the instant-stow toolbar option, no
  popup) → the tabs drain into the icon, the counter falls to 0, `Stowed 40 tabs · 3 lists` → hard
  cut into the library, lists reveal → `flights` search → `2 matches in 2 lists` → Trip
  `Restore all` → `Restored 11 tabs · Trip` → the opening frame fades back in at 11–11.8s so the
  12/0 seam is effectively pixel-identical.
- Story order is a rule, not a preference: a visitor must recognise their own mess before seeing a
  library, so the demo never opens on the library, a search, or a restore.
- Presentation: no shot bar, no per-beat cards. A stage HUD carries the whole narration — a tab
  counter that climbs 12 → 24 → 40 then drops to 0, and one caption per beat (`40 tabs open. 3
  you're using.`, `One click. Clean window.`, `Nothing lost.`, `Find anything.`, `Pick up where you
  left off.`). The HUD is 19px at the 1120px figure and 13px on the mobile crop, and fades out at
  10.6–10.85s for the seam. The figure still carries one plain caption
  (`Forty open tabs become three lists. One click, and nothing is lost.`) for anyone who reads the
  page instead of watching it.
- Content is everyday, not developer: a Google Flights result page for Lisbon and Chrome's own
  new-tab page stand in for the old Chrome-extensions docs, and the three lists are Trip, Work, and
  Shopping. No fake extension URL, no `indexeddb` query, no Chrome Web Store screenshots.
- No-JS and first paint use the demo's own opening frame (`assets/hero-mess-*.webp`, captured at
  1.6s by `scripts/capture-hero-poster.mjs`); the module replaces it and pauses offscreen. On
  `file://`, Chrome blocks the module, so the inline `.is-file` class keeps the poster visible and
  adds a “serve over HTTP” note. Reduced motion renders the still at 1.6s. The host is a labelled
  `role="img"`; the stage is `aria-hidden` and contains no focusable controls.
- This is a scripted reconstruction from the real components and tokens, not a capture. It must
  stay in sync with them; do not add UI Stow does not have.

### How it works

- Eyebrow: `How it works`
- H2: `A calmer browser in three steps.`
- Lede: `Stow saves every tab in the window as one list you can search. Find any of them later,
  then restore one tab or the whole list.`

The three steps carry no kicker any more (`Stow` / `Find` / `Restore` repeated the heading right
below it), and no shot bar above the screenshot (`popup.html`, `library.html`, `quick capture` were
developer decoration about the mock, not about the product).

1. `Save every tab in the window.`
   `Every eligible tab is saved into Stow as one list, and the window closes. Pinned tabs stay
   exactly where you put them.` · `Alt Shift S — save window`, `Alt Shift T — save this tab`
2. `Find any tab you saved.`
   `All the tabs you save live in Stow, searchable by title, URL, domain, or list name. The index
   stays in your browser, so results appear as you type.` · `Alt Shift L — open the library`
3. `Bring back one tab, or the whole list.`
   `Restore a single tab, a selection, or an entire list to the current window or a new one. Remove
   it from Stow afterward if you like.` · `Enter — restore the selected tab`

Shortcut accuracy matters here: step 03 used to print `Alt Shift L` beside Restore, but that
shortcut opens the library and restores nothing. Step 02 now owns `Alt Shift L`, and step 03 shows
the key that actually restores (`Enter`, from `src/ui/components/StackList.tsx:267`).

### Features

- Eyebrow: `Features`
- H2: `The parts you only miss once you rely on it.`
- Lede: `Saving, searching, and restoring are above. These are the six things that keep a library
  trustworthy after the first week.`
- Why: the grid used to be six cards whose first three were Capture / Search / Restore — the same
  three steps as the section above them, in the same order. Three cards now cover what the steps
  cannot: organizing, Chrome tab groups, undo, import/export, exceptions, keyboard. The six keep
  the grid full without repeating the story.

| Label | H3 | Body |
| --- | --- | --- |
| Organize | Shape a list around a project. | Rename it, pin it to the top, lock it so a restore won't empty it, or collapse it and move on. Your structure survives restarts and updates. |
| Tab groups | Keep Chrome's groups intact. | If you already group tabs by project, Stow keeps each group as its own list and recreates the groups when you restore. Turn it off to fold everything into one list. |
| Undo | Nothing is deleted on the first click. | Closing a tab in the library moves it to Trash, not out of existence. Every action is also reversible from the undo control. |
| Import / export | Bring your existing tabs with you. | Import a OneTab list, bookmarks HTML, or Markdown. Export everything as a JSON file whenever you want a copy you own. |
| Exceptions | Some tabs should never move. | Name the sites Stow must leave alone, keep pinned tabs where they are, and decide whether private windows count. |
| Keyboard | Keep your hands on the keys. | The library is built to be driven from the keyboard, from the first capture to the final restore. |

Shortcut rows: `Alt Shift L` open library, `Ctrl/Cmd K` commands, `/` focus search, `Enter`
restore selected.

Organize capabilities: rename, pin, lock, and collapse; reorder lists and move tabs between them;
dedupe a list.
Tab groups: `preserveBrowserGroups` (one group, one list) and `restoreGroups` (recreate them on
restore), both default on — `src/core/settings/schema.ts:8,15`.
Undo: soft delete to Trash plus `undo(opId)` (`src/core/db/repo.ts:346,416`); retention is 7, 30, or
90 days, or off.
Exceptions: `ignoredSites`, `ignorePinnedTabs`, `stowIncognito` (`src/core/settings/schema.ts`).
Import formats: OneTab, Markdown, Bookmarks HTML, Stow JSON.

### Questions

- Eyebrow: `Questions`
- H2: `Before you move your tabs.`
- Lede: `What people ask before trusting an extension with a full window of open pages.`
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

### Cut: why switch and privacy

The page carried two more sections here — `Why switch` (`Already using a tab manager? Here is why
people move.`, three complaint cards plus a migration card) and `Privacy` (`Your tabs stay on your
device.`, three promises plus a one-device transfer card). Both are gone, along with their
`.privacy-*` styles, their nav and footer links, and the `#switch`/`#privacy` anchors.

- Why switch repeated the questions section three times over: each card named a complaint the FAQ
  already answers (`Does Stow sync my tabs to another device?`, `Can I import tabs I saved with
  OneTab?`, the uninstall answer) and then argued it at length. The migration card documented
  import formats the features grid already lists.
- Privacy argued the same three facts the hero trust line states — no account, no cloud, no
  tracking — in the longest block on the page. The mechanism detail (`IndexedDB in your own
  profile`, `Zero outbound requests`) now has no home on the page; the FAQ's sync answer and the
  privacy policy remain the places a skeptical visitor can check it.
- Both sections shared one component (`.privacy-grid`: a stacked list of numbered promises beside
a sheet card), which made the page read as the same block twice in a row.

The page now runs hero → benefits → how → features → questions → closing.

#### Closing call to action

- Section after the questions, before the footer: `.section.section--tight.closing`.
- H2: `Start with the window you have open.`
- Body: `Install Stow, save the window, and the tabs come back whenever you want them. Free, open
  source, and it works offline.`
- One button (`data-store-link`, so Firefox gets its own label), then the trust line again.
  The closing trust line carries the same four clauses as the hero's.
- Why it exists: the review's last note was that a hesitant visitor reaching the bottom of the
  page had no button and no reason to scroll back up. It repeats the hero's promise and nothing
  else — no new claims.

## Footer

`stow` · `free, private tab manager` · `source` · `questions` · `changelog` · `v0.1.0 · © 2026 Stow`

## Screenshots

The Library, popup, search, and restore images are current-build captures, not
reconstructions. They are stored in `landing/assets/` as WebP with explicit `width`/`height`
attributes. The hero demo is a scripted reconstruction from the same components and tokens, so its
poster is captured from the demo itself (`scripts/capture-hero-poster.mjs`) rather than from the
extension; the library captures still lead the README and fill the JSON-LD `screenshot`. The step
images remain current-build captures. The former privacy WebPs are no longer used by the page.

| File | Size | Shows | Used in |
| --- | --- | --- | --- |
| `hero-mess-dark.webp`, `hero-mess-light.webp` | 1440×810 | Demo opening frame at 1.6s: forty tabs, counter at 40, first caption | Hero demo poster, no-JS fallback (desktop) |
| `hero-mess-mobile-dark.webp`, `hero-mess-mobile-light.webp` | 480×600 | The same frame on the 4:5 mobile crop | Hero demo poster, no-JS fallback (≤639px) |
| `library-dark.webp`, `library-light.webp` | 1440×900 | Library with Docs, Design, Build | README lead image, JSON-LD `screenshot` |
| `library-mobile-dark.webp`, `library-mobile-light.webp` | 390×844 | Library mobile crop | Asset checks only |
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
- Secondary text contrast: `--ink-3` was raised from `#8a8a8a` to `#9b9b9b` on dark and from
  `#5c5851` to `#55514b` on light, because the 9-11px mono labels, shortcut rows, and capability
  lists were the dimmest text on the page and the review called them unreadable on black. Steps
  and figures use `--ink-2` for captions now, not `--ink-3`.
- Hero, step, and feature layouts collapse at 1023, 767, and 639px. The hero demo
  switches to its 4:5 camera at 1024px (the site's compact breakpoint), max 480px wide.
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

## Deployment

The Vercel project `stow-tabs` serves `landing/` as a static site at
`https://stow-tabs.vercel.app/`. Its Git repository is `code-sharad/stow`, its root directory is
`landing`, and its production branch is `main`. There is no build, install, or output-directory
command, and **no ignored-build command**; every push to a connected branch deploys.

That last part is deliberate. The project used to skip deployments whose commits left `landing/`
alone, with:

```sh
if git diff --name-only HEAD^ HEAD -- landing | grep -q .; then exit 1; else exit 0; fi
```

Vercel checks the repository out shallow, so `HEAD^` does not resolve; `git diff` fails, `grep -q .`
sees no input, and the pipeline exits 0, which means *skip*. Every Git-triggered deployment was
therefore cancelled as an ignored build while production quietly kept the first CLI deploy, and a
merged icon change never reached the site. A fail-open guard (`git rev-parse --verify HEAD^` first)
fixes that class of bug, but the guard was buying a few seconds on a site that builds in four: the
step is gone, and an extension-only commit now deploys the unchanged landing directory.

Reproduce the shallow case before trusting any future guard:

```sh
git clone --depth 1 file://$PWD /tmp/shallow
cd /tmp/shallow && git diff HEAD^ HEAD   # fatal: bad revision 'HEAD^'
```

The CLI is not an escape hatch. `vercel --prod` from the repository root ignores the project's root
directory and fails looking for a `dist` output; inside `landing/` it cannot resolve the configured
root directory. Deploy by merging to `main`.

`.vercelignore` excludes local project settings, environment files, `demo.html`, and `HERO-DEMO.md`
from CLI uploads. Do not commit `.vercel/` or environment files.

To check a deployed URL, run:

```sh
LANDING_TEST_URL=https://stow-tabs.vercel.app pnpm check:landing
```

The remote check runs the same browser, accessibility, and SEO assertions and also requires the
public assets to load and both development files to return 404. `LANDING_URL` overrides the
expected canonical origin when testing a custom domain.

The Search Console file must stay at the root of `landing/` and keep its exact name, because
Google compares the body against the URL it was given. The existing
`google3d833a44d7eced00.html` verifies the old `https://code-sharad.github.io/stow/` URL-prefix
property only. A Search Console property for the Vercel URL needs its own verification file.

The page is ready to deploy as-is once the captures and checks pass. Keep `docs/brand` as the
source of truth; update this file when shipped copy or screenshots change.
