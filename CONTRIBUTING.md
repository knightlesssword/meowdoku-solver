# Contributing to Meowdoku Solver

Thanks for taking the time to improve the project. This guide covers local setup, the constraints that keep the app maintainable, and the checks expected before a pull request.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Security issues should follow [SECURITY.md](SECURITY.md), not the public issue tracker.

## Before you start

- Read the [README](README.md) for the product rules and current limitations.
- Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) before changing state, solver, persistence, or rendering behaviour.
- Search existing issues and pull requests before opening a new one.
- For a large change, open an issue first so the approach can be discussed.

## Local setup

There is no package manager, build step, or generated output.

1. Fork the repository and clone your fork.
2. Create a branch from `main`:

   ```powershell
   git switch -c feat/short-description
   ```

3. Open `index.html` directly, or serve the repository root:

   ```powershell
   python -m http.server 8765 --bind 127.0.0.1
   ```

4. Open <http://127.0.0.1:8765/>.

A local server is recommended because browser storage and some platform features behave differently on `file://` pages.

## Project constraints

The application intentionally stays small and dependency-free.

- Keep the three primary files: `index.html`, `css/style.css`, and `js/app.js`. Do not introduce a framework, bundler, package manifest, backend, or runtime dependency without a documented reason and maintainer agreement.
- Keep runtime paths relative so the app works from a repository subpath on GitHub Pages and, where the browser permits, from `file://`.
- Do not add analytics, telemetry, remote fonts, external scripts, or runtime network requests.
- Preserve the twelve palette colours, their order, and their stored indices.
- Preserve the puzzle rules: one cat per colour, row, and column; cats never touch in eight directions; each used colour is one orthogonally connected region. There is **no maximum region size**.
- Preserve the legacy data contract: accept schema versions 1 and 2, ignore the retired `maxRegion` field, omit it from new payloads, and keep named saves under `cat-solver:`.
- Keep the autosave key separate from named saves. Autosave must run before Validate and Solve analysis, must not block either operation when storage fails, and must never overwrite a named save.
- Keep the fixed `Meowdoku Solver` title, the Paint / Erase / Cat modes, and the 6 / 4 / 3 palette grid.
- Use the supplied branding files in `assets/branding/`; do not create duplicate placeholder logos.

## Code conventions

- Use two-space indentation, semicolons, and double-quoted strings in JavaScript, matching the existing source.
- Keep the logical section comments in `js/app.js` and add comments for invariants or non-obvious algorithmic decisions, not for trivial assignments.
- Prefer `textContent` and DOM construction for user-controlled or imported values. Do not add new `innerHTML` sinks for untrusted data.
- Keep HTML semantic and accessible: labels, button types, dialog semantics, focus handling, live-region behaviour, and keyboard paths matter.
- Put presentation in CSS. Avoid inline event handlers and normal-layout `style` attributes.
- Preserve the existing storage keys and payload compatibility unless the change is explicitly a migration with tests.
- Avoid unrelated formatting churn. A focused diff is easier to review and safer to ship.

## Testing

There is no committed test runner. The browser and accessibility harness used for the recorded evidence lives outside the repository; see [`docs/TESTING.md`](docs/TESTING.md) for the exact environment and results.

Before opening a pull request, run at least:

```powershell
node --check js/app.js
git diff --check
```

Then exercise the affected behaviour in a browser. Depending on the change, this includes:

- **Board and palette:** sizes 4 × 4 through 10 × 10, paint and erase dragging, cats, Undo/Redo, resize and clear confirmations, 12 colours, 6 / 4 / 3 palette columns, no bottom erase swatch.
- **Rules and diagnostics:** disconnected regions, diagonal-only contact, unpainted cells, cats on unpainted cells, row/column/colour conflicts, touching cats, and a connected region larger than the old default cap.
- **Solver:** unique, multiple-solution, no-solution, capped, and inconclusive cases; manual-cat constraints; candidate overlays; forced steps only after a complete search.
- **Persistence:** named saves, overwrite confirmation, autosave before Validate and Solve, empty-board invalidation, startup Restore/Start fresh, malformed autosave, blocked storage, legacy `maxRegion`, and rejected imports leaving the board unchanged.
- **UI:** dark and light themes; 1281 px, 768 px, and 390 px widths; no horizontal overflow; dialog focus, Escape, focus restoration, keyboard scrolling, and reduced motion.

If you use a temporary test harness, do not commit its dependency tree or generated artifacts. Record the command, browser version, and result in the pull request. Do not claim a check passed unless you ran it.

## Issues

Use the issue templates when they fit. A useful bug report includes:

- a short description and expected versus actual behaviour;
- exact reproduction steps;
- browser, operating system, viewport, theme, and board size;
- relevant console output or a screenshot;
- an exported JSON puzzle only when it contains no private information.

Do not paste tokens, passwords, private browser data, or personal information into an issue.

## Pull requests

- Keep one pull request focused on one logical change.
- Link the related issue when one exists.
- Describe the behaviour change, the approach, and any compatibility or rollback concerns.
- Include the tests you actually ran. Add screenshots for visible UI changes when useful.
- Update `README.md`, `CHANGELOG.md`, and the relevant `docs/` file when behaviour, data format, security posture, or deployment changes.
- Confirm that no secrets, personal data, generated test output, or unrelated files are included.
- Do not edit or force-push the generated `gh-pages` branch. Deployment is maintainer-owned.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) with an imperative, concise subject:

```text
feat(solver): report capped searches as provisional
fix(persistence): remove stale autosave after a failed write
docs(readme): document local storage limits
```

Common types are `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `security`, `perf`, and `ci`. Add a scope when it clarifies the area. Explain non-obvious motivation in the body.

Do not rebase, amend, or force-push published history. Add follow-up commits instead. Maintainers may squash a pull request at merge time without rewriting `main` history.

## License

By contributing, you agree that your contribution is licensed under the project's [MIT License](LICENSE).
