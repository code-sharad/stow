# 04. Design system and UI

> **Visual layer superseded 2026-11-22.** The implementation now uses the console system in
> `docs/DECISIONS.md` ("Console interface derived from OpenCode"). Layout, interaction, content,
> and accessibility requirements below still apply; Paper/Sheet colors, serif/sans type, card
> radii, and shadow guidance do not.

**Author role:** senior design engineer · **Audience:** implementing agent, design reviewers
**Read §1–§4 before touching any UI.** Tokens (§3) and metrics (§4) are the single source of truth. Components never contain raw colors, font sizes, or magic spacing. Section numbers here are referenced from 00–03.

---

## 1. Design intent

**Subject.** A personal *holding area for tabs in flight*: the place tabs go when you are not done with them but your browser (and your head) needs relief.
**Audience.** People who live in the browser all day: researchers, developers, students, analysts. They will scan hundreds of titles quickly, many times a day.
**Primary job.** Scan, find, and restore. Saving is one click and already done; the Library is a *reading and retrieval* surface.
**Feeling.** Calm, trustworthy, quietly competent. It should feel like a well-kept reference shelf, not a dashboard. Nothing should flash, nag, or sell.

**Vernacular we borrow from.** Libraries and filing: index tabs, spines, catalog cards, ledgers, call numbers. This gives us the one memorable idea (§2): *stacks are ruled sheets with a colored spine, not cards*, navigated through an *index rail*.

**Principles**
1. **Density with air.** Show many rows, but give each enough height and rhythm to scan (36 px comfortable, 28 px compact).
2. **Structure carries meaning.** The spine encodes the browser's tab-group color; the serif title marks "this is a named thing you own"; hairlines separate *regions*, never decorate. If a line or color encodes nothing, remove it.
3. **Reversible by default.** Destructive actions are quiet and undoable (toast + Trash), so the UI never needs alarmist styling or confirmation dialogs.
4. **Quiet until acted on.** No ambient motion. Motion answers an action (open, collapse, drop, stow).
5. **Keyboard is a first-class input**, not an afterthought; every pointer affordance has a keyboard path.
6. **Honest about data.** Titles can lie; show real destinations (domain visible on the row, full URL on hover).

### 1.1 Plan review against defaults (what we deliberately avoided)

We worked the brief ("tab manager UI") through the generic path first: grey neutrals, indigo/blue accent, Inter, white rounded cards with soft shadows, eyebrow labels, monospace data. We changed:

| Generic default | Our choice | Why |
|---|---|---|
| Every group is a rounded **card** with shadow | **Ruled sheets** with a 3 px **spine**, no resting shadows | Lists of hundreds of rows read as a continuous ledger; cards fragment scanning and burn vertical space. |
| Indigo/blue accent | **Spruce** green (`#1B6B52`), tinted neutrals | Distinct from the OneTab blue and the blue-everything utility look; calm, "ledger" connotation. |
| Dark mode = near-black + saturated neon accent | Deep **spruce-ink** (`#111A17`) with a soft **sage** accent (`#7FCDAE`) | Avoids acid-on-black; keeps eye comfort for long sessions. |
| One sans for everything | **Serif for names** (stack/page titles) + **sans for work** (rows, controls) | Names of collections deserve identity; rows need neutral legibility. |
| Monospace for URLs/shortcuts, ALL-CAPS labels, `·`-joined metadata, `→` on buttons | None of these. Metadata uses spacing; labels are sentence case. | They are template tells and hurt legibility/i18n. |
| Uniform 8–12 px radius everywhere | Radius **by role** (§4.3) | Hierarchy is communicated through shape too. |

## 2. Visual language at a glance

| Element | Decision |
|---|---|
| **Palette** | **Paper** `#F1F3EF` (canvas) · **Sheet** `#FBFCFA` (reading surface) · **Ink** `#15201C` (text) · **Spruce** `#1B6B52` (accent) · **Graphite** `#4F5B55` (secondary text) · **Signal** `#B3261E` (danger). Dark: **Night** `#111A17`, **Dark sheet** `#16211D`, **Sage** `#7FCDAE`. |
| **Type** | **Instrument Sans** (variable) for UI and rows; **Newsreader** (variable, optical sizing) for stack titles, page/section titles, and the wordmark. Two clearly different families; no monospace anywhere in v1. |
| **Layout** | **Index rail** (left, 232 px) + **reading column** (max 760 px, centered in the remaining space). All text is left-aligned; numbers are right-aligned with tabular figures. |
| **The memorable thing** | The **spine**: each stack carries a 3 px vertical rule in its native tab-group color (neutral if none). It runs the full height of the stack, thickens on drag-over, and is mirrored by a tick in the rail. Everything else stays quiet. |
| **Shape** | Hairline structure, no resting shadows. Shadows only on floating layers (menus, dialogs, toasts, dragged row). |
| **Motion** | User-triggered only, ≤ 280 ms, ease-out. One orchestrated moment: the new stack settling in after a stow. |

## 3. Design tokens (`src/ui/styles/tokens.css`)

Tokens use the CSS `light-dark()` function with `color-scheme`, so each token is defined once. (`minimum_chrome_version` is 123 for this reason.) Theme override attributes (`data-theme="light|dark"`) set `color-scheme`; otherwise the OS decides.

