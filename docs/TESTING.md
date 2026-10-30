# Meowdoku Solver - Test Report

- **Test date:** 2026-10-30
- **Scope:** Phase 3 security, solver, UI, and accessibility audit; includes fixes for three confirmed defects.
- **Status:** All executed suites passed after fixes. No test remains failing. Deferred coverage is listed at the end.
- **Detailed findings:** `docs/QUALITY_AUDIT.md`. Phase-by-phase execution history: `docs/IMPLEMENTATION_REPORT.md`.

## Environment

| Item | Value |
|---|---|
| Operating system | Windows (`win32`) |
| Node.js | v22.23.0 |
| Browser | Chromium 131.0.6778.33, Playwright build `chromium-1148` |
| Browser mode | Headless, viewports from 390 px to 1281 px wide |
| Test runner | Temporary `playwright-core` 1.64.1 harness outside the repository |
| Accessibility engine | `axe-core` 4.10.2, injected into the page at runtime |
| App server | Local static HTTP server at `http://127.0.0.1:8765`, repository root |
| Local-file case | `file:///D:/blep/FSProjects/cat-puzzle-solver/index.html` |
| Project dependencies | None added. The harness lives in `C:\Users\abuba\AppData\Local\Temp\opencode` and is not committed. |

## Commands run

Static checks:

```powershell
node --check js/app.js
git diff --check
node C:\Users\abuba\AppData\Local\Temp\opencode\phase3-static-check.js
```

Browser suites (each starts a fresh Chromium context and clears `localStorage` unless the case intentionally seeds it):

```powershell
node C:\Users\abuba\AppData\Local\Temp\opencode\phase2-core.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase2-autosave.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase2-file-protocol.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase2-storage-blocked.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase3-keyboard.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase3-security.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase3-solver-matrix.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase3-inconclusive.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase3-autosave-failure.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase3-controls.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase3-scroll-focus.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase3-axe.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase3-axe-final.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase3-visual.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase3-palette-shots.js
```

The server was started with Python's static HTTP server from the repository root:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

## Results summary

| Suite | Checks | Result |
|---|---:|---|
| JavaScript syntax | 1 | Pass |
| Git whitespace check | 1 | Pass |
| Static HTML/CSS/JS inventory | 8 observations | Pass |
| Phase 2 core regression | 19 | 19 / 19 pass |
| Phase 2 autosave regression | 9 | 9 / 9 pass |
| Local `file://` loading | 1 | Pass |
| Blocked-storage loading | 1 | Pass |
| Phase 3 keyboard and focus | 13 | 13 / 13 pass |
| Phase 3 persistence/security | 10 | 10 / 10 pass |
| Phase 3 solver and responsive matrix | 11 | 11 / 11 pass |
| Phase 3 inconclusive-search path | 1 | Pass |
| Phase 3 autosave-write failure | 5 | 5 / 5 pass |
| Phase 3 visible controls | 10 | 10 / 10 pass |
| Phase 3 scrollable-panel keyboard access | 4 | 4 / 4 pass |
| Phase 3 axe, empty board | 4 scans | 0 violations |
| Phase 3 axe, populated board and dialogs | 18 scans | 0 violations after fix |
| Phase 3 visual renders | 6 full renders + 6 palette crops | Inspected; no overflow or clipping observed |

## What was tested

### Static checks

- `node --check js/app.js` exited 0.
- `git diff --check` reported no whitespace errors.
- `index.html` had 80 unique IDs and no duplicates.
- No inline event-handler attributes, external `href`/`src` URLs, CSS `@import`, or JavaScript external URLs were found.
- `js/app.js` is loaded relatively with `defer`.
- The only inline script is the reviewed theme bootstrap.

### Board, palette, and core editing

- Boards 4 × 4 through 10 × 10 render the expected cell count, row/column rulers, and ARIA row/column counts.
- Palette has exactly 12 colours, no erase swatch, and 6 / 4 / 3 equal-width columns at desktop / tablet / mobile widths.
- Paint by click and pointer drag; erase by click and drag; returning to Paint retains the selected colour.
- Cat mode places and removes cats; erase also removes a cat.
- Keyboard arrows move board focus; Enter applies the active mode.
- Board resize asks for confirmation, Cancel preserves the board, and confirmation starts a clean board.
- Clear board confirms, then removes paint and cats.
- Remove all cats confirms, then removes cats while preserving paint.
- Clear history empties the activity list and disables its button.

### Validation and solver integrity

