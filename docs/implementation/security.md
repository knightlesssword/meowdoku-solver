# Meowdoku Solver - Security Audit Specification

## Scope

This is a local-first static browser application. The absence of a backend reduces some attack surfaces but does not eliminate risks from untrusted JSON, user-controlled names, DOM rendering, browser storage, file handling, malicious SVGs, or expensive solver inputs.

## 1. DOM injection and XSS

Inventory every use of:
- `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`;
- dynamic SVG or markup generation;
- dynamic attributes, CSS values, selectors, and event handlers;
- template literals containing user-controlled or imported values.

Trace data from puzzle names, import payloads, saved puzzle labels, diagnostics, generated messages, and filenames to rendering sinks. Prefer DOM construction plus `textContent`. Where markup templates remain, prove that every interpolated value is controlled or safely escaped. Validate any dynamic URL or CSS value instead of interpolating arbitrary strings.

## 2. JSON and schema validation

Validate the complete import/autosave/save payload before changing active application state. Check:
- object shape and supported schema version;
- board dimensions (4 through 10, if still the verified product range);
- exact cell array length;
- integer cell values, including only `-1` or a valid stable colour index;
- cat array shape, integer bounds, and duplicates;
- selected colour and supported interaction mode;
- optional name type and maximum length;
- unsupported or malformed values.

Reject a malformed payload atomically. A failed import must leave the active puzzle unchanged. Treat legacy `maxRegion` as an ignored, obsolete optional property. It must neither reject otherwise-valid legacy data nor affect current logic.

Do not confuse data-format validation with puzzle-rule validation. A structurally valid imported puzzle may still be incomplete or violate puzzle rules; that is a separate diagnostics concern.

## 3. localStorage

Review key namespacing, serialization, parsing, quota errors, storage-disabled cases, corrupted values, duplicate names, and partial-write risk.

Preserve existing named save keys and theme preference key if verified in source. Implement autosave in a separate namespaced key. Autosave failure must not block validation or solving. Do not claim browser localStorage is encrypted, confidential, or durable backup. Document that users can clear it through browser settings and should export important puzzles.

Avoid leaving an old autosave available after the user explicitly starts fresh or after an empty-board action that should invalidate the previous recovery point.

## 4. File import/export

Review file size limits, FileReader errors, JSON parse errors, schema validation, generated download names, object URL cleanup, and error feedback. Ensure malformed or oversized files are rejected without mutating the board. Ensure object URLs are revoked after the download has been initiated.

## 5. SVG and asset safety

Inspect user-supplied SVGs before including them. Reject or remove scripts, event-handler attributes, external resource references, unexpected `foreignObject`, or unneeded embedded data. Prefer simple local vector assets. Do not place untrusted SVG markup directly into the DOM with `innerHTML`.

## 6. Resource exhaustion and solver integrity

Review recursion depth, branching factor, allocations, UI thread blocking, timers, history size, and repeated DOM work. Verify the actual search caps from source rather than assuming them.

If the search is capped or timed out:
- results must be marked provisional/inconclusive;
- no uniqueness claim may be made;
- no forced deduction may be presented as proven from an incomplete solution set;
- zero results before the search cap must not be described as proof of no solution if the search did not finish.

Do not remove safeguards to make a demo appear faster. Any algorithmic optimization needs equivalence/regression tests.

## 7. Network, privacy, and dependencies

Verify there are no tracking scripts, analytics, remote fonts, telemetry, external runtime libraries, or puzzle-data network requests. Static hosting requests for the app's own HTML/CSS/JS/logo assets are expected. Do not add permissions or APIs that are unrelated to the product.

## 8. Git and workflow security

- Scan staged changes for secrets and personal data.
- Use least-privilege GitHub Actions permissions.
- Pin third-party workflow actions to reviewed immutable commit SHAs.
- Do not expose secrets in logs.
- Do not deploy arbitrary branches or pull-request code with write permissions.
- Do not permit deployment branch updates to trigger recursive deployments.
- Never force-push deployment output.

## 9. Severity and reporting

Use Critical, High, Medium, Low, and Informational. A finding must include:
- affected file and line/function;
- preconditions and attack surface;
- impact;
- reproduction or evidence;
- remediation;
- regression test.

Label speculative concerns as hypotheses. Do not invent vulnerabilities. Record fixed, accepted, deferred, and unresolved findings separately in `docs/QUALITY_AUDIT.md`.
