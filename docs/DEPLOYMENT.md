# Meowdoku Solver - Deployment

- **Document date:** 2026-10-30.
- **Target:** GitHub Pages at <https://knightlesssword.github.io/meowdoku-solver/>.
- **Source of truth:** `main`.
- **Published branch:** `gh-pages`, repository root (`/`).

## Current status

Deployment is **not yet verified**. This document records the required topology and the checks that the release phase must complete.

| Item | Status on 2026-10-30 |
|---|---|
| Deployment workflow | Not created. `.github/` contains only issue and pull-request templates. |
| Workflow run | Not run. |
| `gh-pages` branch | Does not exist locally or remotely yet. |
| GitHub Pages settings | Not configured or verified. |
| Public URL | Not verified. The URL above is the intended target, not a claim that the site is live. |
| Smoke test on the public site | Not performed. |

The release phase must update this table after each item is actually verified. Do not mark Pages as enabled merely because a workflow file exists.

## Topology

```text
main (development source)
  │
  ├── index.html
  ├── css/
  ├── js/
  ├── assets/branding/
  └── ... repository files

        deployment workflow
                │
                ▼
gh-pages (generated deployment snapshot, root)
  ├── index.html
  ├── css/style.css
  ├── js/app.js
  └── assets/branding/app-icon.svg

GitHub Pages serves gh-pages / (root)
                │
                ▼
https://knightlesssword.github.io/meowdoku-solver/
```

`main` is the only development branch. `gh-pages` is generated output. Never edit application source directly on `gh-pages`, and never force-push or orphan-replace its history.

## Runtime artifact

Deploy only what the browser needs:

```text
index.html
css/style.css
js/app.js
assets/branding/app-icon.svg
```

`assets/branding/logo-horizontal.svg` is documentation and brand artwork, not a runtime dependency. It may be copied as a small brand asset if desired, but it is not required for the application to work.

Do **not** deploy:

- `docs/` (including architecture, audit, testing, and internal implementation notes);
- `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`;
- `.github/`, `.gitignore`, `.editorconfig`;
- `assets/screenshots/` (README-only);
- test harnesses, local reports, logs, or generated noise.

The app uses relative paths, so it works from the repository subpath without a base-path rewrite.

## Required workflow behaviour

The release phase creates `.github/workflows/deploy-pages.yml` after reviewing the current GitHub Actions documentation and the repository's Pages settings.

The workflow must:

1. Run on pushes to `main` and support `workflow_dispatch`.
2. Validate the runtime files and JavaScript syntax before publishing:
   - `index.html`, `css/style.css`, and `js/app.js` exist;
   - `node --check js/app.js` exits successfully;
   - required branding assets exist;
   - the artifact contains no documentation or test files.
3. Publish only the runtime artifact.
4. Use least-privilege permissions. Read access is enough for validation; write access is limited to the job that updates `gh-pages`.
5. Use a concurrency group to prevent racing deployments.
6. Pin third-party actions to reviewed, immutable commit SHAs. Do not use floating `@vN` tags. Do not invent SHAs.
7. Avoid printing credentials or tokens.
8. Avoid recursive deployments: only `main` pushes trigger the workflow, not `gh-pages` updates.
9. Update `gh-pages` without `git push --force`, `--force-with-lease`, history rewriting, or destructive orphan replacement.
10. Preserve the existing `gh-pages` history. Inspect the branch before changing it.

A dependency-free shell implementation using normal Git commands is acceptable and avoids trusting a third-party deployment action. If a deployment action is used instead, verify from its documentation and source that it does not force-rewrite the branch.

### Suggested job shape

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  validate:
    # checkout, verify runtime files, node --check, stage artifact
  deploy:
    needs: validate
    # update gh-pages with ordinary commits, then push normally
