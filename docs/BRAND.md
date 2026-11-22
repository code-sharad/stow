# Stow brand and extension icon

Status: production direction. The vector master is the source of truth; generated images are
reference material only.

## The mark

**Stack + prompt.** A dark terminal tile contains a lavender prompt rail on the left and three
stacked bars on the right. It reads as a list of tabs at 16 px and as a command line at 128 px.
The bottom bar uses the accent, so the stack has a clear "current" edge instead of looking like a
generic hamburger menu.

- Product: Stow
- Mark name: `stack-prompt`
- One idea: tabs are work; the prompt is where work starts.
- No text, no letter "S", no folder, no cloud, no browser chrome.

## Production assets

| Asset | Size | Notes |
| --- | --- | --- |
| `assets/icon.svg` | 128 master | Vector source, 8 px grid |
| `public/icon/16.png` | 16×16 | Toolbar; rasterised from the master |
| `public/icon/32.png` | 32×32 | Toolbar / retina |
| `public/icon/48.png` | 48×48 | Extensions page |
| `public/icon/128.png` | 128×128 | Store listing / install dialog |
| `docs/brand/icon-preview.html` | browser | Size and theme preview |
| OG image | 1200×630 | Generated from the master; see landing spec |

Regenerate:

```bash
pnpm icons
pnpm build
```

The icon is a dark tile on purpose. It stays visible on light and dark browser toolbars, and the
off-white bars carry the silhouette even when the tile melts into a dark toolbar.

## Geometry

The master is a 128×128 `viewBox`. All coordinates are multiples of 8 so the 16 px export lands on
whole pixels.

| Element | x | y | width | height | fill |
| --- | --- | --- | --- | --- | --- |
| Tile | 0 | 0 | 128 | 128 | `#1B1B1B` |
| Tile radius | — | — | 24 | — | — |
| Prompt rail | 24 | 24 | 8 | 80 | `#A5A0B6` |
| Bar 1 | 40 | 24 | 64 | 16 | `#EEEEEE` |
| Bar 2 | 40 | 56 | 64 | 16 | `#B8B8B8` |
| Bar 3 | 40 | 88 | 64 | 16 | `#A5A0B6` |

At 16 px this becomes a 3 px inset, a 1 px rail, and three 8×2 px bars with 2 px gaps. Do not add
detail below 2 px; it turns to mud.

### Clear space

Keep at least one bar height (16 units at master size) clear on every side. The tile itself
provides the outer boundary in browser UI.

### Color and contrast

| Role | Hex | Use |
| --- | --- | --- |
| Tile | `#1B1B1B` | Always |
| Primary glyph | `#EEEEEE` | Top bar |
| Secondary glyph | `#B8B8B8` | Middle bar |
| Accent | `#A5A0B6` | Rail and bottom bar |

Non-text contrast against the tile: 15.9:1, 7.9:1, and 6.5:1. The mark does not depend on color
alone: the three-bar silhouette survives a grayscale export.

## Generative image workflow

Use an image model to widen the search, not to produce the shipped file. Generated raster icons
lose edge control at 16 px, invent text, and rarely survive a 16/32/48/128 family without manual
cleanup. Generate concept sheets, pick a direction, then redraw the winner on the 8 px grid.

### 1. Generate concept sheets

Use a square aspect ratio and the model's raw/less-stylised mode. Request a sheet, not one precious
image.

**Prompt A — direct direction**

```text
A single flat vector app icon for a local-first tab manager called Stow.
Dark charcoal rounded-square tile, one thin lavender vertical prompt rail on the left,
three horizontal stacked tabs to the right: off-white, warm grey, lavender.
Strict geometric grid, generous padding, crisp edges, high contrast, terminal UI brand mark.
No text, no letters, no numbers, no browser chrome, no folders, no clouds.
Square 1:1, flat 2D, solid colors, centered.
```

**Prompt B — exploration sheet**

```text
Logo exploration sheet, 8 variations of one minimal mark for a terminal-inspired tab manager.
Each variation uses a dark square tile, a vertical prompt bar, and stacked horizontal tabs.
Explore different bar counts, weights, and negative space. Black and off-white on a neutral
background. Flat vector, geometric, no gradients, no shadows, no text.
Square 1:1, consistent optical size across all 8 marks.
```

**Prompt C — social texture only**

```text
Abstract monochrome terminal texture for an Open Graph background.
Faint horizontal rules, sparse lavender cursor blocks, deep charcoal field, no words,
no logos, low contrast so overlaid text stays readable.
Wide 1200x630 composition, flat, no glow, no 3D.
```

**Negative prompt**

```text
text, letters, numbers, typography, wordmark, browser window, folder, cloud, lock,
gradient, glow, neon, 3D, bevel, drop shadow, photorealistic, watermark, UI screenshot,
tiny detail, thin hairlines, rainbow palette, rounded pill buttons, stock SaaS illustration
```

### 2. Judge at real size

Make a contact sheet at 16, 32, 48, and 128 px with nearest-neighbour scaling. Reject a direction
if the bars merge, the rail disappears, or the tile reads as a blob. Also test it on a dark
toolbar (`#202124`) and a light toolbar (`#F1F3F4`).

### 3. Redraw, do not trace

Rebuild the chosen direction with rectangles and one rounded tile in SVG. Do not auto-trace the
generated PNG; tracing adds wobble and sub-pixel edges that fail at 16 px. Keep the generated image
open as a reference for proportion, not as a source layer.

### 4. Export and inspect

```bash
pnpm icons
```

Open `docs/brand/icon-preview.html` and check the 16 px tile at 100% zoom. Then load the unpacked
extension and check the toolbar on both browser themes.

## Brand voice

- Short declarative sentences.
- Lowercase command labels, sentence-case prose.
- Numbers and paths in monospace.
- One accent. No gradients, no glow, no "magic" language.
- Say what is local, what is closed, and what is never sent.

## Don'ts

- Do not ship the generated PNG as the extension icon.
- Do not add a letter, wordmark, or "AI" sparkle.
- Do not use the old green `#1B6B52` tile; the console UI no longer uses spruce.
- Do not add a fourth bar, a cursor, or a tab count to the 16 px asset.
- Do not place the mark on a gradient or a photographic background.
- Do not use a different accent per surface; `#A5A0B6` is the only brand accent.

## Files

- `assets/icon.svg` — vector master
- `docs/brand/icon-preview.html` — size and toolbar preview
- `scripts/gen-icons.ts` — PNG export
- `docs/LANDING.md` — landing page specification
