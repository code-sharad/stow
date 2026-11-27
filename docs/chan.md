 What needs fixing

 ### 1. High: your backup is not a complete backup

 ImportedStack retains only:

 - Stack title
 - Creation time
 - Tab URL
 - Tab title

 Exports omit list order, pinned state, locks, colors, tab order, tab pinning, grouping metadata, and settings. Automatic backups use the same sparse
 representation in src/services/backup.ts.

 Impact: after reinstalling, users recover URLs but not their complete workspace.

 Fix: introduce a versioned full backup schema containing all user-visible state. Validate it on import, support migration between format versions, and test a
 complete export → clear → import → compare round trip.

 ### 2. High: worker restarts can postpone automatic backups indefinitely

 Every background boot calls syncBackupAlarm() in background.ts. That recreates the alarm with a new full daily or weekly delay in backup.ts.

 Frequent Chromium service-worker restarts can therefore keep moving the next backup into the future.

 Fix: preserve an existing alarm during boot. Change its schedule only when the setting changes or the alarm is missing. Add a test covering repeated boots.

 ### 3. High: release packaging bypasses important checks

 The release workflow runs lint, type checking, unit tests, and packaging. It does not run:

 - Chromium E2E or accessibility tests
 - Firefox runtime tests
 - Coverage checks
 - Token and network checks
 - Landing checks

 A tag can therefore publish something that full CI would reject.

 For v0.1.1, Chrome was attached by CI, but Firefox and the source archive were uploaded manually afterward.

 Fix: make release depend on the complete verification workflow. Build every release artifact through that workflow and record checksums and the workflow-run link.

 ### 4. Medium: export/import round trips have confirmed bugs

 Two direct probes failed:

 - OneTab text exported with # Stack title is detected as Markdown and imports zero stacks. The serializer is at formats.ts:84; detection is at formats.ts:270.
 - Exported Markdown containing escaped square brackets cannot be parsed back. Parentheses in URLs also break parsing.

 Fix: test serialize → detectFormat → parseImport, not just the parser in isolation. Either support the complete syntax you emit or explicitly declare export-only
 formats.

 ### 5. Medium: lifecycle interruption can duplicate restored tabs

 Restore opens tabs before deleting their saved rows. That is safe against losing saved tabs, but if the worker stops between those operations, a retry can reopen
 duplicates.

 Several event handlers launch detached promises, and the queue only serializes work within one worker lifetime: queue.ts.

 Fix: persist an operation ID and progress before browser side effects. Reconcile unfinished operations on startup and make retries idempotent. Add a test that
 interrupts restore after opening tabs but before removing saved rows.

 ### 6. Medium: Firefox favicons are broken, with a working fallback

 src/platform/favicon.ts always requests Chromium’s /_favicon/ endpoint. Firefox does not provide it; the real request aborted and the UI fell back to letter
 tiles.

 Fix: capture Firefox’s tabs.Tab.favIconUrl when stowing and use that on Firefox. Retain letter tiles when no icon exists.

 ### 7. Additional correctness gaps

 - Concurrent Library edits can invalidate the stow deduplication snapshot. Recompute it inside the commit transaction.
 - Restore skips group recreation when stack.color is null in restore.ts:86-107.
 - Coverage enforcement applies only to src/core/**, not services, browser adapters, messaging, or UI.
 - pnpm e2e can test stale .output/chrome-mv3 files because it does not build first.

 ────────────────────────────────────────────────────────────────────────────────

 Deployment: what is actually happening

 Your current workflow is GitHub artifact publishing, not store deployment.

 The ZIPs are unsigned, unpacked extensions. Users must use Developer mode or temporary add-on loading. There is no automated:

 - Chrome Web Store submission
 - Firefox AMO submission/signing
 - Review-status handling
 - Staged rollout
 - Production smoke test after store installation

 Manual store submission is reasonable for the first release. Automate submission only after the listings and credentials are established.

 Before submission, also finish:

 - The five required screenshots and promotional assets in docs/STORE_LISTING.md. Existing landing images can provide source material.
 - A consistent homepage and support URL.
 - Permission and privacy justifications.
 - Upgrade, rollback, and database-migration testing.
 - Protection for main with required CI checks.

 Documentation fixes

 - README references 0.1.0 artifacts while the package is 0.1.1.
 - README says Chrome 120+, but the manifest requires Chrome 123+.
 - BUILD.md says Vite 7; the lockfile uses Vite 8.3.8.
 - The documented CHROMIUM_PATH override is ignored by the E2E harness.
 - docs/CHANGELOG.md has no 0.1.1 section.
 - Release tags are not checked against package.json and the changelog.

 Recommended order

 1. Fix backup fidelity, backup scheduling, import round trips, and Firefox favicons.
 2. Add lifecycle interruption and concurrent-write tests.
 3. Run Chrome and Firefox verification on every release; generate all artifacts in CI.
 4. Prepare store assets, submit manually, and test the signed store installation.
 5. Then automate store submission with protected credentials and a manual approval gate.