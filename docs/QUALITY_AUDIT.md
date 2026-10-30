# Meowdoku Solver - Security, Solver, UI, and Accessibility Audit

- **Audit date:** 2026-10-30.
- **Scope:** Phase 3 audit of the working tree after Phase 2 (`dfa3b26`) plus the Phase 3 fixes, revalidated after the Phase 4 branding integration, Phase 5 documentation, Phase 6 publication, and the post-release UI refinement.
- **Auditor:** primary orchestrator, acting as the sole integration owner.
- **Method:** source review, static scans, temporary Playwright/axe browser harness, and manual inspection of real Chromium renders. Test details and commands are in `docs/TESTING.md`.
- **Overall result:** no known Critical or High issue remains in the reviewed scope. Four confirmed defects were fixed and regression-tested, including the UI-refinement footer link issue. The Phase 6 workflow and live Pages deployment were reviewed and verified. Accepted and deferred items are listed separately. This audit does not claim complete security or WCAG conformance.

## Findings summary

| ID | Severity | Area | Status | Summary |
|---|---|---|---|---|
| QA-01 | Medium | Accessibility | Fixed | The populated history panel became a scroll container without keyboard access or a visible focus target (`scrollable-region-focusable`). |
| QA-02 | Medium | Accessibility | Fixed | At narrow widths the scrollable dialog body had no keyboard access (`scrollable-region-focusable`). |
| QA-03 | Low | Persistence | Fixed | A failed autosave write left an older snapshot in storage, so reload could offer stale recovery data. |
| QA-04 | Low | Accessibility | Fixed | The new footer credit link relied on color alone; axe flagged `link-in-text-block`. A visible underline resolved it. |
| A-01 | Low | Persistence | Accepted | Restoring an autosave keeps the recovery key, so the prompt can reappear on later loads and can predate edits made after restore. |
| A-02 | Informational | UI | Accepted | The solution count appears in the header, next-deduction panel, and candidate subtitle; each serves a different scope. |
| A-03 | Informational | Security | Accepted | There is no Content Security Policy; the app has an inline theme bootstrap and no untrusted markup sinks. |
| A-04 | Informational | Privacy | Accepted | `localStorage` is unencrypted, clearable, and not a durable backup. No secrets are stored. |
| A-05 | Low | Solver | Accepted | Search is synchronous on the main thread and can block for up to roughly the 3-second cap; it is bounded and visibly indicated. |
| D-01 | - | Workflow | Resolved | The Phase 6 workflow is pinned, least-privilege, main-only, serialized, and non-force-pushing; both the push run and manual dispatch succeeded. |
| D-02 | - | Accessibility | Deferred | No real screen-reader pass (NVDA, JAWS, VoiceOver) was possible in this environment. |
| D-03 | - | Compatibility | Deferred | Functional tests used Chromium only; Firefox and Safari were not tested. |
| D-04 | - | Performance | Deferred | No low-end-device profiling or long-session memory measurement was performed. |

No unresolved Critical, High, or Medium finding is known after the fixes below.

## Fixed findings

### QA-01 - History panel is scrollable but not keyboard-accessible

- **Severity:** Medium (accessibility).
- **Affected:** `index.html` line 345 (`#history`); `css/style.css` lines 150-155; `js/app.js` `renderHistory()` line 766.
- **Preconditions:** Enough board/solver activity to make `#history` overflow its 280 px maximum height.
- **Impact:** Keyboard-only users could not focus or scroll the activity list. Axe classified the violation as serious. The empty board did not expose the issue because the list did not overflow.
- **Evidence:** The populated-state axe run reported `scrollable-region-focusable` on `#history` in six scans (dark and light at 1281, 768, and 390 px); QA-02 accounted for two further failures in the narrow help dialog. After both fixes, all 18 scans passed with zero violations.
- **Remediation:** Added `tabindex="0"` to `#history` and an inset `:focus-visible` outline for scrollable panels. The list keeps its `role="list"` and accessible label.
- **Regression test:** Keyboard focus plus Page Down changed `#history.scrollTop` from 0 to 245 px with a 2 px visible outline.

