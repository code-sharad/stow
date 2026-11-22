# 03. Delivery plan and QA

**Audience:** implementing agent and reviewers · Requirement IDs refer to `01`, section numbers to `02`/`04`.

Work in milestone order. A milestone is complete only when its **exit criteria** pass in CI and the milestone is tagged (`m0`, `m1`, …). Do not start the next milestone with a red build.

---

## 1. Milestones at a glance

| M | Name | Outcome | Gate |
|---|---|---|---|
| **M0** | Foundations | Repo, CI, tokens, DB, settings, i18n skeleton, spikes | Green CI; spikes documented |
| **M1** | Walking skeleton | Stow → save → list → restore works end to end; invariants 1 and 2 proven | Fault-injection tests pass |
| **M2** | Library management | Virtualized list, stack/tab operations, DnD, selection, search, trash/undo | 20k-tab perf budget met |
| **M3** | Data portability | Import/export (OneTab text, JSON, Markdown, HTML), dedupe polish, backups | Round-trip tests pass |
| **M4** | Experience | Popup, command palette, settings UI, onboarding, themes/density, full keyboard + a11y pass | Axe clean; keyboard-only run-through |
| **M5** | Hardening | Perf at scale, chaos tests, Firefox build, diagnostics, size budgets | All NFRs verified |
| **M6** | Release | Store assets, listing copy, privacy policy, docs, release candidate | Release checklist (§8) complete |

## 2. Milestone details

### M0: Foundations
**Tasks**
1. Scaffold with WXT + React + TS strict + Tailwind v4 + Biome + Vitest + Playwright + pnpm. Add `docs/` (copy these five files), `DECISIONS.md`.
2. CI workflow (lint, typecheck, test, build, `check:*`, size-limit, e2e skeleton).
3. Implement `ui/styles/tokens.css`, `base.css`, font loading, `theme-init.ts`, `metrics.ts`, and the **playground** entrypoint with a few primitives (04 §3, §10).
4. Implement `core/domain` (types, `url.ts`, `order.ts`, `ignore.ts`, `dedupe.ts`) **with full unit and property tests**.
5. Implement `core/db` (schema, `repo` skeleton, `changes.ts` reducer) with `fake-indexeddb` tests; `core/settings` with Zod.
6. i18n wrapper, `en` catalog, pseudo-locale generator script.
7. `platform/*` interfaces + a **fake platform** for tests (tabs, windows, groups, menus, action).
8. Boundary checks: `dependency-cruiser` config, `check-tokens`, `check-no-network`.

**Spikes (time-boxed; write findings to `DECISIONS.md`)**
- **S1: Virtual list + DnD math.** Prototype `LayoutIndex` (prefix sums) with 20k rows; prove `y→row`, drop-target resolution, and edge auto-scroll at 60 fps in the playground.
- **S2: MV3 lifecycle.** Verify in Chromium: SW wake on action click/menu/command; `chrome.alarms` revert for the badge flash; window-survival sequence (create/move Library before closing) never closes the window.
- **S3: E2E harness.** Playwright launches Chromium with the unpacked extension (persistent context), reaches the SW (`context.serviceWorkers()`), and can call exported handlers via `serviceWorker.evaluate`. Context menus and commands are tested by invoking their handlers, not OS UI.
- **S4: Favicons.** Confirm `_favicon` URL form works from the Library page with the `favicon` permission; confirm letter-tile fallback.

**Exit:** CI green; spike notes committed; coverage ≥ 90% on `core/domain`.

### M1: Walking skeleton
**Tasks**
1. `services/stow.ts` pipeline (§8.5) incl. window survival and batched close; `services/restore.ts` (§8.6); `library-tab.ts`; `badge.ts`; action click handler; menus; commands; messaging protocol.
2. Minimal Library: unstyled-but-tokened list of stacks and rows, click-to-restore, "Restore all", delete (soft) with a basic undo toast.
3. Repo: `commitStow`, `verifyStow`, `loadForRestore`, `removeRestored`, `softDelete*`, `undo`, change bus.
4. Fault-injection tests (below, T-INV-1/2).

**Exit:** Manual smoke on Chrome: stow a 10-tab window, close/reopen browser, tabs still there, restore one/all. Invariant tests green. Walking skeleton demo recorded in `docs/CHANGELOG.md`.

### M2: Library management
**Tasks**
1. Flattened virtualization with fixed row heights; stack header/rows/gap per 04 §7; collapse persistence.
2. ORG-01..12 (rename, pin, lock, merge, sort, move-to, remove duplicates in stack).
3. DnD (tab↔stack, stack reorder, new stack by gap) with pointer + keyboard sensors; multi-select drag; auto-scroll; optimistic update/rollback.
4. Selection model + bulk bar (LIB-06).
5. Search: chunked index, incremental updates, highlighting, `domain:`.
6. Trash view, Undo toasts, ⌘/Ctrl+Z, retention purge + alarm.
7. Index rail with scroll-spy.

