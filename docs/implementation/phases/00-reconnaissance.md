# Phase 00 - Repository and Application Reconnaissance

Read `MASTER.md`, `memory.md`, `plan.md`, and `agents.md` first.

## Goal

Establish the exact starting state and identify the authoritative version before modifying files.

## Git inspection

Run and inspect:

```bash
git status --short --branch
git branch -avv
git remote -v
git log --oneline --decorate -20
git tag --list
```

Inspect `.gitignore`, `.github/`, existing docs, GitHub Pages configuration where accessible, ignored files, and untracked files. Confirm expected remote repository. Do not reset, clean, stash, switch branches, overwrite files, or discard local changes.

## Source inspection

Read the entire current application. Confirm whether the checked-out source matches the latest supplied ~4,782-line revision. Verify actual presence and behaviour of:
- `validateBoard()`;
- `solve()`;
- `validatePuzzleData()`;
- `analyze()` and region connected-component logic;
- `maxRegion` selector and enforcement;
- `buildPalette()`, `updatePaletteState()`, segmented modes, and `eraseOption`;
- `contextLine` and `updateContextLine()`;
- `savePuzzle()`, localStorage keys, import/export, and schema versions;
- solver cap/time limit and provisional-result semantics;
- existing event binding and initialization.

Inventory all features and map DOM IDs to their owners. Identify CSS design tokens and breakpoints. Identify current comments and existing tests.

## Baseline checks

Run appropriate existing syntax/static checks. If available, open the app in a browser and smoke-test board rendering, theme, palette, erase, solve, and storage. Record what was actually verified.

## Delegated analysis

Use read-only agents per `agents.md` if safe. Get architecture, security, and UI/accessibility findings. Do not let these agents edit files.

## Outputs

Create/update `docs/implementation/BASELINE.md` (or a section of `docs/IMPLEMENTATION_REPORT.md`) with:
- Git baseline and working tree status;
- source revision identity and discrepancies;
- file inventory;
- actual feature inventory;
- storage keys and schema versions;
- solver constraints and limits;
- baseline test results;
- known pre-existing issues;
- blockers.

## Gate

Do not proceed until the correct source is established and all user changes are protected. If source mismatch or unrelated uncommitted changes make the next step unsafe, report the precise issue and continue only with independent analysis.