### QA-02 - Narrow dialog body is scrollable but not keyboard-accessible

- **Severity:** Medium (accessibility).
- **Affected:** `index.html` line 370 (`#modalBody`); `css/style.css` lines 150-155.
- **Preconditions:** A dialog whose content exceeds the dialog height, observed with the help dialog at a 390 px viewport.
- **Impact:** Keyboard users could not focus the scrollable body to read the remaining content. Axe reported `scrollable-region-focusable` as serious.
- **Evidence:** The help-dialog scans at 390 px failed in both themes before the fix; the post-fix populated/dialog matrix passed all 18 scans.
- **Remediation:** Added `tabindex="0"` to the shared dialog body and the same inset focus outline. Existing Escape handling, initial focus, and focus restoration still pass.
- **Regression test:** At 390 × 600, focusing `#modalBody` and pressing Page Down changed `scrollTop` from 0 to 356 px; the outline was 2 px; Escape still closed the dialog.

### QA-03 - Failed autosave write leaves an older recovery snapshot

- **Severity:** Low (persistence integrity).
- **Affected:** `js/app.js` `autosaveBoard()` lines 2138-2158, specifically the `setItem` catch path at lines 2149-2152.
- **Preconditions:** A previous autosave exists, the board has content, and the next autosave write fails (for example quota exhaustion or a storage security error).
- **Impact:** The previous snapshot remained readable, so a later reload could offer recovery data that did not match the board at the time of the failed validation/solve. The UI labels the snapshot and timestamp, so the risk is confusion rather than silent replacement.
- **Evidence:** A seeded `meowdoku:autosave:v1` value remained after a forced `QuotaExceededError` until the failure path was changed. The regression test now confirms the key is `null`, validation still completes, and a reload shows no recovery prompt.
- **Remediation:** Call `clearAutosave()` in the write catch block before emitting the existing one-time warning. `clearAutosave()` already swallows storage exceptions, so blocked storage remains non-blocking.
- **Regression test:** Five checks in the temporary autosave-failure suite: old key removed, validation not blocked, warning not spammed on a second failure, no stale recovery after reload, and no console errors.

### QA-04 - Footer credit link was distinguished by color alone

- **Severity:** Low (accessibility).
- **Affected:** `.app-footer a` in `css/style.css`.
- **Preconditions:** The footer is visible; axe scans the page.
- **Impact:** `link-in-text-block` flagged the link because its color contrast against the surrounding footer text was below 3:1 and it had no underline or other non-color distinction.
- **Evidence:** The first populated/dialog axe run after the footer change reported the rule in all 18 scans; the empty-board matrix also carried the same markup.
- **Remediation:** Added a visible 1 px underline with a 2 px offset. Hover color remains an enhancement, not the only distinction.
- **Regression test:** Populated/dialog axe 18 / 18 and empty-board axe 4 / 4 passed with zero violations.

## Accepted findings

### A-01 - Restore keeps the autosave recovery point

- **Severity:** Low; accepted product behaviour.
- **Affected:** `js/app.js` `offerAutosaveRecovery()`.
- **Behaviour:** Choosing **Restore board** applies the snapshot but does not remove the key. Reloading can offer the same snapshot again. If the user edits after restoring and then reloads, the offered snapshot can predate those edits.
- **Why accepted:** The snapshot matches the board at the moment of restore, is explicitly labelled with puzzle name, size, counts, and timestamp, and is never applied silently. The Phase 1 requirement explicitly requires clearing on **Start fresh** and on empty-board Validate/Solve; it does not require consuming the key on restore. Keeping it preserves a recovery point for a restored board that has not been saved or exported.
- **Mitigation already present:** Start fresh removes the key; Validate/Solve rewrites it before analysis; a failed write now removes it (QA-03); the payload passes the same defensive validator as imports.
- **Revisit if:** Product direction changes to one-shot recovery. That would need a decision about reload behaviour after restore and a regression test for the chosen lifecycle.

### A-02 - Solution count appears in three places

