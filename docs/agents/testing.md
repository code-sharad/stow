# Testing guide

Stow uses three layers: fast unit/integration tests with Vitest, Chromium end-to-end tests with Playwright, and a real-Firefox WebDriver smoke suite. Pick the lowest layer that can prove the behavior, then add the browser layer when the risk is in extension wiring.

## Commands

| Command | What it runs | When |
| --- | --- | --- |
| `pnpm lint` | Biome check | every change |
| `pnpm typecheck` | `tsc --noEmit` | every change |
| `pnpm test` | Vitest, all `src/**/*.test.ts` | every change |
| `pnpm test -- <path>` | one file or directory | while iterating |
| `pnpm test:related <paths>` | tests related to source paths | focused loop |
| `pnpm verify:fast` | lint + typecheck + unit tests | before commit |
| `pnpm test:coverage` | Vitest with V8 coverage of `src/core/**` | core changes |
| `pnpm check:boundaries` | import-layer guard | moving modules or adding cross-layer imports |
| `pnpm verify` | guards + lint + typecheck + coverage + builds + manifest + landing | before PR |
| `pnpm verify:e2e` | build + Playwright Chromium suite | tabs/restore/UI changes |
| `pnpm test:firefox` | Firefox build + real-Firefox smoke | platform/background/Firefox changes |

Coverage is enforced for `src/core/**` at 80% lines and 80% functions by `vitest.config.ts`. Do not lower the thresholds to make a change pass; add a focused test.

## Unit and integration tests

Configuration is `vitest.config.ts`; setup is `src/test/setup.ts`.

- Environment: jsdom, globals enabled, `@testing-library/jest-dom` matchers, `fake-indexeddb/auto`.
- Tests live beside the code: `src/core/db/repo.test.ts`, `src/core/io/formats.test.ts`, `src/services/restore.test.ts`, and so on.
- Domain tests should be table-driven and pure: input/expected output, no browser mocks.
- Repo tests use the real Dexie code over `fake-indexeddb`. Reset the database between tests (`setDbForTests(null)` / fresh `StowDB`) and avoid sharing mutable fixtures.
- Service tests replace `globalThis.chrome` with a small hand-written mock before importing/calling the service. Keep mocks limited to the APIs the workflow uses.
- Prefer fake timers for alarm/retry/scheduling tests. Assert the call sequence, not just the final value, when ordering is the invariant.
- Tests must be independent. Do not rely on a previous test's database rows, timers, or mock call counts.

Examples of coverage already in place:

- `src/core/db/repo.test.ts` — commit/verify, soft delete/undo/trash/delete-forever, restore bookkeeping, stack/tab moves, ordering, retention, reset.
- `src/core/db/backup.test.ts` — full v2 round-trip preserving order/pin/lock/collapse/color/timestamps/favicon, unsafe scheme skip.
- `src/services/backup.test.ts` — alarm reconciliation across worker boots and schedule changes.
- `src/services/restore.test.ts` — normal restore, crash after partial open, resume opens only pending rows, duplicate invocation.
- `src/core/io/formats.test.ts` — all formats, titled OneTab detection, escaped Markdown round-trip, strict v2 rejection.

## Chromium E2E

The suite is `e2e/stow.spec.ts`, run by `pnpm e2e` or `pnpm verify:e2e` (which builds first). `playwright.config.ts` uses one worker, a 45s test timeout, and traces retained on failure. The spec launches Chromium itself, loads `.output/chrome-mv3`, and finds the extension by its service-worker URL.

- Always build before running; `verify:e2e` does this for you.
- Set `CHROMIUM_PATH` if Chromium is not at `/usr/bin/chromium`. On a headless Linux host use `xvfb-run -a pnpm verify:e2e`.
- The suite covers stow/restore, search/settings, popup binding, trash, JSON import, full export → database reset → import round-trip, and axe accessibility checks.
- UI changes need an axe assertion and both light/dark checks; keyboard behavior is part of acceptance, not a follow-up.
- Use the extension's own service worker to reset IndexedDB between scenarios. Do not reuse a dirty profile across tests.

## Firefox smoke

`e2e-firefox/smoke.mjs` is a plain Node ESM script, run by `pnpm test:firefox`. It starts a local fixture server, launches Firefox headless with WebDriver BiDi, installs `.output/firefox-mv3` temporarily, then verifies install, stow, stored favicons, restore, settings, and a clean console.

Environment details that matter:

- Firefox and `geckodriver` must be on `PATH`; both are project dependencies.
- `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1` is required to evaluate scripts in `moz-extension://` pages. The script sets it on the WebDriver service.
- Find the extension tab by waiting for a `moz-extension://` window handle. Do not construct the origin from `new URL(...).origin` (it returns `"null"`); use `protocol + host`.
- The script logs `icons: stored=N letter=N`; stored icons must be `data:image/...` and must not reference `_favicon`.

Use this suite for favicons, manifest/browser differences, background startup, and anything where Chromium's behavior is not enough. It is slower than unit tests; do not move pure logic here.

## What to run by change type

| Change | Minimum proof |
| --- | --- |
| Domain rule | table-driven unit test + `pnpm test` |
| Repo transaction / index / soft delete | repo test + backup round-trip + `pnpm test:coverage` |
| Import/export format | format tests incl. malformed, escaped, oversized, unsafe |
| Restore/stow workflow | service test with failure path + E2E |
| Message protocol | schema/typecheck + service or E2E coverage |
| Settings | settings test + backup round-trip + UI E2E if visible |
| Firefox/favicon/platform | mock unit test + `pnpm test:firefox` |
| UI component | E2E + axe + screenshots for store-facing changes |
| Release/docs only | `pnpm check:agent-docs`, `pnpm check:release-version`, relevant guards |

## Debugging

- A repo test that passes alone but fails in a suite usually means shared state: reset `StowDB` and restore `chrome` mocks in `afterEach`.
- `fake-indexeddb` does not emulate quota errors. Inject the failure at the repo/service seam rather than trying to fill storage.
- E2E cannot see the extension: confirm `.output/chrome-mv3` exists, the build is current, and the service-worker URL contains the expected extension id.
- Firefox privileged-scope errors usually mean `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1` was not set on the WebDriver service, not that the selector is wrong.
- Avoid fixed sleeps. Wait for UI state, downloaded files, window handles, or a service-worker response.

## Adding a test

1. Name the behavior, not the implementation: "keeps tabs open when verification fails", not "calls removeInBatches".
2. Put it beside the unit under test. Use the existing mocks/fixtures before inventing a new harness.
3. For a bug fix, write the failing case first and confirm it fails for the expected reason.
4. For a safety invariant, test the failure path, not only the happy path.
5. If the test needs a new browser API, extend the local mock minimally and document the behavior in this file or the service test.
