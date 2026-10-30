# Phase 0 - Repository and Application Baseline

Recorded: 2026-10-30. All statements below were verified against the working tree and the live app in a Chromium-based browser served over local HTTP. No source changes were made during reconnaissance.

## Git baseline

| Item | Verified state |
|---|---|
| Working directory | `<repository-root>` |
| Current branch | `master` (single local branch, no upstream) |
| Remote | None configured (`git remote -v` empty) |
| GitHub repository | `knightlesssword/meowdoku-solver`, public, **empty** (`isEmpty: true`, no branches) |
| GitHub Pages | Not configured (`GET /repos/.../pages` returns 404) |
| Commits | `af7ff90` feat: rebuild cat placement solver workbench; `e6d2530` chore: capture original cat placement solver |
| Tags | None |
| Tracked files | `cat-placement-solver (1).html` only |
| Uncommitted/untracked | `README.md`, `.github/` (issue + PR templates), `assets/branding/` (two supplied SVGs), `docs/implementation/` (this prompt pack) |
| Unrelated local modifications | None. The tracked HTML matches `HEAD` exactly. |

Safety assessment: the untracked files are user-supplied project inputs. They will be committed unchanged (apart from adding this baseline) before source work begins, so they cannot be lost. The branch rename `master` -> `main` is a ref rename with no history rewrite and no remote to conflict with. No rebase, reset, clean, or force-push is required anywhere in the current state.

## Source identity

- Authoritative source: `cat-placement-solver (1).html`, 4,781 lines, 156,924 bytes, clean at `HEAD` (`af7ff90`).
- The file matches the "latest supplied revision" description in `memory.md` (a developed single-file app, not the small prototype). It is the newest source in the repository and in the working tree; no newer local copy exists.
- The app contains one inline `<style>` block, one inline theme bootstrap script, and one inline application script wrapped in an IIFE with `"use strict"`.
- No tests, package manifest, bundler, build scripts, or workflows exist.

## File inventory

```text
cat-placement-solver (1).html   tracked, application
README.md                        untracked, prompt-pack readme
.github/                         untracked, issue and PR templates only
assets/branding/app-icon.svg     untracked, user-supplied 256x256 app icon
assets/branding/logo-horizontal.svg  untracked, user-supplied 940x260 wordmark
docs/implementation/            untracked, execution prompt pack
```

The supplied SVGs differ from the placeholder names in `memory.md`; the actual files are `app-icon.svg` and `logo-horizontal.svg`. Per `brand.md`, the actual filenames win; no duplicates will be created.

## Actual feature inventory

### Board and editing
- Board sizes 4 through 10, default 8; `sizeSelect` change starts a new empty board after confirmation only when content exists.
- 12 paint colours with stable indices 0-11 and fixed hex/ink/eye values (`COLORS`).
- Modes: `paint`, `erase`, `cat`, selected through the segmented control (`[data-mode]`) plus a separate bottom `eraseOption` button.
- Painting a cell removes any cat on it; erasing removes both paint and cat; Cat mode toggles a manual cat.
- Pointer click and drag painting/erasing/cat placement, with pointer capture and a 100-entry undo stack; redo stack cleared on new edits.
- Roving-tabindex keyboard grid navigation (arrows, Home/End, Ctrl/Cmd+Home/End); Enter/Space activates the current mode through the native button click path.
- Row and column rulers, board legend, board caption, and screen-reader instructions.
- Undo/redo keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y).

### Validation and diagnostics
- `connectedComponents()` computes orthogonal same-colour components.
- `analyze()` reports unpainted cells (warning), multi-component colours (error), the configured region-size limit (error), colour-count mismatch, cats on unpainted cells, touching cats in all eight directions, more than one cat per row/column/colour, and returns a conflict cell set.
- Diagnostics render clickable issues that highlight the relevant cells.
- Header status pill, diagnostics badge, and three metric counters (painted cells, colours used, manual cats).

### Solver
- `searchSolutions()` performs backtracking with minimum-remaining-values colour choice.
- Constraints: one colour per row, one per column, one cat per used colour, manual cats are hard constraints, no touching in eight directions.
- Limits verified in source: `MAX_SOLUTIONS = 20000`, `SEARCH_TIME_MS = 3000`; checked every 256 recursion nodes.
- Capped searches are marked `capped` / `inconclusive`; forced placements are suppressed unless the search completed. Zero results after a capped search are not reported as proof of impossibility.
- Candidate locations grouped by colour, optional overlay on the grid, forced-step carousel with "Place this cat", manual cats shown as confirmed candidates.

### Persistence and files
- Named saves: `localStorage` prefix `cat-solver:`; save prompts before overwriting an existing key; load dialog lists valid entries and hides invalid ones.
- Theme preference: `cat-solver-theme` (`light` / `dark`).
- Payload schema `version: 2` with `name`, `n`, `maxRegion`, `cells`, `cats`, `selected`, `mode`, optional `savedAt`.
- Import: JSON file input, 5 MB limit, `validatePuzzleData()` checks version 1-2, integer size 4-10, exact cell count, cell values -1..11, cats bounds/duplicates, selected colour, mode, name length; replacement confirmation when a board has content.
- Export: JSON Blob download with sanitised file base and object-URL revocation.
- **No autosave and no startup recovery exist.**

