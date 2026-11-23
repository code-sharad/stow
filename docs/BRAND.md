# Stow brand and extension icon

Status: production. The raster master is the source of truth; the size family is generated from it.

## The mark

**Layered archive.** A white card, outlined in near-black, holds a small layered archive and
stands on a solid orange base that rounds the mark's bottom edge. The card keeps the silhouette
readable at 16 px and the orange base gives it a clear footing instead of reading as a generic
window. The surround is transparent: there is no plate behind the mark, so it sits on a light or
dark toolbar without one.

- Product: Stow
- Mark name: `layered-archive`
- One idea: tabs are an archive; shelving them keeps the work.
- No text, no letter "S", no folder, no cloud, no browser chrome.

## Production assets

| Asset | Size | Notes |
| --- | --- | --- |
| `assets/icon.png` | 1254×1254 | Raster master, sRGB with alpha, trimmed before export |
| `public/icon/16.png` | 16×16 | Toolbar; downscaled from the master |
| `public/icon/32.png` | 32×32 | Toolbar / retina |
| `public/icon/48.png` | 48×48 | Extensions page |
| `public/icon/64.png` | 64×64 | Store submission (32/64/128 set) |
| `public/icon/128.png` | 128×128 | Store listing, install dialog, in-app brand |
| `landing/assets/icon.png` | 128×128 | Landing header and footer; written by `pnpm icons` |
| `landing/assets/favicon.png` | 32×32 | Favicon and apple-touch-icon; written by `pnpm icons` |
| `landing/assets/og.svg` | 1200×630 | Open Graph source; embeds a 96 px copy |
| `docs/brand/icon-preview.html` | browser | Size and toolbar preview |

Regenerate the icon family and rebuild:

```bash
pnpm icons
pnpm build
```

`pnpm icons` writes the whole family: five manifest sizes into `public/icon/` and the two landing
copies. The library rail and popup use `public/icon/128.png` directly, so one command updates the
toolbar, the in-app brand, and the site header together. The Open Graph raster is generated from its source:

```bash
rsvg-convert -w 1200 -h 630 landing/assets/og.svg -o landing/assets/og.png
```

## Sizing

The master carries a few pixels of slack and transparent rounding, so `scripts/gen-icons.ts`
trims to the ink, resizes with Lanczos, and centres the result in a square. A plain downscale of the
untrimmed master leaves the mark sitting off-centre in the toolbar. At 16 px the card outline, the
archive inside it, and the orange base must stay distinct; reject a variant where the base merges
into the card.

### Clear space

Keep at least one band height clear on every side. The tile itself provides the outer boundary in
browser UI.

## Color and contrast

Sample the authoring file; the dominant colors are card `#FDFDFC`, outline `#060607`, orange base
`#FD7703`, and green `#119A24`. Do not recolor, invert, or restroke the mark per surface. The
near-black outline carries the silhouette on a light toolbar and the white card carries it on a dark
one, so the same file works on both without a plate.

## Brand voice

- Short declarative sentences.
- Lowercase command labels, sentence-case prose.
- Numbers and paths in monospace.
- One accent. No gradients, no glow, no "magic" language.
- Say what is local, what is closed, and what is never sent.

## Changing the mark

1. Replace `assets/icon.png` with a square master at 512 px or larger.
2. Run `pnpm icons` and `pnpm build` — the manifest family and both landing copies update together.
3. Open `docs/brand/icon-preview.html` and check the 16 px tile at 100% on both toolbars.
4. Update `landing/assets/og.svg` if the mark changed, then regenerate `og.png`.

## Don'ts

- Do not recolor, invert, or restroke the mark per surface; use the master as supplied.
- Do not hand-crop, rotate, or add padding; `pnpm icons` handles trim and centring.
- Do not add a letter, wordmark, cursor, or "AI" sparkle.
- Do not upscale a small export; always regenerate from the master.
- Do not place the mark on a gradient or a photographic background.

## Files

- `assets/icon.png` — raster master
- `docs/brand/icon-preview.html` — size and toolbar preview
- `scripts/gen-icons.ts` — PNG export
- `docs/LANDING.md` — landing page specification