**Exit:** Perf fixture (20k tabs/500 stacks) meets LIB-05 and NFR-PERF-2/3 in the Playwright perf test; DnD e2e green; all ORG/TRASH/SRCH P0 acceptance tests green.

### M3: Data portability
**Tasks**
1. `core/io/*` parsers/serializers (OneTab text, JSON, Markdown, Netscape HTML) with Zod and limits.
2. Import dialog with preview, mode selection, progress, atomic transaction; error states.
3. Export UI (all, stack, selection), clipboard actions.
4. Backups: manual download; optional-permission flow for scheduled backups; restore from backup (Merge/Replace with typed confirm + auto-export).
5. Storage usage display.

**Exit:** Round-trip tests (JSON lossless; OneTab text order-preserving); malformed-input corpus (below) rejected with zero writes; import of a 50k-line file never freezes the UI (long-task budget).

### M4: Experience
**Tasks**
1. Popup (POP) with eligible-count label, recent stacks, search handoff.
2. Command palette (cmdk) with actions, stack jump, tab search.
3. Settings UI (all keys; live apply; reset).
4. Onboarding welcome panel; empty states; error copy per 04 §13.
5. Themes, density, forced-colors, reduced motion; shortcut cheat-sheet (`?`).
6. Full a11y pass: tree semantics, roving tabindex, live regions, focus management, 200%/400% zoom reflow.

**Exit:** Axe clean on all routes × light/dark × both densities; keyboard-only script (§6.3) completes; screen-reader pass (NVDA+Chrome and VoiceOver+Chrome) logged in the manual checklist.

### M5: Hardening
**Tasks**
1. Chaos tests (§5), large-scale tests (§4 T-PERF), memory profile.
2. Firefox build: feature-detect `tabGroups`, letter-tile favicons, event-page background; run the e2e subset that is API-supported.
3. Diagnostics log UI; Recovery screen + emergency export (and test).
4. Bundle-size tuning (lazy chunks); verify budgets.
5. Fix-forward bug bash using the manual checklist matrix (§7).

**Exit:** All NFRs in 01 §8 verified with recorded numbers in `docs/CHANGELOG.md`.

### M6: Release
**Tasks:** Store assets (04 §14), listing copy and permission justifications (02 §5), `docs/PRIVACY.md`, README for users, versioning (SemVer), signed zips for Chrome/Edge/Firefox, release notes, final trademark/name check.
**Exit:** Release checklist (§8) all checked; `v1.0.0-rc.1` tagged; two external dogfooders complete the OneTab-migration scenario (S-12) unaided.

## 3. Test strategy

| Layer | Scope | Tools | Notes |
|---|---|---|---|
| **Unit** | `core/domain`, `core/io`, `ui/layout`, reducers | Vitest + fast-check | ≥ 90% line coverage on `core`; property tests for URL key, order keys, parsers, reducer |
| **Integration** | `repo` against IndexedDB; services against **fake platform** | Vitest + fake-indexeddb | Includes fault injection (throwing DB, partial `tabs.remove`, rejected `tabs.create`) |
| **Component** | Rows, stack header, dialogs, palette, settings | Testing Library | Keyboard interactions and ARIA semantics asserted |
| **E2E** | Real Chromium + built extension | Playwright | Stow/restore through SW handlers; Library UI flows; DnD; import; no-network assertion |
| **A11y** | Every route × theme × density | axe-core in Playwright | Zero serious/critical |
| **Visual** | Playground states × light/dark × density × RTL × pseudo-locale | Playwright screenshots | Baselines updated only with design review |
| **Perf** | Seeded fixtures (1k, 5k, 20k tabs) | Playwright + trace/`performance.measure` | Budgets in 02 §17; fail CI on regression |
| **Manual** | Matrix in §7 | Checklist | Required per milestone |

**Test data:** `scripts/seed-fixture.ts --tabs 20000 --stacks 500 --seed 1` creates deterministic Stow JSON with realistic titles/domains, long titles, RTL titles, emoji, duplicate URLs, and tracking params.

## 4. Automated test catalog (must exist)

