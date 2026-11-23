# Stow brand and extension icon

Status: production. The raster master is the source of truth; the size family is generated from it.

## The mark

**Layered archive.** A dark rounded tile holds a cream, layered archive above an amber base. The
tonal bands keep the silhouette readable at 16 px and give the tile a clear bottom edge instead of
reading as a generic window.

- Product: Stow
- Mark name: `layered-archive`
- One idea: tabs are an archive; shelving them keeps the work.
- No text, no letter "S", no folder, no cloud, no browser chrome.

## Production assets

| Asset | Size | Notes |
| --- | --- | --- |
| `assets/icon.png` | 1254×1254 | Raster master, opaque, sRGB |
| `public/icon/16.png` | 16×16 | Toolbar; downscaled from the master |
| `public/icon/32.png` | 32×32 | Toolbar / retina |
| `public/icon/48.png` | 48×48 | Extensions page |
| `public/icon/128.png` | 128×128 | Store listing, install dialog, in-app brand |
| `landing/assets/icon.png` | 128×128 | Landing header and footer |
| `landing/assets/favicon.png` | 32×32 | Favicon and apple-touch-icon |
| `landing/assets/og.svg` | 1200×630 | Open Graph source; embeds a 96 px copy |
| `docs/brand/icon-preview.html` | browser | Size and toolbar preview |

Regenerate the icon family and rebuild:

```bash
pnpm icons
pnpm build
```

The library rail and popup use `public/icon/128.png` directly, so `pnpm icons` updates the toolbar
and the in-app brand together. The Open Graph raster is generated from its source:

```bash
rsvg-convert -w 1200 -h 630 landing/assets/og.svg -o landing/assets/og.png
```

## Sizing

The master is square and fills its frame, so exports are direct Lanczos downscales with no extra
padding. At 16 px the tile and the three bands must stay distinct; reject a variant where the amber
base merges into the dark tile.

### Clear space

Keep at least one band height clear on every side. The tile itself provides the outer boundary in
browser UI.

## Color and contrast

Sample the authoring file; the dominant colors are tile `#0E0E0E`, cream `#FCEFD5`, and amber
`#FAA227`. Do not recolor, invert, or restroke the mark per surface. The dark tile keeps it visible
on light and dark browser toolbars, and the cream bands carry the silhouette when the tile melts
into a dark toolbar.

## Brand voice

- Short declarative sentences.
- Lowercase command labels, sentence-case prose.
- Numbers and paths in monospace.
- One accent. No gradients, no glow, no "magic" language.
- Say what is local, what is closed, and what is never sent.

## Changing the mark

1. Replace `assets/icon.png` with a square master at 512 px or larger.
2. Run `pnpm icons` and `pnpm build`.
3. Open `docs/brand/icon-preview.html` and check the 16 px tile at 100% on both toolbars.
4. Update `landing/assets/og.svg` if the mark changed, then regenerate `og.png`.

## Don'ts

- Do not recolor, invert, or restroke the mark per surface; use the master as supplied.
- Do not crop, rotate, or add padding beyond the master.
- Do not add a letter, wordmark, cursor, or "AI" sparkle.
- Do not upscale a small export; always regenerate from the master.
- Do not place the mark on a gradient or a photographic background.

## Files

- `assets/icon.png` — raster master
- `docs/brand/icon-preview.html` — size and toolbar preview
- `scripts/gen-icons.ts` — PNG export
- `docs/LANDING.md` — landing page specification
