# Meowdoku Solver - Architecture

- **Status:** current implementation after Phase 4.
- **Scope:** the static application in `index.html`, `css/style.css`, and `js/app.js`, plus the assets and documentation around it.
- **Related documents:** [`README.md`](../README.md), [`TESTING.md`](TESTING.md), [`QUALITY_AUDIT.md`](QUALITY_AUDIT.md), [`BRAND.md`](BRAND.md), [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Design goals

Meowdoku Solver is a local-first puzzle workbench with a deliberately small runtime footprint.

- **No build step.** The browser loads the same files that are committed. There is no package manifest, bundler, transpiler, framework, backend, or runtime library.
- **Three primary application files.** Markup lives in `index.html`, presentation in `css/style.css`, and behaviour in `js/app.js`.
- **Relative paths.** The app must work from a GitHub Pages repository subpath and, where browser security permits, from `file://`.
- **Preserve user data.** Puzzle state is plain JSON with stable colour indices and a shared validator for imports, named saves, and autosaves.
- **Be honest about solver limits.** Capped searches are provisional; no uniqueness or forced-placement claim survives an incomplete search.
- **Degrade safely.** Blocked storage, malformed data, and solver failures must not corrupt the active board or prevent the rest of the UI from working.

## Runtime architecture

```text
index.html
├── document metadata, local favicon, theme bootstrap
├── inline SVG symbol sprite
├── header, workspace, sidebar, footer
├── dialogs, toast region, hidden file input
└── css/style.css + js/app.js (deferred, relative)
        │
        ├── CSS: tokens, themes, layout, components, responsive rules
        └── JS: state, rendering, editing, validation, solver, persistence
```

The page is a single document. The browser is the entire runtime: no service worker, network API, server process, or background worker is used.

### `index.html`

The document owns:

- **Metadata and shell.** Language, viewport, description, colour-scheme declaration, local SVG favicon, theme colour, title, stylesheet, and deferred script.
- **Theme bootstrap.** A small inline script reads `cat-solver-theme` and sets `data-theme` before first paint to avoid a flash. It is the only inline script and is intentionally defensive: storage access is wrapped in `try/catch`.
- **SVG sprite.** A hidden `<svg>` defines the interface icons as `<symbol>` elements. The app references them with same-document `<use href="#...">`; there are no external icon requests.
- **Semantic regions.** A skip link, `<header>`, `<main>`, `<section>`, `<aside>`, and `<footer>` provide the page landmarks and heading structure.
- **Workspace controls.** Board name, board size, Paint / Erase / Cat segmented control, rules line, board toolbar, board grid, palette, Undo/Redo/Validate, and Solve.
- **Sidebar.** Board diagnostics, next deduction, candidate locations, and deduction history.
- **Overlays.** One shared `<dialog>` for help, confirmations, save/load lists, and messages; a toast region; a hidden file input for JSON imports.

The board itself is an empty `role="grid"` container. `js/app.js` builds its rows and cells, so the DOM always matches the active board size.

### `css/style.css`

The stylesheet is organized around tokens and components:

- **Design tokens.** Dark is the default theme. `:root[data-theme="light"]` overrides the colour, surface, border, focus, and shadow tokens.
- **Layout.** `.app-shell` max-width, a two-column `.workspace` with a flexible stage and a sidebar, and a stacking breakpoint at 1120 px.
- **Components.** Header, status pill, buttons, segmented mode control, setup bar, board frame and rulers, palette, diagnostics, deduction cards, candidate lists, history, dialogs, toasts, footer.
- **Board cells.** Cat icons are absolutely positioned inside their cell and cells are allowed to shrink with `min-height: 0`, so an SVG without an intrinsic size cannot inflate a grid track or overlap later rows.
- **Responsive rules.** Additional breakpoints at 820 px, 720 px, and 430 px adjust the header, setup bar, palette (6 / 4 / 3 columns), board gaps, and typography.
- **Accessibility.** Visible `:focus-visible` outlines, a skip link, reduced-motion handling, and board sizing that keeps the grid usable at narrow widths.
- **Themes.** Colour is presentation only. Persisted puzzle data stores palette indices, never theme-specific colour strings.

### `js/app.js`

The script is one strict-mode IIFE. It is organized by responsibility rather than by artificial classes:

1. **Constants and configuration.** Palette, solver caps, history cap, storage keys.
2. **DOM references.** A `dom` map plus palette and mode button lists.
3. **State.** Board, cats, selection, mode, theme, candidate visibility, undo/redo, history, solver result, analysis cache, focus, drag state, and active dialog.
4. **Utilities.** Coordinates, colour names, pluralization, neighbours, board-content check, reduced-motion query, icon and chip helpers.
5. **Theme.** Apply, persist, and update the toggle.
6. **Dialogs and toasts.** A Promise-based shared dialog, focus restoration, confirmations, messages, help content.
7. **Palette and mode.** Build the twelve radio-like swatches, roving tabindex, arrow-key selection, and mode rendering.
8. **Board rendering.** Build the grid and rulers, roving tabindex, cell labels, cat/candidate/conflict states, and responsive metrics.
9. **Stats and status.** Painted cells, colours, manual cats, header state, action enablement.
10. **History and undo/redo.** Activity entries, bounded undo stacks, snapshots, and derived-state invalidation.
11. **Board interaction.** Pointer paint/erase/cat drag, click handling, keyboard navigation, focus, and conflict highlighting.
12. **Validation.** Flood-fill components and the pure `analyze()` pass.
13. **Solver.** `searchSolutions()` and the `solve()` orchestration.
14. **Solver panels.** Next deduction, candidate lists, step navigation, apply-step.
15. **Data validation and serialization.** `validatePuzzleData()`, `buildPuzzlePayload()`, and whole-board application.
16. **Persistence.** Named saves, storage errors, autosave, startup recovery.
17. **Import/export.** File size check, JSON parse, validation, confirmation, download.
18. **Bindings and startup.** File menu, keyboard shortcuts, event wiring, initialization.

The code preserves the original function semantics and initialization order: theme, palette, board, events, derived panels, history, then autosave recovery.

## State model

User-owned state is intentionally small:

| Name | Type | Meaning |
|---|---|---|
| `n` | integer | Board size, 4-10. |
| `cells` | array of integers | Row-major `n × n`; `-1` is unpainted, `0..11` is a palette index. |
| `cats` | `Set<number>` | Manual cat cell indices. |
| `selected` | integer | Active palette index. |
| `mode` | `"paint" \| "erase" \| "cat"` | Active interaction mode. |
| `theme` | `"dark" \| "light"` | Presentation preference. |
| `showCandidates` | boolean | Candidate overlay visibility. |

Derived or transient state includes `solver`, `lastAnalysis`, `lastApplied`, `isSolving`, `undoStack`, `redoStack`, `history`, `focusIndex`, highlights, drag bookkeeping, and `activeDialog`.

### Coordinates

Board indices are row-major:

```text
index = row * n + column
```

`rc(index)` is the single conversion back to zero-based row and column. User-facing coordinates are one-based (`r1 · c1`). The board grid, rulers, ARIA row/column counts, cats, candidates, and exported cell arrays all use the same index model.

### Neighbours

`neighbours(index, diagonal = false)` returns in-bounds neighbours:

- **Default (four orthogonal):** used for colour-region connectivity.
- **`true` (eight surrounding):** used for the no-touching cat rule.

Keeping these two modes explicit prevents a diagonal from accidentally connecting a region or a cat from being allowed to touch at a corner.

### Change invalidation

Any board edit or whole-board replacement invalidates derived solver results. `clearDerivedForBoardChange()` resets the solver, analysis cache, applied step, highlights, and solving state as appropriate, then refreshes the board and panels. Undo/redo restores only `cells` and `cats`; solver results are deliberately not restored and must be recomputed.

Undo snapshots contain `cells` and `cats`. The undo stack is bounded at 100 entries; the activity history is separately bounded at 40 entries. A new edit clears the redo branch.

## Editing and rendering flow

A normal board edit follows this path:

1. `setCellAction()` checks whether the cell actually changes. Painting a cell removes any cat there; erasing removes both paint and cat; Cat mode toggles a cat.
2. The drag controller groups a pointer gesture into one undo snapshot and one history entry.
3. `refreshBoardAndDiagnostics()` re-renders cells, stats, header status, and the diagnostics panel.
4. `renderSolverPanels()` clears or re-renders solver output as needed.
5. `updateActionStates()` disables controls that are invalid while solving or when no content exists.

The render path is intentionally direct: rebuild the small board model, update classes and labels, and let CSS handle presentation. There is no virtual DOM or retained component tree.

## Validation model

`connectedComponents()` flood-fills every painted cell into orthogonal components of the same colour. `analyze()` is a pure pass over the current state and returns:

- painted and unpainted cell lists;
- used colours;
- connected components, grouped by colour;
- row, column, and colour cat counts;
- errors, warnings, and conflict cells;
- an `empty` and `complete` flag.

Errors block solving. Warnings describe an incomplete board but do not block structural analysis. Specific checks include:

- every used colour has exactly one orthogonal component;
- the board is fully painted before solving;
- a complete board uses exactly `n` colours;
- a cat is not on an unpainted cell;
- no row, column, or colour has more than one manual cat;
- no two cats occupy any of the eight neighbouring cells.

There is no maximum region size or region-area selector. The only region rule is connectivity.

## Solver

`searchSolutions(analysis)` is a bounded backtracking search over the used colours.

### Search order

At each recursion level:

1. For every unassigned colour, build the list of legal cells.
2. A cell is legal only if its row and column are unused, none of its eight neighbours contains an assigned cat, and, when the colour has a manual cat, the cell is that cat.
3. Choose the colour with the fewest legal cells (minimum remaining values).
4. If any colour has zero legal cells, backtrack immediately.
5. Otherwise recurse over the chosen colour's candidates.

The recursion depth is bounded by the number of colours, at most 10. Candidate filtering is bounded by the board size and eight neighbours.

### Enumeration and candidate data

Each complete assignment increments the solution count. For every assigned colour, the chosen cell is added to that colour's possible-cell set; every cell occurrence is counted. After the search:

- `possible` maps each colour to its sorted candidate cells;
- `candidateByCell` maps a cell to its colour for the overlay;
- `forcedSteps` is built only when the search completed and found at least one solution.

A forced step is reported when a colour has exactly one possible cell, or when a cell appears in every enumerated solution. Both cases are computed from the complete solution set, not from a heuristic.

### Caps and statuses

| Constant | Value | Effect |
|---|---:|---|
| `MAX_SOLUTIONS` | 20,000 | Stop after this many solutions. |
| `SEARCH_TIME_MS` | 3,000 | Stop after roughly three seconds; the clock is checked every 256 nodes. |
| `MAX_HISTORY` | 40 | Bound the visible activity history. |

Status is derived from the search outcome:

- `unique`: complete search, exactly one solution.
- `ambiguous`: complete search, more than one solution.
- `none`: complete search, zero solutions.
- `capped`: cap or time limit reached with at least one solution; candidates are provisional, forced steps suppressed.
- `inconclusive`: cap or time limit reached before any solution; no candidates or forced steps.

`solve()` also blocks empty, incomplete, structurally invalid, and impossible-colour-count boards before searching. It writes the autosave first, shows a `Searching…` state, and defers the synchronous search by one animation frame plus a short timeout so that state can paint.

The search is not cancellable and runs on the main thread. The caps keep the worst case bounded, but a difficult board can still cause a short frozen interval near the limit.

## Persistence and data format

### Keys

| Key | Owner | Purpose |
|---|---|---|
| `cat-solver:<name>` | Named saves | One JSON payload per puzzle name. |
| `meowdoku:autosave:v1` | Autosave | One recovery payload, separate from named saves. |
| `cat-solver-theme` | Theme | `"dark"` or `"light"`. |

### Payload

`buildPuzzlePayload()` writes schema version 2:

```json
{
  "version": 2,
  "name": "Example puzzle",
  "n": 4,
  "cells": [-1, 0, 0, 1, 2, 2, 3, 3, 0, 0, 1, 1, 2, 2, 3, 3],
  "cats": [0, 3],
  "selected": 0,
  "mode": "paint",
  "savedAt": 1760000000000
}
```

`cells` always has exactly `n × n` entries. `cats` is sorted on output. `selected` and `mode` are restored when a puzzle is loaded. `savedAt` is included for named saves and autosaves, and is used only for display and sorting. New payloads never include `maxRegion`.

The example above shows the field shape, not a guaranteed rule-valid puzzle. Structural validation and puzzle-rule diagnostics are separate concerns.

### Shared validation

`validatePuzzleData(input, fallbackName)` is the only gate for imports, named saves, and autosaves. It checks the whole payload before any state changes:

- input is a non-array object;
- optional `version` is an integer from 1 to 2;
- `n` is an integer from 4 to 10;
- `cells` is an array of exactly `n × n` integers in `-1..11`;
- `cats` is an array of unique in-bounds integer cell indices;
- `selected` is an integer in `-1..11` (legacy `-1` normalizes to 0);
- `mode` is `paint`, `erase`, or `cat`;
- `name` is a string, trimmed and capped at 50 characters;
- `savedAt` is finite or defaults to 0.

Unknown properties such as `maxRegion` are ignored. A rejected payload returns an error and leaves the active board untouched. Structural validity is separate from puzzle validity: a well-formed board can still be incomplete or rule-breaking, which is the diagnostics panel's job.

### Applying a puzzle

`applyPuzzleData()` is called only after validation and, for imports, after the user confirms replacement. It:

- replaces `n`, `cells`, `cats`, `selected`, and `mode`;
- resets undo, redo, activity history, focus, solver state, and highlights;
- updates the name and size controls;
- rebuilds the board, mode, diagnostics, and solver panels;
- records a load/import history entry.

### Autosave lifecycle

`autosaveBoard()` runs at the start of both `validateBoard()` and `solve()`, before analysis and before every early return.

- If the board has no content, it removes the autosave key and returns.
- Otherwise it writes the current payload to `meowdoku:autosave:v1`.
- If the write fails, it removes the old key, reports a one-time warning, and lets validation or solving continue.
- On startup, `readAutosave()` validates the stored value. Invalid data is discarded; an empty value is ignored; a valid non-empty value opens the recovery dialog with **Restore board** and **Start fresh**.
- Restore applies the snapshot through the same validated path and keeps the key. Start fresh clears the key and the board.
- Named saves are never touched by the autosave path.

## Import and export

- **Import:** the file input accepts `.json` and `application/json`. Files over 5 MB are rejected before reading. `FileReader` errors and JSON parse errors produce a dialog without changing the board. The parsed object is validated, then the user confirms replacement if the board has content, then `applyPuzzleData()` runs.
- **Export:** `buildPuzzlePayload()` produces version 2 JSON, `safeFileBase()` sanitizes the download name, a temporary anchor starts the download, and the object URL is revoked after one second. Export does not include `maxRegion`, derived solver results, or history.
- **Named saves:** saving uses `cat-solver:<name>` and asks for confirmation before replacing an existing key. Loading re-validates the stored payload. Corrupt entries are counted and hidden from the list instead of breaking it.
- **Storage failure:** quota and blocked-storage errors are caught and translated into actionable messages. Validation and solving do not depend on storage success.

## Accessibility and theming

- The page has one `<h1>` (`Meowdoku Solver`), landmark regions, a skip link, and labelled controls.
- The board is a `role="grid"` with roving tabindex, arrow-key movement, and Enter/Space activation. ARIA row and column counts follow `n`.
- The palette is a `role="radiogroup"` with radio-like buttons, arrow/Home/End navigation, and `aria-checked`.
- The shared dialog uses native `<dialog>`, restores focus, traps tab order through the browser's modal behaviour, closes on Escape, and keeps a focusable scroll body.
- The file menu implements menu semantics, arrow navigation, Escape, outside-click dismissal, and focus return.
- Scrollable history and dialog bodies have `tabindex="0"` and visible focus outlines.
- Themes are token overrides, not separate markup. The theme toggle updates `meta[name="theme-color"]` and persists to `cat-solver-theme`.
- `prefers-reduced-motion: reduce` collapses transitions and animations.
- Automated axe scans are evidence, not a conformance claim. Real screen-reader and cross-browser testing remain deferred; see [`TESTING.md`](TESTING.md).

## Security posture

The app has a small attack surface but not zero risk.

- No backend, accounts, analytics, telemetry, remote fonts, or runtime network calls.
- User-controlled names and imported values are rendered through `textContent` or fixed attributes. New `innerHTML` templates must not interpolate untrusted data.
- The shared validator bounds every imported/saved/recovered value before use.
- Imports are size-limited; export names are sanitized; object URLs are revoked.
- Brand SVGs are local, self-contained vectors with no scripts, event handlers, external references, embedded images, or `foreignObject`.
- There is no CSP or hosting header configuration in the app itself. This is an accepted residual risk to revisit in future hosting hardening.
- `localStorage` is unencrypted and clearable; it is not a secret store or backup.

See [`QUALITY_AUDIT.md`](QUALITY_AUDIT.md) for findings, accepted risks, and deferred work.

## Invariants to preserve

1. `cells` contains exactly `n × n` values.
2. Cell values remain `-1` or a valid palette index in `0..11`.
3. Palette order and values remain stable; persisted data uses indices.
4. Cats remain cell indices; duplicate cats are invalid.
5. Region connectivity is orthogonal; cat no-touching is eight-way.
6. A used colour must form exactly one connected region.
7. There is no maximum region size.
8. Manual cats constrain the solver.
9. A board edit invalidates derived solver results.
10. A capped search cannot claim uniqueness, no-solution, or a forced placement.
11. Imports, named saves, and autosaves all pass through the same validator.
12. New payloads omit `maxRegion`; legacy payloads with it remain importable.
13. Named saves and autosave use separate keys.
14. The app remains dependency-free and works from relative paths.

## Extension guidance

- **New board size:** widen the allowed range in `validatePuzzleData()`, the size select, and the solver tests. Do not assume the current 4-10 range elsewhere.
- **New palette colour:** append to `COLORS` rather than reordering existing entries; persisted data depends on indices. Check contrast and candidate/cat ink.
- **New solver result state:** update status derivation, the header, next-deduction and candidate panels, action enablement, and the provisional rules together.
- **New import field:** add strict validation, decide whether it is display-only or behavioural, and update the data-format docs and regression cases.
- **New persistence key:** namespace it and keep autosave separate from named saves.
- **New UI panel:** use semantic markup, keyboard access, focus handling, and the existing token system. Do not add a second competing status source without a reason.

## Known limitations

- The solver runs synchronously on the main thread and has no cancel control.
- `localStorage` is origin-bound, unencrypted, and clearable; there is no sync or backup.
- Firefox, Safari, real screen readers, and physical touch devices are not verified in the recorded test environment.
- There is no committed CI test suite or visual-regression baseline.
- Deployment uses a pinned GitHub Actions workflow and a generated `gh-pages` branch; the live site was verified on 2026-10-30. See [`DEPLOYMENT.md`](DEPLOYMENT.md).
