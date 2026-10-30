# Meowdoku Solver - Project Memory

This file records stable project facts and explicit user decisions. It is not a substitute for reading the actual source code. When source behaviour conflicts with this file, inspect the source and report the discrepancy instead of guessing.

## Identity and hosting

- Project: **Meowdoku Solver** (`meowdoku-solver`).
- GitHub: `knightlesssword/meowdoku-solver`.
- Remote: `https://github.com/knightlesssword/meowdoku-solver`.
- Development branch: `main`.
- Deployment branch: `gh-pages`.
- Pages URL: `https://knightlesssword.github.io/meowdoku-solver/`.
- License: MIT, copyright `knightlesssword`, year 2026.
- `main` is canonical. `gh-pages` is an automatically generated deployment snapshot, not a second development branch.

## Technology and architectural decisions

- Dependency-free static web application.
- Vanilla HTML, CSS, and JavaScript.
- No framework, npm package manifest, bundler, build process, backend, analytics, or runtime network dependency.
- Primary files: `index.html`, `css/style.css`, `js/app.js`.
- Keep one primary JS file unless there is a demonstrated maintenance or technical reason to introduce additional native browser-compatible files.
- The app should be usable by opening `index.html` locally where browser security permits and must work from GitHub Pages.

## Latest known application baseline

The latest supplied revision is approximately 4,782 lines in one HTML file. It is substantially more developed than the original prototype. Known elements include:

- responsive puzzle workspace and custom CSS design tokens;
- dark theme default and a fully designed light theme;
- 4x4 through 10x10 boards;
- twelve indexed paint colours;
- Paint, Erase, and Cat modes;
- pointer/drag interaction and keyboard grid navigation;
- row/column rulers;
- connected-component validation;
- manual cat constraints;
- diagnostics, solver results, candidate locations, forced deductions;
- search cap of 20,000 solutions and a time cap of 3 seconds in the supplied revision;
- undo/redo and bounded activity history;
- custom dialogs and toasts;
- local named puzzle saves and JSON import/export;
- local theme persistence.

Verify the actual repository source and current constants before relying on any of these values. Do not assume this list is a complete feature inventory.

## Explicit product decisions

1. Remove maximum region size entirely. Preserve one orthogonally connected component per used colour. Do not limit the number of cells in that component.
2. Retain only the segmented Paint / Erase / Cat control. Remove the separate bottom `None - erase` button. The twelve colour indices must remain stable.
3. Palette: equal-width buttons in a responsive fixed-column grid. Target 6 columns desktop, 4 tablet, 3 mobile.
4. Remove the header context line showing board dimensions and puzzle name. Retain the puzzle-name field for named saves. Fixed browser title: `Meowdoku Solver`.
5. Reduce redundant UI information without removing actionable diagnostics or accessibility content.
6. Autosave before Validate and Solve processing, using a separate storage key. Preserve named saves.
7. Add a recovery choice at startup for valid non-empty autosave data.
8. Preserve legacy puzzle data containing `maxRegion` by accepting and ignoring that field.
9. Use user-supplied SVG logo exports from the Figma design. Inspect before integration.
10. Preserve Git history. No rebase, no force-push.
11. Use separate logical commits and conventional commit messages.
12. Publish by automatically deploying from `main` to `gh-pages`.

## Branding references

Figma file: https://www.figma.com/design/JzBKBmu4Ey5kRYBJSYpZ93

The file contains editable logo artwork: a horizontal lockup and a standalone app icon. The user intends to export SVG assets and add them to the repository. Expected paths only if the files are actually supplied:

- `assets/branding/meowdoku-logo.svg`
- `assets/branding/meowdoku-icon.svg`

The screenshots shared by the user are visual references for the game's warm cat-themed identity and gameplay. They are not automatically repository assets. Do not invent or claim screenshots exist.

## Existing local storage compatibility

The supplied implementation uses:

- `cat-solver:` prefix for named puzzle saves;
- `cat-solver-theme` for theme preference.

Verify the source. Preserve these keys unless migration is proven necessary. Autosave must use a separate dedicated key, proposed as `meowdoku:autosave:v1`.

## Git and agent policy

- One orchestrator owns source integration, Git operations, commits, pushes, and deployment.
- Agents may independently inspect and report. Documentation authors may write only within an assigned documentation scope after behaviour is verified.
- Never allow simultaneous edits to the same file.
- Preserve unrelated and uncommitted work.
- Report blockers rather than taking unsafe shortcuts.

## Memory maintenance

Update this file only when a durable decision or verified project fact changes. Keep temporary task progress, test output, findings, and commit IDs in `docs/IMPLEMENTATION_REPORT.md` or `docs/QUALITY_AUDIT.md`, not as permanent memory.