### UI systems
- Dark theme default, designed light theme, persisted theme, `theme-color` metadata update.
- Custom `<dialog>` modal system with focus restoration, Escape/cancel, backdrop click, button promise results.
- Toast region with a three-toast cap.
- Accessible file menu with roving focus, Escape, outside-click close.
- Skip link, reduced-motion CSS, visible focus styles, ARIA grid roles and labels.
- Static in-page help dialog documenting rules, solver guarantees, and keyboard shortcuts.

### Redundant or obsolete presentation present in baseline
- Header context line (`contextLine`) and dynamic document title based on the puzzle name.
- `eraseOption` block at the bottom of the palette, including `eraseState`.
- Palette status text, mode indicator, and board hint repeat the active mode/colour in several places.
- Painted-cell count appears in both the board caption and the diagnostics metric.
- Maximum region selector with default `10` cells and enforcement in `analyze()`.

## DOM, CSS, and storage facts

- 86 element IDs; 105 named functions; 103 CSS custom-property declarations.
- Breakpoints: `max-width: 1120px` (sidebar stacks), `820px` (setup grid, status pill hidden), `720px` (compact mobile, palette forced to 3 columns), `430px` (narrow tweaks), plus `prefers-reduced-motion: reduce`.
- Baseline palette uses `grid-template-columns: repeat(auto-fit, minmax(86px, 1fr))`; at 1281 px viewport it resolves to **8** equal columns, not the required 6/4/3 responsive targets.
- Storage keys: `cat-solver:` (named saves), `cat-solver-theme` (theme). No autosave key.
- Schema version accepted: 1 and 2. New payloads write version 2.

## Baseline checks actually run

| Check | Command / method | Result |
|---|---|---|
| JavaScript syntax | Extracted inline application script to a temp file, `node --check` (Node v22.23.0) | Pass |
| Browser load | Chromium tab via local `python -m http.server 8765`, app HTML opened | Pass, no console messages |
| Board render | DOM query | 64 cells at 8x8, rulers and legend present |
| Palette render | DOM query | 12 swatches, `auto-fit` resolving to 8 columns at 1281 px |
| Default max region | DOM query | `10` |
| Theme | DOM query | `dark`, no flash observed |
| Horizontal overflow | `scrollWidth === clientWidth` at 1296 px | Pass |
| Accessibility audit | Not yet run | Deferred to Phase 3 |
| Security audit | Not yet run | Deferred to Phase 3 |

Node v22.23.0, Git 2.53.0, GitHub CLI 2.55.0 (authenticated as `knightlesssword`, scopes include `repo` and `workflow`), Python 3.12.3 are available. The browser automation tool is available and was used. No npm packages were installed.

## Supplied SVG inspection

- `assets/branding/app-icon.svg`: 18 lines, self-contained square 256x256 icon, rounded cream tile with a 3x3 colour-grid motif and cat face; only `rect`, `path`, `circle`-style vector primitives.
- `assets/branding/logo-horizontal.svg`: 21 lines, self-contained 940x260 horizontal lockup, same motif plus wordmark paths.
- Scan for `<script>`, `on*=` handlers, `foreignObject`, external `href`/`url(http...)`, `@import`, and `<image>` returned no matches. Assets are safe to integrate locally.

## Known pre-existing issues and risks to address in later phases

1. Maximum region feature is active: selector, `ALLOWED_MAX_REGIONS`, `maxRegionValue()`, `analyze()` enforcement, payload field, help text, and change handler. It must be removed while legacy `maxRegion` stays importable and ignored.
2. Separate `None — erase` palette button duplicates the segmented Erase mode. Must be removed without losing erase semantics or the retained paint colour.
3. Palette uses ragged `auto-fit`; must become an equal-width 6/4/3 grid.
4. Header context line and name-derived document title must be removed; title fixed to `Meowdoku Solver`.
5. Repeated painted counts and mode/colour descriptions need a restrained redundancy pass.
6. No autosave before Validate/Solve and no startup recovery dialog.
7. Branding still uses a hand-drawn inline gold mark and title "Cat Placement Solver"; supplied Meowdoku SVGs are not referenced.
8. No deployment workflow, no license, no project README (the current README is the prompt-pack readme).
9. GitHub repository is empty and has no remote; branch is `master`; Pages is not configured. These are expected setup tasks for Phase 6, not source blockers.
10. Browser smoke tests so far cover rendering only; interaction, persistence, import/export, and solver cases are scheduled for Phase 1 and the Phase 3 test matrix.

## Gate decision

The authoritative source is established, all uncommitted inputs are known and will be committed unchanged, and no user work is at risk. Phase 0 passes. Proceeding to Phase 1.
