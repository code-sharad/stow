# 02. Technical design

**Status:** normative for v1.0 · **Audience:** implementing agent · **Companion docs:** 01 (what), 03 (plan/QA), 04 (UI)

> Verify every platform/library API against **current** documentation before relying on it (00 §4). Where this document names an API, the *intent* is normative; exact signatures may have moved.

---

## 1. Stack and rationale

| Concern | Choice | Why | Rejected |
|---|---|---|---|
| Extension framework | **WXT** (Vite-based) | MV3-native, file-based entrypoints, HMR, cross-browser manifest generation, zip packaging | Plasmo (heavier, less control), hand-rolled Vite |
| Language | **TypeScript** (`strict`, `noUncheckedIndexedAccess`) | Safety at boundaries | JS |
| UI | **React 19** | Team familiarity, ecosystem for DnD/virtualization | Svelte/Solid |
| Styling | **Tailwind CSS v4** over **CSS-variable tokens** (04 §3) | Fast iteration, tokens as single source of truth | CSS-in-JS (runtime cost) |
| Primitives | **Radix UI** (Dialog, DropdownMenu, Popover, Tooltip, Switch, Checkbox, Select, ToggleGroup) + **cmdk** | Accessible, unstyled; we own the look | Material/Chakra (opinionated visuals) |
| Icons | **lucide-react** (tree-shaken) | Consistent stroke icons, ISC license | Icon fonts |
| Storage (data) | **IndexedDB via Dexie 4** | Large volumes, indexes, transactions, usable in service worker | `chrome.storage.local` for data (no indexes/transactions) |
| Storage (settings) | `chrome.storage.local` (+ WXT storage helper) | Small, cross-context change events | IndexedDB |
| Ordering | **fractional-indexing** keys | Reorder without renumbering; low-conflict | Integer positions |
| IDs | **ULID** | Sortable, collision-free, offline | UUIDv4 |
| Search | **MiniSearch** | Small, fuzzy/prefix, incremental add/remove | Fuse (slower at scale), Lunr |
| DnD | **@dnd-kit/core** (+ our own layout index) | Pointer/keyboard sensors, custom collision | react-beautiful-dnd (unmaintained) |
| Virtualization | **@tanstack/react-virtual** | Fixed-size rows → exact math | react-window |
| State | **Zustand** (selector-based) | Tiny, works with external change bus | Redux |
| Validation | **Zod** | Runtime validation at trust boundaries | Hand-written guards |
| Messaging | Typed wrapper over `chrome.runtime.sendMessage` (or `@webext-core/messaging`) | One protocol module (§9) | Ad-hoc strings |
| Lint/format | **Biome** | One fast tool | ESLint+Prettier |
| Tests | **Vitest**, **Testing Library**, **fake-indexeddb**, **Playwright** (real Chromium + extension), **axe-core** | See 03 §3 | Jest |
| Package manager | **pnpm** | Strict, fast | npm |

Pin exact versions in the lockfile; use the latest stable at implementation time. Record any version-driven deviation in `docs/DECISIONS.md`.

## 2. Repository structure

See 00 §5. **Dependency rules** (enforced by a CI import-boundary check such as `dependency-cruiser`):

- `core/*` imports nothing from `platform`, `services`, `ui`, `entrypoints`, and never references `chrome`/`browser` globals or React.
- `platform/*` may import `core/domain` types only.
- `services/*` import `core` and `platform` (via interfaces), never `ui`.
- `ui/*` imports `core` and `messaging`, never `platform` or `services`.
- No circular dependencies.

## 3. Runtime architecture

```
                    ┌──────────────────────────────────────────────┐
                    │              IndexedDB  (Dexie)              │
                    │  stacks · tabs · ops · meta · logs           │
                    └───────▲───────────────▲──────────────▲───────┘
                            │ repo (tx)     │ repo (tx)    │ repo (read)
┌───────────────────────────┴───┐   ┌───────┴────────┐   ┌─┴──────────────┐
│ Background service worker     │   │ Library page   │   │ Popup          │
│ • owns tab-touching workflows │◄──┤ UI + state     │   │ light UI       │
│   (stow, restore, library-tab)│   │ writes data    │   │ reads recents  │
│ • context menus, commands,    │   │ directly via   │   │ sends commands │
│   action click, alarms, badge │   │ repo           │   │ to SW          │
│ • purge, backup scheduling    │   └───────▲────────┘   └────────────────┘
└───────────────┬───────────────┘           │
                │      BroadcastChannel 'stow:changes'  (delta bus, §10)
                └───────────────────────────┘
          chrome.storage.local('settings')  ── onChanged ──► all contexts
```

