# Meowdoku Solver - Deployment

- **Document date:** 2026-10-30.
- **Status:** live and verified on 2026-10-30.
- **Target:** GitHub Pages at <https://knightlesssword.github.io/meowdoku-solver/>.
- **Source of truth:** `main`.
- **Published branch:** `gh-pages`, repository root (`/`).

## Current status

| Item | Status on 2026-10-30 |
|---|---|
| Deployment workflow | `.github/workflows/deploy-pages.yml`, committed as `6cb94a4`. |
| Workflow run | Initial push run `41068060948` succeeded for `6cb94a4`. Manual `workflow_dispatch` run `41068782251` and docs-only pushes also succeeded. The cat-icon fix deployed in run `41073235011` for `4c69130`. |
| `gh-pages` branch | Two commits: initial deployment `7f3fc83` and cat-icon fix `0a57cf3`. The second commit has the first as its parent. |
| GitHub Pages settings | Source `gh-pages`, path `/`, build type `legacy`; latest Pages build `1327376367` completed with status `built`. |
| Public URL | HTTP 200 at <https://knightlesssword.github.io/meowdoku-solver/>. |
| Runtime assets | `index.html`, `css/style.css`, `js/app.js`, `assets/branding/app-icon.svg`, and `.nojekyll` all returned HTTP 200 with the expected content types. |
| Artifact isolation | `/docs/`, `/README.md`, and `/.github/` returned HTTP 404; only the five intended files are deployed. |
| Smoke test on the public site | Passed: import, unique-solution solve, candidate overlay, forced-step controls, theme switch, mobile width, named save/load, export, and help dialog. No page or console errors; all five requests were same-origin. |
| Cat-icon layout fix | Passed on the live site at 4 × 4 through 10 × 10 on desktop and mobile: the board stayed square, every cell in a board matched its row/column size, the cat icon stayed absolute and inside its cell, and no horizontal overflow appeared. |

The manual `workflow_dispatch` run was intentionally a no-op because the runtime artifact had not changed. It fetched the existing `gh-pages` branch and exited without adding a commit, confirming the update path does not rewrite history when there is nothing to publish. The later cat-icon fix did produce a normal second deployment commit, confirming the append path on the live branch.

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
  ├── .nojekyll
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
.nojekyll
index.html
css/style.css
js/app.js
assets/branding/app-icon.svg
```

`.nojekyll` is an empty Pages control file that keeps the static tree from being processed as a Jekyll site.

`assets/branding/logo-horizontal.svg` is documentation and brand artwork, not a runtime dependency. It may be copied as a small brand asset if desired, but it is not required for the application to work.

Do **not** deploy:

- `docs/` (including architecture, audit, testing, and internal implementation notes);
- `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`;
- `.github/`, `.gitignore`, `.editorconfig`;
- `assets/screenshots/` (README-only);
- test harnesses, local reports, logs, or generated noise.

The app uses relative paths, so it works from the repository subpath without a base-path rewrite.

## Implemented workflow

`.github/workflows/deploy-pages.yml` runs on pushes to `main` and on manual `workflow_dispatch`. The job is guarded with `github.ref == 'refs/heads/main'`, so a dispatch from another branch cannot publish.

### Triggers and permissions

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: pages
  cancel-in-progress: false
```

- Only `contents: write` is granted. The job needs it to append a commit to `gh-pages`; no `pages: write`, `id-token: write`, or unrelated scopes are requested.
- The workflow is limited to `main`, so a `gh-pages` push cannot recursively trigger it.
- The concurrency group serializes Pages deployments. `cancel-in-progress` is false so a release is not cancelled halfway through.
- No secrets are configured or printed. The built-in `GITHUB_TOKEN` is used through the checked-out repository's persisted credentials.

### Action pin