**Invariants**
- **T-INV-1 (save-before-close):** DB write throws / quota error / read-back mismatch → `tabs.remove` never called; error surfaced; Library unchanged.
- **T-INV-2 (effect-before-delete):** `tabs.create` rejected for item *k* → item *k* remains; others removed; summary correct.
- **T-INV-3 (soft delete):** every delete path leaves rows recoverable; only the three permitted paths hard-delete.
- **T-INV-4 (no network):** Playwright fails on any non-extension request across all flows; bundle grep passes.
- **T-INV-5 (verbatim URL):** stow→export→import preserves `url` byte-for-byte for a corpus (fragments, odd params, unicode, tracking params).
- **T-INV-6 (text-only rendering):** titles containing `<img onerror>`, `<script>`, `javascript:` URLs, RTL override characters render inert; click on `javascript:` item is refused (REST-09).
- **T-INV-7 (SW statelessness):** terminate SW between pipeline steps in e2e (via `chrome.runtime` reload or CDP `ServiceWorker.stopAllWorkers`); data remains consistent per the failure table.

**Functional (examples; every P0/P1 AC in 01 maps to ≥ 1 test)**
- Scope resolution table for all STOW-02 scopes; ignore-rule truth table (STOW-04); dedupe planner branches; native-group splitting (STOW-07); window survival (STOW-05); concurrent stow double-fire (STOW-11).
- Restore: modifiers, new-window, pinned/group recreation, lock behavior, empty-stack cleanup, ordering.
- Organization: rename limits, pin/lock semantics, merge, sort, move-to, DnD across/within/gap; keyboard DnD.
- Trash: undo/redo of each operation kind, retention purge boundary (exactly at N days), restore-to-original-position, "Recovered tabs".
- Search: ranking sanity, `domain:`, highlighting escapes, incremental index updates after edits.
- Import/export: OneTab text fixtures (CRLF, trailing spaces, missing titles, pipes inside titles, 3 blank lines), JSON round-trip, malformed corpus (truncated JSON, wrong `formatVersion`, 200k+ tabs, huge URLs, non-allowlisted schemes) → zero writes.
- Settings: invalid values fall back to defaults; live apply across contexts.
- Migration: fixture DB v(n-1) → v(n).

**T-PERF (budgets from 02 §17)**
- Cold open @ 20k: FMP ≤ 300 ms, interactive ≤ 800 ms; scroll test ≥ 55 fps (long-frame ratio); search p95 ≤ 50 ms; stow 1,000 tabs ≤ 3 s save-and-verify; no long task > 100 ms during restore of 200 tabs; Library heap ≤ 150 MB.

## 5. Chaos and fault-injection scenarios

1. Kill the SW immediately after `commitStow`, after `verifyStow`, mid-`removeInBatches`, and mid-restore. Assert: no loss; duplicates are mergeable; badge self-corrects at next wake.
2. Simulate `QuotaExceededError` on stow and import (via a wrapper that throws after N writes).
3. Close the target window mid-stow; close tabs manually mid-stow; navigate a tab between classify and close (acceptable: it is closed; data reflects the pre-navigation URL).
4. Open two Libraries (two windows) and mutate in both; assert convergence and no lost updates (rev-gap resync).
5. Extension reload while Library open → banner, no uncaught exceptions.
6. Corrupt DB / failed migration → Recovery screen → emergency export produces valid JSON containing all rows readable.
7. Sleep/wake: alarms overdue → purge/backup run at next start.

## 6. Acceptance scenarios (Gherkin-style; each is an e2e or manual-with-script test)

**S-1 One-click stow**
Given a window with 6 ordinary tabs, 2 pinned tabs, 1 `chrome://` tab and the Library, with defaults
When I click the toolbar icon
Then 6 tabs are saved in one new top Stack, those tabs close, the pinned and `chrome://` tabs remain, the Library is visible, and the badge shows the new total.

**S-2 Window survival**
Given a window with only 5 ordinary tabs
When I stow the window
Then the window stays open with exactly one tab (the Library).

**S-3 Save failure is safe**
Given the database rejects writes
When I stow
Then no tab closes and I see "Couldn't save tabs. Nothing was closed."

**S-4 Restore one / background / invert**
Click opens active and removes the item; ⌘/Ctrl-click opens in background and removes; Alt-click opens and keeps.

**S-5 Restore stack in new window** with a pinned tab and a native group → tabs open in a new window, pinned tab re-pinned, group recreated with title/color; items removed; empty untitled stack moves to Trash.

**S-6 Lock protects**
Given a locked stack
When I restore all
Then tabs open and remain in the stack; delete is disabled with the "Unlock to delete" tooltip.

**S-7 Dedupe**
Given the Library contains `https://a.com/x?utm_source=n`
When I stow a tab `https://a.com/x`
Then the older copy moves to Trash as a merge (toast says "Merged 1 duplicate", Undo available), and the new copy is saved.

**S-8 DnD with keyboard parity**
Dragging a tab to another stack, and doing the same via "Move to…" and via keyboard DnD, produce identical data.

