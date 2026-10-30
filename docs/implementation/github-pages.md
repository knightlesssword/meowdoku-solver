# GitHub Pages - Deployment Workflow Requirements

## Fixed deployment topology

- Source repository: `knightlesssword/meowdoku-solver`.
- Source branch: `main`.
- Published branch: `gh-pages`.
- Published directory: repository root (`/`).
- Public URL: `https://knightlesssword.github.io/meowdoku-solver/`.

`main` is the sole development source of truth. `gh-pages` is generated output only. Never edit application source directly on `gh-pages`.

## Workflow file

Create `.github/workflows/deploy-pages.yml` after inspecting the existing repository workflows and GitHub Pages configuration.

The workflow must:
- run on pushes to `main` and support `workflow_dispatch`;
- validate `index.html`, `css/style.css`, `js/app.js`, favicon/logo assets that are genuinely required, and JavaScript syntax before publishing;
- deploy only the static site files and required assets, not development documentation, source prompts, tests, or unrelated repository files;
- use least-privilege token permissions;
- use concurrency to prevent racing deployments;
- pin third-party actions to reviewed immutable commit SHAs;
- avoid exposing credentials in logs;
- avoid recursive deployment loops caused by its own `gh-pages` update;
- preserve `gh-pages` history and push normally without force-push.

Before choosing an action, inspect maintained GitHub Actions documentation and the action's current official documentation/release. Do not assume a floating `@vN` tag is acceptable when this project explicitly requires immutable reviewed SHAs. Do not invent SHAs. Record why each action is used and which permissions it needs.

## Safe branch update

Do not use `git push --force`, `--force-with-lease`, history rewriting, or a destructive orphan-branch replacement. Inspect the current `gh-pages` branch first. Design deployment so new generated contents are committed on top of existing deployment history and pushed normally. If this cannot be done safely with the chosen publishing mechanism, stop and explain the constraint rather than weakening branch safety.

A deployment action may use its own documented update mechanism, but it must be verified not to force-rewrite the existing branch. If the only available deployment pattern would rewrite the branch, choose an alternate safe method or report the blocker.

## GitHub Pages settings

Configure Pages to publish from `gh-pages` at `/`. If the GitHub API/CLI or repository permissions cannot configure it, provide exact manual steps:
1. Open repository Settings.
2. Open Pages.
3. Select deploy from a branch.
4. Select `gh-pages`.
5. Select `/ (root)`.
6. Save and wait for the Pages deployment to complete.

Do not claim Pages is enabled because the workflow YAML exists.

## Validation

After pushing to `main`:
- inspect the workflow run and exact commit SHA deployed;
- verify `gh-pages` updated and still has its prior history;
- verify the deployed files and their relative paths;
- visit the public URL;
- verify HTML, CSS, JS, favicon, and brand assets load;
- exercise the application in browser where possible;
- inspect the browser console for errors.

Report separately: workflow created, workflow run passed, `gh-pages` pushed, Pages settings configured, public site accessible, and actual app smoke test passed. These are distinct states.
