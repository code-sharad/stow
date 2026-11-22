# 01. Product requirements

**Status:** v1.0 scope, ready for implementation · **Owner:** Product/Engineering · **Audience:** implementing agent and reviewers

Keywords **MUST / SHOULD / MAY** follow RFC 2119. Priorities: **P0** = release-blocking, **P1** = ships in v1.0 if at all feasible, **P2** = stretch / v1.1.

---

## 1. Summary

Tab overload is a memory and attention problem. OneTab solved it with one idea: *click once, your tabs become a list, the browser gets its RAM back.* It is now unmaintained, built on legacy extension architecture, has a dated UI, offers little organization beyond reordering, and performs destructive actions without undo.

**Stow** keeps the one-click promise and adds the things a modern tool needs: instant search, trash and undo, drag and drop that also works from the keyboard, native tab-group preservation, backup, dark mode, and a codebase that is MV3-native and maintainable. It is entirely local. There is no account, no server, and no telemetry.

## 2. Goals and non-goals

### Goals
| ID | Goal | How we know |
|----|------|-------------|
| G1 | **Parity.** A OneTab user can switch and lose nothing they rely on. | Parity matrix (§5) fully green for P0 rows; OneTab text import round-trips. |
| G2 | **Zero data loss.** | Invariants 1–3 (00 §3) proven by tests, including fault injection. |
| G3 | **Fast at scale.** | 20,000 saved tabs across 500 stacks: smooth scrolling, <50 ms search (see §8). |
| G4 | **Modern, accessible UX.** | WCAG 2.2 AA; full keyboard operation; dark/light; design system in 04. |
| G5 | **Private by construction.** | No network code paths; no host permissions; CI-enforced. |
| G6 | **Maintainable.** | Pure core, typed boundaries, ≥90% line coverage on `src/core`, documented decisions. |

### Non-goals (v1)
- **Cloud sync, accounts, or hosted "share as web page" links.** They require a server and break the local-only guarantee. Alternatives: export/copy as Markdown/text/HTML/JSON. The storage layer is built behind an interface so a future opt-in sync adapter is possible.
- **Tab suspending/discarding of *open* tabs.** Different product.
- **Browsing-history/session recording.**
- **Mobile browsers and Safari.** Chromium-family first; Firefox desktop second (M5).
- **AI features, recommendations, auto-grouping by content.**
- **Replacing bookmarks.** Stow is a holding area for *tabs in flight*; bookmark export is offered for interoperability only.

## 3. Users and jobs to be done

| Persona | Behavior | Job |
|---------|----------|-----|
| **Tab hoarder** | 100–500 tabs, many windows | "Free my machine without losing my place." |
| **Researcher** | Collects pages per topic over weeks | "Park a topic, find it again, reopen it as a set." |
| **Minimalist** | Wants zero ceremony | "One click, forget about it, it's all there when I need it." |
| **Migrant from OneTab** | Years of saved lists | "Bring my lists over without a fight." |

## 4. Glossary (use these terms everywhere, in code, UI, and docs)

| Term | Meaning |
|------|---------|
| **Stow** (verb) | Save tabs into the Library and close them. |
| **Stack** | An ordered set of saved tabs created by one stow (or by the user). OneTab calls these "tab groups"; we avoid that term because it collides with the browser's native **tab groups**. |
| **Saved tab** | One URL + title inside a Stack. In UI copy: "tab". |
| **Library** | The full-page extension UI listing all Stacks. Singleton tab. |
| **Restore** | Re-open a saved tab or Stack as real browser tabs. |
| **Trash** | Soft-deleted tabs and Stacks, recoverable until retention expires. |
| **Eligible tab** | An open tab that passes the ignore rules (§7.1). |
| **Pinned stack / Locked stack** | See ORG-07 / ORG-08. Do not confuse with browser *pinned tabs*. |

## 5. OneTab parity matrix

> Based on OneTab's commonly documented behavior. Where an implementer can inspect an installed copy of OneTab, verify behavior against it for rows marked †. Never copy code, art, or text from it (00 §3.10).