**Rules of the road**

1. **Anything that touches live browser tabs runs in the service worker** (stow, restore, focus/create Library). UIs send a command message and await a typed result. This guarantees completion when the popup closes or the Library navigates.
2. **Pure data edits** (rename, move, reorder, delete, undo, import) run in whichever UI context initiates them, through `repo` (transactional). IndexedDB serializes conflicting transactions.
3. After every committed transaction, `repo` returns a **ChangeSet** and broadcasts it on the delta bus (§10).
4. **All service-worker listeners are registered synchronously at top level** of `background.ts` (MV3 requirement). Async init happens inside handlers.
5. The service worker may be terminated at any time. No correctness depends on in-memory state (invariant 8). An in-memory promise queue serializes workflows within one SW lifetime; cross-lifetime safety comes from the failure-mode design in §15.

## 4. Manifest (generated by WXT; shown for intent)

```jsonc
{
  "manifest_version": 3,
  "name": "__MSG_extName__",
  "description": "__MSG_extDescription__",
  "default_locale": "en",
  "minimum_chrome_version": "123",          // light-dark(), tabGroups, favicon, setBadgeTextColor
  "permissions": ["tabs", "tabGroups", "storage", "unlimitedStorage",
                  "contextMenus", "favicon", "alarms"],
  "optional_permissions": ["downloads"],     // requested at runtime only if autoBackup enabled
  // NO host_permissions, NO content_scripts, NO web_accessible_resources
  "action": { "default_title": "__MSG_actionTitle__", "default_icon": { /* 16/32/48/128 */ } },
  "background": { "service_worker": "background.js", "type": "module" },
  "options_page": "options.html",            // tiny page that redirects to library.html#/settings
  "commands": {
    "stow-window":       { "suggested_key": { "default": "Alt+Shift+S" }, "description": "__MSG_cmdStowWindow__" },
    "stow-tab":          { "suggested_key": { "default": "Alt+Shift+T" }, "description": "__MSG_cmdStowTab__" },
    "open-library":      { "suggested_key": { "default": "Alt+Shift+L" }, "description": "__MSG_cmdOpenLibrary__" },
    "stow-all-windows":  { "description": "__MSG_cmdStowAll__" }     // no default key (browsers limit suggested keys)
  },
  "incognito": "spanning",
  "content_security_policy": { "extension_pages": "script-src 'self'; object-src 'self'" }
}
```

Firefox build adds `browser_specific_settings.gecko` (`id`, minimum version, and current data-collection declarations: "none") and uses an event-page background; WXT handles the transform.

## 5. Permissions and justification (use verbatim in store forms)

| Permission | Why it is required | Alternatives considered |
|---|---|---|
| `tabs` | Read URL, title, pinned/incognito/group state of the user's open tabs; create, move, and close tabs. This is the product's single purpose. | `activeTab` only grants the current tab on gesture, so it cannot stow a whole window. |
| `tabGroups` | Read and recreate native tab-group title/color when stowing/restoring. | Feature-detect; degrade gracefully if absent. |
| `storage`, `unlimitedStorage` | Persist settings; persist a potentially large library locally without eviction/quota errors. | |
| `contextMenus` | "Stow…" actions on page and toolbar-icon context menus. | |
| `favicon` | Show site icons from the browser's **local** favicon cache (no network, no third-party service). | Third-party favicon services leak the user's saved sites; rejected. |
| `alarms` | Trash retention purge and scheduled backups (MV3 service workers cannot use long-lived timers). | |
| `downloads` *(optional)* | Scheduled backups to the Downloads folder. Requested only when enabled by the user. | Manual export via blob + anchor needs no permission. |

Note for store review: the `tabs` permission surfaces a "read your browsing history" warning. This is unavoidable for the stated purpose; the listing must explain that data never leaves the device.

## 6. Data model

### 6.1 Types (`src/core/domain/types.ts`)

