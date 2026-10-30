# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 1.x (initial release and current `main`) | Yes |
| Older or unlisted versions | No |

Only the latest code on `main` and the latest deployed site are intended to receive security fixes. This project is a static, local-first application with no backend and no hosted user accounts.

## Reporting a vulnerability

Please **do not** open a public issue for a suspected security vulnerability.

Private vulnerability reporting is enabled for this repository. Use [Report a vulnerability](https://github.com/knightlesssword/meowdoku-solver/security/advisories/new), or open the repository's **Security** tab and choose the same option.

If private reporting is unavailable, contact the maintainer through the contact options on the [knightlesssword GitHub profile](https://github.com/knightlesssword) and ask for a private channel. Do not include exploit details until a private channel is confirmed.

Include as much of the following as you can:

- the affected file, function, version, or commit;
- browser and operating system;
- prerequisites and step-by-step reproduction;
- observed impact and what data or behaviour is at risk;
- a proof of concept, if safe to share privately;
- any suggested remediation;
- whether the issue is already public.

Reports are handled on a best-effort basis. No response time, bounty, or disclosure deadline is guaranteed. Please allow time for investigation and a fix before publishing details.

## Scope

In scope:

- the application source in `index.html`, `css/style.css`, and `js/app.js`;
- import, save, autosave, and export validation;
- browser `localStorage` handling and startup recovery;
- DOM rendering of puzzle names, saved labels, diagnostics, and solver output;
- supplied SVG assets and local file paths;
- solver resource exhaustion and capped-search integrity;
- the GitHub Actions deployment workflow and repository configuration once present.

Out of scope:

- vulnerabilities in the browser, operating system, GitHub, or other third-party services;
- social engineering and physical access attacks;
- reports that require unrealistic resources or a compromised local machine;
- missing security headers or policies that are already documented as accepted residual risk;
- issues in tools that are not shipped in the application.

The current security posture, accepted risks, and deferred checks are documented in [`docs/QUALITY_AUDIT.md`](docs/QUALITY_AUDIT.md). This project does not claim a security certification, complete protection, or WCAG conformance.

## Security-relevant design notes

- The app has no backend, accounts, analytics, telemetry, remote fonts, or runtime network dependency.
- Puzzle names, imported JSON, saved values, and recovered autosaves pass through a shared validator before use.
- User-controlled text is rendered as text, not inserted as executable markup.
- JSON imports are capped at 5 MB; malformed or invalid data is rejected without changing the active board.
- `localStorage` is unencrypted and clearable. It is not a confidential store or a backup. Export important puzzles.
- The solver is capped at 20,000 solutions or about 3 seconds. Capped searches do not produce uniqueness or forced-placement claims.
- Deployment must use least-privilege permissions, reviewed action pins, and a non-force-push update of `gh-pages`.

## Good-faith research

Please act in good faith: do not access other users' data, degrade service, or test against systems you do not own or have permission to test. Keep findings private until a fix or coordinated disclosure is agreed.
