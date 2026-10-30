# Meowdoku Solver - UI and Product Design Requirements

## Design objective

Refine the existing application, do not replace it with a generic dashboard or unrelated visual concept. The app is a focused puzzle workbench. Its board is the primary interaction surface; controls and solver reasoning should remain discoverable without overwhelming the board.

## Product identity

The visual direction is warm, friendly, cat-centric, and puzzle-oriented. Use the user-supplied Figma logo assets and `brand.md`. References include the user's gameplay screenshots and a warm illustrated banner. Treat screenshots as inspiration and product context, not assets to copy into the interface.

## Layout principles

- Keep the puzzle board visually dominant.
- Maintain a balanced board/sidebar layout on desktop.
- Reorganize into a logical vertical flow on tablet/mobile.
- Preserve stable cell sizes and usable touch targets.
- Do not squeeze diagnostics into unreadable columns.
- Avoid horizontal overflow, clipped palette labels, and sticky sidebars that trap content on small screens.
- Keep controls near the board operations they affect.

## Palette requirements

- Exactly twelve paint colours; preserve the existing colour indices and hex values because saved board data stores indices.
- No `none`/erase colour in the palette.
- Erase remains a segmented mode alongside Paint and Cat.
- Equal-width colour buttons in a responsive CSS grid: 6 columns desktop, 4 tablet, 3 narrow/mobile (adjust breakpoints only with evidence from tested widths).
- Consistent gaps, button heights, swatch sizes, label alignment, selection borders, and focus states.
- Avoid the current `auto-fit` ragged-row result.

## Redundancy cleanup

Remove the header line `8 × 8 · Untitled puzzle`, its DOM dependency, and update function/calls that exist only for that line. Keep the puzzle name input for named saves. The document title is fixed to `Meowdoku Solver`.

Audit repeated painted-cell counts, selected-mode/colour labels, and overlapping status badges. Show each important piece of information once unless the repeated presentation has a clearly different purpose. Preserve useful diagnostics, rule explanations, keyboard help, error messages, and accessible names.

## Theme requirements

- Dark theme remains the default unless actual source/product requirements establish otherwise.
- Light theme must be designed and tested independently, not treated as an inversion.
- Ensure sufficient contrast for text, palette selection, cells, candidate markers, conflicts, dialogs, toasts, disabled controls, and focus indicators.
- Persist theme preference using the existing key if verified.
- Avoid unapproved decorative gradients, glassmorphism, excessive shadows, or 3D effects inside the functional UI.

## Interaction and accessibility

Preserve keyboard grid navigation, palette keyboard operation, semantic roles, skip link, accessible dialog behaviour, focus restoration, visible focus, aria states, reduced motion, and non-colour-only error communication. Every visible control must work and communicate its state.

## Visual QA

Review actual browser renders at representative widths, including wide desktop, tablet, and narrow mobile. Check both themes. Record screenshots only if captured from the running app. Do not claim a layout passed based only on reading CSS.