```css
:root {
  color-scheme: light dark;

  /* Surfaces */
  --canvas:   light-dark(#F1F3EF, #111A17);   /* page background (Paper / Night) */
  --sheet:    light-dark(#FBFCFA, #16211D);   /* stacks, inputs, popup body */
  --raised:   light-dark(#FFFFFF, #1C2A25);   /* menus, dialogs, popovers */
  --scrim:    light-dark(rgb(10 16 13 / .45), rgb(0 0 0 / .60));

  /* Lines */
  --line:         light-dark(#DDE2DC, #27362F);  /* decorative hairlines */
  --line-strong:  light-dark(#C3CBC2, #38493F);  /* region dividers */
  --line-control: light-dark(#7F8B84, #6F7D75);  /* control borders (>= 3:1) */

  /* Text */
  --ink:   light-dark(#15201C, #E6ECE8);
  --ink-2: light-dark(#4F5B55, #B2BFB8);
  --ink-3: light-dark(#5F6B64, #8E9B93);         /* >= 4.5:1 on canvas and sheet */

  /* Accent (Spruce / Sage) */
  --accent:         light-dark(#1B6B52, #7FCDAE);
  --accent-hover:   light-dark(#155A44, #97D9BF);
  --accent-press:   light-dark(#104A39, #6BBB9C);
  --accent-wash:    light-dark(#E1EFE9, #1C3A2F);
  --accent-line:    light-dark(#9CC9B8, #3F7A63);
  --ink-on-accent:  light-dark(#FFFFFF, #0B1A14);

  /* Danger */
  --danger:        light-dark(#B3261E, #F2958E);
  --danger-solid:  light-dark(#B3261E, #E5645B);
  --danger-wash:   light-dark(#F9E3E1, #3A1D1B);
  --ink-on-danger: light-dark(#FFFFFF, #1A0B0A);

  /* Interaction */
  --hover:    light-dark(rgb(21 32 28 / .05), rgb(230 236 232 / .06));
  --press:    light-dark(rgb(21 32 28 / .09), rgb(230 236 232 / .10));
  --selected: var(--accent-wash);
  --focus:    light-dark(#15201C, #E6ECE8);

  /* Inverse (toasts) */
  --inverse-bg:     light-dark(#15201C, #E6ECE8);
  --inverse-ink:    light-dark(#F1F3EF, #111A17);
  --inverse-accent: light-dark(#7FCDAE, #1B6B52);

  /* Spine colors = native tab-group colors (decorative; never the only signal) */
  --grp-none:   var(--line-strong);
  --grp-grey:   light-dark(#6B7570, #9AA5A0);
  --grp-blue:   light-dark(#2F6FDE, #6FA0F5);
  --grp-red:    light-dark(#D2402F, #F0786A);
  --grp-yellow: light-dark(#C99A06, #E6B93A);
  --grp-green:  light-dark(#2E8B57, #5DBB86);
  --grp-pink:   light-dark(#C93B8A, #E37AB5);
  --grp-purple: light-dark(#8A52D6, #B48CF0);
  --grp-cyan:   light-dark(#1A8FA0, #5CC1D1);
  --grp-orange: light-dark(#D9701F, #F0A05A);

  /* Type */
  --font-ui:    'Instrument Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-title: 'Newsreader', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif;

  --text-meta:  12px/16px var(--font-ui);     /* counts, kbd, hints */
  --text-small: 13px/20px var(--font-ui);     /* domain, secondary, menu descriptions */
  --text-base:  14px/20px var(--font-ui);     /* rows, controls, body */
  --text-md:    16px/24px var(--font-ui);     /* dialog titles, search input */
  --text-stack: 18px/24px var(--font-title);  /* stack titles */
  --text-page:  24px/30px var(--font-title);  /* page/section titles, empty-state heading */
  --text-hero:  32px/38px var(--font-title);  /* onboarding only */

  /* Radii (by role) */
  --r-xs: 3px;   /* favicon tile, kbd */
  --r-sm: 6px;   /* buttons, inputs, rows' hover fill */
  --r-md: 10px;  /* menus, dialogs, popovers, toasts */

  /* Elevation (floating layers only) */
  --shadow-pop: 0 8px 24px rgb(10 16 13 / .16), 0 0 0 1px var(--line-strong);

  /* Motion */
  --dur-fast: 100ms;  --dur-base: 180ms;  --dur-slow: 280ms;
  --ease-out: cubic-bezier(.2, .8, .2, 1);
  --ease-in-out: cubic-bezier(.6, 0, .2, 1);

  /* Layers */
  --z-rail: 5; --z-sticky: 10; --z-menu: 50; --z-dialog: 60; --z-toast: 70; --z-drag: 80;
}
:root[data-theme='light'] { color-scheme: light; }
:root[data-theme='dark']  { color-scheme: dark; }

@media (prefers-reduced-motion: reduce) {
  :root { --dur-fast: 0ms; --dur-base: 0ms; --dur-slow: 0ms; }
}
```

**Tailwind v4 mapping** (`@theme inline` so utilities read tokens live and theme switches work without rebuild):

```css
@theme inline {
  --color-canvas: var(--canvas);  --color-sheet: var(--sheet);  --color-raised: var(--raised);
  --color-line: var(--line);      --color-line-strong: var(--line-strong);  --color-line-control: var(--line-control);
  --color-ink: var(--ink);        --color-ink-2: var(--ink-2);  --color-ink-3: var(--ink-3);
  --color-accent: var(--accent);  --color-accent-wash: var(--accent-wash);  --color-on-accent: var(--ink-on-accent);
  --color-danger: var(--danger);  --color-danger-solid: var(--danger-solid);  --color-danger-wash: var(--danger-wash);
  --color-hover: var(--hover);    --color-press: var(--press);  --color-selected: var(--selected);
  --font-sans: var(--font-ui);    --font-serif: var(--font-title);
  --radius-xs: var(--r-xs);       --radius-sm: var(--r-sm);     --radius-md: var(--r-md);
}
```

