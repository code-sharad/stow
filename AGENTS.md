# AGENTS.md

Stow is a local-first Chrome/Firefox extension that saves browser tabs into a searchable library. This file is the entry point for AI agents and new contributors. It is a map, not the whole territory: when it disagrees with code or tests, the code and tests win.

## Start here

Read in this order:

1. This file.
2. [`docs/agents/architecture.md`](docs/agents/architecture.md) for the current module map and data flows.
3. The relevant recipe in [`docs/agents/recipes.md`](docs/agents/recipes.md).
4. [`docs/DECISIONS.md`](docs/DECISIONS.md) for rationale behind storage, backup, restore, and permission choices.
5. The tests beside the code you are about to change.

[`docs/00-README-agent-brief.md`](docs/00-README-agent-brief.md) through [`docs/05-hardening-plan.md`](docs/05-hardening-plan.md) are **historical build/spec documents**. They describe the original plan and an older target layout. Do not copy paths or file names out of them. Use this file and `docs/agents/architecture.md` for the tree as it exists.

## Commands

Run from the repository root. Node 22+ and pnpm 10+ are required.

| Goal | Command |
| --- | --- |
| Install and generate WXT types | `pnpm install` |
| Fast static checks | `pnpm lint && pnpm typecheck` |
| Unit tests | `pnpm test` |
| One test file | `pnpm test -- src/core/db/repo.test.ts` |
| Tests related to changed files | `pnpm test:related src/core/db/repo.ts src/core/domain/plan.ts` |
| Fast loop before committing | `pnpm verify:fast` |
| Coverage (core thresholds) | `pnpm test:coverage` |
| Chrome build | `pnpm build` |
| Firefox MV3 build | `pnpm build:firefox` |
| Manifest guard | `pnpm check:firefox-manifest` |
| Full pre-PR gate | `pnpm verify` |
| Browser E2E | `pnpm verify:e2e` |
| Firefox runtime smoke | `pnpm test:firefox` |
| Store screenshots | `pnpm screenshots` |
| Agent-doc consistency | `pnpm check:agent-docs` |
| Module boundary guard | `pnpm check:boundaries` |

`pnpm verify` runs token and network guards, lint, typecheck, coverage, both builds, the Firefox manifest guard, and the landing-page check. The landing check launches headless Chromium. `pnpm verify:e2e` builds first and launches a visible Chromium; on a headless Linux host use `xvfb-run -a pnpm verify:e2e`. Set `CHROMIUM_PATH` when Chromium is not at `/usr/bin/chromium`.

`pnpm test:firefox` needs Firefox and geckodriver on `PATH` (both are project dependencies). It builds `.output/firefox-mv3`, installs it temporarily, and drives it through WebDriver BiDi.

## Architecture at a glance

```
UI (React, src/ui, src/entrypoints)
  ├─ local reads/writes ──────────────► src/core/db/repo.ts
  └─ privileged workflows ──message──► src/entrypoints/background.ts
                                          ├─ src/services/stow.ts
                                          ├─ src/services/restore.ts
                                          ├─ src/services/backup.ts
                                          ├─ src/services/badge.ts / menus.ts
                                          └─ src/platform/* (chrome.*)
```

- `src/core/domain/` is pure TypeScript: domain types, URL normalization, ignore rules, planning, dedupe, ordering, native-group mapping. No `chrome.*`, React, Dexie, or UI imports.
- `src/core/db/` owns IndexedDB. `schema.ts` defines tables; `repo.ts` owns transactions; `changes.ts` publishes committed change sets.
- `src/core/io/formats.ts` is the single import/export boundary: OneTab text, Markdown, Netscape HTML, legacy Stow JSON, and full backup v2.
- `src/core/settings/` owns the zod settings schema and the `chrome.storage.local` mirror.
- `src/platform/` wraps reusable browser access (tabs, windows, favicons). Workflow-specific APIs such as alarms, downloads, permissions, menus, badge, and tab groups are called by the owning service, never by `core` or UI components.
- `src/services/` orchestrates multi-step workflows. They may call `core`, `platform`, `repo`, and workflow-specific browser APIs, but not React or UI.
- `src/messaging/protocol.ts` defines every UI-to-background message with zod and the response map.
- `src/entrypoints/background.ts` registers listeners at top level, then dispatches messages, commands, menus, and alarms.
- `src/ui/` is React plus a zustand store. Local library mutations call `src/ui/actions.ts`, which calls `repo.ts`; privileged tab operations go through `send()`.

The dependency rule is one-way: `ui/entrypoints → services → core`, with reusable browser access in `platform`. Do not import UI, services, platform, or `chrome.*` into `core/domain`, `core/io`, or `core/db`; `core/settings/store.ts` is the deliberate `chrome.storage` boundary.

## Data safety invariants

These are product invariants, not suggestions. A change that weakens one needs an explicit decision entry and a test.

1. **Save before close.** Stow writes and verifies the new stack before closing any tab. If the write, quota check, or verification fails, no tab is closed.
2. **Effect before delete.** A restore opens a tab before the saved row is marked removed. Deleting a saved row must never destroy the only copy of a URL.
3. **Transactions own consistency.** Multi-table writes happen in one Dexie transaction. Do not read a URL index, lock set, or duplicate set outside the transaction that uses it.
4. **Soft delete first.** Tabs and stacks are hidden with `deletedAt`/`deletedBy`; permanent deletion only happens through the purge/empty-trash paths.
5. **No silent URL rewrite.** Store the URL the user had. Derive `urlKey` for duplicate detection; do not rewrite or canonicalize the saved URL.
6. **Local only.** No network calls, telemetry, remote code, host permissions, or new browser permissions without an explicit product decision. The privacy guard test will fail otherwise.
7. **Restart-safe workflows.** MV3 workers are killed at any time. Durable progress belongs in IndexedDB (for example `Operation.restore`), not in module globals.
8. **Favicons are data, not HTML.** Only sanitized `data:image/...` or `https:` URLs of at most 64 KiB are stored. Never inject them with `innerHTML` or `dangerouslySetInnerHTML`.
9. **Settings are imported only after confirmation.** Backup import previews settings; applying them is a separate, explicit action.
10. **Every behavior has a test.** Bug fixes get a regression test that fails without the fix.

