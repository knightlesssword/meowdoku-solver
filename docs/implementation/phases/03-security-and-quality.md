# Phase 03 - Security, Solver, UI, and Accessibility Audit

Read `MASTER.md`, `agents.md`, `security.md`, `design.md`, `architecture.md`, and `testing.md`.

## Goal

Audit the refactored app. Use read-only agents for independent findings. The orchestrator owns all fixes and integration.

## Security

Follow every category in `security.md`: dynamic DOM/XSS sinks, JSON validation, localStorage, file handling, SVG safety, search resource exhaustion, privacy/network requests, dependencies, Git secrets, and workflow permissions.

## Solver integrity

Inspect all puzzle constraints and candidate/search logic. Confirm one cat per colour/row/column, no touching including diagonal, one orthogonally connected region per colour, manual cats as hard constraints, all cells painted before search, and no maximum region-size constraint. Confirm capped/time-limited results are provisional and forced steps suppressed when search is incomplete.

## UI/accessibility

Follow `design.md`. Test both themes and representative desktop/tablet/mobile widths. Inspect keyboard use, focus, dialogs, aria state, reduced motion, contrast, pointer/drag behaviour, and redundant information.

## Fix policy

Fix confirmed defects with minimal, tested changes. Do not rewrite working modules for style alone. Do not add a framework, runtime dependency, or build system. Clearly label uncertain findings as hypotheses and do not call them vulnerabilities.

## Outputs

Create/update:
- `docs/QUALITY_AUDIT.md` - findings, severity, evidence, remediation, residual risks;
- `docs/TESTING.md` - test environment, actual commands, actual outcomes, untested areas.

## Gate

Re-run relevant regression tests after each fix. Inspect diff. Do not proceed to deployment if any known critical/high issue remains without an explicit mitigation or blocker report. Do not claim total security or accessibility compliance.