```ts
export type Id = string; // ULID
export type GroupColor = 'grey'|'blue'|'red'|'yellow'|'green'|'pink'|'purple'|'cyan'|'orange';

export interface Stack {
  id: Id;
  title: string;                // '' = untitled; ≤ 200 chars
  orderKey: string;             // fractional index; ascending = top → bottom within its section
  pinned: boolean;
  locked: boolean;
  collapsed: boolean;
  color: GroupColor | null;     // from native tab group, if any
  tabCount: number;             // live (non-deleted) tabs; RECOMPUTED inside every tx touching the stack
  createdAt: number;            // epoch ms
  updatedAt: number;
  deletedAt: number;            // 0 = live (IndexedDB cannot index null/undefined)
  deletedBy: Id | '';           // Operation id that deleted it
}

export interface SavedTab {
  id: Id;
  stackId: Id;
  url: string;                  // verbatim; ≤ 32,768 chars; never rewritten (invariant 6)
  urlKey: string;               // derived: normalizeUrlKey(url, algoVersion)
  title: string;                // ≤ 2,000 chars; may be ''
  orderKey: string;             // fractional index within stack
  wasPinned: boolean;
  createdAt: number;
  deletedAt: number;            // 0 = live
  deletedBy: Id | '';
}

export interface Operation {
  id: Id;
  kind: 'stow'|'delete-tabs'|'delete-stacks'|'restore-remove'|'dedupe-merge'|'merge-stacks'
      | 'import'|'empty-trash'|'purge';
  createdAt: number;
  counts: { tabs: number; stacks: number };
  undoneAt: number;             // 0 = not undone
}

export interface MetaRow { key: string; value: unknown } // 'schemaVersion', 'urlKeyAlgo', 'rev', 'installedAt'
export interface LogRow  { id?: number; ts: number; level: 'info'|'warn'|'error'; code: string; detail: string } // detail never contains URLs/titles
```

### 6.2 Dexie schema (`src/core/db/schema.ts`)

```ts
db.version(1).stores({
  stacks: 'id, deletedAt, deletedBy, [deletedAt+pinned+orderKey]',
  tabs:   'id, stackId, deletedAt, deletedBy, urlKey, [stackId+deletedAt+orderKey], [deletedAt+urlKey]',
  ops:    'id, createdAt',
  meta:   'key',
  logs:   '++id, ts',
});
```

- `deletedAt = 0` marks live rows; queries for live data use `[deletedAt+…]` with `0`.
- Request persistence at Library start: `navigator.storage.persist()`; ignore the result but log it.

### 6.3 Invariants enforced inside `repo` (unit/integration-tested)

1. Every mutation is **one Dexie `rw` transaction** over the tables it touches; it **recomputes** `tabCount` for every affected stack (never increments or decrements).
2. A stack with `locked=true` is never deleted, never loses tabs through `removeOnRestore` or dedupe, and `repo` rejects such calls with a typed error (UI also disables the actions).
3. Deleting a stack stamps the stack **and its live tabs** with the same `deletedAt`/`deletedBy`, so Undo (clear stamps for that `deletedBy`) restores both.
4. `orderKey` always comes from `core/domain/order.ts` (fractional-indexing wrapper). If two siblings ever share a key (concurrent edits), the repo repairs the section by regenerating keys in one transaction.
5. Every transaction increments `meta.rev` by 1 and includes it in the ChangeSet (§10).
6. Reads never mutate; the UI never writes to IndexedDB outside `repo`.

### 6.4 Migrations

Dexie `version(n).stores().upgrade()`; each upgrade is a single atomic transaction. Maintain `meta.schemaVersion`. When the `urlKey` algorithm changes, bump `meta.urlKeyAlgo` and rewrite `urlKey` in a migration (chunked within the upgrade transaction). A fixture-based test per migration loads a DB snapshot from the previous version, upgrades, and asserts content equality.

### 6.5 Emergency export

If opening the DB or a migration fails, the Library renders a **Recovery screen** (not a blank page): shows diagnostics, and a "Download raw data" action that opens the database in Dexie *dynamic mode* (no schema) and dumps all tables to JSON. This path has its own test (corrupt/failed-migration fixture).

## 7. Settings storage

`chrome.storage.local['settings']` holds a Zod-validated object with `schemaVersion`. `getSettings()` always returns a fully-populated object (defaults merged per key; invalid values replaced by defaults, with a diagnostics log entry). `chrome.storage.onChanged` pushes updates to all contexts; React subscribes via a store. The service worker re-reads settings per workflow (cheap) instead of caching across wake-ups. Theme is **also** mirrored to `localStorage` (`stow.theme`) so `theme-init.ts` can apply it synchronously before first paint (04 §10).

## 8. Core algorithms and services

### 8.1 URL normalization (`core/domain/url.ts`): derives `urlKey` only

