# Decisions

Append-only. Newest at the bottom.

## 2026-11-22 — Ship a working v1 on WXT + React + Dexie

- **Decision:** Use WXT 0.21, React 19, TypeScript strict, Dexie 4, Zod 4, MiniSearch 7, and
  Tailwind 4 with CSS design tokens.
- **Alternatives:** Plain Vite + CRXJS; vanilla Web Components; Preact.
- **Reason:** WXT gives MV3 entrypoints and cross-browser builds with little glue. Dexie's
  transactions and indexes fit the save-before-close invariant. React is familiar for the
  keyboard-heavy Library.

## 2026-11-22 — Keep domain and repository logic independent of React

- **Decision:** The domain, repository, and import/export formats have no React dependency.
  Browser-bound pieces are narrow: the settings store uses `chrome.storage.local`, and the
  Netscape HTML parser uses `DOMParser`. Tab/window calls still live in `src/platform` and
  services.
- **Reason:** Invariants (save-before-close, effect-before-delete) must be testable with
  `fake-indexeddb`, without a live browser. The settings and HTML paths are tested under jsdom.
  The service worker stays stateless.

## 2026-11-22 — Library writes apply their ChangeSet locally

- **Decision:** UI mutations that call the repository directly also pass the returned
  `ChangeSet` to the Library store. Service-worker mutations still arrive over
  `BroadcastChannel`.
- **Alternatives:** Reload the whole Library after every local write.
- **Reason:** `BroadcastChannel` does not deliver a message to the context that sent it. Applying
  the delta keeps the UI immediate and avoids full-table reads. Resync still covers gaps.

## 2026-11-22 — Scheduled backups use a data URL download

- **Decision:** `services/backup.ts` serializes live stacks and calls
  `chrome.downloads.download` with an encoded `data:` URL when the user has enabled backups and
  granted the optional permission.
- **Alternatives:** Offscreen document + Blob URL; File System Access API.
- **Reason:** MV3 service workers cannot create object URLs. The data-URL path keeps the worker
  stateless and needs no extra document. Very large libraries may hit browser URL limits; manual
  export remains the safe path for those.

## 2026-11-22 — Self-host Inter, never fetch fonts

- **Decision:** Bundle Inter as a variable WOFF2 at `public/fonts/inter-var.woff2` (SIL OFL 1.1,
  license at `public/fonts/INTER-LICENSE.txt`). Use Inter for interface text and the system
  monospace stack for paths, counts, keys, domains, and command prompts.
- **Alternatives:** Fetch Google Fonts at runtime; rely on whatever Inter the OS may have.
- **Reason:** Invariant 4 forbids remote fonts, and the extension must look the same on machines
  without Inter installed. The local WOFF2 keeps the bundle self-contained and the license is
  compatible with redistribution.

## 2026-11-22 — Background bundle is slightly over the written budget

- **Decision:** Accept a gzipped background bundle of roughly 65 KB against the 60 KB target.
- **Alternatives:** Split the repository/Zod behind dynamic imports; remove runtime validation.
- **Reason:** Runtime Zod validation protects the message boundary and repository reads. The
  overage is small; library and popup budgets are met. Recorded as a release-check deviation.

## 2026-11-22 — Drag and drop uses an explicit Move dialog

- **Decision:** Ship pointer drag/reorder through the stack/tab menus and a keyboard-accessible
  **Move to…** dialog. Do not ship a virtualized pointer DnD sensor in this cut.
- **Alternatives:** `@dnd-kit` pointer sensors over the virtual list.
- **Reason:** Virtualized DnD is the riskiest UI surface for lost selection and jank. A menu and
  dialog path works with keyboard, screen readers, and touch, and cannot silently drop a tab.
  `@dnd-kit` was removed from the dependency set; a follow-up needs its own spike.

## 2026-11-22 — Console interface derived from OpenCode

- **Decision:** Replace the Paper/Sheet visual system with a dark-first console interface:
  monospace type, near-black canvas, lavender accent, 1px rules, square corners, dense 30/34px
  rows, a prompt-style search field, and a persistent status bar with key hints. Light mode is a
  warm paper-terminal variant, not a separate design.
- **Alternatives:** Keep the library/filing metaphor; skin only the color tokens; add a third
  theme.
- **Reason:** Stow is operated like a command surface: search, scan, stow, restore. The console
  language makes state and shortcuts visible, removes card chrome that competed with hundreds of
  titles, and matches the tool the audience already lives in. Behaviour, route structure, and
  accessibility requirements from `04-design-system-and-ui.md` still apply; its Paper/Sheet
  visual sections are superseded.

