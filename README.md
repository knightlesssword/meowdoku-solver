# Meowdoku Solver Prompt Pack

This archive contains the phased OpenCode prompt kit and GitHub templates.

## Start here

1. Copy `docs/implementation/` into the repository's `docs/implementation/` directory.
2. Copy `.github/` into the repository root, merging with any existing `.github` content. Do not overwrite existing workflows/templates without inspecting them.
3. Start an OpenCode session at the repository root.
4. Give the agent the instruction in `docs/implementation/MASTER.md`.
5. Ask it to follow `plan.md`, reading and executing one phase prompt at a time.

## Files

- `MASTER.md`: main instruction and read order.
- `memory.md`: stable project facts and decisions.
- `plan.md`: phase sequencing and gates.
- `agents.md`: multi-agent roles and write ownership.
- `skills.md`: capability discovery and tool-use rules.
- `security.md`: security audit specification.
- `design.md`: UI and accessibility requirements.
- `brand.md`: Figma asset integration.
- `architecture.md`: target structure and invariants.
- `testing.md`: regression matrix.
- `github-pages.md`: workflow/deployment requirements.
- `phases/`: six execution prompts.
- `.github/ISSUE_TEMPLATE/`: issue templates.
- `.github/pull_request_template.md`: PR template.

The prompt pack is intended for development guidance. Do not copy `docs/implementation/` into the public Pages deployment artifact unless you deliberately want those internal execution notes published.