1. `new URL(raw)`; on failure → key = `raw.trim()`.
2. Lowercase scheme and host (rely on URL parsing for punycode); drop default ports; remove trailing slash on non-root paths.
3. Drop the fragment **unless** it begins with `#/` or `#!` (client-side routes).
4. If `stripTrackingForDedupe`: remove params `utm_*`, `fbclid`, `gclid`, `dclid`, `msclkid`, `mc_cid`, `mc_eid`, `igshid`, `yclid`, `_hsenc`, `_hsmi`, `ref_src` (list lives in `constants.ts`).
5. Sort remaining query params by key then value (key only; the stored `url` is untouched).
6. Do **not** strip `www.` or change scheme (`http` vs `https` are distinct).

Property tests (fast-check): idempotent (`f(f(x)) = f(x)`); equal keys for permuted params; never throws.

### 8.2 Ignore classification (`core/domain/ignore.ts`)

Pure function `classify(tabs, settings, ctx) → { eligible, skipped: Record<SkipReason, number> }`. `SkipReason`: `internal-scheme | library | blank | pinned | incognito | ignored-site | window-type | oversized-url`. Use `tab.url ?? tab.pendingUrl`. Precedence is the order listed. `ignoredSites` uses Chrome match-pattern syntax compiled once per call (support `<all_urls>` and `*://host/*` forms; invalid patterns are ignored and surfaced in Settings validation).

### 8.3 Dedupe planner (`core/domain/dedupe.ts`)

```ts
planDedupe(incoming: Candidate[], existing: ReadonlyMap<string, SavedTab[]>, policy: 'global'|'off')
  → { keep: Candidate[]; collapsedWithinBatch: number; trashExisting: SavedTab[]; skippedBecauseLocked: number }
```
Within-batch duplicates collapse to the first occurrence. Under `'global'`, for each kept candidate, live existing tabs with the same `urlKey` that are **not** in locked stacks are returned in `trashExisting`; those in locked stacks are untouched (candidate is still saved). Pure and exhaustively unit-tested.

### 8.4 Build plan (`core/domain/plan.ts`)

`buildStowPlan(eligible, groups, settings, existingIndex, now) → StowPlan` returns the exact rows to insert (stacks with order keys, tabs with order keys), rows to trash, counts, and the ordered list of browser tab ids to close. Pure; no I/O. Grouping rule: with `preserveBrowserGroups`, one Stack per native group (title/color from the group, ordered by first tab position), plus one Stack for ungrouped tabs; otherwise one Stack.

### 8.5 Stow workflow (`services/stow.ts`)

```ts
async function stow(scope: StowScope, origin: Origin): Promise<StowResult> {
  return queue.run(async () => {
    const settings = await getSettings();
    const tabs     = await tabsPort.resolve(scope, settings);       // chrome.tabs.query by scope (normal windows)
    const { eligible, skipped } = classify(tabs, settings, ctx);
    if (eligible.length === 0) return { ok: true, saved: 0, skipped };

    const groups   = settings.preserveBrowserGroups ? await groupsPort.describe(eligible) : new Map();
    const existing = settings.dedupe === 'global' ? await repo.liveUrlIndex(eligible.map(urlKeyOf)) : new Map();
    const plan     = buildStowPlan(eligible, groups, settings, existing, Date.now());

    const change   = await repo.commitStow(plan);                    // ONE rw transaction (stacks, tabs, ops, meta)
    await repo.verifyStow(plan);                                     // read back: counts + ids present, else throw
    await windowsPort.ensureSurvival(plan.closeTabIds, settings);    // §8.5.1, BEFORE closing
    await tabsPort.removeInBatches(plan.closeTabIds, 50);            // per-id fallback on batch failure
    await badge.refresh();
    bus.publish(change);
    return { ok: true, ...plan.summary, skipped };
  }, { onError: (e) => { log(e); badge.flashError(); return { ok: false, error: toUserError(e) }; } });
}
```

**8.5.1 Window survival.** For each window `W` that would end up with zero tabs after `plan.closeTabIds` close (compute from the pre-close tab list):
- `afterStow='show-library'`: ensure the singleton Library tab is in `W`. If it exists in another window, `tabs.move` it into `W` (singleton preserved) and focus; otherwise create it in `W`.
- `afterStow='stay'`: create a New Tab page in `W`.
Only then close tabs. For windows that keep at least one tab (e.g., pinned tabs remain), the Library is still opened/focused for the *originating* window when `show-library`.

