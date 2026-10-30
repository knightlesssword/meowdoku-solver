# OpenCode Skills, Tools, and Capability Discovery

## Purpose

Use capabilities that are genuinely available in the current OpenCode environment. Do not assume a command, agent, skill, MCP connector, browser, test runner, or GitHub integration exists.

## Before using tools

1. Inspect repository instructions such as `AGENTS.md`, `AGENT.md`, `.opencode/`, `.opencode/agents/`, `.opencode/skills/`, and any project-specific development guide. Respect the repository's own instructions unless they conflict with the safety rules in `MASTER.md`.
2. Inspect OpenCode's available agents and installed skills using the version's documented discovery mechanism. Do not invent configuration syntax or agent names.
3. Identify whether browser automation (for example Playwright), HTML validation, accessibility checking, JavaScript syntax checking, and GitHub CLI/API access are genuinely available.
4. Prefer existing tools and existing test infrastructure. Avoid adding permanent dependencies merely to produce a report.

## Agent usage

Use the role definitions in `agents.md`. If subagents are unavailable, execute the same inspections sequentially. If agent tools lack isolated worktrees or write restrictions, make them read-only by instruction and do not run concurrent write tasks.

## Testing capabilities

- Use `node --check js/app.js` only if Node.js is installed. This is a syntax check, not a browser test.
- Use an existing browser automation setup if one is already available.
- If Playwright is available globally or as an existing development tool, use it without adding it as a runtime dependency.
- Test localStorage, dialogs, pointer interactions, browser storage failures, and file import/export in a real browser where possible.
- Use manual testing if automation is unavailable, and clearly label it manual.
- Do not state that accessibility is fully compliant based only on a visual inspection.

## GitHub and deployment capabilities

- Inspect `gh auth status` only if GitHub CLI is installed.
- Use the authenticated GitHub integration/CLI only if connected and authorized.
- Do not request, print, or commit access tokens.
- If Pages settings cannot be inspected or changed, provide precise manual steps rather than pretending configuration succeeded.

## Figma assets

The user has already created an editable logo design in Figma: https://www.figma.com/design/JzBKBmu4Ey5kRYBJSYpZ93

The user will export SVG assets and add them to the repo. Use those actual repository files. Do not assume the coding agent has access to the Figma connector or can export the assets. Do not create replacements when the user-supplied files exist.

## Evidence and reporting

For each tool, distinguish:
- available and actually used;
- available but not used;
- unavailable;
- attempted but failed.

Never invent tool output, test results, deployment status, or repository permissions.
