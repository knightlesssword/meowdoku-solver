# Phase 01 - Mandatory Product Feature Corrections

Read `MASTER.md`, `memory.md`, `plan.md`, `architecture.md`, `design.md`, `testing.md`, and `security.md` as needed.

## Goal

Implement and test the explicit feature corrections while the app is still in its original single-file form. Keep this phase separate from structural extraction to make regressions easier to isolate.

## A. Remove maximum region-size restriction

Remove the selector, DOM references, constants, getter/setter handlers, event bindings, disabled state, validation enforcement, error/warning messages, help text, CSS, serialization output, and active state that enforce or display a maximum region size.

Keep connected-component validation: one used colour must form exactly one orthogonally connected region. Any size is accepted. No hidden or default area limit is permitted.

Backward compatibility: accept supported legacy saved/imported payloads containing `maxRegion`, ignore the property, and omit it from new payloads. Do not reject otherwise-valid data because of that legacy field. Preserve actual existing schema-version support; do not bump schema without a reason.

## B. Remove duplicate erase UI

Remove the separate bottom `None - erase` option and its DOM refs, state, listeners, and unused CSS. Retain segmented Paint / Erase / Cat.

Erase must remove both cell paint and any cat. Switching back to Paint must preserve the previous selected colour. The palette remains exactly twelve paint colours; `none` is not a palette item.

## C. Align palette

Replace ragged auto-fit rows with a fixed responsive grid: 6 columns desktop, 4 medium/tablet, 3 narrow/mobile. Equal button width and height, consistent gaps and swatches, legible labels, no overflow, preserved colour indices/values, accessible selected state and keyboard behaviour.

## D. Remove header context line

Remove visual `contextLine` showing board size and puzzle name, its DOM reference, function and calls if unused. Keep puzzle-name input. Set the document title to `Meowdoku Solver` and do not mutate it based on puzzle name.

## E. Redundancy audit

Review `boardCount`, painted metric, `paletteStatus`, `activeMode`, header status, and diagnostics badge. Remove visual duplication where it does not add a distinct purpose. Preserve actionable diagnostics and accessibility instructions.

## F. Autosave before Validate/Solve

Implement a synchronous, non-blocking best-effort snapshot using a dedicated key such as `meowdoku:autosave:v1` before `validateBoard()` analyzes and before `solve()` analyzes or returns early.

Autosave payload: version, board size, name, cells, cats, selected colour, mode, saved timestamp. Do not save derived solver results or `maxRegion`.

Do not reuse the named-save keyspace (`cat-solver:` if confirmed in source). Do not prompt, overwrite named saves, create history entries, or block core operations if storage fails.

On startup, validate the autosave through the common data validator. If valid and non-empty, show accessible Restore / Start fresh choices. Do not silently replace a new board. Starting fresh clears/dismisses the autosave. Empty-board Validate/Solve must not leave an older stale autosave as the next recovery point. Malformed autosave is rejected safely.

A storage failure produces a non-blocking toast; validation and solving continue.

## Tests required before phase exit

- one connected region >10 cells validates without region-size error;
- disconnected same-colour regions still fail;
- legacy JSON with `maxRegion: 10` loads, property is ignored;
- new JSON has no `maxRegion`;
- no max-region selector, labels, handlers, or enforcement remain;
- bottom erase control absent; segmented Erase works by click and drag;
- selected paint colour survives mode switching;
- twelve palette buttons align 6/4/3 at tested viewport widths;
- context line absent, document title fixed;
- autosave takes place before validation/solve, including invalid/incomplete early returns;
- autosave restore/fresh/corrupt/storage-failure cases work;
- manual named saves are unaffected.

## Gate

Run regression tests and inspect the complete diff. Commit this phase as logical, reviewable commits only after it passes. Record all outcomes and any blocked tests.