| Capability | Stow v1 | Status | Notes |
|---|---|---|---|
| One-click: send all tabs in the window to a list | STOW-01 | **Parity** (P0) | Default toolbar action. |
| Send only this tab / all but this / left / right | STOW-02 | **Parity** (P0) | Context menu + shortcuts. |
| Send all tabs in all windows | STOW-02 | **Parity** (P0) | |
| Send highlighted (multi-selected) tabs | STOW-02 | **New** (P1) | |
| Click a saved link to reopen it (and remove from list)† | REST-01 | **Parity** (P0) | Remove-on-restore is configurable. |
| Restore all tabs in a list† | REST-03 | **Parity** (P0) | Plus "restore in new window". |
| Delete a tab / delete a list | ORG-02/03 | **Improved** (P0) | Goes to Trash, with Undo. |
| Rename a list | ORG-01 | **Parity** (P0) | Inline. |
| "Star"/"Lock" a list† | ORG-07/08 | **Improved** (P1) | Defined here as **Pin** and **Lock**. |
| Drag and drop tabs and lists | ORG-04..06 | **Parity** (P0) | Plus keyboard-accessible alternative (ORG-11). |
| Remove duplicates† | STOW-06 | **Parity** (P0) | Policy-driven; merged duplicates go to Trash. |
| Ignore pinned tabs† | STOW-04 | **Parity** (P0) | |
| Import / export as plain-text URL list | DATA-01/03 | **Parity** (P0) | Format-compatible (02 §12.1). |
| Badge showing saved-tab count | — | **Dropped** | A quiet icon: no count, only transient ✓/! feedback. |
| Open list page on startup / pin the list tab† | SET catalog | **Parity** (P1) | |
| Share a list as a hosted web page | n/a | **Dropped** | Needs a server; see non-goals. Alternatives: copy as Markdown/text, export HTML. |
| Search across saved tabs | SRCH-01 | **New** (P0) | |
| Trash, undo | TRASH-* | **New** (P0) | |
| Preserve native tab group name/color | STOW-07 | **New** (P1) | |
| Multi-select and bulk actions | LIB-06 | **New** (P1) | |
| Command palette, keyboard-first operation | KBD-* | **New** (P1) | |
| Dark mode, density | LIB-08 | **New** (P1) | |
| Backups (manual + scheduled) | DATA-05 | **New** (P1) | |
| "Memory saved" statistics | n/a | **Deferred** | v1.1; needs honest methodology. |

## 6. Core user flows

**F1: Stow the window.** User clicks the toolbar icon → eligible tabs are saved as a new Stack at the top of the Library → those tabs close → the Library is shown in that window → the badge shows the new total.

**F2: Restore one.** In the Library the user clicks a saved tab → it opens in a new tab right next to the Library → it disappears from the list (unless the stack is locked or the setting says keep).

**F3: Restore a stack.** User clicks "Restore all" → tabs open in the current window (or a new one, per setting or menu choice) in throttled batches → opened items are removed → an empty, untitled, unpinned, unlocked stack removes itself.

**F4: Find.** User presses `/` or ⌘/Ctrl+K, types a few characters → results appear as they type, grouped by stack → Enter opens the highlighted tab.

**F5: Recover.** User deletes a stack by mistake → a toast offers **Undo** → or later: Trash → Restore.

**F6: Migrate.** User exports from OneTab (plain text) → Library → Import → previews counts → imports as new stacks.

## 7. Functional requirements

### 7.1 Stowing (STOW)

- **STOW-01 (P0): One-click stow.** With default settings, clicking the toolbar icon stows all eligible tabs of the current **normal** window into a new Stack placed at the top of the Library (or several Stacks when STOW-07 applies).
  *AC:* Window has 10 tabs: 2 browser-pinned, 1 `chrome://settings`, 1 Library tab, 6 ordinary. After the click: 6 saved, those 6 closed; the 4 others remain; window stays open; Library visible; badge = previous total + 6.
- **STOW-02 (P0): Scopes.** Support: *this tab*, *all tabs in window*, *all other tabs*, *tabs to the left*, *tabs to the right*, *highlighted tabs* (P1), *all windows*. Reachable from: context menu (page and toolbar-icon contexts), keyboard commands, popup, command palette.
  *AC:* For each scope, a unit test against a faked tab set asserts the exact tab-id set selected.