- **Severity:** Informational; accepted.
- **Affected:** Header status pill, next-deduction result, candidate subtitle.
- **Behaviour:** A solved board can show the same count in the global header, inside the deduction explanation, and above the candidate list.
- **Why accepted:** The header is the global board state, the deduction panel uses the count to explain whether a forced placement exists, and the candidate subtitle scopes the count to the candidate lists. Removing any of them would either hide global state or separate a count from the list it describes. Painted-cell count and selected mode/colour each appear once. No duplicate status badge was found.

### A-03 - No Content Security Policy

- **Severity:** Informational; accepted residual risk.
- **Affected:** `index.html` document metadata.
- **Behaviour:** The page has no CSP meta tag or response header. It retains one small inline theme bootstrap and an inline SVG sprite.
- **Why accepted:** There is no backend to set headers, no untrusted HTML sink, no external script, font, image, analytics, or network request, and imports are validated before use. A useful CSP would need a hash or nonce for the bootstrap and careful testing of the local SVG favicon and same-document SVG references. Adding one is a deployment-phase hardening option, not a blocker for this local-first build.
- **Revisit in:** future hosting hardening. Phase 6 published from a branch without adding a CSP; any future policy needs browser verification of the theme bootstrap, local SVG favicon, inline SVG references, and downloads.

### A-04 - Browser storage is not confidential or durable

- **Severity:** Informational; accepted.
- **Affected:** `cat-solver:` named saves, `cat-solver-theme`, and `meowdoku:autosave:v1`.
- **Behaviour:** Data is stored unencrypted in same-origin `localStorage`, can be read by scripts on that origin, and can be cleared by the browser or user.
- **Why accepted:** No credentials or secrets are stored. The UI describes the app as local-first, and JSON export is available. Documentation must not call local storage encrypted, confidential, or a backup. The README and `SECURITY.md` now repeat this limitation.
- **Evidence:** Blocked-storage and corrupt-value tests produce actionable messages and do not crash the app.

### A-05 - Synchronous bounded search can block the UI

- **Severity:** Low; accepted.
- **Affected:** `js/app.js` `searchSolutions()` and `solve()`.
- **Behaviour:** The backtracking search runs on the main thread inside a timeout after a paint frame. It checks elapsed time every 256 nodes and stops at 20,000 solutions or about 3 seconds.
- **Why accepted:** The caps bound the work and recursion depth is at most the number of colours (10). The interface shows `Solving…`, disables editing/actions, and marks capped results provisional. A Web Worker would add architecture and file-loading complexity without changing the product's correctness guarantees.
- **Residual risk:** A slow device can still experience a short frozen interval near the cap. No cancellation control exists. This was not profiled on low-end hardware.

## Deferred and resolved items

### D-01 - GitHub Actions and deployment security (resolved)

Phase 6 added `.github/workflows/deploy-pages.yml` in commit `6cb94a4`. The workflow was reviewed and exercised as follows:

- **Triggers:** pushes to `main` and manual `workflow_dispatch` only. A job-level guard rejects any ref other than `refs/heads/main`.
- **Permissions:** only `contents: write` is requested, which the job needs to append to `gh-pages`. There is no `pages: write`, `id-token: write`, or unrelated scope.
- **Action pin:** `actions/checkout` v7.0.1 is pinned to commit `3d3c42e5aac5ba805825da76410c181273ba90b1`. The SHA was resolved from the official release and verified through the GitHub API.
- **Concurrency:** the `pages` group serializes runs with `cancel-in-progress: false`.
- **Artifact allowlist:** only `index.html`, `css/style.css`, `js/app.js`, `assets/branding/app-icon.svg`, `assets/branding/logo-horizontal.svg`, and `.nojekyll` are staged. Documentation, templates, screenshots, tests, and local paths are excluded.
- **Branch safety:** the publish step creates an orphan `gh-pages` only when the branch does not exist. Otherwise it builds on the fetched branch and uses ordinary `git push origin HEAD:gh-pages`. It never uses `--force`, `--force-with-lease`, or a destructive orphan replacement.
- **No secrets:** the built-in `GITHUB_TOKEN` is used through the checkout action's persisted credentials; no repository secret is configured or printed.
- **Evidence:** push run `41068060948` succeeded for `6cb94a4`; manual run `41068782251` succeeded as a no-op. `gh-pages` was created at `7f3fc83`. The cat-icon fix deployed in `41073235011` and appended `0a57cf3`; the UI refinement deployed in `41083159875` and appended `f857d8e`. Pages builds `1327302791`, `1327376367`, and `1327518875` completed with status `built`, and the public URL returned HTTP 200. The live appends confirm non-destructive history growth.

