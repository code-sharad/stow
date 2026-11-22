# Changelog

## 0.1.0 — 2026-11-22

### Changed

- Replaced the Paper/Sheet visual layer with an OpenCode-derived console system: dark-first
  palette, monospace type, lavender accent, square corners, 1px rules, and dense 30/34px rows.
- Set the dark canvas to `#0C0C0C` and removed the raised reading-pane background, so stacks
  and tab rows sit directly on the canvas; regenerated the library captures and Open Graph image
  to match.
- Added a full-width command bar, prompt-style search, and a persistent status line with view
  path, live counts, and keyboard hints.
- Settings, Trash, welcome, popup, menus, dialogs, and toasts now share the same flat console
  language.
- Native `window.confirm` prompts for empty-trash and reset are now in-product confirm dialogs.
- Increased the type scale throughout. **Comfortable** now uses 14px tab titles with 38px rows;
  **Compact** uses 13px titles with 32px rows. Both scale controls, rail, settings, popup, and
  status text.
- Renamed the setting to **Text size and density** and documented the trade-off inline.
- Added a two-font system: self-hosted Inter for interface text, monospace for paths, counts,
  domains, shortcuts, and status hints. No remote font requests.
- Replaced the legacy green icon with the console `stack-prompt` mark: charcoal tile, lavender
  prompt rail, three stacked bars. Added a size/toolbar preview at
  `docs/brand/icon-preview.html`.
- Added `docs/BRAND.md` (generative prompt workflow, icon geometry, QA) and `docs/LANDING.md`
  (page structure, copy deck, design system, accessibility, and performance spec).

### Added

- Static landing page in `landing/`: console status strip, terminal demo, product proof, real
  light/dark library captures, privacy ledger, import/export formats, and install steps.
- Generated Open Graph image (`landing/assets/og.png`, 1200×630) from
  `landing/assets/og.svg`, plus a Playwright + axe check (`pnpm check:landing`) covering 320,
  375, 640, 768, and 1440 px in both color schemes.

### Project

- Open-sourced under the MIT license.
- Added contributor, security, and community guides, issue forms, a pull request template, a
  tag-driven release workflow, and landing-page CI coverage.

### Fixed

- All-tabs counts now exclude trashed tabs.
- Accessibility contrast for status-bar key hints in both light and dark themes.
- The Library no longer renders Settings twice.

## 0.0.1 — 2026-11-22

Pre-release development cut of Stow.

### Added

- MV3 extension on WXT + React + Dexie with no host permissions and a self-only CSP.
- Stow pipeline: resolve scope → classify → dedupe → plan → one read/write transaction →
  read-back verification → window-survival check → batched close → badge refresh → change bus.
- Restore pipeline: scheme allowlist → batches of 8 → native group recreation → remove restored
  rows only after opening succeeds.
- Library with virtualized stacks, search (`domain:` included), keyboard tree navigation,
  selection and bulk actions, command palette, inline rename, pin/lock/collapse, move dialog,
  dedupe, copy as Markdown/text, and JSON/HTML/Markdown/OneTab import.
- Trash with Undo, retention purge alarm, delete forever, and empty trash.
- Popup with eligible count, recent stacks, and Library handoff.
- Settings for theme, density, toolbar click, startup, badge, ignored sites, incognito, groups,
  restore behavior, retention, backups, import/export, storage usage, and shortcuts.
- Optional runtime `downloads` permission with scheduled daily/weekly JSON backups.
- English catalog, light/dark tokens, comfortable/compact metrics, reduced-motion and
  forced-colors styles.

### Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` (70 tests), `pnpm build`, and `pnpm e2e` (5
  Chromium tests, including an axe serious/critical scan) pass locally.
- Core coverage at the last run: 88.53% statements, 94.82% lines, 90.05% functions.
- Production build: about 823 KB on disk, 43 KB CSS; gzipped initial library JS about 162 KB,
  popup under 3 KB, background about 65 KB.
- No-network and token greps pass (`pnpm check:network`, `pnpm check:tokens`).

### Known gaps

- Pointer drag-and-drop is replaced by the Move dialog (see `docs/DECISIONS.md`).
- Landing assets use relative OG paths until a production URL exists; `canonical`, `sitemap.xml`,
  and hosted OG URLs are deployment tasks.
- Store screenshots, promo art, AMO source bundle, and external dogfooding remain release tasks.
