# Recipes

Step-by-step changes for the tasks agents most often get wrong. Read [`architecture.md`](architecture.md) first. Every recipe ends with the checks that prove it works.

## Add a setting

1. Add the key, type, default, and validation to `src/core/settings/schema.ts`. Use `.catch(...)` so corrupt/old storage cannot brick startup.
2. If the setting changes appearance, mirror it in `src/core/settings/store.ts` (theme/density already do).
3. Add a control in `src/ui/components/SettingsPage.tsx` and message keys in `src/ui/i18n.ts`. Reuse design tokens; no raw colors.
4. If the setting affects a workflow, read it inside that workflow (for example `src/services/stow.ts`) at call time. Do not cache it in a module global.
5. Backups include settings automatically through `buildFullBackup`; confirm `settingsSchema` still parses and add a round-trip assertion if the value is non-default.
6. Add the setting to the relevant unit test and, if it changes visible settings behavior, an E2E assertion.
7. Record a decision if the setting changes data safety, permissions, or backup compatibility.

Verify: `pnpm test -- src/core/settings src/core/db/backup.test.ts`, then `pnpm verify:e2e` for UI.

## Add or change a persisted field

1. Add the field to the domain type in `src/core/domain/types.ts`.
2. Write and read it in `src/core/db/repo.ts`. Keep all multi-table reads/writes inside the existing transaction.
3. Add an index in `src/core/db/schema.ts` only if the field is queried or sorted. Adding a plain field needs no Dexie migration; adding/removing an index needs a new `this.version(n).stores(...)` and an upgrade note.
4. Include the field in `src/core/io/formats.ts`: `FullBackupTab`/`FullBackupStack`, zod schema, `buildFullBackup`, `importBackup`. Preserve old backups by making the field optional or defaulted.
5. Update `src/core/db/backup.test.ts` and any repo tests that construct the type.
6. Record the compatibility decision in `docs/DECISIONS.md` and the user-visible change in `docs/CHANGELOG.md`.

Verify: `pnpm test -- src/core/db src/core/io/formats.test.ts`, plus `pnpm typecheck`.

## Add a UI → background message

1. Add the request schema and response type to the union/map in `src/messaging/protocol.ts`.
2. Add the handler branch in the message switch in `src/entrypoints/background.ts`; validate the sender before privileged work.
3. Add the caller in `src/ui/actions.ts` (or the relevant component) using `send()`.
4. Keep payloads narrow: IDs and `TabCandidate`, not raw `chrome.tabs.Tab`.
5. Test the workflow service directly and cover the UI path in `e2e/stow.spec.ts` if it is user-visible.

Verify: `pnpm typecheck && pnpm test`, then `pnpm verify:e2e` for the UI path.

## Add or change an import/export format

1. Work in `src/core/io/formats.ts`. Add detection evidence in `detectFormat`; do not classify by extension alone.
2. Parse untrusted input at the boundary: enforce `LIMITS.importBytes`, per-URL limits, allowed schemes, and a maximum tab count. Return `ImportIssue` for skipped rows; never throw away a whole import for one bad row unless the format is a structured backup.
3. Serialize with escaping that round-trips through the parser. Add a test with brackets, parentheses in URLs, backslashes, and non-ASCII titles.
4. If the format can carry settings or list metadata, use the full-backup schema and the shared `buildFullBackup`/`importBackup` path rather than a parallel writer.
5. Add fixtures/tests in `src/core/io/formats.test.ts` (and `src/core/db/backup.test.ts` for v2 round-trips).
6. Update `docs/DECISIONS.md` if compatibility or trust boundaries change.

Verify: `pnpm test -- src/core/io/formats.test.ts src/core/db/backup.test.ts`.

## Change restore behavior

1. Read `src/services/restore.ts` and the `RestoreOpState`/`RestoreRowState` types in `src/core/domain/types.ts`.
2. Preserve the order: create the durable op → open in `BATCH_RESTORE` chunks → mark `opened` per chunk → remove saved rows only after the replacement opens.
3. Make retries idempotent. `resumeNow` must reopen only `pending` rows and reconcile rows that no longer exist.
4. Add or update tests in `src/services/restore.test.ts`: normal restore, crash after partial open, duplicate invocation, and removal failure.
5. If the change affects what the user sees, cover the resume toast/library path in `e2e/stow.spec.ts`.