## Task router

| If the task is about… | Read first | Edit | Verify |
| --- | --- | --- | --- |
| Stow scope, eligibility, pinned/incognito/ignored tabs | `src/core/domain/ignore.ts`, `plan.ts`; `src/services/stow.ts` | domain + `repo.commitFreshStow` | `pnpm test -- src/core/domain src/core/db/repo.test.ts` |
| Opening/removing tabs, crash resume | `src/services/restore.ts`; `Operation.restore` in `types.ts` | restore service + repo restore functions | `src/services/restore.test.ts`, E2E |
| Import/export formats or backup shape | `src/core/io/formats.ts`; `docs/DECISIONS.md` | formats, `backup.ts`, `repo.importBackup` | `formats.test.ts`, `src/core/db/backup.test.ts` |
| IndexedDB schema, soft delete, purge, undo | `src/core/db/schema.ts`, `repo.ts` | repo + migration/version | repo tests, backup round-trip |
| Library UI, keyboard, themes | `src/entrypoints/library`, `src/ui/**` | components/state/actions/i18n/styles | `pnpm verify:e2e`, screenshots |
| Browser API or manifest permission | `src/platform/**`, `wxt.config.ts` | platform adapter + service | unit mocks, `pnpm test:firefox` |
| Settings behavior | `src/core/settings/schema.ts`, `store.ts` | schema/store, Settings page, i18n | settings tests, backup round-trip |
| Message between UI and worker | `src/messaging/protocol.ts` | protocol + background handler + caller | protocol-related tests, E2E |
| Release or store metadata | `docs/RELEASE_RUNBOOK.md`, workflows | release docs, workflows, and version | `pnpm check:release-version` |

## Definition of done

Before saying a change is complete:

1. The behavior has a test that would fail without the change, or you can explain why a test is impossible.
2. `pnpm verify:fast` passes.
3. If you touched tabs, restore, messaging, or the library UI, run `pnpm verify:e2e`.
4. If you touched Firefox behavior, favicons, the background lifecycle, or platform code, run `pnpm test:firefox`.
5. If you touched `src/core`, `pnpm test:coverage` stays above the configured thresholds.
6. If you changed a stored field, message shape, permission, import/export format, or user-visible behavior, add or update a `docs/DECISIONS.md` entry and the `docs/CHANGELOG.md` Unreleased section.
7. If you added a path, command, or document, update this file or `docs/agents/` and run `pnpm check:agent-docs`.
8. The diff contains no secrets, no generated `.output/`, no coverage output, and no unrelated formatting churn.

## Do not

- Do not add network requests, analytics, telemetry, remote scripts, host permissions, or new manifest permissions without explicit approval and a privacy update.
- Do not use `dangerouslySetInnerHTML`, `innerHTML`, or `eval` for imported titles, URLs, or favicons.
- Do not close tabs before the save is verified, or remove saved rows before the replacement tab is open.
- Do not cache library state in worker globals and assume it survives a restart.
- Do not hand-edit `pnpm-lock.yaml`, `.output/`, generated icons, or store screenshots; use the package manager or the script.
- Do not run `git push --force`, rewrite `main`, change branch protection, create releases/tags, or run `wxt submit` unless the user explicitly asks.
- Do not run destructive database operations against a real browser profile; tests use `fake-indexeddb`.
- Do not run `pnpm format` across the repository as part of a focused change; format only the files you touched.
- Do not copy the target tree from `docs/00-README-agent-brief.md`; it is historical.

## Known drift and sharp edges

- `docs/00`–`05` are historical. The current tree is in `docs/agents/architecture.md`.
- The legacy Stow JSON importer accepts only `formatVersion: 1`. Full backups are `formatVersion: 2` and go through `parseFullBackup`; do not force v2 through the legacy parser.
- Firefox does not expose the Chromium `favicon` permission or `/_favicon/` cache. Firefox icons are captured from `tabs.Tab.favIconUrl` at stow time and stored as data URLs. Chromium can fall back to the extension favicon cache when the permission exists; otherwise the UI draws a letter tile.
- `src/services/queue.ts` serializes work only within one worker lifetime. Durable restore progress is handled by restore operations in IndexedDB.
- Native tab groups are preserved when the browser supports them, but never required for core behavior.
- The UI calls `repo.ts` directly for local mutations. A future boundary check may tighten this; do not introduce new cross-layer shortcuts.

## Where to learn more

- [`docs/agents/architecture.md`](docs/agents/architecture.md) — modules, storage schema, write/restore/import flows.
- [`docs/agents/recipes.md`](docs/agents/recipes.md) — step-by-step changes with exact files and tests.
- [`docs/agents/testing.md`](docs/agents/testing.md) — test layers, mocks, E2E and Firefox harness details.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — why the current design exists.
- [`docs/RELEASE_RUNBOOK.md`](docs/RELEASE_RUNBOOK.md) — release and store submission.