| Action | Version | Commit SHA | Why |
|---|---|---|---|
| `actions/checkout` | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` | Fetches the source and provides authenticated Git commands. |

The SHA was resolved from the official `actions/checkout` v7.0.1 release and verified through the GitHub API before use. The workflow does not use a floating `@v7` tag. No third-party deployment action is used.

### Steps

1. **Check out main.** `fetch-depth: 0` makes full history available; `persist-credentials: true` lets the publish step push with the job token.
2. **Validate runtime files.** The step checks for `index.html`, `css/style.css`, `js/app.js`, and `assets/branding/app-icon.svg`, then runs `node --check js/app.js`.
3. **Stage static artifact.** It copies only the four runtime files, adds an empty `.nojekyll`, prints the file list, and asserts exactly five files. Documentation, screenshots, templates, tests, and internal notes are never staged.
4. **Publish `gh-pages`.** The step:
   - removes and prunes any stale worktree;
   - fetches `origin/gh-pages` if it exists and creates a detached worktree from it;
   - creates an orphan `gh-pages` only when the branch does not exist yet;
   - clears the worktree contents, copies the staged artifact, and commits;
   - exits successfully without a commit when the artifact is unchanged;
   - pushes with ordinary `git push origin HEAD:gh-pages`.
5. **Summarize.** The job summary records the published SHA and the public URL.

The publish step never uses `--force`, `--force-with-lease`, `git reset`, or a destructive orphan replacement of an existing branch. A local simulation of the same shell logic produced a first commit and then a second commit whose parent was the first; the real workflow's first run and no-op dispatch both succeeded.

## GitHub Pages settings

Pages was configured through the GitHub API on 2026-10-30 with:

- source branch `gh-pages`;
- source path `/`;
- build type `legacy`;
- HTTPS enforced;
- Pages status `built`.

If the repository is recreated or the setting is lost, use these manual steps:

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

- [x] The workflow runs completed successfully (`41068060948`, `41073235011`, plus docs-only no-ops).
- [x] The latest run used the expected commit SHA from `main` (`4c69130`).
- [x] `gh-pages` contains the deployment commits (`7f3fc83`, then `0a57cf3`).
- [x] The branch update is non-destructive: the workflow uses ordinary `git push`, and the live cat-icon deployment appended `0a57cf3` on top of `7f3fc83` with no force-push or orphan replacement.
- [x] The artifact contains only runtime files plus `.nojekyll`.
- [x] No documentation, test harness, secret, or local path is present in the artifact.

### Public site

- [x] <https://knightlesssword.github.io/meowdoku-solver/> returns the app, not a 404.
- [x] `index.html`, `css/style.css`, `js/app.js`, and `assets/branding/app-icon.svg` return HTTP 200.
- [x] The SVG is served as `image/svg+xml`.
- [x] The page uses the GitHub Pages origin, not a local file path.
- [x] The browser console has no page or console errors.
- [x] The favicon and header icon load.

### Application smoke test

- [x] The app initializes with an empty 8 × 8 board.
- [x] Paint, Erase, and Cat modes work on the live site.
- [x] Validate writes the autosave and shows diagnostics.
- [x] Solve returns a result and the candidate overlay works.
- [x] A named save survives a reload on the same origin.
- [x] Export downloads JSON and import accepts it.
- [x] Dark and light themes work.
- [x] A narrow 390 px viewport has no horizontal overflow and uses three palette columns.
- [x] The help dialog opens, closes on Escape, and restores focus. Focus containment was covered by the Phase 3 keyboard suite.

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
- The implemented branch-publishing workflow requests only `contents: write`. It does not request `pages: write` or `id-token: write`; if a future publishing mechanism needs them, scope them to the deployment job.
- Only `main` should publish. A `gh-pages` update must not trigger another deployment.
- Never force-push deployment output.
- Private vulnerability reporting is enabled for the repository; do not route security reports through deployment logs or public issues.

See [`QUALITY_AUDIT.md`](QUALITY_AUDIT.md) for the resolved workflow-security finding (D-01) and [`ARCHITECTURE.md`](ARCHITECTURE.md) for the application's runtime assumptions.
