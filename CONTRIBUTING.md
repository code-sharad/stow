# Contributing to Stow

Thanks for helping make a quieter tab manager. Stow is a local-first Chrome extension; the
product promise is part of the engineering contract.

## Before you start

- Read the product and engineering constraints in `docs/00-README-agent-brief.md`.
- For substantial changes, open an issue first so the approach can be agreed before code.
- By participating, you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

Requirements: Node 22+, pnpm 10+, and a Chromium-based browser.

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts WXT and loads the extension automatically. For a production build:

```bash
pnpm build
```

Then load `.output/chrome-mv3` from `chrome://extensions` in Developer mode.

## What to preserve

These are product invariants, not preferences:

1. Save before close. Write the library and verify the read-back before closing any tab.
2. Open before delete. Restore a saved tab successfully before removing it from the library.
3. Deletes are soft. Trash and Undo are always available.
4. No network. No telemetry, account, sync, analytics, remote fonts, or host permissions.
5. Stored URLs are verbatim. Derived URL keys are for comparison only.
6. Text is text. Never render saved titles or URLs as HTML.
7. The service worker is stateless. Every workflow commits to IndexedDB.
8. Accessibility and keyboard operation are acceptance criteria, not polish.

## Checks

Use the fast loop while working:

```bash
pnpm verify:fast
```

It runs lint, type checking, and the unit tests. To run only the tests related to the files you
changed, pass them to `pnpm test:related`:

```bash
pnpm test:related src/core/db/repo.ts src/core/domain/plan.ts
```

Run the same full gate as CI before opening a pull request:

```bash
pnpm verify
```

`pnpm verify` runs the token, network, boundary, and agent-doc guards, lint, type checking,
coverage, the Chrome and Firefox builds, the Firefox manifest check, and the landing check. The landing check
launches headless Chromium, so install the Playwright Chromium build if needed.

For changes that touch tabs, restore, or the UI, also run the browser suite:

```bash
pnpm verify:e2e
```

`pnpm verify:e2e` builds first, so it never tests stale `.output/chrome-mv3` files. Set
`CHROMIUM_PATH` if your browser is not at `/usr/bin/chromium`; on a headless Linux host, use
`xvfb-run -a pnpm verify:e2e`.

For platform, background-lifecycle, favicon, or Firefox-specific changes, run the real-Firefox
smoke suite:

```bash
pnpm test:firefox
```

If you change the UI, update or add an axe assertion and include both light and dark checks. If
you change behavior covered by an invariant, add a test that fails without your change.

## Working with AI agents

AI agents should start at [`AGENTS.md`](AGENTS.md). It links the current architecture, recipes,
testing guide, and the definition of done. `pnpm check:agent-docs` verifies that agent docs point
at existing paths, commands, screenshots, and artifact versions. If you add a command or move a
document referenced from `AGENTS.md` or `docs/agents/`, update those docs in the same change.

## Style

- TypeScript strict mode is on. Avoid `any`; parse external data at the boundary.
- Domain logic belongs in `src/core`; keep `chrome.*` calls in `src/platform` and workflows in
  `src/services`.
- Use design tokens and the i18n catalog. Do not add raw colors or user-facing strings.
- Prefer small, verifiable commits. Conventional Commit prefixes are welcome but not required.
- Keep pull requests focused. Separate refactors from behavior changes.

## Pull requests

Include:

- what changed and why;
- user-visible behavior and screenshots for UI changes;
- the checks you ran;
- privacy or permission implications (normally: none).

Maintainers may ask for a narrower patch or a test before merging. Release artifacts are built
from tags; do not commit `.output/`, coverage, or test reports.