**Rules**
- No color literals, no raw font sizes, no `box-shadow` literals outside `tokens.css` (`check-tokens` enforces).
- A contrast test (`scripts/check-tokens.ts` + `design/contrast-pairs.json`) computes WCAG ratios for every declared pair in both themes: `ink`/`ink-2`/`ink-3` on `canvas`, `sheet`, `raised` ≥ 4.5; `accent` and `danger` text on `sheet` ≥ 4.5; `ink-on-accent` on `accent` and `ink-on-danger` on `danger-solid` ≥ 4.5; `line-control` on `sheet`/`canvas` ≥ 3; `focus` on `canvas`/`sheet`/`accent` ≥ 3. **The test is the source of truth; if a hex above fails, adjust the hex, not the test.**

**Fonts.** Self-hosted WOFF2, Latin + Latin-Extended subsets, variable axes only as needed (Instrument Sans: weight 400–600; Newsreader: weight 500–600 with optical size). Budget ≤ 120 KB total. Ship each font's OFL license in `public/fonts/`. `font-display: swap`; fallbacks above. Non-Latin scripts fall back to system fonts by design.

## 4. Typography, spacing, shape, metrics

### 4.1 Type roles

| Role | Token | Weight | Color | Used for |
|---|---|---|---|---|
| Stack title | `--text-stack` | 500 | `ink` (untitled date: `ink-2`) | Stack header |
| Page/section title | `--text-page` | 500 | `ink` | Settings sections, empty states, Trash heading |
| Hero | `--text-hero` | 500 | `ink` | Onboarding only |
| Row title | `--text-base` | 400 | `ink` | Saved tab title |
| Row domain | `--text-small` | 400 | `ink-3` | Host on the row |
| Body/controls | `--text-base` | 400/500 | `ink` / `ink-2` | |
| Counts, kbd, hints | `--text-meta` | 500 | `ink-3` | Tabular figures |

Rules: sentence case everywhere; no ALL CAPS; no italics for emphasis; `font-variant-numeric: tabular-nums` on every count, time, and badge; paragraphs ≤ 62ch (`max-width: 62ch` on help text); `text-wrap: pretty` on multi-line copy; truncation via CSS ellipsis with full text in tooltip and accessible name.

### 4.2 Spacing
4 px base unit (Tailwind default scale). Row horizontal padding 12 px; icon-to-text gap 10 px; page gutter 24 px (16 px below 900 px); between stacks `stackGap`.

### 4.3 Radii by role
`--r-xs` favicon tiles, kbd · `--r-sm` buttons, inputs, row hover/selected fills · `--r-md` menus, dialogs, popovers, toasts · **Stacks have no radius** (they are sheets; the spine has 2 px end caps).

### 4.4 Layout metrics (`src/ui/layout/metrics.ts` is the source; CSS variables are written from it at boot)

```ts
export const METRICS = {
  comfortable: { row: 36, stackHead: 52, stackGap: 24, topBar: 56 },
  compact:     { row: 28, stackHead: 44, stackGap: 16, topBar: 48 },
} as const;
export const RAIL_WIDTH = 232;     // 200 between 900–1099 px
export const CONTENT_MAX = 760;
export const SPINE_WIDTH = 3;      // 5 on drag-over
export const POPUP_WIDTH = 360;    // max height 560
```
Row and header heights are **fixed**, which makes virtualization and drag-and-drop hit-testing exact (02 §17). Never let content change a row's height.

## 5. Page layouts

### 5.1 Library (≥ 1100 px)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ▤ Stow   ┌──────────────────────────────────────┐              ⌘K    ⚙   [ Stow all tabs ]│ top bar 56
│          │ ⌕  Search tabs and stacks         /  │                                         │ (sticky, canvas, bottom hairline)
│          └──────────────────────────────────────┘                                         │
├─────────────────┬──────────────────────────────────────────────────────────────────────────┤
│ All tabs   482  │  ┃ Nov 22, 3:40 PM                       14 tabs    [Restore all]  ⋯      │ stack header 52
│ Pinned       3  │  ┃  ▫ ◼ Understanding IndexedDB transactions   developer.mozilla.org     │ row 36
│ Trash       12  │  ┃  ▫ ◼ Dexie.js: liveQuery()                  dexie.org            ⧉ ⇄ ✕  │ (hover: actions)
│                 │  ┃  ▫ ◼ fractional-indexing                     github.com                │
│ Stacks          │  ┃                                                                       │
│ ▌Nov 22…    14  │                                                                          │ gap 24
│  Rate limiting 9│  ┃ Research: rate limiting  📌          9 tabs    [Restore all]  ⋯       │ (spine = blue)
│  Reading list 31│  ┃  ▫ ◼ Token bucket vs leaky bucket           blog.cloudflare.com        │
│  …              │  ┃  ▫ ◼ …                                                                │
└─────────────────┴──────────────────────────────────────────────────────────────────────────┘
   rail 232                       reading column max 760, centered in the remaining space
