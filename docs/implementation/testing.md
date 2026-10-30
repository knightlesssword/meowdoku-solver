# Meowdoku Solver - Testing Strategy and Acceptance Cases

## Testing policy

Use existing repository tooling first. Do not add a framework or permanent dependency without a demonstrated need. Distinguish syntax checks, static checks, automated browser tests, and manual tests. Record the actual command/browser/version and result. A JavaScript syntax check is not a functional test.

## Feature regression matrix

### Board and input
- Board sizes 4x4 through 10x10 render correct cell counts and rulers.
- Paint by click and drag.
- Erase by click and drag; removes paint and any cat.
- Change from Erase back to Paint; prior selected colour is retained.
- Place/remove cats in Cat mode.
- Keyboard arrows navigate; Enter/Space applies active mode.
- Board resizing safely resets state and confirms destructive changes as designed.

### Palette
- Exactly twelve colours.
- Existing colour order, hex values, and indices preserved.
- No `none` swatch.
- Equal-width CSS grid at desktop (6 columns), tablet (4), and narrow/mobile (3).
- Segmented Erase remains, bottom erase button absent.
- Keyboard selection and aria-checked states work.

### Validation and region rules
- Every used colour forms one orthogonally connected component.
- Diagonal adjacency alone does not connect same-colour cells.
- Disconnected regions are detected and highlighted.
- A connected region larger than the previous default cap (10) is accepted without region-size error.
- No selector, default, hidden setting, error, rule text, or active enforcement for max region remains.
- Existing row, column, colour, cat, and diagonal-touch constraints remain intact.

### Solver
- Verified puzzle with one solution is reported unique only after complete search.
- Multiple-solution puzzle is reported ambiguous.
- No-solution puzzle is reported only after exhaustive completion.
- Timed/capped search reports provisional/inconclusive status.
- No forced deductions are presented as proven when search is incomplete.
- Manual cats constrain results.
- Candidate locations obey all hard constraints.

### Legacy data compatibility
- Import a valid old payload with `maxRegion: 10`; it loads and the property has no effect.
- Import supported schema versions (verify actual existing versions).
- Invalid cells, invalid cats, duplicates, invalid board dimensions, wrong array length, malformed JSON, and unsupported schema are rejected atomically.
- A rejected import leaves active board unchanged.
- New exports omit `maxRegion`.

### Persistence and autosave
- Manual named saves preserve existing namespace and overwrite-confirmation behaviour.
- Autosave happens before Validate analysis and before Solve processing, including early-return cases for incomplete/invalid boards.
- Autosave uses its own key; named saves remain untouched.
- Autosave does not create manual-save prompts or history spam.
- Startup offers restore/fresh for a valid non-empty autosave.
- Choosing fresh clears/dismisses stale recovery data.
- Empty-board Validate/Solve does not leave a previous puzzle as a stale recovery point.
- Malformed autosave is rejected safely.
- localStorage unavailable/quota errors do not block validation or solving.

### UI, themes, and accessibility
- Dark and light theme both checked.
- Desktop, tablet, and mobile checked.
- No horizontal overflow, clipped controls, or overlap.
- Dialog focus, Escape handling, focus restoration, keyboard navigation, visible focus, and reduced motion checked.
- UI redundancy removed without loss of helpful diagnostics or instructions.

## Suggested test tooling

Use existing Playwright/browser tooling if already available. If not, use a browser manually or a temporary non-committed harness where possible. Do not add runtime dependencies. Use HTML/CSS validators or accessibility tools only if available and appropriate. Do not claim WCAG conformance from a few visual checks.

## Test report

Create/update `docs/TESTING.md` with:
- test date;
- environment and browser;
- commands and tools actually run;
- scenarios tested;
- pass/fail/blocked status;
- known gaps;
- regression defects and fixes.

Keep detailed security findings in `docs/QUALITY_AUDIT.md` and end-to-end execution results in `docs/IMPLEMENTATION_REPORT.md`.
