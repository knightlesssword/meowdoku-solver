# Phase 04 - Meowdoku Branding and UI Refinement

Read `MASTER.md`, `memory.md`, `brand.md`, and `design.md`.

## Goal

Integrate the actual SVG assets supplied by the user and finish the UI refinements while preserving the current product's functionality.

## Asset discovery

Inspect repository root, `assets/`, and `assets/branding/`. Identify actual supplied logo and icon filenames. If the assets are missing, do not fabricate them or reference broken paths. Report that the user must add the export before integration. Do not overwrite or duplicate assets.

## SVG review

Inspect SVG markup for scripts, event attributes, external resource references, `foreignObject`, linked assets, and unnecessary embedded data. Keep self-contained, safe vector artwork. Preserve SVG aspect ratio and avoid converting vectors to raster images without a real need.

## Integration

Use icon in compact header/favicon. Use horizontal wordmark where it fits, especially README hero. Ensure contrast on light and dark surfaces. The logo's warm brown wordmark may be inappropriate on dark surfaces; use theme-aware text with the icon rather than forcing illegible artwork.

Use local relative paths only. Add correct alt text and dimensions. No external Figma resource URLs at runtime.

## Refinement

Apply the palette grid, removed context-line, redundant UI cleanup, and other design requirements from `design.md`. This phase must not undo Phase 01 fixes or introduce a generic redesign. Maintain board prominence, warm brand cues, good contrast, and usable mobile layout.

## Gate

Verify actual asset paths, favicon, header, README-ready wordmark, dark/light theme contrast, and mobile layout. Run application regressions after any UI changes. Update brand documentation with only assets actually present.
