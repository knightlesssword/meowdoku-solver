# OpenCode Agent Delegation Rules

## Objective

Use multiple agents only where parallel work reduces missed issues or context overload. Source changes, Git operations, and deployment require a single accountable owner.

## Roles and ownership

### Primary orchestrator - sole integration owner

Owns all application source changes, agent coordination, review of findings, conflict resolution, integration, test execution, commits, pushes, GitHub configuration, deployment, and final reporting.

### Agent: architecture analyst

- Read-only.
- Inspect full app and report feature inventory, state model, rendering, event flow, persistence, solver design, refactor risks, and compatibility concerns.
- Do not edit files, switch branches, stage files, commit, or push.

### Agent: security auditor

- Read-only.
- Audit DOM injection/XSS, imported data, storage, file handling, browser APIs, resource consumption, privacy, and supply-chain exposure.
- Return findings with precise file/line references, attack preconditions, severity, and remediation suggestions.
- Do not edit or commit.

### Agent: UI/accessibility reviewer

- Read-only.
- Review desktop/tablet/mobile layouts, both themes, palette, redundant information, interaction affordances, keyboard paths, focus management, contrast, motion, and semantics.
- Return reproducible findings and suggested fixes. Do not edit.

### Agent: documentation maintainer

- May write only documentation files explicitly assigned by the orchestrator.
- Must derive claims from the actual finished source and test evidence.
- Must not modify application HTML/CSS/JS, workflow YAML, templates, Git configuration, or branches.
- Must not commit or push.
- Draft after the architecture and behaviour are established, not before.

### Optional agent: test designer

- Read-only unless explicitly assigned a dedicated test file.
- Convert the feature inventory and acceptance criteria into concrete test cases, including legacy JSON and autosave failure cases.
- Do not alter app source.

## Safe parallelism

Parallelize independent read-only reviews. Documentation can be drafted in parallel only after the orchestrator confirms actual implementation behaviour and grants non-overlapping file ownership.

Never:
- let two agents modify the same file;
- let agents edit the same working tree concurrently without enforced isolation;
- let any subagent commit, push, rebase, checkout branches, or modify Git state;
- ask a read-only auditor to apply a patch;
- blindly merge agent-generated changes.

If OpenCode cannot guarantee file-level permissions or isolated worktrees, run agents sequentially. The goal is correctness, not agent count.

## Delegation brief format

For each task, provide:
1. relevant files and read-only/write permissions;
2. exact scope and exclusions;
3. relevant phase prompt and supporting docs;
4. required output format;
5. requirement to cite source locations and distinguish confirmed facts from hypotheses;
6. requirement not to edit, commit, or push unless expressly authorized.

## Required agent report format

- Summary
- Files inspected
- Confirmed findings, with line references
- Suspected findings, clearly labelled
- Impact/severity
- Reproduction or evidence
- Recommended remediation
- Regression tests needed
- Questions/blockers

Orchestrator reviews every report, checks whether findings still apply after other phases, and decides whether to fix, defer, or reject each recommendation.