**8.5.2 Close step.** `chrome.tabs.remove(ids)` in chunks of ≤ 50. If a chunk throws (a tab vanished), retry the chunk id-by-id, ignoring "no tab with id" errors; any other error is logged, counted, and reported ("2 tabs couldn't be closed"), while the data stays saved (safe duplicate state).

### 8.6 Restore workflow (`services/restore.ts`)

```ts
async function restore(req: RestoreRequest): Promise<RestoreResult> {
  return queue.run(async () => {
    const items = await repo.loadForRestore(req);                    // honours lock, selection, stack ids
    const safe  = items.filter(i => isAllowedScheme(i.url));         // REST-09; rest counted as failed
    const win   = await resolveTargetWindow(req.target, settings);   // current window or new window
    const opened: Id[] = [];
    for (const batch of chunk(safe, BATCH = 8)) {
      const results = await Promise.allSettled(batch.map(i => tabsPort.create(i, win, flags(i, settings))));
      results.forEach((r, k) => r.status === 'fulfilled' && opened.push(batch[k].id));
      await sleep(120);                                              // yield; keeps browser UI responsive
    }
    if (settings.restoreGroups) await groupsPort.recreate(...);
    const change = await repo.removeRestored(opened, req, settings); // soft-delete AFTER success (invariant 2)
    await badge.refresh(); bus.publish(change);
    return { ok: failed.length === 0, opened: opened.length, failed: failed.length };
  });
}
```
- New window: `windows.create({ url: firstUrl, focused: true })`, then add the rest to that window.
- Single-tab restore uses the same path with `BATCH` irrelevant; placement `index = libraryTab.index + 1 + offset`.
- **Lazy restore note (P2):** placeholders (tab loads a local `lazy.html?id=…` that navigates on visibility) complicate history/back behavior and tab-title/URL honesty. Not in v1.0 without a spike proving it clean.

### 8.7 Library singleton (`services/library-tab.ts`)

`focusOrCreate({ hash?, windowId? })`: `tabs.query({ url: libraryUrl + '*' })`; if found → `tabs.update(id, { active: true })` + `windows.update(win, { focused: true })` (and update hash via `tabs.update` url if a hash was requested); if multiple, focus the first and leave the rest. If none → create (pinned if `pinLibraryTab`). The Library URL is excluded from classification.

### 8.8 Context menus (`services/menus.ts`)

Create in `runtime.onInstalled` (MV3 persists them) and rebuild when the locale/settings that affect titles change; register `contextMenus.onClicked` at top level. Items (ids stable):

| id | contexts | title key |
|---|---|---|
| `stow-tab` | page | menuStowTab |
| `stow-window` | page, action | menuStowWindow |
| `stow-others` | page | menuStowOthers |
| `stow-left` / `stow-right` | page | menuStowLeft / menuStowRight |
| `stow-highlighted` | page, action | menuStowSelected |
| `stow-all-windows` | page, action | menuStowAll |
| `open-library` | page, action | menuOpenLibrary |

Respect the action-menu top-level limit (≤ 6): we use 4. Handlers map `info.menuItemId` + `tab` → `StowScope` → `stow()`.

### 8.9 Commands, action click, startup

- `commands.onCommand`: `stow-window`, `stow-tab`, `open-library`, `stow-all-windows` → same handlers as menus.
- **Action click:** `chrome.action.onClicked` fires only if no popup is set. On every SW start and on `toolbarClick` change, apply `action.setPopup({ popup: toolbarClick==='popup' ? 'popup.html' : '' })` (idempotent). For `'library'`, the click handler opens the Library; for `'stow-window'` it calls `stow({kind:'window'})`.
- **Startup (`runtime.onStartup` and every SW boot):** refresh badge, re-apply popup binding, ensure alarms exist (`purge` daily, `backup` per setting), run retention purge if due, optionally open Library (`openLibraryOnStartup`).
- **First install (`onInstalled` reason `install`):** create menus, seed meta, open the Library with `#/welcome`. **Update:** migrate, rebuild menus, no UI.

### 8.10 Badge (`services/badge.ts`)

`refresh()`: `count = tabs.where('deletedAt').equals(0).count()` → `formatBadge(count)` (01 BADGE-01) → `action.setBadgeText`, `setBadgeBackgroundColor`, `setBadgeTextColor`, `setTitle`. `flashSuccess()`/`flashError()` set a transient `✓`/`!` and schedule a revert using `chrome.alarms` (not `setTimeout`, which a terminated SW will drop); always ends in `refresh()`.

