# GitHub Copilot instructions

Read [`../AGENTS.md`](../AGENTS.md) first. It is the shared agent entry point with the current commands, architecture map, invariants, and definition of done.

Use [`../docs/agents/architecture.md`](../docs/agents/architecture.md) for the module map, [`../docs/agents/recipes.md`](../docs/agents/recipes.md) for task-specific steps, and [`../docs/agents/testing.md`](../docs/agents/testing.md) for the test layers.

Key rules:

- Preserve save-before-close and open-before-remove ordering.
- Keep `src/core/domain`, `src/core/io`, and `src/core/db` free of `chrome.*`, React, platform, and UI imports. `src/core/settings/store.ts` is the deliberate `chrome.storage` boundary.
- Do not add network access, telemetry, or permissions without explicit approval.
- Run `pnpm verify:fast` before committing; `pnpm verify` before a PR; add `pnpm verify:e2e` and/or `pnpm test:firefox` when the change reaches browser wiring.
- Record storage/format/permission decisions in `docs/DECISIONS.md`.
- `docs/00`–`05` are historical; do not copy their target tree.
