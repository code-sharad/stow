# Stow: agent brief

> **Working name: "Stow".** A modern, local-first replacement for the OneTab browser extension.
> The name is a placeholder. It lives in exactly one constant (`src/shared/brand.ts`) and in `_locales/*/messages.json`. Do not hardcode it anywhere else, so renaming is a one-line change.

You are implementing this product end to end: scaffolding, core logic, UI, tests, CI, and release packaging. Read this file fully, then the other four documents in order. After a release, read `05-hardening-plan.md` for the post-audit remediation plan.

## 1. Document map and precedence

| # | File | Owns | Written as |
|---|------|------|-----------|
| 00 | `00-README-agent-brief.md` | Invariants, working agreements, repo layout, definition of done | Tech lead |
| 01 | `01-product-requirements.md` | What the product does: scope, parity matrix, requirements with acceptance criteria, settings catalog | Senior engineer / product |
| 02 | `02-technical-design.md` | How it is built: stack, architecture, manifest, data model, algorithms, failure modes, security | Senior engineer |
| 03 | `03-delivery-plan-and-qa.md` | Milestones, test strategy, acceptance scenarios, CI, release checklist, risks | Senior engineer |
| 04 | `04-design-system-and-ui.md` | Visual language, tokens, layout, components, interaction, motion, a11y, copy | Senior design engineer |
| 05 | `05-hardening-plan.md` | Post-audit remediation workstreams: data safety, lifecycle, browser parity, release engineering, docs | Tech lead |

**Precedence when documents disagree:** behavior and data → 01, then 02. Anything visual (color, type, spacing, motion, copy tone) → 04. Anything about order of work → 03. If two documents conflict and you cannot resolve it by this rule, pick the safer option for user data, record it in `docs/DECISIONS.md`, and continue. Do not stall.

## 2. Product in one paragraph

One click turns every eligible tab in the current window into a **Stack** in a searchable, organizable **Library**, closes those tabs to free memory, and lets the user restore any tab or whole stack later. It does everything OneTab users rely on (see the parity matrix in 01 §5), plus search, trash and undo, drag and drop with a keyboard-accessible alternative, dark mode, import/export/backup, and preservation of native browser tab groups. It is MV3, TypeScript, local-only, with **zero network access and zero telemetry**.

## 3. Non-negotiable invariants

These are release-blocking. Each has a test (see 03 §4). If a task seems to require breaking one, stop and record why in `docs/DECISIONS.md`.

1. **Save before close.** Never close a browser tab until its data is durably committed to IndexedDB *and* read back successfully. A failure anywhere before the close step means **zero tabs are closed**.
2. **Effect before delete.** Never remove saved data until the action it enables has succeeded (restore: open the tab first, then remove the item). The worst case of any crash is a duplicate, never a loss.
3. **Everything deletable is recoverable.** Deletes are soft (Trash + Undo). Permanent removal happens only via explicit "Delete forever", "Empty trash", or retention purge.
4. **No network, ever.** No `fetch`/XHR/WebSocket to anything, no remote fonts/scripts/icons, no analytics, no third-party favicon services, no remote code. Enforce with CSP and a CI grep/lint rule.
5. **No host permissions.** Only the permissions listed in 02 §5. Adding one requires a documented decision.
6. **Stored URLs are verbatim.** `url` is never rewritten. Normalization produces a separate derived `urlKey` used only for comparison.
7. **Untrusted text is only ever text.** Page titles and URLs are rendered as text nodes. No `dangerouslySetInnerHTML`, no `innerHTML`, no dynamic `eval`. Saved URLs are scheme-allowlisted before opening.
8. **The service worker is stateless.** Anything that matters across wake-ups lives in IndexedDB or `chrome.storage`. Module-level variables are caches only.
9. **Tokens, not literals.** UI colors, spacing, radii, motion durations come from design tokens (04 §3). No raw hex outside `tokens.css`. All user-visible strings come from the i18n catalog.
10. **Clean-room.** Implement from observable behavior and the documents here. Do not copy OneTab's code, icons, name, logo, copy, or screenshots. "Import from OneTab" is permitted as a nominative reference only.

## 4. Working agreements