- **STOW-03 (P0): Save-before-close.** (Invariant 1.) Pipeline: resolve → classify → plan → single DB transaction → read-back verify → close.
  *AC:* Fault-injection test forces the DB write to throw → no `tabs.remove` call is made, an error is surfaced, and the Library is unchanged. Same for read-back mismatch and `QuotaExceededError`.
- **STOW-04 (P0): Ignore rules.** Never stow: tabs with internal/privileged schemes (`chrome:`, `chrome-untrusted:`, `chrome-extension:`, `moz-extension:`, `edge:`, `brave:`, `about:`, `devtools:`, `view-source:`, `resource:`); the Library page itself; new-tab pages and blank pages; browser-**pinned** tabs (unless `ignorePinnedTabs=false`); **incognito** tabs (unless `stowIncognito=true`); tabs matching the user's `ignoredSites` patterns; tabs in non-`normal` windows (popups, apps, devtools). Skipped tabs are left untouched and counted by reason.
  *AC:* Table-driven unit test covers every rule and precedence; result reports counts per skip reason.
- **STOW-05 (P0): Window survival.** Stowing must never close the browser window unintentionally. If closing the stowed tabs would leave a window with zero tabs, the Library (or a New Tab page when `afterStow='stay'`) is guaranteed to exist in that window *before* the close step. See 02 §8.5.
  *AC:* Stowing a window consisting only of eligible tabs leaves that window open, containing exactly one tab (the Library).
- **STOW-06 (P0): Duplicates.** (a) Within a single stow, identical `urlKey`s are collapsed to the first occurrence. (b) Against the Library, policy `dedupe='global'` (default) moves the *older* existing copy to Trash (as a `dedupe-merge` operation, undoable) and keeps the new one; `'off'` keeps both. Locked stacks are never modified by dedupe (the new copy is simply saved). The result reports "N duplicates merged".
  *AC:* Unit tests for the planner (pure function) cover all branches.
- **STOW-07 (P1): Preserve native tab groups.** With `preserveBrowserGroups=true` (default), each native tab group among the stowed tabs becomes its own Stack with the group's title and color; ungrouped tabs form a Stack of their own. Order of resulting Stacks mirrors tab-strip order.
  *AC:* 3 groups + 4 ungrouped tabs → 4 Stacks; titles/colors preserved; with the setting off → 1 Stack.
- **STOW-08 (P0): Placement.** New Stacks are inserted at the top (before all unpinned Stacks, after pinned ones) with `createdAt = now`.
- **STOW-09 (P0): Pinned metadata.** Each saved tab records `wasPinned` so a restore can re-pin it when applicable (REST-03).
- **STOW-10 (P1): Feedback.** After success: toolbar badge shows the new total; if the Library page is visible, the new Stack is highlighted once (04 §9); when stow was triggered from a context where the Library is not shown (`afterStow='stay'`), the badge briefly shows a check state (`✓`, ~1.2 s) and then reverts to the count. On failure the badge shows `!` until the next successful operation or 10 s, whichever is first, and the Library (if open) shows a toast with a specific reason.
- **STOW-11 (P0): Serialization.** Stow and restore operations run through a single in-service-worker queue. A rapid second invocation sees an already-updated tab set and cannot double-save.
  *AC:* Firing the stow handler twice concurrently saves each tab exactly once.
- **STOW-12 (P1): Scale.** Stowing 1,000 tabs completes the save-and-verify phase in ≤ 3 s (p95, fixture machine) and closes them in batches of ≤ 50 ids.
- **STOW-13 (P0): Popup execution.** Actions started from the popup execute in the service worker (the popup may close at any moment).

### 7.2 Restoring (REST)