```
- **Top bar:** wordmark (glyph + "Stow" in `--font-title`, 20 px/600), search (max 560 px), palette hint, settings icon button, primary **Stow all tabs** (executes `stow window` for the window that owns the Library).
- **Rail:** top group = routes with counts (All tabs, Pinned, Trash). Below, "Stacks" lists each stack (title or date, count right-aligned). The current stack (scroll-spy) shows a 2 px accent tick at the inline-start and `ink` text. Rail is virtualized past 200 items. Rail and list scroll independently.
- **Reading column:** stacks are separated only by `stackGap` whitespace and their spines.

### 5.2 Below 900 px
Rail hides behind a "Stacks" disclosure button in the top bar (popover list). Reading column fills width. Below 480 px (and in the future side panel), the row's domain is hidden (visible in tooltip and when selected); heights stay fixed.

### 5.3 Popup (360 px wide, ≤ 560 tall; P1)

```
┌────────────────────────────────────────┐
│ ▤ Stow                            ⚙    │ 48
├────────────────────────────────────────┤
│ ⌕  Search saved tabs…                  │ (Enter opens Library with the query)
├────────────────────────────────────────┤
│  Stow this window              14 tabs │ ← list items, 40 px, kbd at the end
│  Stow this tab                  Alt+⇧T │
│  Stow other tabs                       │
│  Stow all windows                      │
├────────────────────────────────────────┤
│ Recent                                 │
│  Nov 22, 3:40 PM    14        Restore  │
│  Rate limiting       9        Restore  │
│  Reading list       31        Restore  │
├────────────────────────────────────────┤
│ Open library                     482   │
└────────────────────────────────────────┘
```
Primary action items use `--text-base` 500 with the eligible count in `ink-3`. After an action, the popup closes itself (the SW does the work).

### 5.4 Command palette (⌘/Ctrl+K)
Centered dialog, 560 px wide, `--r-md`, `--shadow-pop`, scrim. Input (`--text-md`) on top, hairline, results below grouped by plain-sentence group labels ("Actions", "Stacks", "Tabs", "Settings"), max 8 visible rows then scroll. Enter runs, ⌘/Ctrl+Enter opens a tab in background, Esc closes. Tab results show favicon, title, stack name (ink-3).

### 5.5 Settings (`#/settings`)
Rail swaps to a settings sub-nav (General, Stowing, Restoring, Appearance, Data, Shortcuts, About). Content column max 640 px. Section title in `--text-page`. Each setting row: label (`--text-base` 500) + help (`--text-small` `ink-2`, ≤ 62ch) on the left, control on the right; hairline between rows; 16 px vertical padding. Destructive data actions live in a "Data" group with their own sentence-case sub-heading.

### 5.6 Onboarding (welcome panel at the top of an empty Library)
`--text-hero` heading, two sentences of body, three icon rows (pin the toolbar icon, click it, find your tabs here), shortcut kbd chips, and two buttons: **Stow this window** (primary) and **Import from OneTab** (secondary). It is a plain section on `canvas`, not a card; dismissible; shown only until the first stack exists.

## 6. Responsive and zoom rules
- Support 320 px width and 200%/400% zoom with no horizontal scrolling of the main content; toolbars wrap; fixed row heights remain (text truncates).
- `scroll-padding-top: calc(var(--topbar-h) + 8px)` so focused rows are never hidden under the sticky bar.
- Touch is not a v1 target, but hit areas are ≥ 28 × 28 px.

## 7. Library list anatomy

### 7.1 Stack (a "ruled sheet")

```
spine(3px) ┃  [chevron]  Title (serif 18)  [📌] [🔒]        14 tabs   Nov 22, 3:40 PM   [Restore all] [⋯]
           ┃  ─ rows ─
```
- **Spine:** full height of the stack (header + rows), color from `--grp-*` by `stack.color` or `--grp-none`; 2 px end caps; `inline-start` aligned with the content edge.
- **Header (height `stackHead`):** collapse chevron (16 px icon button, rotates 90° in `--dur-base`); **title** in `--text-stack` (untitled → creation time via `Intl.DateTimeFormat`, `ink-2`; click or F2 to rename inline); pinned/locked as 14 px icons in `ink-3` with tooltips; at the inline-end: **count** ("14 tabs", `--text-meta`, `ink-3`, tabular), **time** (`--text-meta`, `ink-3`; relative text in tooltip), `Restore all` (secondary, small), overflow menu (⋯). No dots or slashes between metadata; separation is 16 px of space.
- **Overflow menu items:** Restore in new window · Rename · Pin stack/Unpin stack · Lock stack/Unlock stack · Move to top/bottom · Merge into… · Sort by (title, domain, date saved) · Remove duplicates · Copy as Markdown · Copy as text · Export stack · Delete stack (danger text; disabled with tooltip if locked).
- Hover on the header applies `--hover` fill with `--r-sm` inset by 4 px from the spine.

### 7.2 Tab row (height `row`)