Residual deployment considerations: the repository has no environment approval gate or branch protection configured, and any future change to the workflow or Pages settings must be reviewed again. These are operational hardening items, not unresolved findings in the current release.

### D-02 - Real assistive-technology testing

Automated axe scans, keyboard operation, focus checks, and computed-style checks passed, but no real screen-reader session was available. Announcement order for the header `aria-live` region, toasts, solver status changes, and dialog content is therefore not verified with NVDA, JAWS, or VoiceOver. Axe cannot detect every semantic, reading-order, or announcement problem.

### D-03 - Browser compatibility

All functional and accessibility runs used Chromium 131.0.6778.33. Firefox and Safari were not available. The code uses broadly supported platform features (`<dialog>`, Pointer Events, `localStorage`, CSS custom properties, `dvh`), but compatibility is not proven by this audit.

### D-04 - Performance and long-session behaviour

No CPU throttling, low-memory device, or multi-hour session test was run. Search caps and the 40-entry history limit bound the main known growth paths, but memory and responsiveness were not profiled.

## Audit coverage and evidence

### DOM injection and XSS

- Inventoried every `innerHTML`, generated SVG/markup template, dynamic attribute, selector, URL, and CSS custom-property path in `js/app.js`.
- User-controlled values from imports, puzzle names, saved labels, filenames, diagnostics, history, and solver messages reach the DOM through `textContent` or fixed attributes.
- Remaining `innerHTML` templates contain static structure plus internal icon names or constants. `buildPalette()` interpolates only the fixed `COLORS` hex/ink values and internal icon markup. Help text interpolates only internal board size and compile-time solver caps.
- No `eval`, `new Function`, `document.write`, dynamic `querySelector` from user data, or user-controlled URL/CSS value was found.
- Imported names such as `<img src=x onerror=...>` remained inert text in the board name and history; source review confirmed the same `textContent` pattern in saved labels and dialogs.
- Export names are sanitized through `safeFileBase()`; the JSON payload retains the original name as data, which is safe.

### JSON and schema validation

`validatePuzzleData()` is the shared path for imports, named saves, and autosaves. It enforces:

- object shape; supported versions 1 and 2; retired `maxRegion` ignored;
- integer board size 4-10 and exact `n × n` cell length;
- integer cells in `-1` or `0..11`;
- cat indices in bounds, unique, sorted on output;
- selected colour in `-1..11` (legacy `-1` normalizes to 0);
- mode in `paint`, `erase`, `cat`;
- string names trimmed and capped at 50 characters;
- finite `savedAt` or 0, used only for display/sorting.

Validation completes before confirmation or state mutation. Fourteen malformed-schema payloads, malformed JSON, and an oversized file all left the active board unchanged. Legacy version 1 with `maxRegion: 10` loaded and the retired field had no effect.

### localStorage

- Named saves remain under `cat-solver:<name>`; theme remains `cat-solver-theme`; autosave uses `meowdoku:autosave:v1`.
- Corrupt named saves are counted and hidden without breaking the load dialog. Invalid or empty autosaves are discarded. Empty-board Validate/Solve removes an older autosave.
- Storage getter exceptions produce actionable save/load messages and no page errors. Autosave failures do not block validation or solving, and the one-time warning is not repeated on every failure.
- Duplicate named saves use the existing replace confirmation. Autosave never overwrites named saves.
- The QA-03 fix ensures a failed autosave write cannot leave an older snapshot as the next recovery point.