- **REST-01 (P0): Open one.** Activating a saved tab opens a new active tab immediately after the Library tab (index +1, preserving relative order for repeated opens), then removes the item (if `removeOnRestore` and stack not locked).
- **REST-02 (P0): Modifiers.** Primary click: open active. ⌘/Ctrl-click and middle-click: open in the **background** (Library keeps focus). Alt/Option-click: invert `removeOnRestore` for this action only. Rows are real links (`<a href>`), so "copy link address" and "open in new tab" in the browser's context menu work and do not corrupt bookkeeping (click handlers intercept).
- **REST-03 (P0): Restore a stack.** Opens all tabs of a Stack in the **current window** (default) or a **new window** (menu action or `restoreTarget='new-window'`). Re-pins tabs where `wasPinned && restorePinned`; recreates the native tab group (title/color) where the Stack has `color` or came from a group and `restoreGroups` is on. Opens in throttled batches so the UI stays responsive (02 §8.6).
  *AC:* A 30-tab stack restores fully; the main thread of the Library shows no long task >100 ms during restore in the e2e trace.
- **REST-04 (P0): Open-then-remove.** (Invariant 2.) A saved tab is removed only after `tabs.create` for it resolves. If creation fails (e.g., blocked scheme), the item stays and the summary toast lists the count that failed.
- **REST-05 (P1): Restore selection** (bulk action, same semantics).
- **REST-06 (P1): Empty-stack cleanup.** If a Stack becomes empty by restore and is untitled, unpinned, and unlocked, it is moved to Trash (as part of the same undoable operation). Titled, pinned, or locked empty Stacks remain.
- **REST-07 (P1): Restore from popup and palette.**
- **REST-08 (P2): Lazy restore.** Optional mode that opens tabs as lightweight placeholders loading on activation. Out of v1.0 unless trivially safe (see 02 §8.6 note).
- **REST-09 (P0): URL safety.** Before opening, the URL scheme must be in the allowlist `{http, https, ftp, file}`; anything else is refused and counted as failed. (Imports are validated against the same list at import time.)

### 7.3 Library (LIB)

- **LIB-01 (P0): Singleton.** One Library tab per browser profile. Opening it focuses the existing tab (switching windows if needed) or creates one. Hash routes: `#/` (stacks), `#/trash`, `#/settings[/section]`, `#/stack/<id>` (scroll to and highlight).
- **LIB-02 (P0): Ordering and layout.** Pinned stacks first, then others; within each section by `orderKey` (new stacks at the top). Each stack shows: title (or formatted creation time if untitled), tab count, creation time, flags (pinned/locked), native-group color spine, and its rows. Collapse/expand state persists per stack (`collapsed`).
- **LIB-03 (P0): Row content.** Favicon, title (falls back to URL when empty), domain. Long text truncates with ellipsis; full title+URL available via tooltip and accessible name. Right-to-left and bidi-control characters in titles must not spoof or break layout (render with `dir="auto"` in `<bdi>`).
- **LIB-04 (P0): Live updates.** Changes from the service worker, popup, or another Library window appear without reload (02 §10 change bus).
- **LIB-05 (P0): Scale.** 20,000 tabs / 500 stacks: cold open to first meaningful paint ≤ 300 ms, interactive ≤ 800 ms, scrolling ≥ 55 fps on the fixture machine; DOM node count stays bounded (virtualization).
- **LIB-06 (P1): Selection.** Checkbox on hover/focus; shift-click range; ⌘/Ctrl+A selects all visible; selection survives search filtering within the same view. A bulk bar appears with: Restore, Move to…, Delete, Copy as…; Esc clears.
- **LIB-07 (P1): Index rail.** Left rail lists Stacks (title/date + count) with scroll-spy and click-to-jump; collapses to a disclosure below 900 px.
- **LIB-08 (P1): Theme and density.** Light / dark / system; comfortable / compact. Applied without flash on load (04 §10).
- **LIB-09 (P0): Empty states** for: no stacks, no search results, empty trash, empty stack (copy in 04 §13).
- **LIB-10 (P0): Stale-context resilience.** If the extension updates or reloads while the Library is open, the page shows a non-destructive "Stow was updated. Reload to continue." banner instead of throwing.

### 7.4 Organization (ORG)