```
[ ☐ ] [ ◼ ]  Title that truncates with an ellipsis……………  developer.mozilla.org          [⧉][⇄][✕]
 20px  16px  flex 1 (min 0)                                  ≤ 30%, ink-3 --text-small     hover/focus-within
```
- **Checkbox slot:** 20 px reserved at the start; visible on hover/focus-within or when any selection exists (no layout shift).
- **Favicon:** 16 px (§11.4). **Title:** `ink`, single line, `dir="auto"` in `<bdi>`; empty title falls back to the URL (shown in `ink-2`). **Domain:** `ink-3`, hidden below 480 px.
- **Row actions** (visible on hover and `:focus-within`): Copy link, Move to…, Delete. They are `tabindex="-1"` (the row is one tab stop; the same actions are in the row's context menu, opened with the context-menu key, Shift+F10, or right-click).
- **States:** hover = `--hover`; pressed = `--press`; selected = `--selected` with a 2 px `accent` inline-start tick; focus = 2 px `--focus` outline offset −2 px (inside the row so it is never clipped); drag source = 40% opacity.
- The row is an `<a href>` (real URL, allowlisted scheme) so the browser's native link affordances work; the click handler intercepts (01 REST-02).

### 7.3 Gap between stacks
A `stackGap`-tall droppable region that acts as the "new stack" target during drag (drop line + label, §8.3). Otherwise empty.

### 7.4 Search results mode
The same list, filtered: stacks with no matches disappear; matching rows show highlights (`<mark>` styled `background: var(--accent-wash); color: inherit; border-radius: var(--r-xs)` plus a 1 px `accent-line` underline for forced-colors/low-vision redundancy); a one-line status above the list ("23 matches in 6 stacks") in `--text-small` `ink-2`, announced politely.

## 8. Interaction design

### 8.1 Pointer behavior on a tab row

| Gesture | Result |
|---|---|
| Click | Open (active); removes the item per settings/lock |
| ⌘/Ctrl-click or middle-click | Open in background; Library keeps focus |
| Alt/Option-click | Open and invert "remove on restore" for this action |
| Right-click | Row context menu (Open, Open in background, Open in new window, Copy link, Move to…, Delete) |
| Drag | See §8.3 |
| Checkbox click / Shift-click | Select / range-select |

### 8.2 Selection model
Selection is a set of tab ids (and stack ids when a stack header is selected = all its tabs). A **bulk bar** replaces the top-bar search area (sticky, `--raised`, `--shadow-pop` not needed; it sits in the bar): "{n} selected", then Restore, Move to…, Copy as…, Delete, and a Clear button. Esc clears. Selection persists across scroll and filtering within the same view, and is cleared on route change.

### 8.3 Drag and drop
- Activation: pointer must move ≥ 4 px (prevents accidental drags). Whole row is draggable; keyboard path in §8.4.
- **Drag overlay:** the row lifted with `--shadow-pop`, `--r-sm`, no tilt, following the pointer; multi-selection shows a stacked count chip ("3 tabs") at the inline-end.
- **Drop indication:** a 2 px `accent` line with 6 px round end dots between rows; over a stack header or empty stack, the target's spine widens to 5 px and the header gets `--accent-wash`; over a gap, the line spans the content column with the label "Drop to make a new stack" in `--text-small` `accent`.
- **Auto-scroll** within 48 px of the viewport edges, accelerating to 1,000 px/s.
- **Invalid targets** (locked stack deletion is not drag-related; dropping into trash is not supported in v1): cursor `not-allowed` only for truly invalid regions.
- Drop commits optimistically; on failure the item animates back (`--dur-base`) and an error toast appears.
- Reordering stacks: drag the stack header; during the drag the stack collapses visually to its header (data unchanged) so long stacks are manageable.

### 8.4 Keyboard map

Single-character shortcuts are active **only while focus is inside the list** (WCAG 2.1.4); global ones use modifiers or `/`.

| Scope | Key | Action |
|---|---|---|
| Global (Library) | `/` | Focus search (when not typing) |
| | `⌘/Ctrl+K` | Command palette |
| | `?` | Shortcut cheat-sheet dialog |
| | `⌘/Ctrl+Z` | Undo last operation |
| | `g` then `l` / `t` / `s` | Go to Library / Trash / Settings |
| List (tree) | `↑` `↓` / `Home` `End` | Move focus |
| | `→` / `←` | Expand / collapse stack; on a tab, `←` moves to its stack |
| | `Enter` | Tab: open · Stack: expand/collapse |
| | `Shift+Enter` | Stack: Restore all |
| | `Ctrl/⌘+Enter` | Tab: open in background |
| | `Alt+Enter` | Tab: open and keep |
| | `Space` | Toggle selection of focused item |
| | `Shift+↑/↓` | Extend selection |
| | `⌘/Ctrl+A` | Select all visible |
| | `Delete` / `Backspace` | Delete selection or focused item |
| | `F2` | Rename stack |
| | `m` | Move to… |
| | `p` / `l` | Pin / lock focused stack |
| | `Shift+F10` / context-menu key | Row/stack context menu |
| | `Esc` | Clear selection → close menus |
| Keyboard DnD | `Space` (on a focused row in move mode via `m`→"Move with arrows", or `Ctrl+Space`) | Pick up; `↑↓` move; `←→` change stack boundary; `Enter` drop; `Esc` cancel |

Announcements for keyboard DnD (polite live region): "Picked up {title}. Position {i} of {n} in {stack}." / "Moved to {stack}, position {i} of {n}." / "Dropped." / "Cancelled."

### 8.5 Inline rename
Title swaps to an input with identical font metrics (no layout shift), selected text, 1 px `--line-control` underline only (no box). Enter commits, Esc cancels, blur commits. Max 200 chars with a count shown only past 180.

## 9. Motion

All durations come from tokens and collapse to 0 under `prefers-reduced-motion`.

| Moment | Spec |
|---|---|
| Stack collapse/expand | Height via grid-rows `0fr↔1fr` over `--dur-base` `--ease-out`; chevron rotates in sync |
| Row removal (restore/delete) | Fade to 0 and collapse height over `--dur-base`; list reflows via virtualization offset update (no layout animation for off-screen rows) |
| Menu/popover open | opacity 0→1 and scale .98→1 over `--dur-fast`; close instant |
| Dialog | Scrim fade + panel translateY(8px)→0 over `--dur-base` |
| Toast | Enter: translateY(8px)+fade over `--dur-base`; exit: fade over `--dur-fast` |
| Drop settle | Item eases to its slot over `--dur-fast` |
| **New stack after a stow (the one orchestrated moment)** | When the Library is visible and a stow just created stacks: new stacks mount at the top; their header fill animates `--accent-wash` → transparent over 1,200 ms `--ease-out`, and the spine animates 5 px → 3 px over 400 ms. Not shown on initial load, import, or undo. Under reduced motion: a static 2 px `accent-line` outline for 2 s, then removed. |

Forbidden: ambient/looping animation, hover transitions on every element, entrance fades on page load, bounces/springs, parallax.

## 10. Theming, density, and first paint

- **Theme:** `system` (default) | `light` | `dark`, via `data-theme` on `<html>`. **Density:** `comfortable` | `compact`, via `data-density`.
- **No flash:** `src/entrypoints/theme-init.ts` compiles to a tiny classic (non-module) script included synchronously in `<head>` of Library/popup/options HTML. It reads `localStorage['stow.theme']` / `['stow.density']` and sets the attributes before first paint. Settings changes write both `chrome.storage` and `localStorage`. (Extension CSP forbids inline scripts, hence the external file.)
- **Forced colors:** under `@media (forced-colors: active)`: spines render as `border-inline-start: 3px solid CanvasText`; selection uses `outline: 2px solid Highlight`; focus uses `outline: 2px solid Highlight`; backgrounds from `color-mix`/washes are dropped; icons use `currentColor`.
- **Color is never the only signal:** the spine color mirrors the group's *name* (the stack's title); pinned/locked have icons; selected rows have a tick plus checkbox state.

