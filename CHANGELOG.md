# Changelog

All notable changes to Meowdoku Solver are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Centered the horizontal wordmark in the header on a cream contrast plate, kept the status/theme/help controls top-right, and moved the File menu beside Clear board.
- Moved the three-rule summary directly under the Puzzle canvas heading and removed redundant sidebar subtitles.
- Replaced the footer status text with a "Made with ❤️ by knightlesssword" credit linking to GitHub; the local-first and solver-cap details remain in the help dialog.
- Increased Undo/Redo and Solve puzzle button sizes.
- Kept Validate because it writes the recovery autosave and records validation history; diagnostics continue to update live.

### Fixed

- Placing a cat made the cell grow to the SVG's default 150 px height and overlap the rows beneath it, breaking the grid layout. Cat icons are now absolutely positioned and sized against the cell, and cells cannot expand past their grid track.
- Applying a forced cat cleared the deduction set and disabled Next step until Solve was pressed again. The app now recomputes the remaining deductions automatically.
- The new footer credit link relied on color alone; it now has a visible underline.

## [1.0.0] - 2026-10-30

### Added

- Initial release of Meowdoku Solver as a dependency-free static web application.
- Painting workspace for boards from 4 × 4 to 10 × 10, with twelve colours, Paint / Erase / Cat modes, pointer dragging, row and column rulers, and keyboard grid navigation.
- Live structural diagnostics for unpainted cells, disconnected colour regions, cats on unpainted cells, and row, column, colour, and eight-way touching-cat conflicts.
- Connected-region validation with no maximum region size. Each used colour must form exactly one orthogonally connected region.
- Bounded backtracking solver with minimum-remaining-values ordering, manual cats as hard constraints, candidate overlays, solution counts, and forced deductions.
- Solver status reporting for unique, ambiguous, no-solution, provisional, and inconclusive results.
- Undo/redo, bounded activity history, named browser saves, automatic recovery before Validate or Solve, and JSON import/export.
- Dark and light themes, responsive desktop/tablet/mobile layouts, reduced-motion handling, keyboard-accessible dialogs, focusable scroll regions, and skip navigation.
- Supplied app icon and horizontal wordmark assets, including the icon as the local SVG favicon and the wordmark as the centered header brand.
- Project documentation, issue and pull-request templates, MIT license, contribution guide, code of conduct, and security policy.
- GitHub Actions deployment from `main` to `gh-pages`, publishing only the runtime HTML, CSS, JavaScript, app icon, and `.nojekyll`. The initial public site went live at <https://knightlesssword.github.io/meowdoku-solver/> on 2026-10-30.

### Changed

- Split the original single-file application into `index.html`, `css/style.css`, and `js/app.js` while preserving behaviour.
- Removed the maximum region-size setting and all active enforcement. Legacy `maxRegion` values are accepted and ignored.
- Removed the bottom-of-palette erase swatch. Erasing remains available through the segmented Erase mode and also removes cats.
- Replaced the flexible palette layout with an equal-width 6 / 4 / 3 responsive grid.
- Fixed the document title and header to `Meowdoku Solver` and removed the old board-size/puzzle-name context line.
- Reduced duplicated painted-cell and active-mode information while keeping diagnostics, rules, and actionable feedback.
- Moved automatic saving to the start of Validate and Solve, including early-return paths, using a dedicated recovery key separate from named saves.
- Updated the exported payload to schema version 2 without the retired `maxRegion` field. Versions 1 and 2 remain importable.

### Fixed

- A failed autosave write could leave an older recovery snapshot in storage. The failure path now removes the stale key before showing a one-time warning.
- The populated history panel and narrow dialog body were scrollable but not keyboard-accessible. Both now accept focus and show a visible focus outline.
- Opening the app with a valid autosave now offers an explicit **Restore board** or **Start fresh** choice instead of silently applying data.

### Security

- All imported, saved, and recovered payloads pass through a shared validator before changing the active board. Unsupported versions, malformed data, out-of-range cells or cats, duplicate cats, invalid modes, and invalid colours are rejected atomically.
- JSON imports are limited to 5 MB, export filenames are sanitized, and object URLs are revoked after download.
- The app makes no runtime network requests and ships no analytics, remote fonts, external libraries, or backend.
- Supplied SVG assets were reviewed for scripts, event handlers, external references, embedded images, and `foreignObject` before integration.
- Capped or timed-out searches never produce uniqueness or forced-placement claims.

## Release links

- [Version history](https://github.com/knightlesssword/meowdoku-solver/commits/main)