- **ORG-01 (P0):** Rename a Stack inline (click title, F2, or menu). Empty string = untitled. Max 200 chars. Commits on Enter/blur; Esc cancels.
- **ORG-02 (P0):** Delete a Stack → Trash; Undo toast.
- **ORG-03 (P0):** Delete a saved tab → Trash; Undo toast.
- **ORG-04 (P0):** Drag a tab within its Stack or into another Stack. Multi-select drag moves all selected.
- **ORG-05 (P0):** Drag to reorder Stacks (within the pinned / unpinned section; dragging across sections pins/unpins, with a visible drop indication).
- **ORG-06 (P0):** Dropping a tab in the gap between Stacks creates a new Stack containing it.
- **ORG-07 (P1): Pin.** Pinned stacks form a section at the top. No other behavior.
- **ORG-08 (P1): Lock.** A locked stack cannot be deleted, cannot lose tabs to restore-removal, and is exempt from dedupe merges. The user can still rename, reorder, and add tabs. Delete actions on it are disabled with an explanatory tooltip ("Unlock to delete").
- **ORG-09 (P1): Merge** a Stack into another (appends, preserves order, source goes to Trash; undoable).
- **ORG-10 (P1): Sort** a Stack's tabs once by title, domain, or date saved (not a persistent mode).
- **ORG-11 (P1): "Move to…"** menu command for tabs (searchable stack picker; also "New stack"). This is the keyboard/AT alternative to dragging (WCAG 2.5.7).
- **ORG-12 (P1): Remove duplicates in stack.**
- **ORG-13 (P2): Split stack by domain.**

### 7.5 Search and filter (SRCH)

- **SRCH-01 (P0):** Instant, typo-tolerant search over title, URL, and Stack title. Results keep Stack grouping, highlight matches, show a match count, and update on every keystroke. `/` focuses search; Esc clears and returns focus to the list.
- **SRCH-02 (P1):** `domain:example.com` operator (suffix match on host); free text can be combined.
- **SRCH-03 (P1):** In Trash view, search covers trashed items only.
- **SRCH-04 (P1):** Popup search field opens the Library with `?q=` prefilled. Command palette searches tabs and Stacks directly.

### 7.6 Trash and undo (TRASH)

- **TRASH-01 (P0):** All deletes are soft. Trash lists deleted Stacks and tabs grouped by the operation that deleted them (e.g., "Deleted 12 tabs, 2 hours ago"), with **Restore** and **Delete forever**, and a global **Empty trash**.
- **TRASH-02 (P0):** Every destructive Library action shows a toast with **Undo** (visible ≥ 8 s; pauses on hover/focus). ⌘/Ctrl+Z undoes the last operation in the current Library session.
- **TRASH-03 (P0):** Retention (`trashRetentionDays`, default 30; options 7/30/90/forever) is enforced by a daily alarm and on service-worker startup. Purges are logged in the local diagnostics ring.
- **TRASH-04 (P0):** Restoring a trashed tab whose Stack is alive returns it to its original position (original `orderKey`). If the Stack is gone, it goes to a new Stack titled "Recovered tabs".
- **TRASH-05 (P0):** Permanent deletion ("Delete forever", "Empty trash") requires a confirmation dialog stating the count and that it cannot be undone.

### 7.7 Import, export, backup (DATA)

- **DATA-01 (P0): Export all.** Formats: **JSON** (full fidelity, includes settings), **OneTab-compatible text**, **Markdown**; **Netscape bookmarks HTML** (P1).
- **DATA-02 (P0): Export/copy a Stack or selection** as text or Markdown to the clipboard.
- **DATA-03 (P0): Import.** Accepts OneTab text, Stow JSON, and plain URL lists (one per line); Netscape bookmarks HTML (P1). A **preview dialog** shows detected format, stack count, tab count, skipped/invalid lines, and a duplicate count, with mode **Add** (default) or **Skip duplicates**. Nothing is written until the user confirms.
- **DATA-04 (P0): Atomic import.** An import is a single transaction. Invalid input never leaves a partial state. Limits: file ≤ 100 MB, ≤ 200,000 tabs, URL ≤ 32,768 chars, title truncated to 2,000 chars. Imported URLs must pass the scheme allowlist (REST-09). Progress is shown for large files; the UI never freezes.
- **DATA-05 (P1): Backups.** "Download backup" (JSON) at any time. Optional **scheduled backups** (daily/weekly) that write to the Downloads folder using the *optional* `downloads` permission, requested only when the user enables the feature. "Restore from backup" supports **Merge** (default) and **Replace library**; Replace first auto-exports the current library and requires typed confirmation.
- **DATA-06 (P1):** Settings → Data shows counts and storage usage (`navigator.storage.estimate()`).
- **DATA-07 (P0):** Export → Import of Stow JSON is lossless (round-trip test: ids, order, flags, timestamps preserved).