## 11. Components

Build on Radix primitives (headless) and `cmdk`; style only with tokens. Every component appears in the **playground** (§15) in all states.

### 11.1 Button
| Variant | Fill | Text | Border | Hover | Press |
|---|---|---|---|---|---|
| primary | `accent` | `ink-on-accent` | none | `accent-hover` | `accent-press` |
| secondary | transparent | `ink` | 1 px `line-control` | `hover` fill | `press` fill |
| ghost | transparent | `ink-2` | none | `hover` | `press` |
| danger | `danger-solid` | `ink-on-danger` | none | 8% darker (via `color-mix` with `ink`) | 14% darker |

Sizes: **md** 32 px (padding-inline 12, `--text-base` 500, `--r-sm`); **sm** 28 px (compact density, row-level). Icon-only: square, 16 px icon, tooltip with name + shortcut after 500 ms (instant on keyboard focus). Disabled: `ink-3` text, no fill change, `aria-disabled` with tooltip explaining *why* where relevant. Loading: spinner replaces the label's leading icon; width locked. No trailing arrows in labels.

### 11.2 Inputs and selection controls
- **Search input:** 36 px, `--text-md`, `sheet` fill, 1 px `line-control` border, `--r-sm`, leading search icon (16 px, `ink-3`), trailing `kbd` hint (`/`) hidden while typing, clear button when non-empty. Focus: 2 px `--focus` outline offset 2 px (border unchanged).
- **Text input (rename, settings):** same chrome, 32 px.
- **Checkbox:** 16 px box, `--r-xs`, `line-control` border; checked = `accent` fill with `ink-on-accent` check; indeterminate dash for partial stack selection.
- **Switch:** 36×20 track, `line-control` off / `accent` on, 16 px thumb; label is the row label (clickable).
- **Select / ToggleGroup:** Radix Select for long lists; **segmented control** (ToggleGroup) for ≤ 4 choices (theme, density, toolbar click).

### 11.3 Menus and dialogs
- **Menu (Radix DropdownMenu/ContextMenu):** `raised`, `--r-md`, `--shadow-pop`, padding 4, items 32 px tall, 16 px icons, `kbd` right-aligned (`ink-3`), sub-menus open on →/hover with 150 ms intent delay, destructive items in `danger` text with the icon, separators `line`. Typeahead enabled.
- **Dialog:** 440 px (import/export 560 px), `raised`, `--r-md`, `--shadow-pop`, scrim, title `--text-md` 600 (sans), body `--text-base`, footer right-aligned: secondary left of primary; destructive confirmation uses the **danger** variant as primary. Focus moves to the first field or, for confirmations, to the **safe** (cancel) button. Esc closes; focus returns to the trigger. Never nest dialogs.
- **Tooltip:** `inverse-bg`/`inverse-ink`, `--text-meta`, `--r-sm`, 4 px × 8 px padding, max 280 px; never the only carrier of essential info.

### 11.4 Favicon and letter tile
16 px image from the favicon provider (02 §13) in a 16×16 box with `--r-xs`. While loading or on failure: **letter tile**: first letter of the registrable-domain label (uppercase, `--text-meta` 600), background `color-mix(in srgb, var(--grp-X) 18%, var(--sheet))`, text `ink-2`, where `X` = one of {blue, red, yellow, green, pink, purple, cyan, orange} chosen by a stable hash of the domain. No layout shift between states. Images get `alt=""` (decorative) and `loading="lazy"` only outside the virtual window (the virtualizer already bounds work).

### 11.5 Toast
Bottom-center, 16 px above the viewport edge, `inverse-bg`/`inverse-ink`, `--r-md`, `--shadow-pop`, padding 10 × 14, max width 480 px, single line preferred; action button text in `inverse-accent` 500. Up to 3 stacked (newest at the bottom). Default 8 s for toasts with Undo (pause on hover/focus-within and while the window is blurred), 4 s for plain confirmations, errors persist until dismissed. `role="status"` (polite); errors `role="alert"`. Dismiss with Esc when focused.

### 11.6 Kbd and small marks
`kbd`: `--text-meta`, `ink-2`, `sheet` fill, 1 px `line-control` border, `--r-xs`, min-width 20 px, centered, using platform glyphs (⌘ ⇧ ⌥ on macOS; Ctrl, Shift, Alt elsewhere). Pinned/locked marks are 14 px icons, no pills.

### 11.7 Settings groups and copy
Groups and the exact settings in each (labels/help text are catalog strings):

