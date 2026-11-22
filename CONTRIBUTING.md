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

Run the same checks as CI before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
pnpm check:tokens
pnpm check:network
pnpm check:landing
pnpm e2e
```

`pnpm e2e` and `pnpm check:landing` launch Chromium. Set `CHROMIUM_PATH` if your browser is not at
`/usr/bin/chromium`; on a headless Linux host, use `xvfb-run -a pnpm e2e`.

If you change the UI, update or add an axe assertion and include both light and dark checks. If
you change behavior covered by an invariant, add a test that fails without your change.

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