### 7.8 Settings (SET)

- **SET-01 (P0):** Every setting in §9 is user-editable in Library → Settings, grouped as in 04 §11.7. Changes apply live in all contexts without reload.
- **SET-02 (P0):** Settings are validated and defaulted on load; unknown or invalid values fall back to defaults and never crash.
- **SET-03 (P0):** "Reset all settings" restores defaults (data untouched).

### 7.9 Popup (POP) (P1)

When `toolbarClick='popup'`, or when the user opens it from the extension menu, the popup offers: Stow this window (with eligible-tab count), Stow this tab, Stow other tabs, Stow all windows, a search field (Enter opens Library with the query), the three most recent Stacks with one-click **Restore all**, and "Open library" with the total saved-tab count. Size: 360 px wide, ≤ 560 px tall.

### 7.10 Keyboard and command palette (KBD) (P1)

- **KBD-01:** Manifest `commands` ship with sensible defaults (02 §8.9); users can remap at the browser's shortcuts page.
- **KBD-02:** ⌘/Ctrl+K opens a command palette: actions, Stack jump, tab search, settings jump.
- **KBD-03:** Library list is a single keyboard composite (tree pattern, 04 §12): arrows navigate; →/← expand/collapse a stack; Enter opens; Space toggles selection; Delete removes; the full map is in 04 §8.4. `?` shows a shortcut cheat-sheet.

### 7.11 Onboarding (ONB) (P1)

On first install, open the Library with a short welcome panel: what Stow does, the toolbar icon location (with "pin it to your toolbar" hint), the shortcut, and an "Import from OneTab" call to action. Nothing is stowed automatically. On update, no network "what's new" fetch; link to the bundled changelog.

### 7.12 Badge (BADGE)

- **BADGE-01 (P0):** The toolbar icon never shows a saved-tab count. Transient `✓`/`!` feedback is allowed. Tooltip (`action.title`) reads "Stow: N saved tabs".

## 8. Non-functional requirements

| ID | Area | Requirement |
|----|------|-------------|
| NFR-PERF-1 | Stow latency | Click → save committed ≤ 400 ms for 100 tabs; tabs closed ≤ 1.5 s (p95, excluding browser teardown). |
| NFR-PERF-2 | Library cold open | First meaningful paint ≤ 300 ms, interactive ≤ 800 ms at 20k tabs. |
| NFR-PERF-3 | Search | p95 ≤ 50 ms per keystroke at 20k tabs; index build ≤ 400 ms, non-blocking (chunked). |
| NFR-PERF-4 | Memory | Library tab ≤ 150 MB at 20k tabs (excludes browser baseline). Idle service worker holds no heavy state. |
| NFR-REL-1 | Data safety | Invariants 1–3; migrations atomic; emergency export path (02 §6.5). |
| NFR-REL-2 | Crash tolerance | Killing the service worker at any point of a stow/restore never loses data (02 §15). |
| NFR-PRIV-1 | Network | Zero outbound requests. Verified by CI and by a Playwright test that fails on any request not to `chrome-extension://`. |
| NFR-PRIV-2 | Permissions | Only those in 02 §5; no host permissions; `downloads` is optional and runtime-requested. |
| NFR-PRIV-3 | Incognito | Incognito tabs are never persisted unless the user explicitly opts in. |
| NFR-A11Y | Accessibility | WCAG 2.2 AA; full keyboard operation incl. reorder; screen-reader labels and live announcements; reduced-motion and forced-colors respected; 200% zoom and 320 px reflow (04 §12). |
| NFR-I18N | Localization | All strings in the i18n catalog; ICU-style plurals; RTL-safe (CSS logical properties); locale-aware dates/numbers via `Intl`. v1 ships `en`; the catalog structure must permit adding locales without code changes. |
| NFR-COMPAT | Browsers | Chrome/Edge/Brave/Arc/Vivaldi (Chromium ≥ 123) in v1.0; Firefox (current stable and ESR where API-complete) by M5 with documented degradations (02 §19). |
| NFR-SIZE | Footprint | Library initial JS ≤ 220 KB gzip, popup ≤ 90 KB, background ≤ 60 KB, fonts ≤ 120 KB total (02 §17). |
| NFR-SEC | Security | CSP `script-src 'self'; object-src 'self'`; input validation with Zod at every trust boundary (imports, messages, storage reads); no dynamic code. |
| NFR-MAINT | Maintainability | Pure core ≥ 90% line coverage; typed message protocol; ADR log; no circular dependencies (CI check). |

