# Stow privacy policy

Stow stores the tabs you choose to save in your browser's local extension storage. Lists, tabs,
trash, and pending restore state live in IndexedDB; settings and the backup schedule live in
`chrome.storage.local`. It does not transmit titles, URLs, settings, favicons, or usage data
anywhere.

- **No network requests.** The extension has no host permissions and its content security policy
  blocks remote scripts. A favicon is stored with the tab when it is stowed: Chromium exposes its
  on-device `_favicon` cache, and Firefox supplies `tab.favIconUrl`. Both are kept as data URLs in
  IndexedDB; when neither is available, Stow draws a letter tile. No icon is ever fetched.
- **No telemetry or analytics.** No identifiers, crash reports, or usage counters are collected.
- **No accounts.** There is no sign-in, sync service, or server operated by Stow.
- **Downloads.** If you enable scheduled backups, Stow asks for the optional `downloads`
  permission and writes JSON backups to your Downloads folder. Manual export also writes a local
  file. Nothing is uploaded.
- **Removal.** Uninstalling Stow removes its extension storage. Export a backup first if you want
  to keep your library.

Contact the maintainer of the distribution you installed for privacy questions, or open an issue
at https://github.com/code-sharad/stow/issues. This policy describes the extension as built from
this repository.