- A 16-cell single colour region imported with legacy `maxRegion: 10` is accepted; the old limit has no effect.
- A disconnected colour region is detected and highlighted.
- A 4 × 4 column-stripe puzzle reports 2 solutions, 8 candidates, and no forced placement.
- The same puzzle with 4 manual cats reports a unique solution.
- A unique 4 × 4 fixture reports `Unique solution`, exposes 4 forced steps, and the first candidate overlay marks 4 cells.
- Next step advances from step 1 of 4 to step 2 of 4; Place this cat applies the displayed forced cat at `r2 · c4`.
- A connected-region fixture with no arrangement reports exhaustive `No solution` after the search completes.
- 10 × 10 column stripes reach the 20,000-solution cap, report `Provisional results`, show 77 provisional candidates, suppress forced cards, and disable next/apply actions.
- A 10 × 10 hard no-solution fixture with a test-only patched clock reports `Search inconclusive`, with no candidates or forced steps and disabled actions.
- Manual cats constrain the search; candidate lists obey row, column, colour, touching, and manual-cat constraints by construction and fixture results.

### Persistence and autosave

- Validate and Solve write `meowdoku:autosave:v1` before analysis, including incomplete-board early returns.
- Empty-board Validate/Solve removes an older autosave.
- Startup offers Restore / Start fresh for a valid non-empty autosave.
- Start fresh removes the key and clears the board.
- Restore recreates the saved board and remains recoverable on a later load (accepted behaviour A-01).
- Corrupt autosave is discarded with a warning and no modal.
- Storage write failure does not block validation; the warning appears once.
- Failed autosave write now removes the older recovery snapshot, and reload shows no stale recovery prompt.
- Named saves remain under `cat-solver:<name>` and are separate from the autosave key.
- Corrupt named saves are counted and hidden without breaking the load list.
- Blocked `localStorage` produces actionable save/load messages and no page errors.

### Security and file handling

- Fourteen invalid schema payloads were rejected atomically: unsupported version, size 3, size 11, wrong cell length, cell below -1, cell above 11, fractional cell, cat outside board, duplicate cats, negative cat, invalid selected colour, invalid mode, non-text name, and non-array cats.
- Malformed JSON and a file over 5 MB were rejected without changing the board.
- An imported name containing `<img src=x onerror=...>` stayed inert text in the name field and history. Source review confirmed that saved labels and dialogs use the same `textContent` pattern.
- Export produced a sanitized filename, kept the original name only as JSON data, omitted `maxRegion`, and revoked its object URL.
- No page errors or console errors occurred in any suite.

### Keyboard, focus, dialogs, and reduced motion

- First Tab reaches the skip link and Enter targets `#main`.
- Palette Arrow Right/Left, Home, End, and wrap behaviour select and focus the correct colour with correct `aria-checked`.
- Board arrows move focus; Enter paints; global Ctrl+Z and Ctrl+Shift+Z undo and redo.
- File menu opens, arrow-navigates, closes on Escape, and restores focus to the File button.
- Help dialog contains focus, traps Tab, closes on Escape, and restores focus to Help.
- Destructive confirmation focuses Cancel; Escape preserves the board and restores focus.
- Theme toggles, persists under `cat-solver-theme`, and survives reload.
- Reduced-motion media emulation collapses transition and animation durations below 0.001 s.
- History and dialog body are keyboard-focusable scroll regions with visible 2 px focus outlines and working Page Down scrolling.

### Themes, responsive layout, and visual inspection

- Dark and light themes were rendered and inspected at 1281, 768, and 390 px.
- No horizontal page or body overflow was measured at any tested width.
- 10 × 10 mobile cells measured 28 px; the palette used 3 columns.
- Palette crops were inspected at all three widths in both themes: equal button sizes, no clipped labels, no bottom erase button.
- Full renders showed a dominant board, readable diagnostics, no overlapping controls, and the fixed `Meowdoku Solver` title.
- Screenshots were captured by the temporary harness and not committed. They are evidence for this run, not a permanent visual-regression baseline.

## Regression defects and fixes

| Defect | Before | Fix | After |
|---|---|---|---|
| QA-01 history panel had no keyboard access | Six populated-board axe scans failed with `scrollable-region-focusable` on `#history` | Added `tabindex="0"` and an inset `:focus-visible` outline | 18 / 18 axe scans pass; Page Down scrolls the focused history list |
| QA-02 narrow dialog body had no keyboard access | Help dialog at 390 px failed in both themes | Added `tabindex="0"` to the shared modal body and the same focus outline | 18 / 18 axe scans pass; Page Down scrolls the focused dialog body; Escape still closes it |
| QA-03 failed autosave left an older snapshot | Seeded key survived a forced quota error | `autosaveBoard()` now calls `clearAutosave()` in its catch path | Key is removed, validation continues, warning appears once, reload has no stale prompt |