```

This is a shape, not a final workflow. The release phase must fill in reviewed action SHAs and the exact safe branch-update commands.

## GitHub Pages settings

If the GitHub API, CLI, or repository permissions cannot configure Pages, use these manual steps:

1. Open the repository **Settings**.
2. Open **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `gh-pages` branch.
5. Select `/ (root)`.
6. Save and wait for the Pages deployment to complete.

Do not claim Pages is enabled until the settings show the branch and the public URL serves the app.

## Verification checklist

Run these checks after the first deployment and after any workflow change.

### Workflow and branch

- [ ] The workflow run completed successfully.
- [ ] The run used the expected commit SHA from `main`.
- [ ] `gh-pages` contains the new commit.
- [ ] `gh-pages` still contains its prior history; no force-push or orphan replacement occurred.
- [ ] The artifact contains only runtime files.
- [ ] No documentation, test harness, secret, or local path is present in the artifact.

### Public site

- [ ] <https://knightlesssword.github.io/meowdoku-solver/> returns the app, not a 404.
- [ ] `index.html`, `css/style.css`, `js/app.js`, and `assets/branding/app-icon.svg` return HTTP 200.
- [ ] The SVG is served as `image/svg+xml`.
- [ ] The page uses the GitHub Pages origin, not a local file path.
- [ ] The browser console has no page or console errors.
- [ ] The favicon and header icon load.

### Application smoke test

- [ ] The app initializes with an empty 8 × 8 board.
- [ ] Paint, Erase, and Cat modes work.
- [ ] Validate writes the autosave and shows diagnostics.
- [ ] Solve returns a result and the candidate overlay works.
- [ ] A named save survives a reload on the same origin.
- [ ] Export downloads JSON and import accepts it.
- [ ] Dark and light themes work.
- [ ] A narrow viewport has no horizontal overflow.
- [ ] The help dialog opens, traps focus, closes on Escape, and restores focus.

Record each state separately: workflow created, workflow run passed, `gh-pages` pushed, Pages settings configured, public site accessible, and app smoke test passed. These are not interchangeable.

## Rollback

- If a deployment is bad, fix or revert the offending commit on `main`, then let the workflow deploy again.
- If a workflow change is the problem, revert that workflow commit and run the corrected workflow.
- Do not force-push `gh-pages`. Add a new deployment commit that restores the previous runtime files.
- If Pages itself is misconfigured, correct the branch/root setting in **Settings → Pages** and redeploy.
- If the site is serving a stale asset, check the workflow run and Pages deployment status before changing code; GitHub Pages can cache for a short period.

## Troubleshooting

| Symptom | Likely cause | Check |
|---|---|---|
| Public URL returns 404 | Pages not configured, wrong branch, or no successful deployment | Settings → Pages; latest workflow run; `gh-pages` contents |
| HTML loads but CSS/JS 404 | Artifact omitted files or used the wrong directory | Workflow artifact list; Network panel paths |
| Icon or favicon 404 | `assets/branding/app-icon.svg` not copied | Artifact contents; relative path from `index.html` |
| Workflow cannot push | Token permissions or branch protection | Job `permissions`; branch rules; workflow log |
| Workflow loops | `gh-pages` push also triggers the workflow | Trigger limited to `main` |
| Deployment rewrites history | A deployment action force-pushes by default | Action documentation/source; `git log` on `gh-pages` |
| Saved puzzles missing on the live site | Different origin from local testing | `localStorage` is origin-bound; expected |

## Security notes

- Never put secrets, tokens, private keys, or personal data in the workflow or artifact.
- Do not deploy arbitrary pull-request code with write permissions.
- Do not use `pull_request_target` to build and publish untrusted code.
- Pin actions to reviewed commit SHAs and record why each action is needed.
- Keep `pages: write` and `id-token: write` scoped to the deployment job if the chosen publishing mechanism needs them; otherwise omit them.
- Only `main` should publish. A `gh-pages` update must not trigger another deployment.
- Never force-push deployment output.

See [`QUALITY_AUDIT.md`](QUALITY_AUDIT.md) for the deferred workflow-security finding (D-01) and [`ARCHITECTURE.md`](ARCHITECTURE.md) for the application's runtime assumptions.