Verify: `pnpm test -- src/services/restore.test.ts`, then `pnpm verify:e2e`.

## Change stow, eligibility, or dedupe

1. Pure rules belong in `src/core/domain/ignore.ts`, `plan.ts`, or `dedupe.ts`. Add the rule there first with a table-driven unit test.
2. Keep the transaction boundary: `repo.commitFreshStow` reads the live URL index and locked stacks inside the transaction. Do not precompute duplicate/lock state in the service.
3. `src/services/stow.ts` owns orchestration only: scope → classify → commit → verify → ensure survival → close.
4. Add a regression test that fails without the change. For safety changes, also test the failure path (write/quota/verify error closes nothing).
5. Update the invariant or decision if the rule changes product behavior.

Verify: `pnpm test -- src/core/domain src/core/db/repo.test.ts src/services`, then `pnpm verify:e2e`.

## Add a browser capability or permission

1. Put reusable browser access in `src/platform/*.ts` behind a small typed function. A workflow-specific API (alarms, downloads, permissions, menus, badge, tab groups) stays in its owning service.
2. Declare the permission in `wxt.config.ts` and handle browser differences explicitly (Firefox drops `favicon` today).
3. Use it from a service, never from `src/core` or directly from React components.
4. Add a unit test with a mocked `chrome.*` object. Add `pnpm test:firefox` coverage when behavior differs in Firefox.
5. Justify the permission in `docs/DECISIONS.md` and `docs/PRIVACY.md`; run `pnpm check:network` and `pnpm check:firefox-manifest`.
6. Update `docs/STORE_LISTING.md`/review notes if the permission is user-visible.

Verify: `pnpm verify`, `pnpm test:firefox`.

## Add or change a library UI surface

1. Add the route/component under `src/entrypoints/library/` and `src/ui/components/`.
2. Use `src/ui/state/library.ts` for server-ish state and `src/ui/actions.ts` for mutations. Do not call Dexie from components.
3. Add message keys to `src/ui/i18n.ts`; no hardcoded user-facing strings.
4. Cover keyboard operation, focus-visible, light/dark, and red/cyan extremes. Use tokens from `src/ui/styles/`.
5. Add an axe assertion to `e2e/stow.spec.ts`; run `pnpm verify:e2e`.
6. If the surface appears in store assets, run `pnpm screenshots` and update `docs/STORE_LISTING.md`.

Verify: `pnpm verify:e2e`, then `pnpm verify`.

## Change backup or retention

1. `src/services/backup.ts` owns schedule and download; `src/core/io/formats.ts` owns the payload. Keep manual export and automatic backup on the same builder.
2. Preserve the alarm reconciliation rule: do not recreate/clear an alarm when the stored mode already matches. MV3 restarts must not postpone a backup forever.
3. Retention/purge lives in `src/core/db/repo.ts`; preserve soft-delete and `lastPurge` behavior.
4. Extend `src/services/backup.test.ts` for schedule changes and `src/core/db/backup.test.ts` for payload changes.
5. Record any format/retention change in `docs/DECISIONS.md`; add a changelog entry.

Verify: `pnpm test -- src/services/backup.test.ts src/core/db/backup.test.ts`, then `pnpm verify`.

## Prepare a release

1. Bump `package.json`, update `docs/CHANGELOG.md`, and confirm the version references in README and BUILD.
2. Run `pnpm check:release-version` with the intended tag available (or `GITHUB_REF_NAME` set).
3. Run `pnpm verify` and `pnpm verify:e2e`; run `pnpm test:firefox` for platform changes.
4. Follow `docs/RELEASE_RUNBOOK.md` for tags, artifacts, checksums, store uploads, and rollback.
5. Do not create tags, releases, or store submissions unless the user explicitly asked.

Verify: `pnpm check:release-version`, `pnpm verify`, `pnpm verify:e2e`.
