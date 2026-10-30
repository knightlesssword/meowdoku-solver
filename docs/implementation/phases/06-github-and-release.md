# Phase 06 - GitHub Commits, Workflow, and Pages Publication

Read `MASTER.md`, `memory.md`, `agents.md`, `github-pages.md`, and `testing.md`.

## Goal

Commit and publish the finished application while preserving all existing Git history.

## Pre-push review

Inspect:

```bash
git status --short --branch
git diff
git diff --cached
git log --oneline --decorate -20
git remote -v
```

Stage only intended files. Scan staged diff for credentials, private data, generated noise, and unrelated edits. Ensure all tests that can run have run. Do not add user prompt packs to the public README or static deployment unless intentionally desired; prompt docs under `docs/implementation/` are developer material and should not be copied into the Pages output.

## Commits

Use Conventional Commits. Make logical commits for product corrections, autosave, refactor, security fixes, branding, docs, and deployment workflow. Adjust commit grouping to actual work. Do not create empty/no-op commits. Do not amend unrelated commits or alter existing history.

## Branches and remote

- Confirm current branch is `main` before source publication.
- Fetch and inspect remote state.
- Preserve existing commit ancestry.
- Push normally to `origin main`.
- Never rebase or force-push.
- If diverged, reconcile through safe merge after inspecting both sides.

## GitHub Actions

Create `.github/workflows/deploy-pages.yml` following `github-pages.md`. Inspect official current documentation for any third-party actions and pin to reviewed immutable SHAs. Avoid secrets. Deployment must not use force-push and must serialize concurrent runs.

## Pages configuration

Set Pages branch source to `gh-pages`, root directory. If permissions prevent automatic configuration, give precise UI steps. Do not claim configured when not verified.

## Live verification

Verify workflow run status, deployed commit, gh-pages history, files at branch root, public URL, asset loading, browser console, and application smoke test. Distinguish workflow success from live site verification.

## Final report

Update `docs/IMPLEMENTATION_REPORT.md` with commit IDs, branch, push status, workflow run, Pages configuration status, public URL test, tests run, and outstanding limitations. No unsupported success claims.