All three fixes were followed by the full regression run listed above. No unrelated module was rewritten.

## Pass / fail / blocked

- **Passed:** every executed static, browser, security, solver, keyboard, visual, branding, and accessibility check listed above and in the Phase 4 section below.
- **Failed:** none in the final run.
- **Blocked / not executed:** real screen-reader testing, Firefox/Safari, physical touch devices, low-end performance profiling, and GitHub Actions security review. Reasons are recorded in `docs/QUALITY_AUDIT.md` (D-01 through D-04).

## Known gaps and limitations

1. **No real assistive-technology pass.** Axe found no automated violations, but axe does not prove WCAG conformance or correct screen-reader announcement order. The header `aria-live` pill, toasts, and solver status changes were not heard through NVDA/JAWS/VoiceOver.
2. **Chromium only.** Firefox and Safari were unavailable. `<dialog>`, Pointer Events, `dvh`, and storage behaviour in those engines are unverified.
3. **No physical touch test.** Drag was exercised with mouse/pointer events in Chromium; real touch scrolling and palm rejection were not tested.
4. **No visual-regression baseline.** Screenshots were inspected manually; no pixel-diff or screenshot snapshot is stored in the repository.
5. **No performance profile.** Search caps and history limits were verified in source and behaviour, but CPU throttling and long-session memory were not measured.
6. **Cap path uses a patched clock.** The `Search inconclusive` fixture temporarily replaced `performance.now` in the test page to force the time limit deterministically. Application code was not modified for that test.
7. **Temporary harness.** Playwright/axe scripts live outside version control, so another tester must recreate them or inspect the recorded commands and outcomes. No runtime dependency was added to the project.
8. **Storage blocking is emulated.** The blocked-storage case used an init script that makes the `localStorage` getter throw; it was not tested in every browser's private mode.
9. **No CSP test.** No Content Security Policy is present, so none was exercised. If Phase 6 adds one, the inline theme bootstrap, local SVG favicon, inline SVG `<use>` references, and downloads must be retested.
10. **Workflow checks are deferred.** There is no GitHub Actions workflow to test until Phase 6; least-privilege permissions and action SHA pinning remain a release gate.

## Phase 4 branding checks (2026-10-30)

Source integration: `f73f32c` (`feat(branding): use supplied app icon in header and favicon`). Asset and usage record: `docs/BRAND.md`.

Commands:

```powershell
node C:\Users\abuba\AppData\Local\Temp\opencode\phase4-asset-review.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase4-branding.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase4-file-check.js
node C:\Users\abuba\AppData\Local\Temp\opencode\phase4-wordmark.js
```

| Check | Result |
|---|---|
| SVG safety scan | Both assets have no script, event handlers, `foreignObject`, `<image>`, `<use>`, `<style>`, CSS `url()`, `@import`, entities, embedded data, or external references |
| Asset geometry | `app-icon.svg` is 256 × 256 (1:1); `logo-horizontal.svg` is 940 × 260 and keeps that ratio |
| HTTP delivery | Both assets returned HTTP 200 with `Content-Type: image/svg+xml` |
| Header and favicon | 6 / 6 checks passed across dark/light themes and 1281/768/390 px: icon loads at 42 px (36 px mobile), `alt=""`, no header or page overflow |
| Local file use | `file:///D:/blep/FSProjects/cat-puzzle-solver/index.html` loaded the icon at 256 × 256 with no page or console errors |
| Core regression rerun | 19 / 19 pass |
| Autosave regression rerun | 9 / 9 pass |
| `file://` and blocked-storage reruns | Both pass |
| Keyboard, security, solver, inconclusive, autosave-failure, controls, scroll-focus reruns | 13 / 13, 10 / 10, 11 / 11, pass, 5 / 5, 10 / 10, 4 / 4 |
| Axe rerun | Empty board 4 / 4 scans with zero violations; populated board/dialog matrix 18 / 18 scans with zero violations |
| Full-page visual rerun | Dark/light at 1281, 768, and 390 px; no overflow; header icon legible on both themes |

The horizontal wordmark was inspected on light and dark surfaces. Its cocoa wordmark and muted tagline lose contrast on the dark app background, so it is documented as a light-surface asset. The app header uses the icon with theme-aware text instead. README creation and the final hero choice remain Phase 5 work.