| Group | Setting | Label | Help |
|---|---|---|---|
| General | `toolbarClick` | When I click the toolbar icon | Choose what a single click does. You can always use the right-click menu. |
| | `afterStow` | After stowing | Show the Library in the window, or leave the window as it is. |
| | `openLibraryOnStartup` | Open the Library when the browser starts | |
| | `pinLibraryTab` | Keep the Library tab pinned | |
| Stowing | `ignorePinnedTabs` | Leave pinned tabs open | |
| | `preserveBrowserGroups` | Keep tab groups as separate stacks | Each group becomes a stack with the same name and color. |
| | `ignoredSites` | Never stow these sites | One pattern per line, for example `*://mail.google.com/*`. |
| | `dedupe` | When a tab is already saved | Keep only the newest copy. The older one goes to Trash. |
| | `stripTrackingForDedupe` | Ignore tracking parameters when comparing | Treats `?utm_source=…` links as the same page. |
| | `stowIncognito` | Allow stowing private windows | Saved tabs from private windows are written to disk and stay after you close the window. |
| Restoring | `restoreTarget` | Restore all opens tabs in | Current window / New window |
| | `removeOnRestore` | Remove tabs from the Library once opened | Locked stacks always keep their tabs. |
| | `restorePinned` / `restoreGroups` | Re-pin tabs that were pinned / Recreate tab groups | |
| Appearance | `theme`, `density`, `showFavicons` | Theme / Density / Show site icons | Site icons come from your browser's local cache; nothing is downloaded. |
| Data | `trashRetentionDays` | Keep deleted tabs for | 7 days / 30 days / 90 days / Forever |
| | `autoBackup` | Back up automatically | Saves a file to your Downloads folder. Requires permission to manage downloads. |
| | actions | Import…, Export…, Download backup, Restore from backup…, Empty trash, Reset settings | Destructive ones use confirmation dialogs (§13). |
| Shortcuts | n/a | Keyboard shortcuts | Shows current bindings and a button that opens the browser's shortcut settings (copy the URL to clipboard if direct navigation is blocked). |
| About | n/a | Version, privacy statement, diagnostics (copy log), license notices | |

## 12. Accessibility specification (WCAG 2.2 AA)

**Structure and semantics**
- Library list is a **tree**: container `role="tree"` `aria-label="Saved tabs"` `aria-multiselectable="true"`. Each virtualized row is a `treeitem` with `aria-level` (1 = stack, 2 = tab), `aria-setsize`, `aria-posinset`, `aria-expanded` (stacks), `aria-selected`. **Roving tabindex**: one tab stop for the whole tree; arrows move within it (§8.4). Row action buttons are `tabindex="-1"` and mirrored in the context menu (single tab stop, no nested-interactive traps).
- Landmarks: `header` (top bar), `nav` (rail, labeled "Stacks"), `main` (list), dialogs are `role="dialog"` with `aria-modal`.
- Headings: one `h1` per route (visually the wordmark/route title); stack titles are `h2` equivalents *inside* treeitems only if the pattern allows; otherwise use accessible names ("Stack {title}, {n} tabs, pinned").
- Accessible names: tab row = "{title}, {domain}"; actions include context ("Delete {title}").

**Input and focus**
- Everything operable by keyboard, including reordering (menu and keyboard DnD; WCAG 2.5.7).
- Visible focus: 2 px `--focus` outline, offset 2 px (−2 px inside rows); never removed. Focus is not obscured by sticky bars (scroll-padding).
- Dialog focus: trap, initial focus rules in §11.3, return to trigger on close. Menus: roving focus, Esc closes.
- Target size ≥ 28 px (min 24 per 2.5.8), with spacing.
- Character-key shortcuts only when the list has focus (2.1.4).

**Perception**
- Contrast per §3 (text 4.5:1; UI components 3:1) in both themes, verified by CI.
- 200% text zoom and 320 px reflow without loss (1.4.4, 1.4.10); text spacing overrides (1.4.12) don't break fixed-height rows because text truncates, not wraps.
- Color is never the sole signal (§10).
- Respect `prefers-reduced-motion`, `prefers-contrast: more` (increase `--line-*` contrast via a media-query override block), and `forced-colors`.

**Announcements (live regions)**
- Polite: stow/restore/delete/undo results ("Stowed 14 tabs in 3 stacks."), search status ("23 matches in 6 stacks."), keyboard DnD steps.
- Assertive: errors only.
- Toasts are not the only channel; the live region duplicates their text.

**Language and direction:** `lang` from the UI language; `dir` from locale; titles use `dir="auto"`.

## 13. Content design

**Voice:** plain, specific, calm. Active verbs; sentence case; no exclamation marks, emoji, or apologies. Errors say what happened, what is safe, and what to do. Same verb throughout a flow: the button says "Restore", the toast says "Restored".

**Glossary (never mix):** stow (verb) · stack · tab · Library · restore · Trash · pin / lock (stacks).

### 13.1 Actions (menu/button labels)
Stow all tabs · Stow this tab · Stow other tabs · Stow tabs to the left · Stow tabs to the right · Stow selected tabs · Stow all windows · Open library · Restore all · Restore in new window · Rename · Pin stack / Unpin stack · Lock stack / Unlock stack · Move to… · Merge into… · Sort by title / domain / date saved · Remove duplicates · Copy as Markdown · Copy as text · Copy link · Delete · Delete forever · Empty trash · Import… · Export… · Download backup.

### 13.2 Toasts (ICU plurals in the catalog)
| Event | Copy | Action |
|---|---|---|
| Stow | "Stowed {n, plural, one {# tab} other {# tabs}}." / with groups: "Stowed 14 tabs in 3 stacks." | none |
| Stow with skips | "Stowed 12 tabs. {k} pinned tabs stayed open." (omit clause if none; other reasons grouped: "2 tabs can't be saved.") | none |
| Stow, nothing eligible | "Nothing to stow in this window." | none |
| Dedupe | "Merged {n} duplicate(s)." | Undo |
| Restore | "Restored {n} tabs." / "Restored 11 tabs. 1 couldn't be opened." | none |
| Delete tab(s)/stack | "Deleted {n} tabs." / "Deleted stack." | Undo |
| Move | "Moved {n} tabs to {stack}." | Undo |
| Import | "Imported {n} tabs in {m} stacks." | Undo |
| Copy | "Copied {n} links." | none |