## 2026-11-22 — Landing page is static, dependency-free, and uses real captures

- **Decision:** Ship `landing/` as plain HTML, CSS, and a small deferred script. Use real
  Playwright captures of the built extension instead of mocked product art, and generate the OG
  image from a checked-in SVG.
- **Alternatives:** A component framework or static-site generator; a browser-chrome mockup;
  hand-drawn promo art.
- **Reason:** The product promise is no network and no build machinery for the page itself. A
  static page loads fast, can be audited with the same Playwright stack as the extension, and a
  vector source keeps the icon and social mark reproducible without a generative-model dependency.
  Real captures keep the page honest and avoid a fake browser window.

## 2026-11-22 — MIT-licensed public repository

- **Decision:** Publish the source under the MIT license at `code-sharad/stow`, with contributor,
  security, and community guides, issue forms, and a tag-driven release workflow.
- **Alternatives:** A source-available license; a private repository with binary releases only.
- **Reason:** The privacy claim is only credible if the code can be audited. MIT is the simplest
  permissive license for a small utility and lets forks and package maintainers carry it forward.
  The product invariants stay in `CONTRIBUTING.md` so forks inherit the expectations, not just the
  code.

## 2026-11-26 — Backup v2 carries settings and list metadata; v1 stays importable

- **Decision:** Manual export and scheduled backup share `buildFullBackup()`. The payload records
  every live stack (`orderKey`, `pinned`, `locked`, `collapsed`, `color`, timestamps) and tab
  (`orderKey`, `wasPinned`, `createdAt`, `favicon`) plus the settings object. Import validates the
  whole document with strict zod schemas, refuses unknown fields and future versions, and applies
  imported settings only after an explicit confirmation. Legacy `formatVersion: 1` files still
  import as tabs-only.
- **Alternatives:** Add fields to v1 in place; export only the library; silently apply imported
  settings.
- **Reason:** A backup that drops lock/pin state or settings is not a restore. A new version keeps
  old importers honest and lets the importer tell the user when a file could not carry those fields.
  Confirming settings prevents a stranger's backup from turning retention or scheduled downloads
  into destructive defaults.

## 2026-11-26 — Existing backup alarms survive boot

- **Decision:** `syncBackupAlarm()` reads the stored schedule mode and returns without touching an
  alarm that already matches it. It creates an alarm only when none exists or the user changed the
  mode, and clears it when the mode becomes `off`.
- **Alternatives:** Recreate the alarm on every service-worker boot; store the next run time and
  schedule an exact delay.
- **Reason:** MV3 workers restart constantly. Recreating the alarm on each boot pushes the next
  backup further out forever, so a daily schedule can never fire.

## 2026-11-26 — Restore progress is durable, and resume is keyed by op id

- **Decision:** Before the first `chrome.tabs.create`, restore writes a `restore` operation with one
  row per saved tab. Successful creates mark rows `opened`; successful removals mark them `removed`.
  An unfinished operation is surfaced in the Library as a Resume toast, and resuming opens only
  `pending` rows, then removes every row the operation had opened.
- **Alternatives:** Retry by matching URLs; keep progress in memory; remove rows before opening.
- **Reason:** The worker can die between create and remove, and URL matching guesses wrong when the
  same URL is saved twice. An op-id ledger makes retry idempotent and preserves the product
  invariant that a saved row disappears only after its browser tab exists.

## 2026-11-26 — Dedupe decisions come from the commit transaction's snapshot

- **Decision:** The stow path builds its plan inside the Dexie transaction that writes it
  (`commitFreshStow`), reading the live URL index and locked-stack set from that snapshot.
- **Alternatives:** Keep the pre-read plan and abort on a mismatch; lock the whole database during
  plan construction.
- **Reason:** A delete or move in the Library between planning and committing could otherwise trash
  the wrong duplicate row or merge into a stack that no longer exists.

## 2026-11-26 — Capture favicons at stow time instead of requesting them

- **Decision:** Save `tabs.Tab.favIconUrl` as a validated `data:image/…` or `https:` string, capped
  at 64 KiB, and prefer it when rendering. Use Chromium's `_favicon/` endpoint only when the
  manifest grants the `favicon` permission; otherwise fall back to a letter tile.
- **Alternatives:** Store page URLs and fetch icons later; add host permissions for favicons.
- **Reason:** Firefox has no `_favicon/` endpoint, and fetching icons from sites would break the
  no-network promise. Capturing the URL the browser already resolved keeps both platforms offline.