### File import and export

- Import refuses files over 5 MB before reading, handles `FileReader` failure, rejects malformed JSON, validates before confirmation, and only then replaces the board.
- Export creates a JSON blob, sanitizes the download base name, appends a temporary anchor, and revokes the object URL after the download starts. The revocation was observed.
- No network upload occurs; files are read and written locally by the browser.

### SVG and asset safety

- `assets/branding/app-icon.svg` and `logo-horizontal.svg` contain no scripts, event-handler attributes, external references, `<foreignObject>`, embedded images, entities, `@import`, or `url(...)`.
- The inline SVG sprite has no script or external reference. Phase 4 replaced the static data-URI favicon with the supplied local `assets/branding/app-icon.svg`. The current header uses the supplied horizontal wordmark on a cream plate; both SVG paths stay inside the repository. The Phase 4 re-scan preserved the clean asset properties recorded here.
- No untrusted SVG markup is inserted with `innerHTML`.

### Resource exhaustion and solver integrity

- Search caps verified in source: `MAX_SOLUTIONS = 20000`, `SEARCH_TIME_MS = 3000`, history `MAX_HISTORY = 40`.
- Recursion depth is bounded by the number of colours (at most 10). Candidate filtering is bounded by board cells and eight neighbours.
- `analyze()` enforces one orthogonal component per used colour, exact colour count, manual-cat row/column/colour limits, and eight-way no-touching.
- `searchSolutions()` enforces row, column, eight-way touching, and manual cats as hard constraints. It uses minimum-remaining-values ordering and records all enumerated solutions for candidates.
- `solve()` refuses empty, incomplete, structurally invalid, or impossible-colour-count boards before searching.
- Capped or timed-out searches expose only `capped` or `inconclusive` status, suppress forced steps, and never claim uniqueness or no-solution. The help text states this.
- No maximum region-size constraint, selector, setting, error, or active enforcement remains.

Solver evidence:

| Scenario | Observed result |
|---|---|
| 4 × 4 column stripes | 2 solutions, 8 candidates, no forced claim |
| Same fixture with 4 manual cats | Unique solution, 4 cats |
| Unique 4 × 4 fixture with no manual cats | `Unique solution`, 4 forced steps, 4 candidate cells |
| 4 × 4 connected-region fixture with no arrangement | Exhaustive `No solution`; no candidates |
| 10 × 10 column stripes | Solution cap reached; `Provisional results`; 77 provisional candidates; no forced cards; actions disabled |
| 10 × 10 hard no-solution fixture with patched clock | `Search inconclusive`; no candidates or forced steps; actions disabled |

The inconclusive case required a temporary test-only `performance.now` patch to force the time cap deterministically. It is a harness technique, not application code.

### Network, privacy, and dependencies

- HTML, CSS, and JavaScript contain no external URLs, remote fonts, analytics, telemetry, or runtime libraries.
- No package manifest, bundler, framework, backend, or project dependency was added.
- Playwright and axe were installed only in the temporary harness directory outside the repository and are not shipped.
- The only network requests observed are the app's own HTML, CSS, and JavaScript from the local static server.

### Git and secrets

- Current tracked files and the available commit history were scanned for common token/key/private-key patterns: none found.
- The Phase 3 source diff contained only the three fixes above; no generated artifacts or test fixtures were staged.
- No remote is configured yet. Branch is `main`; no rebase, reset, or force-push was performed.
- Workflow permission and pinning checks were deferred to D-01 in Phase 3 because no workflow existed then. D-01 was resolved and verified in Phase 6.

### UI and accessibility