## 9. Settings catalog

All keys live in `chrome.storage.local` under `settings` (02 §7). Defaults are normative.

| Key | Type / values | Default | Description |
|---|---|---|---|
| `toolbarClick` | `'stow-window' \| 'popup' \| 'library'` | `'stow-window'` | What clicking the toolbar icon does. |
| `afterStow` | `'show-library' \| 'stay'` | `'show-library'` | Whether the Library is brought into the window after stowing. |
| `ignorePinnedTabs` | boolean | `true` | Leave browser-pinned tabs open. |
| `stowIncognito` | boolean | `false` | Allow saving incognito tabs to disk (shows a warning). |
| `preserveBrowserGroups` | boolean | `true` | Native tab groups become separate Stacks. |
| `ignoredSites` | string[] (match patterns) | `[]` | Never stow matching URLs, e.g. `*://mail.google.com/*`. |
| `dedupe` | `'global' \| 'off'` | `'global'` | Duplicate handling vs. the existing Library. |
| `stripTrackingForDedupe` | boolean | `true` | Ignore `utm_*`, `fbclid`, etc. when comparing URLs. |
| `restoreTarget` | `'current-window' \| 'new-window'` | `'current-window'` | Where "Restore all" opens tabs. |
| `removeOnRestore` | boolean | `true` | Remove items from the Library once opened. |
| `restorePinned` | boolean | `true` | Re-pin tabs that were pinned. |
| `restoreGroups` | boolean | `true` | Recreate native tab groups. |
| `openLibraryOnStartup` | boolean | `false` | Open the Library when the browser starts. |
| `pinLibraryTab` | boolean | `false` | Keep the Library tab pinned. |
| `theme` | `'system' \| 'light' \| 'dark'` | `'system'` | |
| `density` | `'comfortable' \| 'compact'` | `'comfortable'` | |
| `showFavicons` | boolean | `true` | |
| `trashRetentionDays` | `7 \| 30 \| 90 \| 0` (0 = forever) | `30` | |
| `autoBackup` | `'off' \| 'daily' \| 'weekly'` | `'off'` | Requires optional `downloads` permission. |

## 10. Privacy stance (must be reflected in the store listing and `docs/PRIVACY.md`)

Stow stores your saved tabs only in your browser's local extension storage. It makes no network requests, collects no analytics, and has no account. Exports go where you save them. A local diagnostics log (last 100 error entries, no URLs or titles) is kept for bug reports and is never transmitted; the user copies it manually.

## 11. Release scope

- **v1.0 = all P0 + P1** (M0–M6 in 03). P2 items and the deferred statistics feature are v1.1.
- **v1.1 candidates:** lazy restore, side-panel UI, split-by-domain, query operators beyond `domain:`, memory-saved statistics, optional sync adapter (user-supplied backend or File System Access folder), additional locales.

## 12. Open questions and chosen defaults

| # | Question | Default chosen (change only via decision log) |
|---|---|---|
| 1 | Product name | **Stow** (placeholder). Verify trademark/store-name availability before release. |
| 2 | Default toolbar action: popup or instant stow? | **Instant stow** (the product's core promise). The popup is reachable from the extension menu and via setting. |
| 3 | Split native groups into Stacks by default? | **Yes**, with a clear setting and toast copy ("Stowed 14 tabs in 3 stacks"). |
| 4 | Default dedupe? | **Global, newest wins**, always undoable. |
| 5 | Incognito? | **Never persisted** by default. |
| 6 | License | **MIT** (placeholder; maintainer may change). |