## 9. Messaging contract (`src/messaging/protocol.ts`)

One typed map; Zod-validate every incoming payload in the SW.

```ts
export interface Protocol {
  stow(req: { scope: StowScope }): StowResult;
  restore(req: RestoreRequest): RestoreResult;
  openLibrary(req: { hash?: string }): { ok: true };
  getEligibleCount(req: { scope: StowScope }): { count: number }; // popup label
  requestBackupPermission(req: {}): { granted: boolean };
}
type StowScope =
  | { kind: 'window'; windowId?: number } | { kind: 'all-windows' }
  | { kind: 'tab'; tabId: number }        | { kind: 'others'; tabId: number }
  | { kind: 'left'; tabId: number }       | { kind: 'right'; tabId: number }
  | { kind: 'highlighted'; windowId?: number };
type RestoreRequest = { by: 'tab'|'stack'|'selection'; ids: Id[];
  window?: 'current'|'new'; background?: boolean; invertRemove?: boolean };
```
Results are discriminated unions: `{ ok: true, … } | { ok: false, error: { code, message } }`. Error `code`s are stable strings mapped to i18n copy in the UI (never show raw exceptions).

## 10. Change bus and client state

**Problem:** at 20k tabs, re-running whole-table live queries on every mutation is too slow.
**Design:** a *delta bus*.

- `repo` mutations return `ChangeSet { rev, stacksUpserted, stacksDeletedIds, tabsUpserted, tabsDeletedIds }` (hard deletes only) and `repo` publishes it on `BroadcastChannel('stow:changes')` after commit.
- Each UI context keeps a normalized in-memory store (`Map<Id, Stack>`, `Map<Id, SavedTab>`, plus per-stack ordered id arrays). `applyChangeSet(state, change)` is a pure reducer (unit-tested).
- **Gap detection:** if `change.rev !== state.rev + 1`, fully resync from IndexedDB (a single `toArray()` per table with the live index; ~tens of ms at 20k rows). Resync also runs on `visibilitychange → visible` and on bus errors.
- Optimistic UI is allowed for drag/drop (apply the reducer locally, then commit; on failure, roll back and toast).
- The popup uses small direct queries (recent stacks, total count) and does not hold the full store.

## 11. Search (`ui/state/search.ts`)

- MiniSearch index over `{ id, title, url, stackTitle }`, built **in chunks** (e.g., 2,000 docs per `requestIdleCallback`/`scheduler.yield()` slice) after first paint; search is disabled-looking for <400 ms at worst, with the list fully usable.
- Options: `prefix: true`, `fuzzy: 0.2`, boost `title: 2`, `stackTitle: 1.2`, `url: 1`. Tokenize URLs on `/ . - _ ? = &` so `github` finds `github.com`.
- Maintain the index incrementally from ChangeSets (`add`/`discard`/`replace`). Rebuild from scratch on resync.
- `domain:` operator parsed before the free-text; matches host suffix using stored `urlKey` host.
- Results: filtered flat list preserving stack grouping, capped render via virtualization (not capped logically). Highlight ranges come from MiniSearch match info; rendering uses text nodes + `<mark>` created through React elements, never HTML strings.

## 12. Import / export formats

### 12.1 OneTab-compatible text
Lines of `URL | Title`, one per tab; a blank line separates stacks. Stack titles are not representable (exported as `# Title` comment lines only when the user opts in with "Include stack titles"; the importer tolerates and uses them).
**Parse rules:** normalize `\r\n`; split on `/\n\s*\n/`; for each line, regex `^\s*(\S+?)\s*(?:\|\s*(.*))?$`; URL must parse and pass the scheme allowlist `{http,https,ftp,file}`; invalid lines go to the preview's "skipped" list with line numbers; empty blocks ignored.

### 12.2 Stow JSON (lossless)
```jsonc
{ "app": "stow", "formatVersion": 1, "exportedAt": "2026-11-22T10:15:00Z",
  "settings": { /* optional */ },
  "stacks": [ { "id": "01J…", "title": "", "orderKey": "a0", "pinned": false, "locked": false,
                "collapsed": false, "color": "blue", "createdAt": 1732270000000, "updatedAt": 1732270000000,
                "tabs": [ { "id": "01J…", "url": "https://…", "title": "…", "orderKey": "a0",
                            "wasPinned": false, "createdAt": 1732270000000 } ] } ] }
```
Validated by Zod (`formatVersion` gate; unknown future versions are refused with a clear message). Trashed items are exported only when "Include trash" is checked. On import, ids that already exist are skipped (idempotent re-import); on conflict-free import, ids are preserved.