**S-9 Search**
With 20k tabs, typing `gith` shows matching rows within 50 ms p95; `domain:github.com rust` narrows correctly; Esc restores the full list and focus.

**S-10 Undo and Trash**
Delete a stack → Undo restores position and contents; after 31 days (clock-mocked) Trash purges it; "Delete forever" requires confirmation.

**S-11 Import safety**
Importing a malformed file shows precise errors and changes nothing; a valid OneTab file previews counts and imports atomically.

**S-12 OneTab migration (dogfood)**
User exports from OneTab, imports into Stow, sees N stacks / M tabs matching the source, restores a stack successfully. Completed unaided by two testers.

**S-13 Offline guarantee**
All flows run with network disabled; zero blocked or attempted external requests.

### 6.3 Keyboard-only run-through (manual, M4)
Using only the keyboard: open Library via shortcut → search (`/`) → open a result → collapse/expand stacks → rename a stack (F2) → move a tab to another stack (menu) → select range → delete → undo (⌘/Ctrl+Z) → open the palette → change theme → import dialog open/close. Focus is never lost or trapped; focus ring is always visible.

## 7. Manual test matrix (record results per milestone)

| Axis | Values |
|---|---|
| Browsers | Chrome stable & beta, Edge stable, Brave, Vivaldi/Arc (smoke), Firefox stable (M5+) |
| OS | Windows 11, macOS (Apple Silicon), Ubuntu |
| Profiles | Fresh profile; profile with 500+ open tabs across 5 windows; incognito allowed vs. disallowed |
| Display | 100%, 200% zoom, 400% zoom at 320 CSS px; high-DPI; forced-colors; reduced motion; dark/light/system |
| Input | Mouse, keyboard only, trackpad; IME text entry in rename |
| Assistive tech | NVDA + Chrome, VoiceOver + Chrome |
| Locale | `en`, pseudo-locale `en-XA`, RTL (via forced `dir=rtl` build flag) |
| Data | Empty library; 20k fixture; fixture with long/RTL/emoji titles; duplicate-heavy fixture |

## 8. Release checklist (M6)

- [ ] All milestone exit criteria met; CI green on the release commit.
- [ ] NFR numbers recorded in `docs/CHANGELOG.md` (perf, size, memory).
- [ ] `docs/PRIVACY.md` final; store privacy fields consistent (no data collected; no remote code).
- [ ] Permission justifications pasted from 02 §5; optional `downloads` explained.
- [ ] Store assets complete (04 §14): icons, 5 screenshots (1280×800), small promo (440×280), marquee (1400×560), listing copy (no "OneTab" in the name/icon; nominative mention only in description for import).
- [ ] Name/trademark/store-name availability verified; placeholder `Stow` confirmed or replaced via `brand.ts` + catalogs.
- [ ] Third-party license notices bundled (`THIRD_PARTY_LICENSES.md`, font OFL texts).
- [ ] Source-code reviewability for AMO (documented build steps; reproducible zip).
- [ ] Versioning: SemVer; `manifest.version` from `package.json`; changelog entry.
- [ ] Rollback plan: previous zip retained; data schema migrations are forward-only, so the release must have been dogfooded on a copied profile first.

## 9. Risk register

| # | Risk | Likelihood / impact | Mitigation |
|---|---|---|---|
| R1 | Data loss from a stow/restore bug | Low / **Critical** | Invariants 1–3, fault-injection and chaos tests, Trash/Undo, backups, dogfood on real profiles before release |
| R2 | MV3 SW termination mid-workflow | Medium / High | Stateless design, ordering (save→close, open→remove), alarms not timers, S2 spike |
| R3 | Virtualized DnD complexity/jank | Medium / Medium | Fixed row heights + `LayoutIndex`, S1 spike first, keyboard/menu alternative as fallback path |
| R4 | Store review friction (`tabs` permission warning) | Medium / Medium | Clear single-purpose statement, justification text (02 §5), no host permissions, privacy policy |
| R5 | Firefox API gaps (`tabGroups`, favicons) | Medium / Low | Feature detection, documented degradations, scoped e2e subset |
| R6 | IndexedDB eviction/corruption | Low / High | `unlimitedStorage` + `storage.persist()`, backups, recovery screen + emergency export |
| R7 | Trademark/name conflict; copying OneTab assets | Low / High | Clean-room rule (00 §3.10), name check in M6, own icon/copy |
| R8 | Scope creep delays v1 | High / Medium | v1 scope fixed in 01 §11; ideas go to `DECISIONS.md → Proposed` |
| R9 | Library perf regressions over time | Medium / Medium | Perf tests + bundle budgets in CI, fail on regression |
