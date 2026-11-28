# Building Stow from source

This file exists for add-on reviewers. It describes how `.output/stow-0.1.2-firefox.zip` is
produced from the sources in this package, and nothing else.

## Requirements

- Node.js 22 or newer
- pnpm 10.34.9 (pinned in `package.json` under `packageManager`; `corepack enable` installs it)
- No other tooling, no network access beyond the npm registry

## Steps

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm zip:firefox
```

`pnpm zip:firefox` runs `wxt zip -b firefox --mv3`, which builds and packages in one step.

## Output

| File | What it is |
| --- | --- |
| `.output/firefox-mv3/` | The unpacked extension, identical to the contents of the uploaded zip |
| `.output/stow-0.1.2-firefox.zip` | The package submitted to addons.mozilla.org |
| `.output/stow-0.1.2-sources.zip` | This sources archive |

To inspect what shipped without zipping, `pnpm build:firefox` produces the same tree in
`.output/firefox-mv3`.

## Toolchain

| Component | Version | Role |
| --- | --- | --- |
| WXT | 0.21.5 | Build orchestration, manifest generation, packaging |
| Vite | 8 | Bundling and minification |
| React | 19 | Library and popup UI |
| TypeScript | 5.9 | Sources in `src/` |

`vite` minifies and combines modules, and WXT generates `manifest.json` — which is why this
add-on needs a source submission. Every input is in this archive: `src/`, `public/`, `assets/`,
`wxt.config.ts`, `package.json`, and `pnpm-lock.yaml`.

## Reproducibility

The bundler output is deterministic: the same inputs and lockfile produce the same code in
`.output/firefox-mv3/`. The zip container itself may differ in file timestamps, so compare the
unpacked tree, not the archive bytes.

The build fetches only npm packages pinned in `pnpm-lock.yaml`. It does not download remote
code, templates, or assets: the fonts and images referenced by the landing page live in
`landing/`, which is not part of the extension.

## Verifying the privacy claim

```bash
pnpm check:network   # fails if src/ contains fetch, XHR, WebSocket, or a remote URL
pnpm test            # unit tests
pnpm typecheck
pnpm lint
```

The shipped manifest has no `host_permissions` and a content security policy of
`script-src 'self'; object-src 'self'`.
