# Stow brand and extension icon

Status: production. The raster master is the source of truth; the size family is generated from it.

## The mark

**Layered archive, rendered.** A glossy orange archive box lit from above, so the lid carries a
bright specular band and the base falls into shadow. The render is produced against a near-black
backdrop; the export keys that backdrop out, so the mark sits on a light or dark toolbar with no
plate behind it. One master feeds every surface: the manifest family in `public/icon/`, the landing
header and footer, and the favicon.

- Product: Stow
- Mark name: `layered-archive`
- One idea: tabs are an archive; shelving them keeps the work.
- No text, no letter "S", no folder, no cloud, no browser chrome.

## Production assets

| Asset | Size | Notes |
| --- | --- | --- |
| `assets/icon-glossy.png` | 1254×1254 | Raster master: glossy render on a near-black backdrop, sRGB, keyed out at export |
| `assets/icon.png` | 1254×1254 | Retired flat master, kept for history: nothing renders from it |
| `public/icon/16.png` | 16×16 | Toolbar; downscaled from the master |
| `public/icon/32.png` | 32×32 | Toolbar / retina |
| `public/icon/48.png` | 48×48 | Extensions page |
| `public/icon/64.png` | 64×64 | Store submission (32/64/128 set) |
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

`pnpm icons` writes the whole family from `assets/icon-glossy.png`: five manifest sizes into
`public/icon/` and the two landing copies, so the toolbar, the in-app brand, and the site header move
together. The master is a 3D render lit against near black, so `scripts/gen-icons.ts` keys that
backdrop out by flood-filling from the eight frame edges, erodes the mask two pixels so the surviving
rim stays inside the subject rather than on the blend, feathers the alpha by 1.5 px, and insets the
result to 96% of the tile so a mark this dense does not crowd the wordmark. The library rail and
popup use `public/icon/128.png` directly. The Open Graph raster is generated from its source:

```bash
rsvg-convert -w 1200 -h 630 landing/assets/og.svg -o landing/assets/og.png
```

## Sizing

The master is rendered on a near-black backdrop, so `scripts/gen-icons.ts` keys the backdrop out,
trims to the ink, resizes with Lanczos, and centres the result in a square at 96% of the tile. A
plain downscale of the raw render leaves a dark plate around the box. At 16 px the lid highlight,
the two dividers, and the shadowed base must stay distinct; reject a variant where the box collapses
into a flat orange square.

### Clear space

Keep at least one band height clear on every side. The tile itself provides the outer boundary in
browser UI.

## Color and contrast

Sample the authoring file; the dominant colors are body orange `#ED6304`, lid highlight `#F8A81E`,
shadowed base `#AE340B`, dividers `#E4E1EA`, and paper grey `#A8A1AC`. Do not recolor, invert, or
restroke the mark per surface. The shadowed base and the orange body carry the silhouette on a light
toolbar and the pale dividers carry it on a dark one, so the same file works on both without a plate.

## Brand voice

- Short declarative sentences.
- Lowercase command labels, sentence-case prose.
- Numbers and paths in monospace.
- One accent. No gradients, no glow, no "magic" language.
- Say what is local, what is closed, and what is never sent.

## Changing the mark

1. Replace `assets/icon-glossy.png` with a square master at 512 px or larger, rendered on a dark,
   uniform backdrop so the edge flood-fill still keys cleanly; widen the `14%` fuzz in
   `scripts/gen-icons.ts` if a new backdrop is lighter.
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

- `assets/icon-glossy.png` — raster master
- `assets/icon.png` — retired flat master, kept for history
- `docs/brand/icon-preview.html` — size and toolbar preview
- `scripts/gen-icons.ts` — PNG export
- `docs/LANDING.md` — landing page implementation, copy, and checks
