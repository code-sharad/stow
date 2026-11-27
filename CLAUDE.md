# Claude Code instructions

Read [`AGENTS.md`](AGENTS.md) first. It is the shared entry point for agents and contains the commands, architecture map, data-safety invariants, task router, and definition of done.

Then read the relevant document:

- [`docs/agents/architecture.md`](docs/agents/architecture.md) — current module map and flows.
- [`docs/agents/recipes.md`](docs/agents/recipes.md) — exact files to touch for common changes.
- [`docs/agents/testing.md`](docs/agents/testing.md) — how to test and which suite to run.

Non-negotiables:

- Never close browser tabs before the save is verified, or remove saved rows before the replacement is open.
- Keep `src/core/domain`, `src/core/io`, and `src/core/db` pure: no `chrome.*`, React, platform, or UI imports. `src/core/settings/store.ts` is the deliberate `chrome.storage` boundary.
- Do not add network calls, telemetry, host permissions, or new browser permissions without explicit approval.
- Use `pnpm verify:fast` before committing and `pnpm verify` before opening a PR. Add `pnpm verify:e2e` for tabs/restore/UI and `pnpm test:firefox` for platform/Firefox changes.
- Update `docs/DECISIONS.md` for storage, permission, format, or safety changes, and `docs/CHANGELOG.md` for user-visible changes.
- Do not create tags, releases, store submissions, force-push, or change branch protection unless explicitly asked.

`docs/00`–`05` are historical specs with an obsolete target tree. Use them for product intent only.