### 13.3 Errors
| Case | Title | Body |
|---|---|---|
| Save failed | Couldn't save tabs | Nothing was closed. {Reason if known: "Storage is full."} Try again, or export a backup first. |
| Partial close | Stowed {n} tabs | {k} tabs couldn't be closed. They're saved. You can close them manually. |
| Restore partial | Restored {n} tabs | {k} couldn't be opened and are still in the stack. |
| Blocked scheme | Can't open this link | Stow only opens web addresses (http, https, ftp, file). |
| Import invalid | Couldn't import this file | {first error with line number}. Nothing was changed. |
| Updated while open | Stow was updated | Reload this page to continue. |
| Recovery | The Library can't be opened | Your saved tabs are still on this device. Download your data, then try again. |

### 13.4 Dialogs
- **Delete forever:** title "Delete {n} tabs forever?" · body "This can't be undone." · buttons **Cancel** (default focus) / **Delete forever** (danger).
- **Empty trash:** "Empty Trash?" · "{n} tabs in {m} stacks will be deleted forever." · Cancel / Empty trash.
- **Import preview:** "Import {n} tabs in {m} stacks?" · detected format · skipped lines count with "Show details" · duplicates count · mode: Add / Skip duplicates · Cancel / Import.
- **Replace library (restore from backup):** "Replace your library?" · "This replaces everything in Stow with the backup. We'll download your current library first." · type `replace` to confirm · Cancel / Replace library (danger).
- **Allow incognito stowing:** "Save private tabs to disk?" · "Tabs from private windows will stay saved after you close them." · Cancel / Allow.

### 13.5 Empty states (heading in `--text-page`, one sentence, one action)
| State | Heading | Body | Action |
|---|---|---|---|
| No stacks | Nothing stowed yet | Click the Stow icon in your toolbar, then choose Stow this window to save its tabs here and free up memory. | Stow this window · Import from OneTab |
| No search results | No tabs match "{query}" | Search covers titles, URLs, and stack names. | Clear search |
| Empty trash | Trash is empty | Deleted tabs stay here for {days} days. | none |
| Empty stack | This stack is empty | Drag tabs here to keep them together. | none |
| Nothing pinned | No pinned stacks | Pin a stack to keep it at the top. | none |

### 13.6 Onboarding copy
Heading: "Close the clutter. Keep the tabs." · Body: "Click the Stow icon in your toolbar, choose Stow this window, and its tabs land here so your browser gets its memory back. Everything stays on this device." · Rows: "Pin Stow to your toolbar" / "Open it and choose Stow this window" / "Find, search, and restore tabs here" · Buttons: "Stow this window" / "Import from OneTab".

## 14. Brand and assets

- **Wordmark:** "stow" in Inter 700, 16 px in the top bar, preceded by the 20 px mark.
- **Mark:** the `layered-archive` raster master (`assets/icon-glossy.png`) — a glossy orange archive box rendered against a near-black backdrop, keyed out at export so no plate sits behind it. The rail and popup use `public/icon/128.png`; the toolbar uses the generated 16/32/48/128 family; the landing header and footer use `landing/assets/icon.png`. `scripts/gen-icons.ts` keys and downscales the master for every surface; see `docs/BRAND.md`.
- **Badge:** background `#1B6B52`, text white (`ink-on-accent` light value; set explicitly via `action.setBadgeBackgroundColor/TextColor` because action APIs don't read CSS variables). Transient success `✓`, error `!` (error background `#B3261E`).
- **Store assets:** screenshots 1280×800 ×5 (Library light with several stacks and a spine in two colors; Library dark during a drag; search with highlights; popup; import preview), small promo tile 440×280, marquee 1400×560, all showing real-looking but fictional content, no third-party logos or trademarks. Listing copy follows §13 voice.

## 15. Playground, visual QA, and review checklist

**Playground (`entrypoints/playground`, dev-only):** renders each component in every state (default, hover, focus-visible, pressed, disabled, loading, error) × light/dark × comfortable/compact × LTR/RTL × pseudo-locale `en-XA`, plus composite scenes (stack with 3 / 300 rows, selection, drag-over, empty states, toasts, dialogs). Playwright screenshots of the playground are the visual-regression baseline (03 §3).

**Design review checklist (every PR touching UI):**
- [ ] Only tokens and metrics are used; `pnpm check:tokens` passes (incl. contrast pairs).
- [ ] Rows/headers keep fixed heights in both densities; long, RTL, and emoji titles truncate without overflow.
- [ ] Every interactive element has a visible focus state and a keyboard path; tab order is sensible.
- [ ] Hover/pressed/disabled/loading/error states exist where applicable.
- [ ] Motion uses tokens and respects reduced motion; no ambient motion added.
- [ ] Copy follows §13 (sentence case, active voice, specific errors); strings are in the catalog with translator descriptions.
- [ ] Works at 320 px and 200% zoom; forced-colors and `prefers-contrast: more` checked.
- [ ] No resting shadows, gradients, uniform card containers, ALL-CAPS labels, middot-joined metadata, trailing arrows, emoji, or monospace.
- [ ] The spine remains the only decorative-but-meaningful color device; accent is reserved for primary action, selection, focus-adjacent emphasis, and drag targets.
