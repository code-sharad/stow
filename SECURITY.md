# Security policy

## Supported versions

Stow is an early preview. Security fixes are applied to the latest release on the `main` branch.

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |
| Earlier | No |

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

Report privately through GitHub Security Advisories:

https://github.com/code-sharad/stow/security/advisories/new

Include:

- the affected version and browser;
- a minimal reproduction and the impact;
- whether the issue requires a malicious page, a compromised extension, or local access;
- any suggested fix.

You can expect an acknowledgement within a few days. Please allow time for a fix and release
before public disclosure. Credit will be given unless you prefer to remain anonymous.

## Scope

Stow stores saved URLs, titles, settings, and backups in the browser profile. It has no server,
account, sync, telemetry, analytics, or host permissions, and it makes no network requests.

Relevant reports include:

- a path that sends library data over the network;
- a way to execute stored titles or URLs as HTML/script;
- an extension-origin permission or CSP bypass;
- a message that runs without the extension's own sender check;
- a backup/import path that writes outside the user's chosen destination.

Generic browser vulnerabilities, third-party dependency advisories without a reachable path, and
reports that require an already-compromised browser profile are usually out of scope.

## Safe harbor

We support good-faith security research. Do not access, modify, or exfiltrate other people's data,
and do not degrade the service. Test against your own browser profile.
