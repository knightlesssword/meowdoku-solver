# Meowdoku Solver - Execution Plan

This plan governs the order of work. Execute one phase at a time. Each phase must pass its gate before dependent phases begin.

## Phase map

| Phase | Prompt | Main owner | Gate |
|---|---|---|---|
| 0 | `phases/00-reconnaissance.md` | Orchestrator + read-only agents | Correct source and Git state identified; baseline documented |
| 1 | `phases/01-feature-corrections.md` | Orchestrator | All requested behaviour changes work in the original single-file app |
| 2 | `phases/02-refactor-and-comments.md` | Orchestrator | Three-file app works with no regression |
| 3 | `phases/03-security-and-quality.md` | Security/UI agents read-only, orchestrator fixes | Confirmed findings fixed; regressions and audit recorded |
| 4 | `phases/04-branding-and-design.md` | Orchestrator; design reviewer read-only | Supplied SVGs safely integrated; themes/responsive UI verified |
| 5 | `phases/05-documentation.md` | Documentation agent + orchestrator review | Docs accurate and links/templates validated |
| 6 | `phases/06-github-and-release.md` | Orchestrator only | Commits pushed to main; deployment workflow configured and verified |

## Execution details

### Phase 0 - reconnaissance

- Inspect `git status`, branches, remotes, history, tags, ignored files, existing workflows, and Pages settings where accessible.
- Establish whether the latest ~4,782-line revision is already in the repo, present locally, or needs to be added without overwriting user changes.
- Inventory actual features, functions, selectors, storage keys, schema versions, solver limits, and existing tests.
- Run baseline syntax and available runtime checks.
- Ask no questions unless an essential decision cannot be inferred and an unsafe action would otherwise result. Prefer reporting a blocker over destructive assumptions.

### Phase 1 - feature corrections

Implement all required product corrections while the app is still in its original file. This isolates behaviour changes from extraction. Test legacy puzzle data, no region limit, erase semantics, palette layout, removed header context, redundant info, and autosave/recovery.

### Phase 2 - refactor

Extract HTML/CSS/JS without changing intended behaviour. Keep the application dependency-free. Confirm relative paths, local opening, and root `index.html` hosting. Compare the feature inventory before and after.

### Phase 3 - security and quality

Conduct source-level security, solver correctness, UI, accessibility, performance, and browser regression reviews. Fix confirmed defects. Do not turn speculative concerns into claimed vulnerabilities. Produce `docs/QUALITY_AUDIT.md` and `docs/TESTING.md` with actual evidence.

### Phase 4 - branding and design

Inspect user-supplied Figma SVG exports. Integrate icon and wordmark appropriately. Refine the existing UI only as needed to support the supplied identity and remove redundant UI. Do not recreate the user's inspiration screenshots as app assets.

### Phase 5 - documentation

Create README, changelog, MIT license, contribution guide, code of conduct, security policy, architecture, testing, deployment, quality audit, and implementation report. Add GitHub issue and PR templates. All claims must match verified functionality.

### Phase 6 - GitHub release and Pages

Review all diffs and staged files, scan for secrets, commit logical units, push normally to `main`, and configure deployment from `main` to `gh-pages`. Never rewrite branch history. Verify the real public URL and deployed assets.

## Commit strategy

Use Conventional Commits. Suggested logical units:

1. `fix(puzzle): remove maximum region-size constraint`
2. `fix(ui): simplify erase control and palette layout`
3. `feat(persistence): autosave before validation and solving`
4. `refactor(app): split html css and javascript`
5. `fix(security): harden puzzle data and browser storage handling`
6. `feat(branding): integrate meowdoku logo assets`
7. `docs(project): add open-source project documentation`
8. `ci(pages): deploy main to gh-pages`

Adapt the number and scope to actual diff boundaries. Do not manufacture commits for tiny edits. Before committing, check `git diff --cached` and `git status`. Do not amend, squash, or rebase existing commits.

## Stop conditions

Stop and report before a risky action if:
- repository origin is not the expected repository and cannot be reconciled safely;
- uncommitted work conflicts with the intended edit;
- the local source is newer than the supplied source and the correct source cannot be established;
- publishing would require force-push, rebase, deletion of unrelated content, or credential exposure;
- an external permission blocks Pages configuration or deployment.

Continue independent safe tasks where possible. Record blockers and manual next steps.
