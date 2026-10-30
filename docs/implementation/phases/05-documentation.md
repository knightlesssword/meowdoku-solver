# Phase 05 - Open-Source Documentation and Templates

Read `MASTER.md`, `memory.md`, `architecture.md`, `testing.md`, `security.md`, `brand.md`, and `github-pages.md`.

## Goal

Create complete, polished, accurate documentation after application behaviour and structure are established.

## Required root files

- `README.md`: project identity, logo, description, badges only when truthful, live demo, features, rules, solver methodology, getting started, structure, privacy, contribution, security, license.
- `CHANGELOG.md`: Keep a Changelog format and accurate initial release entry. No invented history.
- `LICENSE`: full standard MIT text, copyright `knightlesssword`, 2026.
- `CONTRIBUTING.md`: setup, conventions, testing, issues, PRs, commit rules.
- `CODE_OF_CONDUCT.md`: Contributor Covenant 2.1 with official attribution.
- `SECURITY.md`: supported version and responsible vulnerability reporting.
- `.gitignore`: tailored to this static project; do not blindly paste a Node template.
- `.editorconfig`: simple consistent text settings.

## Required docs

- `docs/ARCHITECTURE.md`
- `docs/TESTING.md`
- `docs/DEPLOYMENT.md`
- `docs/QUALITY_AUDIT.md`
- `docs/IMPLEMENTATION_REPORT.md`

Use `architecture.md`, `testing.md`, `security.md`, and `github-pages.md` as the specification. The final implementation report must record actual work and test evidence, not promises.

## GitHub templates

Create:
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/pull_request_template.md`

Templates must be concise and useful. Config may link to the actual repository Discussions/security reporting only if those features are enabled; do not create dead links.

## README visual requirements

Use supplied logo if available. Use actual app screenshots only when captured from the working application. Save to `assets/screenshots/`. Never fabricate screenshots or use the decorative inspiration banner as a gameplay screenshot. All badges and links must be accurate.

## Accuracy rules

- Explain no maximum region-size restriction.
- Explain connected regions are still required.
- Explain autosave triggers and startup recovery accurately.
- Explain browser-local storage limitations accurately.
- Explain solver search caps and provisional results accurately.
- State that there is no npm/build step only after verifying.
- Use correct GitHub Pages URL.
- Do not claim external contributors, tests, security certifications, or historical releases without evidence.

## Gate

Check all internal links, file paths, badges, demo URL, logo references, and Markdown formatting. Ensure docs agree with source. Do not commit generated placeholders or empty screenshots.
