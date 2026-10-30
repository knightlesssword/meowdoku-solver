# Phase 02 - Split HTML, CSS, and JavaScript

Read `MASTER.md`, `memory.md`, `architecture.md`, `testing.md`, and the Phase 00 baseline before editing.

## Goal

Extract the now-correct application into three primary files without changing behaviour.

## Target

```text
index.html
css/style.css
js/app.js
```

Keep the app dependency-free: no npm, package manifest, framework, bundler, build tooling, backend, or external runtime dependency.

## HTML

Move markup to root `index.html`. Keep semantic structure, metadata, favicon, accessible labels, skip link, dialogs, and application containers. Link `css/style.css`. Load `js/app.js` with `defer`. Use relative paths. Only retain a small independently justified theme bootstrap if necessary to prevent theme flash; audit it and avoid duplicated app logic.

## CSS

Move the full stylesheet to `css/style.css`. Preserve design tokens, dark/light theme, states, responsive layouts, accessibility, and reduced motion. Remove obsolete styles from Phase 01. Organize with section comments.

## JavaScript

Move all application logic to `js/app.js`. Keep one primary file. Organize into logical sections for constants, DOM, state, utilities, theme, modes/palette, board/rendering, editing/undo, validation, diagnostics, solver, candidates/forced steps, history, dialogs/toasts, serialization, storage/autosave, import/export, events, and startup.

Preserve initialization order, selectors/IDs, event semantics, localStorage compatibility, and solver invariants. No inline event attributes. Avoid accidental globals.

## Comments

Add comments describing module responsibilities and non-obvious algorithms/invariants: coordinate/index model, colour indexing, orthogonal vs eight-way neighbours, connected components, validation, backtracking, candidate generation, forced placement, search cap, undo snapshots, import validation, local saves, autosave lifecycle, and initialization. Use JSDoc where useful. Do not comment trivial assignments or write stale narration.

## Verification

- compare feature inventory to Phase 00;
- run JS syntax check if runtime exists;
- verify no application CSS/logic remains embedded (except justified theme bootstrap);
- verify correct relative links;
- open locally where browser permits;
- smoke-test all Phase 01 tests;
- verify GitHub Pages root layout (`index.html` at root).

## Gate

No feature regression. Review extracted source and diff. Commit the structural extraction separately from unrelated audit or branding changes.