### 12.3 Markdown
`## Stack title (date)` then `- [Title](url)` list. Titles/URLs are escaped for Markdown link syntax.

### 12.4 Netscape bookmarks HTML (P1)
Export: `<DL><p>` folders per Stack. Import: parse with `DOMParser` in the Library page (never in SW), map folders → Stacks, links → tabs; ignore non-http(s) hrefs.

## 13. Favicons (`platform/favicon.ts`)

`FaviconProvider` interface with:
- **Chromium:** `chrome-extension://<id>/_favicon/?pageUrl=<encoded url>&size=32` (via `chrome.runtime.getURL('/_favicon/')`). Local cache only; no network.
- **Firefox/other:** no local-cache API → default to **letter tile** (04 §11.4). An opt-in setting may use the favicon URL captured from `tab.favIconUrl`, but only after a privacy warning because loading it contacts the site (off by default; v1.0 may omit this opt-in).
- Always render a deterministic letter tile while loading/on error (no layout shift).

## 14. Trash, undo, purge

- **Undo(opId):** in one transaction, clear `deletedAt/deletedBy` for all rows stamped with that op, recompute counts, mark `ops.undoneAt`. Undo of a `dedupe-merge` or `restore-remove` is the same mechanism.
- **Purge:** `purgeExpired(now, retentionDays)` hard-deletes rows with `deletedAt>0 && deletedAt < now - retention`, in chunks (≤ 2,000 rows per transaction) to avoid long locks; logs counts only. `ops` older than 30 days are dropped.
- **Delete forever / Empty trash:** hard delete for the targeted rows after confirmation; logged.

## 15. Error handling and failure-mode table

Principle: *fail closed for destructive steps, fail open for information.* Every failure yields a specific, actionable message (04 §13); raw exceptions never reach the UI.

| Failure | Detection | Behavior | User sees |
|---|---|---|---|
| DB write error / `QuotaExceededError` | exception in `commitStow` | Abort; **no tab closed** | Error toast/badge `!`: "Couldn't save tabs. Nothing was closed." |
| Read-back mismatch | `verifyStow` | Treat as write failure | Same |
| Partial `tabs.remove` failure | per-id errors | Data stays saved; log | "Stowed 14 tabs. 2 couldn't be closed." |
| **SW killed after commit, before close** | n/a | Tabs remain open *and* saved (duplicates). Next stow's dedupe merges; user can also close manually. **Never loss.** | Nothing (benign) |
| **SW killed mid-restore** | n/a | Items opened so far remain in the Library (removal happens after); duplicates possible, loss impossible | Nothing |
| `tabs.create` rejected | `allSettled` | Item kept; counted | "Restored 11 tabs. 1 couldn't be opened." |
| Library singleton race | multiple found | Focus first | Nothing |
| Corrupt/oversized import | Zod/limits | Nothing written; first 5 errors with line numbers | Import dialog error state |
| Migration failure | Dexie upgrade throws | Transaction rolls back; Recovery screen (§6.5) | "Library can't be opened" + Download raw data |
| DB `versionchange`/blocked | Dexie events | Close and reload page | Silent reload or banner |
| Extension updated while page open | "context invalidated" errors | Catch at message layer | Banner: "Stow was updated. Reload to continue." |
| Alarm missed (sleep) | startup check | Run purge/backup if overdue | Nothing |

**Diagnostics:** `logs` ring (≤ 100 rows; `code` + minimal detail, **never** URLs/titles) viewable under Settings → About → Diagnostics with "Copy" for bug reports.

## 16. Security and privacy

