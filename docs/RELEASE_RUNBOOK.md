# Stow release runbook

One release is one PR that bumps the version, one tag, one workflow run, and two store
uploads. Do not skip a gate because “it is only a patch”.

## Preconditions

- `main` is green: the `verify` job passed on the latest commit.
- `pnpm verify` passes locally.
- `pnpm test:firefox` passes locally (or the `firefox-smoke` CI job passed).
- Chrome and Firefox smoke-tested from the previous release on a clean profile.
- [ ] No open security advisories or failing Dependabot alerts.
- [ ] `docs/CHANGELOG.md` has real user-facing entries, not a commit dump.

## 1. Bump the version

```bash
git switch -c chore/release-vX.Y.Z
pnpm version X.Y.Z --no-git-tag-version
```

1. Move the `Unreleased` block in `docs/CHANGELOG.md` under `## X.Y.Z` with today’s date.
2. Update version strings in `README.md`, `BUILD.md`, and `docs/STORE_LISTING.md` if they
   mention filenames.
3. Open a PR. Wait for `verify` and `firefox-smoke`; merge it.

## 2. Tag and publish

```bash
git switch main && git pull --ff-only
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

The release workflow runs the same gates as `pnpm verify`, installs Chromium, runs the
Chrome E2E suite, builds Chrome and Firefox, and creates the GitHub release with:

- `stow-X.Y.Z-chrome.zip`
- `stow-X.Y.Z-firefox.zip`
- `stow-X.Y.Z-sources.zip`
- `SHA256SUMS.txt`
- a link to the workflow run in the release notes

The tag, `package.json`, and the `## X.Y.Z` changelog heading must agree or the workflow
fails before building.

## 3. Verify the artifacts

Download every asset from the release and check it:

```bash
cd /tmp/stow-release
sha256sum -c SHA256SUMS.txt
unzip -l stow-X.Y.Z-firefox.zip | head
```

Install the Chrome ZIP in a clean profile and confirm:

- [ ] The library opens and the welcome page appears on first install.
- [ ] Stow, search, restore, trash, and settings survive a browser restart.
- [ ] Export a backup, reset the library, import it, and confirm counts and pinned lists.
- [ ] The toolbar button, context menu, and all four commands work.

Install the Firefox ZIP temporarily and repeat the list. Confirm zero extension console
errors and that favicons render without `_favicon` requests.

## 4. Upload to the stores

### Chrome Web Store

1. Open the [developer dashboard](https://chrome.google.com/webstore/devconsole).
2. Upload the Chrome ZIP from the release.
3. Paste the release notes from `docs/CHANGELOG.md`.
4. Verify the data-use answers still match `docs/PRIVACY.md` (no collection, no remote code).
5. Submit for review and record the date below.

### Firefox AMO

1. Open the [AMO developer hub](https://addons.mozilla.org/developers/).
2. Upload the Firefox ZIP and the sources ZIP from the release.
3. Use the same release notes.
4. Confirm the validator has no errors. The four known bundled-library warnings are
   documented in `docs/DECISIONS.md`; investigate any new warning before submitting.
5. Submit for review and record the date below.

## 5. Post-release smoke test

After the store listing updates:

- [ ] Install from each store on a clean profile.
- [ ] Run the five checks from step 3 against the store build.
- [ ] Confirm the store description, screenshots, and version match this release.

## Rollback

- **Before review:** delete the tag and release, fix forward, and re-tag.
- **After review:** ship a patch release. Do not mutate an already-published version.
- **Broken migration or data loss:** delist the affected version in both stores, pin the
  previous version in the README install links, and publish a post-mortem in
  `docs/DECISIONS.md`.

## Review response templates

**Request for more permissions**

> Stow requests no host permissions and no network access. `tabs` and `tabGroups` are used
> only to read the user’s open tabs when they explicitly stow or restore; `downloads` is
> optional and requested only when the user enables backups. The library lives in
> IndexedDB and settings in `chrome.storage.local`; nothing leaves the device.

**Request for source reproduction**

> See `BUILD.md`. The release assets include `stow-X.Y.Z-sources.zip`; `pnpm install
> --frozen-lockfile && pnpm zip:firefox` reproduces the uploaded package. The only network
> access during the build is the npm registry.

## Submission status

| Version | Store | Submitted | Outcome | Notes |
| --- | --- | --- | --- | --- |
| 0.1.1 | Chrome Web Store | — | — | — |
| 0.1.1 | Firefox AMO | — | — | — |

Update this table in the release PR; it is the only place that records live submission
state.