- Axe 4.10.2: 18/18 scans passed after fixes, covering a populated 6 × 6 solved board with toast, help dialog, load dialog, and clear-confirmation dialog; dark and light themes; 1281 px and 390 px, with the populated board also at 768 px.
- Keyboard: 13/13 checks passed for skip link, palette arrows/Home/End/wrap, board arrows/Enter, undo/redo, file menu, help dialog focus containment/Escape/restoration, destructive confirm focus, theme persistence, and reduced motion.
- Additional keyboard scrolling: history and dialog body both respond to Page Down and show a 2 px focus outline.
- Palette: exactly 12 colours, 6/4/3 equal-width columns at desktop/tablet/mobile, no clipped labels, no bottom erase swatch, and Paint/Erase/Cat modes remain.
- Layout: boards 4-10 render the correct cells and ARIA counts; no horizontal page overflow at tested widths; 10 × 10 mobile cells measured 28 px with a 3-column palette.
- Themes: dark and light rendered and inspected at 1281, 768, and 390 px. No clipped controls or overlap was seen. The document title is `Meowdoku Solver` and the header `<h1>` gets that accessible name from the wordmark alt text; the old header context line is absent.
- Controls: validate, solve, next step, place forced cat, candidate overlay, remove all cats, clear history, resize confirmation, clear board, save/load, import/export, file menu, theme, and help were exercised successfully.
- Reduced motion collapses transitions and animations under `prefers-reduced-motion: reduce`.
- Limitations: axe zero violations is not proof of WCAG conformance; colour contrast was machine-checked but not expert-reviewed; no real screen-reader or cross-browser pass was possible (D-02, D-03).

## Phase 4 and Phase 5 revalidation

### Phase 4 branding

- Both supplied SVGs were re-scanned after integration. They remain self-contained vectors with no scripts, event handlers, external references, embedded images, `<foreignObject>`, CSS `url()`, `@import`, or entities.
- The favicon and header wordmark use local repository paths. Neither is injected as markup.
- The brown horizontal wordmark is placed on a cream plate in the header so it stays legible on the dark theme. The raw wordmark is still not placed directly on the dark background.
- Header/favicon checks passed 6 / 6 across both themes and 1281/768/390 px after the Phase 4 integration, with no overflow. The later centered-wordmark header was rechecked at 1281, 1120, 821, 820, 768, 720, 430, 390, and 320 px with no overlap or overflow. Details are in `docs/TESTING.md`.

No new security, solver, or accessibility finding was introduced by the branding change.

### Phase 5 documentation

- User-facing docs were written from the actual source and the recorded test evidence, not from the original prompt's assumptions. The checked claims are listed in `docs/TESTING.md`.
- The README screenshots are real captures of the running app at 1281 × 1391. They contain only the sample puzzle, interface, and the committed brand artwork; no account, token, local path, or private browser data is visible.
- The documentation states that `localStorage` is unencrypted and clearable, that the browser evidence is Chromium-only, and that no WCAG or security certification is claimed. The Pages target was still unverified at Phase 5 time; Phase 6 later deployed and verified it.
- Internal links, image paths, and heading anchors were checked with a temporary script: 33 Markdown files, 28 relative targets, zero missing targets, zero unbalanced code fences. Public non-Pages links returned HTTP 200 at check time. The Pages target returned 404 at Phase 5 time because Phase 6 had not deployed yet.
- No secret, token, or personal data was added to the documentation or screenshots. The workflow-security review (D-01) was completed in Phase 6.

No new Critical, High, Medium, or Low finding was identified in the documentation pass.

## Phase 6 release verification

