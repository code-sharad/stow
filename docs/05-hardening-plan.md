# Stow hardening and release plan

> **Historical plan.** This was the remediation plan for the audit at `f1e901e`. It has been
> implemented and extended; current behavior, paths, and test commands are in
> [`../AGENTS.md`](../AGENTS.md) and [`agents/`](agents/). Use this file for rationale and scope
> history only.

Status: proposed, 2026-11-26. Source: read-only end-to-end audit of `f1e901e` (GitHub
[code-sharad/stow](https://github.com/code-sharad/stow)), including a real Firefox 160.0.1 run.

This document is written to be executed by AI agents with human review. Each workstream is
issue-ready: scope, files, acceptance criteria, tests, and the exact verification command. Do not
expand scope inside a workstream; open a new issue instead.

## 1. Definition of done for the whole plan

The plan is complete when all of the following are true:

1. A full-fidelity backup round-trips every user-visible field and every setting.
2. Automatic backups cannot be postponed indefinitely by service-worker restarts.
3. Interrupted restore cannot duplicate tabs on retry; retries converge.
4. Stow dedupe is computed inside the commit transaction, not from a stale snapshot.
5. Every format Stow exports can be imported by Stow, proven by a round-trip test.
6. Firefox shows real favicons or a deliberate, documented fallback (no aborted requests).
7. `main` is protected and requires the full CI job; release artifacts come only from a verified
   tag workflow with checksums and a workflow-run link.
8. Docs, screenshots, and version numbers agree with the shipped build.
9. A signed store build has been installed and smoke-tested on Chrome and Firefox.
10. `pnpm verify` is the single local command that equals CI.

Non-goals for this pass: cloud sync, accounts, new product features, redesign, Firefox Android
store submission, automated store publishing (that comes after a manual signed release works).

## 2. Guardrails (read before every task)

These are the existing product invariants in `docs/00-README-agent-brief.md`; they are
release-blocking and unchanged by this plan.

- Save before close: commit and read back before closing any tab.
- Effect before delete: never remove saved data before the action it enables succeeded.
- No network, no telemetry, no host permissions.
- Stored URLs verbatim; titles and URLs are text nodes only.
- Service worker is stateless; anything that matters lives in IndexedDB or `chrome.storage`.
- Every new behavior ships with an automated test, or a checked manual step where automation is
  impossible.
- Any deviation or non-obvious tradeoff is appended to `docs/DECISIONS.md`.

Working rules for agents:

- One issue → one branch → one PR. Branch name `fix/<issue>-<slug>` or `chore/<issue>-<slug>`.
- Conventional Commits, imperative subject, body explains the failure mode being fixed.
- No drive-by refactors, no dependency upgrades, no formatting-only diffs inside a fix PR.
- Every PR body states: what broke, how it was proven, what was **not** covered.
- Prefer a failing test first (red), then the fix (green). Paste the failing assertion in the PR.
- Never mark work done from a successful build alone. Run the command in the issue's **Verify**.

## 3. Waves and sequencing

Dependencies are real: do not start a later wave before the earlier one is merged and green.

| Wave | Theme | Why first |
|------|-------|-----------|
| W0 | Safety net: `pnpm verify`, version guard, test scaffolding | Everything after this depends on trustworthy checks |
| W1 | Data integrity: backup fidelity, alarm schedule, import round trips | Silent data loss is the only unrecoverable class of bug |
| W2 | Lifecycle: durable operations, retry idempotence, dedupe race | Prevents duplicates and stale state under real worker behavior |
| W3 | Platform parity: Firefox favicon, Firefox E2E, packaging validation | Store rejection and broken UI on one browser |
| W4 | Release engineering: release on CI, provenance, protection, store prep | Turns artifacts into a releasable product |
| W5 | Docs, changelog, and submission | Cheap, must be last so it describes what shipped |

## 4. Workstreams

### W0-1 — Add `pnpm verify` as the single check command

Problem: contributors and agents run subsets; CI and release disagree; `pnpm e2e` can test stale
build output.

Scope: `package.json` scripts; `e2e/stow.spec.ts` browser path handling; `CONTRIBUTING.md`.

Do:

- Add `"verify": "pnpm check:tokens && pnpm check:network && pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build && pnpm check:landing"`, plus a separate `"verify:e2e": "pnpm build && pnpm e2e"` so the browser suite always builds first.
- Make E2E honor `process.env.CHROMIUM_PATH ?? '/usr/bin/chromium'` instead of the hardcoded path at `e2e/stow.spec.ts:22`.
- Document `pnpm verify` and `xvfb-run -a pnpm verify:e2e` in `CONTRIBUTING.md`.

Acceptance:

- `pnpm verify` passes locally and in CI using the same command.
- `CHROMIUM_PATH=/some/other/chromium pnpm verify:e2e` uses that binary.
- Removing `.output/chrome-mv3` then running `pnpm verify:e2e` still passes (proves no stale test).

Verify: `pnpm verify && xvfb-run -a pnpm verify:e2e` (Linux headless).

### W0-2 — Fail release when tag, package, and changelog disagree

Problem: `release.yml` accepts any `v*` tag and names files from `package.json:3`; a mismatched tag
publishes the wrong version under the wrong name.

Scope: `scripts/check-release-version.ts` (new), `package.json`, `.github/workflows/release.yml`.

Do:

- Script reads `GITHUB_REF_NAME` (fallback `git describe --tags --exact-match`), strips `v`, compares
  to `package.json` version, and asserts `docs/CHANGELOG.md` contains a `## <version>` heading.
- Non-zero exit with a message naming all three values when they disagree.
- Call it as the first step after install in the release workflow.

Acceptance:

- Tag `v0.2.0` with `package.json` at `0.1.1` fails with a clear error.
- Tag `v0.1.1` with a `## 0.1.1` changelog heading passes.

Verify: `pnpm tsx scripts/check-release-version.ts` under a temporary git tag, both cases.

### W1-1 — Full-fidelity backup and export schema (highest priority)

Problem: exports keep only stack title, `createdAt`, tab URL, and tab title
(`src/core/io/formats.ts:4-13`, `src/services/backup.ts:24-32`, `src/ui/actions.ts:207-245`). Lost:
list order, pin, lock, collapsed, color, tab order, tab pinning, `groupId` (native group identity),
and all settings. After reinstall, users get URLs, not their workspace.

Scope: `src/core/io/formats.ts`, `src/core/db/repo.ts` (export/import helpers),
`src/services/backup.ts`, `src/ui/actions.ts`, `src/core/domain/types.ts` (types only).

Do:

- Introduce `FullBackupV2` with `app`, `formatVersion: 2`, `exportedAt`, `settings`,
  `stacks[]` carrying every field of `Stack` plus `tabs[]` carrying every field of `SavedTab`
  except volatile runtime ids, and explicit `order` arrays if fractional indexes are not exported
  verbatim.
- Keep the existing flat shape as a **legacy import** path (`formatVersion <= 1`) so old exports
  still import. Never silently drop fields on v2: unknown-field rejection is safer than ignoring.
- Zod-validate v2 at the boundary; reject with a specific error code, not `invalid-json`, when a
  v2 document is malformed.
- Schedule backups from the same builder so manual export and automatic backup cannot drift.
- Include settings in the backup, but keep `trashRetentionDays` and other destructive settings
  inert until the user confirms on import (show a diff count before applying).

Acceptance:

- `export → clear DB → import → deep-compare` reproduces stacks, tabs, order, pin, lock, collapsed,
  color, tab pinning, and settings exactly.
- A v1 export still imports with the documented degradation (URLs, titles, dates only) and the UI
  says so before import.
- A v2 document with an unknown field fails closed with a readable message.

Tests: `src/core/io/formats.test.ts` round-trip; `src/services/backup.test.ts` (new) for the
scheduled builder; an E2E case that exports, clears via DevTools-injected storage clear, imports,
and asserts counts plus one pinned/colored list.

Verify: `pnpm test -- formats backup` and `pnpm verify:e2e`.

### W1-2 — Stop resetting the backup alarm on every worker boot

Problem: `boot()` calls `syncBackupAlarm()` on every service-worker start
(`src/entrypoints/background.ts:31-38`), and `syncBackupAlarm()` always recreates the alarm with a
full initial delay (`src/services/backup.ts:7-15`). Frequent MV3 restarts postpone backups forever.

Do:

- Read the existing alarm first (`chrome.alarms.get`). Recreate only when it is missing or the
  persisted schedule version differs from the requested mode.
- Persist `backupScheduleVersion` (or the mode) alongside `lastBackupAt`; treat absence as
  “needs sync”.
- Preserve remaining time on boot: never call `create` with a fresh `delayInMinutes` when an alarm
  with the same period already exists.
- Log a single `backup-alarm-synced` meta entry only when the schedule actually changed.

Acceptance:

- Boot ten times in a test with a fake alarms API; `create` is called at most once, and the
  scheduled time never moves forward after the first creation.
- Changing the setting from daily to weekly and back recreates exactly once per change.

Tests: new `src/services/backup.test.ts` with a fake `chrome.alarms`.

Verify: `pnpm test -- backup` plus a manual check in `chrome://extensions` service-worker
DevTools: reload the worker twice, then inspect `chrome.alarms.getAll()` and confirm the scheduled
time is unchanged.

### W1-3 — Make every exported format importable (or declare it export-only)

Problem: two confirmed round-trip failures.

- `serializeOneTabText(stacks, true)` emits `# Title` headings (`src/core/io/formats.ts:84-94`),
  but `detectFormat()` classifies any heading as Markdown (`:270-290`), so Stow's own titled export
  imports zero stacks.
- `escapeMarkdown()` emits `\[` / `\]` (`:146-151`) while `parseMarkdown()` (`:97-112`) does not
  unescape them, and URLs containing parentheses break the link expression.

Do:

- Prefer content-based detection: scan for OneTab-style `url | title` lines before falling back to
  heading detection; if both markers exist, use the one with more parseable rows and surface the
  chosen format in the import preview.
- In `parseMarkdown`, unescape `\\[`, `\\]`, `\\(`, `\\)`, and handle balanced parentheses in URLs.
- Add a property-style round-trip test: for a fixed corpus (plain titles, brackets, parentheses,
  emoji, very long titles, empty title), `parseImport(serialize(…))` reproduces the input.
- If a format is intentionally export-only (e.g. Netscape HTML for browsers), label it in the UI
  and exclude it from the round-trip contract.

Acceptance:

- `parseImport(serializeOneTabText(stacks, true))` returns the same stacks.
- Markdown with `[draft]` in the title and `(v2)` in the URL round-trips.
- Titled OneTab text is detected as `onetab` in the preview and shows the correct counts.

Tests: `src/core/io/formats.test.ts`, including a table-driven round-trip block.

Verify: `pnpm test -- formats`.

### W2-1 — Durable restore operations and retry idempotence

Problem: restore opens tabs before removing rows (`src/services/restore.ts:108-115`). If the worker
dies between those steps, a retry reopens duplicates. Several event handlers launch detached
promises (`src/entrypoints/background.ts:69-74`, `:90-92`, `:128-134`), and `enqueue`
(`src/services/queue.ts:9-17`) serializes only within one worker lifetime. `onSuspend` does
nothing (`background.ts:133-135`).

Do:

- Before any `chrome.tabs.create`, write an `ops` record: op id, kind `restore`, stack id, tab ids,
  per-tab `pending|opened|removed`, and a timestamp. Reuse the existing `ops` store.
- After each successful create, update the record. After successful removal, mark `removed`.
- On boot, reconcile: find `restore` ops older than a threshold (or with `pending` rows) and offer
  “Resume” in the Library; resuming skips tabs already marked `opened` for that op.
- Keep handlers attached to their promise (use `event.waitUntil` semantics where the platform
  offers it, or an in-memory keep-alive that at minimum prevents parallel duplicates).
- Make the retry path idempotent by op id, not by URL guessing.

Acceptance:

- A simulated crash after two of three tab creates, followed by boot + resume, opens only the
  missing tab and removes all three saved rows.
- Two concurrent restore requests for one list never open the same saved tab twice.

Tests: unit test with a fake `chrome.tabs` that throws mid-loop; an E2E that reloads the
service worker between create and remove (Playwright `worker.evaluate` can force this).

Verify: `pnpm test -- restore` and `pnpm verify:e2e`.

### W2-2 — Compute dedupe inside the commit transaction

Problem: `stowNow()` reads existing URLs (`src/services/stow.ts:50-66`) and later calls
`commitStow(plan)` (`src/core/db/repo.ts`), which does not refresh that snapshot or lock against
direct Library writes. A concurrent delete/move can leave stale copies or wrong `trashExisting`
writes.

Do:

- Move the URL index read inside the Dexie transaction that applies the plan, and recompute the
  affected decisions there. If the recomputed plan differs from the requested plan, abort and
  return a typed `stale-plan` error the caller can retry once.
- Have Library mutations publish their `ChangeSet` before/with the write so the stow path can
  detect an intervening revision (`rev` monotonicity already exists in `src/core/db/changes.ts`).
- Add a unit test with `fake-indexeddb` that interleaves a delete between plan and commit.

Acceptance:

- Interleaved delete never results in a saved copy that duplicates a still-open tab.
- Interleaved move never writes to a locked stack.
- No infinite retry: at most one automatic retry, then a user-visible error.

Verify: `pnpm test -- stow repo`.

### W3-1 — Firefox favicons: use `tabs.Tab.favIconUrl`

Problem: `src/platform/favicon.ts:3-6` always builds `/_favicon/`, which is Chromium-only; the
Firefox manifest deliberately omits the permission (`wxt.config.ts:12-22`, `:55-59`). Confirmed in
Firefox 160.0.1: request aborts (`AbortError: The operation was aborted.`), image errors, letter
fallback renders. Firefox does supply a valid data-URL `favIconUrl` on the tab.

Do:

- Capture `tab.favIconUrl` at stow time and store it on the saved tab as a separate field
  (`favicon?: string`), validated as `data:` or `https:` image URL, length-capped, and **never**
  rendered as HTML.
- In the UI, prefer the stored favicon; use `/_favicon/` only when the manifest exposes it
  (`browser === 'chrome'` or permission present); fall back to letter tiles.
- Keep the fallback silent: no aborted requests on Firefox.

Acceptance:

- On Firefox, no `/_favicon/` request is made and real favicons appear for tabs that supply
  `favIconUrl`.
- On Chrome, behavior is unchanged.
- A malformed `favIconUrl` is dropped at the boundary and renders the letter tile.

Tests: unit test for the URL validator; Firefox E2E assertion that the letter tile or stored icon
renders with zero network-ish console errors.

Verify: `pnpm test -- favicon` and the Firefox harness from W3-3.

### W3-2 — Build and lint Firefox in ordinary CI

Problem: CI builds Chrome only (`.github/workflows/ci.yml:28`); Firefox packaging exists only in
release. Firefox is untested until release day.

Do:

- Add `pnpm build:firefox` and `pnpm zip:firefox` to CI; upload both browser artifacts.
- Add `web-ext lint --source-dir .output/firefox-mv3` as a CI step. Treat `errors` as fatal;
  document the current four bundled-library warnings (`DANGEROUS_EVAL`, `UNSAFE_VAR_ASSIGNMENT`)
  in `docs/DECISIONS.md` with a source-inspection note, and fail if warning count grows.
- Assert the generated Firefox manifest has the expected permissions and no `favicon` key.

Acceptance:

- CI produces `chrome-mv3`, `firefox-mv3`, and both ZIPs.
- `web-ext lint` runs in CI and fails on a new error.

Verify: `.github/workflows/ci.yml` green on a PR that touches `wxt.config.ts`.

### W3-3 — Add a Firefox runtime smoke suite

Problem: `e2e/stow.spec.ts` is Chromium-only by construction: persistent context with
`--load-extension` (`:19-33`), `chrome-extension://` URL (`:58-62`), service-worker discovery.
Firefox uses a generated background page and a randomized `moz-extension://` UUID.

Do:

- Add `e2e-firefox/` driven by Selenium WebDriver BiDi + geckodriver, using
  `installWebExtension(dir, { permanent: false })`.
- Subscribe to `log.entryAdded` before install; fail the test on `error` level entries that
  originate from the extension.
- Discover the extension origin from the opened tab, never by constructing it from the Gecko ID.
- Cover: install, library opens, stow three local HTTP tabs, restore all, settings persist across
  reload, favicon behavior, zero extension console errors.
- Wire it as a non-blocking (`continue-on-error: false` after a stabilisation period) CI job.

Acceptance:

- Suite passes locally and in CI on Firefox stable.
- A deliberately broken manifest permission fails the job with a readable message.

Verify: `pnpm test:firefox` (new script) on a machine with Firefox installed.

### W4-1 — Release only from verified artifacts

Problem: `release.yml:22-31` runs lint, typecheck, unit tests, and packaging only. It skips E2E,
coverage, network/tokens, landing, and Firefox runtime checks. For `v0.1.1`, Chrome came from the
bot, but Firefox and the source archive were uploaded manually at 14:22/14:24.

Do:

- Make the release job depend on the full verification workflow, or inline every gate from W0-1.
- Generate the source archive in the same job (`pnpm zip` already emits one; verify the exact
  filename) and attach all artifacts with `gh release create`.
- Add SHA-256 checksums to a `SHA256SUMS.txt` asset and link the workflow run URL in release notes.
- Add a concurrency group so two tags cannot publish simultaneously.
- Refuse to overwrite an existing release (`gh release view` guard).

Acceptance:

- A tag produces Chrome ZIP, Firefox ZIP, sources ZIP, and checksums, all uploaded by
  `github-actions[bot]`.
- Re-running the job on an existing tag fails fast instead of mutating the release.

Verify: dry run on a throwaway `v0.0.0-test` tag in a fork.

### W4-2 — Protect `main`

Do (repo admin, may need the human):

- Enable branch protection: require PR, require the `verify` check, require branches be up to date,
  disallow force pushes and deletions, require conversation resolution.
- Add a `CODEOWNERS` entry for `.github/workflows/` and `src/core/db/`.

Acceptance: a direct push to `main` is rejected; a red PR cannot merge.

### W4-3 — Store submission materials and runbook

Problem: `docs/STORE_LISTING.md:85-91` requires five 1280×800 screenshots; only
`assets/store/stow-firefox-listing.png` exists. Homepage in `STORE_LISTING.md:82` is a stale Vercel
URL while the repo homepage is GitHub Pages. `BUILD.md:27` claims the Firefox ZIP was uploaded to
AMO, which is not true today.

Do:

- Produce the five screenshots from the landing assets at 1280×800, add small/marquee promo images
  per `docs/03-delivery-plan-and-qa.md`.
- Write `docs/RELEASE_RUNBOOK.md`: preconditions, version bump, tag, CI gate, store upload steps for
  CWS and AMO, review-response templates, rollback (delist/previous version), and post-release
  smoke test on a clean profile.
- Record submission status per store (submitted date, version, reviewer outcome) in the runbook.

Acceptance: a second person can execute a release from the runbook alone.

### W5-1 — Documentation truth pass

Do, in one PR after behavior lands:

- README install filenames `0.1.0` → current version; Chrome 120+ → 123+; keep the release URL.
- `BUILD.md`: Vite 7 → actual version from the lockfile; correct the AMO claim; document the real
  deterministic-vs-ZIP distinction already present.
- `CONTRIBUTING.md`: `pnpm verify`, `CHROMIUM_PATH`, Firefox suite.
- `docs/CHANGELOG.md`: add the missing `0.1.1` heading; move the long Unreleased design diary under
  a clearly-labelled “Notes” section so release notes are readable.
- `docs/PRIVACY.md`: state that settings live in `chrome.storage.local` and library data in
  IndexedDB.
- `docs/STORE_LISTING.md`: fix homepage/support URLs; state the no-network guarantee as
  “enforced by CSP + CI source scan”, not “the build fails”.

Acceptance: no stale version, tool version, or claim remains; `grep` for `0.1.0` and `Vite 7`
returns nothing outside historical changelog entries.

## 5. Issue-ready template

Use this body for every issue created from this plan, so an agent can start without re-reading the
whole audit:

```
## Problem
<observable failure, with file:line and, where possible, the exact error text>

## Expected behavior
<what a user or maintainer sees when this is fixed>

## Scope
- In: <files>
- Out: <explicit non-goals>

## Acceptance criteria
- [ ] <observable, testable statement>
- [ ] <regression test covering the failure mode>

## Verify
`<exact command>`

## Constraints
Product invariants in docs/00-README-agent-brief.md §3 apply. Append any tradeoff to
docs/DECISIONS.md.
```

Suggested labels: `bug`, `data-safety`, `release`, `browser:firefox`, `docs`, `a11y`, `agent-ready`.
Milestone: `v0.2.0 — hardening`.

## 6. PR checklist (paste into every PR)

- [ ] Failing test added first (or manual repro recorded when automation is impossible).
- [ ] `pnpm verify` passes; `pnpm verify:e2e` passes for changes touching tabs/UI.
- [ ] No new permission, no new network call, no `innerHTML`/`eval`.
- [ ] Backup/restore paths still satisfy save-before-close and effect-before-delete.
- [ ] Docs and `docs/DECISIONS.md` updated if behavior, format, or release process changed.
- [ ] PR body names what was **not** tested.

## 7. Risk notes

- **Format migration is the riskiest change.** Land W1-1 behind a `formatVersion` bump, keep v1
  import forever, and never rewrite stored rows during import without a pre-import backup prompt.
- **Durable operations add writes.** Keep the `ops` record tiny and prune it with the existing
  purge alarm; a stuck `ops` table is a worse bug than duplicates.
- **Firefox E2E is a new toolchain.** Budget for geckodriver version drift; pin it and fail loudly
  rather than silently skipping.
- **Branch protection can block hotfixes.** Agree the break-glass procedure (admin merge, then a
  follow-up PR that records why) before enabling it.
- **Store review is external latency.** Do not couple the v0.2.0 GitHub release to store approval;
  ship the GitHub artifacts, then submit.

## 8. Suggested first three actions

1. Open the W0 and W1 issues (six issues) with the template above; label `data-safety`.
2. Implement W0-1 in one PR — it makes every later claim verifiable.
3. Implement W1-2 next (small, testable, stops silent backup loss), then W1-1 (largest, riskiest)
   with a dedicated reviewer pass before merge.
