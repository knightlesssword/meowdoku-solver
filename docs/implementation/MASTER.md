# Meowdoku Solver - Master Execution Instructions

> Entry point for the OpenCode implementation session. Read this file first. Do not execute every phase in one giant pass.

## Mission

Transform the existing cat placement puzzle application into **Meowdoku Solver**, a maintainable, documented, security-reviewed, dependency-free static web application. Preserve the existing solver and working features while implementing the requested product corrections, splitting the current single HTML file into HTML/CSS/JS, integrating the supplied Figma branding assets, and publishing to GitHub Pages.

This is an execution task, not a proposal. Work in the existing repository. Inspect first, then execute the phases in `plan.md` in order, verifying each phase before moving on.

## Fixed project decisions

| Setting | Decision |
|---|---|
| GitHub repository | `https://github.com/knightlesssword/meowdoku-solver` |
| Canonical source branch | `main` |
| Deployment branch | `gh-pages` |
| Public URL | `https://knightlesssword.github.io/meowdoku-solver/` |
| License | MIT |
| Application | Vanilla HTML, CSS, and JavaScript |
| Runtime dependencies | None |
| Build system | None |
| Primary application files | `index.html`, `css/style.css`, `js/app.js` |
| Local data | Browser localStorage, no server-side puzzle storage |

`main` is the sole development source of truth. `gh-pages` is a generated deployment snapshot. A successful deployment from `main` must update the deployment branch without force-pushing or rewriting its history.

## Read order

1. `memory.md` - stable project facts and decisions.
2. `plan.md` - phase order, gates, and expected outputs.
3. `agents.md` - safe delegation and file ownership.
4. `skills.md` - how to discover and use available OpenCode capabilities.
5. Read the phase prompt for the current phase only.
6. Read supporting references when the phase requires them: `security.md`, `design.md`, `brand.md`, `architecture.md`, `testing.md`, and `github-pages.md`.

Do not paste every file into every agent's context. Give each agent the master rules plus only the relevant task file and supporting reference.

## Non-negotiable repository safety

- Preserve the existing Git repository, commit history, tags, and remote configuration unless a verified correction is required.
- Never rebase, force-push, reset away user changes, amend unrelated historical commits, or squash existing history.
- Never discard or overwrite unrelated uncommitted work.
- Inspect `git status`, branches, remotes, and recent history before any modification.
- Do not initialize a new repository over the existing one.
- Before each commit, inspect the staged diff and ensure it contains only the intended logical change.
- Push normally. If remote history diverges, inspect and reconcile with a safe fast-forward or merge. Never force-push.
- Do not publish secrets, tokens, local environment files, browser data, or unrelated files.
- The primary orchestrator alone owns Git branch changes, commits, pushes, and deployment.

## Existing application preservation

The current revised source is a substantial single HTML file (approximately 4,782 lines in the supplied revision), not the earlier small prototype. It already includes a developed design system, dark/light themes, a responsive workspace, grid keyboard navigation, twelve colours, three interaction modes, diagnostics, a solver with search limits, candidate and forced-step panels, undo/redo, history, dialogs, toasts, local named saves, JSON import/export, and theme persistence.

Do not rebuild from scratch. First compare the repository's actual source with the latest supplied revision. Confirm that the newer implementation is present or safely establish which source is authoritative. Never silently replace a newer local file with an older committed version.

## Product corrections that must be implemented

1. Remove the **maximum region size** feature and all active enforcement. Connected-component validation remains mandatory: all cells of each used colour must form exactly one orthogonally connected region. There is no region-area limit. Old saved/imported JSON may include `maxRegion`; accept otherwise-valid legacy data and ignore that obsolete field. Omit it from new saves and exports.
2. Remove the separate bottom-of-palette `None - erase` button. Retain the segmented Paint / Erase / Cat mode control. Erasing must continue to erase paint and any cat, and switching back to Paint must retain the previously selected colour. The palette contains exactly twelve real colours, not a fake `none` colour.
3. Make all twelve colour buttons equal-width using a deliberate responsive CSS grid. Target six columns on wide desktop, four on medium/tablet, and three on narrow/mobile. Keep equal button heights, consistent spacing, readable labels, and no overflow.
4. Remove the header context line such as `8 × 8 · Untitled puzzle`, its DOM reference, and now-unused update logic. Keep the puzzle-name field for named saves. Use a fixed document title: `Meowdoku Solver`.
5. Audit redundant information. Remove duplicate visual presentation where useful, especially repeated painted-cell counts and repeated active-mode/colour descriptions. Do not remove useful diagnostics, rules, accessibility text, or actionable feedback just to reduce density.
6. Implement automatic board saving immediately when Validate or Solve is pressed, before analysis/search and before any early return. Use a dedicated autosave key, separate from manually named `cat-solver:` saves. Autosave must not prompt, overwrite named saves, pollute history, or block validation/search if storage fails. Offer a startup recovery dialog for a valid non-empty autosave, with Restore and Start fresh actions. Clear/dismiss stale autosave when the user chooses fresh; remove a stale autosave if validation/solve is invoked on an empty board. Validate the autosave through the same defensive data-validation path as imports.
7. Integrate the user-supplied Figma logo SVGs after inspecting them. The user will add the exported assets to the repository. Do not invent paths, create duplicate assets, or overwrite supplied files.

## Architecture decision

Split the single HTML app into exactly three **primary** application files:

- `index.html`
- `css/style.css`
- `js/app.js`

Keep the app dependency-free, without npm, a bundler, framework, or backend. Keep one main JavaScript file unless repository evidence demonstrates that splitting it further is materially necessary. Preserve local-file usability where browser security permits and ensure GitHub Pages uses correct relative paths. A small theme bootstrap in the HTML is allowed only if necessary to prevent theme flash and must be separately justified and reviewed.

## Execution workflow

Follow `plan.md`. At the start of each phase:

1. Read the relevant phase file and referenced supporting documents.
2. State the phase's goal, files it may modify, and validation gate internally or in the task report.
3. Delegate independent read-only work where useful.
4. Make changes with a single source-code owner.
5. Run the required tests/checks.
6. Inspect the diff.
7. Commit a completed logical unit using Conventional Commits, unless the phase specifies that commits are deferred until an integration gate.
8. Update the implementation memory/report with facts, not guesses.

Avoid unnecessary micro-commits. Prefer one coherent commit per meaningful logical change. Do not commit an incomplete or failing state merely to satisfy a phase count. If a phase cannot pass, record the blocker and continue only with independent safe work.

## Final acceptance

The task is complete only when:

- the application is split into the agreed three primary files;
- all seven product corrections above are implemented and regression-tested;
- all existing intended solver and editing functionality is preserved;
- the maximum-region limit is absent from current logic while legacy data remains importable;
- the logo assets provided by the user are safely integrated;
- security, accessibility, UI, and code-quality audits are complete;
- project documentation and repository templates exist and are accurate;
- Git history is preserved and no rebase/force-push occurred;
- changes are committed and pushed to `main`;
- a GitHub Actions deployment updates `gh-pages` safely;
- the public URL is verified against the deployed application.

Do not claim a test, push, Pages configuration, or deployment succeeded unless you verified it. If GitHub permissions or repository settings prevent completion, state the exact blocker and provide the remaining manual steps.