- **Repository:** public `knightlesssword/meowdoku-solver`; `main` pushed with all prior history preserved.
- **Workflow:** `.github/workflows/deploy-pages.yml` at `6cb94a4`; `actions/checkout` pinned to the v7.0.1 commit; only `contents: write`; main-only; serialized by concurrency.
- **Workflow runs:** push run `41068060948` succeeded for `6cb94a4`; manual `workflow_dispatch` run `41068782251` succeeded and produced no new deployment commit because the artifact was unchanged. The cat-icon and UI deployments succeeded in `41073235011` and `41083159875`.
- **Deployment branch:** `gh-pages` has three commits: initial `7f3fc83`, cat-icon fix `0a57cf3`, and UI refinement `f857d8e`. The current tree contains only `.nojekyll`, `index.html`, `css/style.css`, `js/app.js`, `assets/branding/app-icon.svg`, and `assets/branding/logo-horizontal.svg`.
- **Pages configuration:** source `gh-pages`, path `/`, build type `legacy`, HTTPS enforced, status `built`; latest build `1327518875`.
- **Public site:** <https://knightlesssword.github.io/meowdoku-solver/> returned HTTP 200. HTML, CSS, JavaScript, SVG, and `.nojekyll` returned HTTP 200 with the expected content types.
- **Live smoke tests:** the deployed app initialized with 64 empty cells and 12 palette colours; paint, erase, cat, validate/autosave, import, solve, candidate overlay, forced-step controls, named save/load, export, theme switch, help dialog, and a 390 px layout all passed. No page or console errors were observed, all five initial requests were same-origin, and export omitted `maxRegion`.
- **Post-release layout fix:** `4c69130` prevents the cat SVG from inflating a grid cell. The live 4 × 4 through 10 × 10 matrix at 1281 px and 390 px passed 14 / 14 cases: square board, uniform cell sizes, correct row count, absolutely positioned cat inside the cell, and no horizontal overflow.
- **Private vulnerability reporting:** enabled on the repository and linked from `SECURITY.md` and the issue-template configuration.

No new Critical, High, Medium, or Low finding was introduced by publication. The live site is now verified; the remaining gaps are the previously recorded compatibility, assistive-technology, performance, and temporary-harness limitations.

## Post-release UI refinement review

- The header now centers the supplied horizontal wordmark on a cream plate. The plate preserves wordmark contrast on the dark theme; the app icon remains the favicon. The status pill and theme/help controls remain top-right.
- The File menu moved next to Clear board. It stays inside the viewport at 1281 px and 390 px, closes on Escape, and restores focus.
- The three-rule summary moved under the canvas heading; the old explanatory sentence and four sidebar subtitles were removed without removing diagnostics, rules, or actionable hints.
- The footer now contains only the heart credit and a GitHub profile link. The local-first and solver-cap text moved into the help dialog. The first axe pass found a color-only link distinction; a visible underline fixed QA-04.
- Validate remains because it writes the autosave recovery point and records validation history. Live diagnostics alone do not autosave.
- Undo/Redo and Solve targets were enlarged, and applying a forced cat now recomputes deductions automatically.
- Verified at 1281, 1120, 821, 820, 768, 720, 430, 390, and 320 px with no header overlap or page overflow. The live forced-step test moved from step 1 of 4 to step 1 of 3 with Next/apply enabled.
- Axe passed 18 / 18 populated/dialog scans and 4 / 4 empty-board scans after the link fix; the live HTTPS populated/dialog rerun also passed 18 / 18. Core, keyboard, controls, and solver regressions passed.

No new unresolved finding remains from the UI refinement.

## Residual risks

1. Restored autosaves persist until Start fresh or a later Validate/Solve, so repeated prompts and pre-edit snapshots are possible (A-01).
2. The main thread can freeze briefly near the search caps on slow hardware; there is no cancel control (A-05).
3. `localStorage` is unencrypted and clearable; users must export important puzzles (A-04).
4. No CSP or hosting security headers are configured in the app or the static Pages deployment (A-03).
5. Screen-reader announcement behaviour and non-Chromium browsers are unverified (D-02, D-03).
6. The temporary test harness is outside version control; the recorded results are reproducible only by recreating the scripts or adding a future non-runtime test setup.
7. The repository does not configure a protected `main` branch or a GitHub environment approval gate. The deployment job has the write access it needs, so maintainer account security and repository branch rules remain operational controls.
8. The workflow action pin must be reviewed and updated deliberately. A future floating tag or unpinned action would weaken the current supply-chain posture.

## Gate decision

The Phase 3, Phase 4, Phase 5, and Phase 6 gates are satisfied for the reviewed scope. No known Critical or High issue remains; all confirmed defects were fixed and regression-tested; branding and documentation were revalidated; the workflow is pinned, least-privilege, main-only, serialized, and non-force-pushing; and the public Pages URL, runtime assets, and live application were verified. Remaining items are accepted residual risks or deferred compatibility, assistive-technology, performance, and harness limitations.
