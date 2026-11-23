# Store listing copy

Paste-ready strings for the Chrome Web Store and addons.mozilla.org. One noun: **list**. The
product is a *tab shelf*; the thing you save is a *list*. `Stack` survives only in code.

## Name

```text
Stow
```

## Summary

Chrome short description (132 char limit) and AMO summary (250 char limit) share one line:

```text
One click saves a window's tabs as a searchable list, then closes them. Local-first: no account, no network, no telemetry.
```

## Description

```text
Too many tabs? Click once. Every tab in the window becomes a searchable list, the tabs close,
and the memory comes back.

No account. No sync. No server. No tracking. No host permissions.

WHY IT IS DIFFERENT

Most tab managers are a list you keep adding to. Stow is a shelf you take things off. One
gesture saves the window, closes it, and leaves you a list you can search. When you need a tab
back, restore one tab, one window, or the whole list.

Nothing leaves this machine. Stow contains no network code at all; the build fails if a
network call is ever added.

ONE CLICK, THEN FIND THINGS AGAIN

Click the toolbar button, press Alt+Shift+S, or use the right-click menu. Grouped tabs become
their own lists with their names and colors intact, and pinned tabs stay open.

Search across everything you have saved: press Command/Ctrl+K and type a few characters of a
title, a URL, or a list name. Typos are fine, and domain: narrows a search to one site.

NOTHING YOU DO IS FINAL

Every tab is written to disk and read back before it closes. If a tab fails to save, the tab
stays open and you get told why. Delete something by mistake and the toast offers Undo; after
that, Trash keeps it for 30 days.

BRING YOUR LISTS WITH YOU

Import from OneTab, a Markdown list, or bookmarks as HTML. Export the same library as JSON or
Markdown whenever you want. Automatic local backups are optional and never leave your
Downloads folder.

PERMISSIONS, AND WHY

Stow asks for tabs, tab groups, storage, context menus, and alarms. It does not ask for access
to the sites you visit, because it never reads a page: it works with the tab's own title and
URL, which the browser already exposes.

A tab manager that can run scripts on your bank's website is a password-stealing extension
waiting to happen. Stow cannot, by construction.

OPEN SOURCE

MIT licensed. The source, the network-check script, and the test suite are all public:
https://github.com/code-sharad/stow

Stow is an independent project and is not affiliated with OneTab.
```

## Metadata

| Field | Chrome Web Store | Firefox AMO |
| --- | --- | --- |
| Category | Productivity | Tabs |
| Language | English | English |
| License | MIT | MIT |
| Privacy policy | `https://github.com/code-sharad/stow/blob/main/docs/PRIVACY.md` | same |
| Homepage | `https://code-sharad.github.io/stow/` | same |
| Support | repository issues | same |

## Screenshots (5, 1280×800)

1. The Library, three lists open, dark. Caption: **Every tab in the window, saved as a list.**
2. Search with three results across two lists. Caption: **Type half a title. Find it.**
3. The stow toast with Undo. Caption: **Nothing closes until it is saved.**
4. Import from OneTab with the preview counts. Caption: **Your old list still works.**
5. Settings → Data, showing local storage and optional backup. Caption: **Your data, in one place, on one machine.**

## Do not write

- No memory percentage unless it is measured, and then label it approximate.
- No "blocker", "AI", or "supercharge".
- No user counts or reviews you do not have.