- CSP as in §4; no `unsafe-eval`, no inline scripts (hence `theme-init.ts` is an external file).
- **Rendering:** titles/URLs as text only; links via anchors with allowlisted schemes; click handlers intercept and route through messaging; anchors carry `rel="noopener noreferrer"`.
- **Validation:** Zod at boundaries: incoming runtime messages (reject unknown shapes, check sender is this extension's id), storage reads, imports.
- **Bidi/spoof safety:** `<bdi dir="auto">` for titles; show the full URL in tooltip so a deceptive title can't hide the destination.
- **No sensitive logging:** diagnostics contain codes and counts only.
- **Network ban:** `scripts/check-no-network.ts` greps the built bundle for `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `import(` of remote URLs, and `http(s)://` literals outside an allowlist (docs links rendered as plain text, not fetched); a Playwright test additionally fails on any request not to `chrome-extension://`.
- **Dependencies:** `pnpm audit` in CI; minimal runtime dependencies; no postinstall scripts allowed (`pnpm.onlyBuiltDependencies` empty or explicit).
- **Incognito:** filtered at classification; additionally the Library never lists data from an incognito session because none is stored unless `stowIncognito=true`.

## 17. Performance design and budgets

| Item | Design | Budget |
|---|---|---|
| Library virtualization | **One flattened virtual list** of fixed-height rows (stack header, tab rows, gap) from metadata; row heights come from `ui/layout/metrics.ts` (density-dependent constants) | ≤ 400 DOM rows mounted at any time |
| Hit-testing for DnD | `LayoutIndex` (prefix sums over row heights) gives `y → row` by binary search; pure and unit-tested; used for drop targets and auto-scroll | O(log n) |
| Store updates | Immutable per-stack arrays; selectors per row; `React.memo` rows | No whole-list re-render on a single change |
| Initial load | One indexed `toArray()` per table; render first screenful before building search index | FMP ≤ 300 ms @ 20k |
| Service worker | No heavy imports at top level; Dexie opened lazily per workflow | Cold SW to first handler ≤ 100 ms |
| Bundles (gzip, CI-enforced via size-limit) | Library initial JS ≤ 220 KB; Popup ≤ 90 KB; Background ≤ 60 KB; fonts ≤ 120 KB total; lazy-load Import/Export, Settings, palette | CI fails on regression > 5% |
| Memory | No retained detached DOM; search index as compact docs | ≤ 150 MB @ 20k |

**Metrics ↔ CSS:** `ui/layout/metrics.ts` is the single source for row/header heights; at boot, it writes CSS variables (`--row-h`, `--stack-head-h`, …). An e2e test asserts rendered row height equals the metric in both densities.

## 18. Internationalization

- `chrome.i18n` message catalogs under `public/_locales/<lang>/messages.json` for manifest strings; a thin `t(key, params)` wrapper (ICU-style plurals via `Intl.PluralRules`) for UI strings, backed by the same JSON so there is one catalog.
- No concatenated sentences; every string has a description for translators.
- CSS logical properties only (`margin-inline-start`, etc.); icons that imply direction mirror in RTL.
- Dates/numbers via `Intl.DateTimeFormat` / `Intl.NumberFormat` using the browser UI language.
- CI includes a pseudo-locale (`en-XA`) build target for visual overflow testing.

## 19. Cross-browser notes

| Area | Chromium (primary) | Firefox (M5) |
|---|---|---|
| Background | Service worker | Event page (WXT transform) |
| Tab groups | `tabGroups` + `tabs.group` | Feature-detect (`browser.tabGroups`); if absent, `preserveBrowserGroups` is hidden/disabled and groups are ignored |
| Favicons | `_favicon` local cache | Letter tiles by default |
| `action.setBadgeTextColor` | Yes | Feature-detect |
| Contexts | `action` menu context | Use `browser_action` equivalents via WXT/polyfill; verify |
| Side panel | `sidePanel` (v1.1) | `sidebar_action` (v1.1) |
| Store requirements | CWS/Edge: permission justifications, privacy policy | AMO: `gecko.id`, data-collection declaration "none", reviewable source build |

All `chrome.*` access goes through `platform/*` so these differences are localized.

## 20. Build, CI, and packaging

- Scripts: `dev`, `build`, `build:firefox`, `zip`, `lint`, `typecheck`, `test`, `test:coverage`, `e2e`, `size`, `check:tokens`, `check:network`, `check:deps`.
- CI (GitHub Actions): install (frozen lockfile) → lint → typecheck → unit/integration (coverage gate) → build → `check:*` → size-limit → Playwright e2e (Chromium with extension; `xvfb` on Linux) → upload zip artifacts. Tag `v*` triggers release packaging (no auto-publish in v1).
- `scripts/gen-icons.ts` renders PNGs from the SVG source (04 §14) at build time; the repo stores only the SVG.
- `scripts/check-tokens.ts` fails the build on raw hex/rgb/hsl color literals or `px` font sizes outside `tokens.css`/`metrics.ts`.