- **Verify, don't assume, platform and library APIs.** Chrome extension APIs, WXT, Dexie, and Tailwind move fast. Pin exact versions in the lockfile, and read the *current* docs when an API detail matters. If a document here names an API that has changed, follow the current docs and note it in `docs/DECISIONS.md`.
- **Keep a decision log.** `docs/DECISIONS.md` is append-only: date, decision, alternatives considered, reason. Every deviation from these documents and every assumption you make goes there.
- **Walking skeleton first.** Milestone M1 delivers stow → save → restore end to end (ugly UI is fine) before any polish. See 03.
- **Pure core, thin adapters.** Domain logic (`src/core`) has no `chrome.*` or React imports and is unit-tested exhaustively. `chrome.*` calls live behind interfaces in `src/platform` so services are testable with a fake.
- **No scope creep.** Anything not in 01 §11 "v1.0 scope" waits. If you have a good idea, put it under "Proposed" in `docs/DECISIONS.md`.
- **Small, reviewable commits.** Conventional Commits; each milestone ends tagged and green on CI.
- **Tests ship with the code.** A requirement is not done until its acceptance criteria are covered by an automated test or, where impossible, a checked item in the manual checklist (03 §7).
- **When truly blocked** by ambiguity that could affect data safety or public behavior, choose the conservative option, log it, and keep going.

## 5. Target repository layout

```
stow/
├─ wxt.config.ts            package.json   pnpm-lock.yaml
├─ tsconfig.json            biome.json     vitest.config.ts   playwright.config.ts
├─ public/
│  ├─ _locales/en/messages.json
│  ├─ fonts/                 (self-hosted woff2 + OFL licenses)
│  └─ icon/                  (generated PNGs: 16/32/48/128)
├─ src/
│  ├─ entrypoints/
│  │  ├─ background.ts       (service worker: registers ALL listeners at top level)
│  │  ├─ library/            (index.html, main.tsx, routes: stacks, trash, settings)
│  │  ├─ popup/              (index.html, main.tsx)
│  │  ├─ options/            (redirects to library#/settings)
│  │  ├─ theme-init.ts       (tiny blocking script; avoids flash of wrong theme)
│  │  └─ playground/         (DEV ONLY: renders every component state; excluded from prod)
│  ├─ core/                  (framework-free, no chrome.*)
│  │  ├─ domain/             types.ts url.ts ignore.ts dedupe.ts order.ts plan.ts
│  │  ├─ db/                 schema.ts repo.ts changes.ts migrations.ts backup.ts
│  │  ├─ io/                 onetab-text.ts json.ts markdown.ts netscape.ts
│  │  └─ settings/           schema.ts store.ts
│  ├─ platform/              (chrome.* adapters behind interfaces)
│  │  tabs.ts windows.ts tabGroups.ts menus.ts action.ts favicon.ts alarms.ts downloads.ts
│  ├─ services/              stow.ts restore.ts library-tab.ts badge.ts menus.ts commands.ts purge.ts
│  ├─ messaging/             protocol.ts client.ts
│  ├─ ui/
│  │  ├─ styles/             tokens.css base.css
│  │  ├─ layout/             metrics.ts layout-index.ts
│  │  ├─ components/         hooks/    state/    i18n/
│  └─ shared/                brand.ts constants.ts
├─ e2e/                      (Playwright with the built extension loaded)
├─ scripts/                  gen-icons.ts  seed-fixture.ts  check-tokens.ts  check-no-network.ts
└─ docs/                     (these five files) DECISIONS.md CHANGELOG.md PRIVACY.md
```

## 6. Global definition of done

A milestone, and the product, is done only when **all** hold:

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm e2e` pass in CI on a clean checkout.
- All invariants in §3 have passing tests.
- No new `any`, no `@ts-ignore` without a linked decision-log entry. TypeScript `strict` plus `noUncheckedIndexedAccess`.
- Axe reports zero serious/critical violations on every route in light and dark.
- Bundle budgets in 02 §17 are met (CI size check).
- Every user-visible string is in the catalog; the app renders correctly under the pseudo-locale (`en-XA`, +40% length, bidi markers) and in RTL.
- The manual checklist in 03 §7 is complete for the milestone's scope.

## 7. Where to start

1. Read 01 and 02 fully. Skim 03. Read 04 §1–§4 before touching UI.
2. Do 03 **M0** (scaffold, CI, tokens, DB, settings) and the four spikes listed there.
3. Do **M1** (walking skeleton) and prove invariants 1 and 2 with automated tests *before* starting M2.
4. Continue milestone by milestone. Do not start a milestone until the previous one is green and tagged.
