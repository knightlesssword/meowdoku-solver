# Meowdoku Solver - Brand and Asset Integration

## Source of truth

Figma file: https://www.figma.com/design/JzBKBmu4Ey5kRYBJSYpZ93

The file contains editable vector artwork for a horizontal logo lockup and a standalone app icon. The user will export the SVG assets and add them to the repository before implementation.

## Expected locations

Use these paths only if the matching files are actually present:

```text
assets/
└── branding/
    ├── meowdoku-logo.svg
    └── meowdoku-icon.svg
```

If the user supplies different filenames or locations, use the actual files and update references accordingly. Do not create duplicate copies or overwrite assets.

## Identity

- Name: Meowdoku Solver.
- Friendly cat + puzzle-grid motif.
- Warm cream and cocoa/brown as supporting brand colours.
- Orange/golden accent.
- Existing puzzle palette colours remain unchanged in value and index.
- Functional UI should remain crisp and restrained; the illustrated banner is mood inspiration, not an instruction to introduce a 3D mascot throughout the product.

## Usage

- Standalone icon: app header, favicon, and compact identity placements.
- Horizontal wordmark: README hero and documentation cover/hero where it fits.
- On the app's dark default theme, do not force the light-surface brown wordmark if contrast is poor. Prefer the icon with theme-aware text or use a separately supplied dark-safe asset if one exists.
- Preserve aspect ratio. Never stretch or crop the logo.
- Use local relative paths; do not load from Figma or external URLs at runtime.
- Provide meaningful alt text for informative images and empty alt text for decorative images.

## Asset inspection

Before integration, inspect SVG source for script elements, `on*` event attributes, `foreignObject`, external hrefs, linked images, external fonts, and unexpected embedded data. Retain only the necessary self-contained vector shapes and text. Do not inline untrusted SVG source using `innerHTML`.

## Favicon and metadata

Use the standalone icon for the favicon if it is a valid square icon. A data URI or local `.svg` favicon is acceptable. Add appropriate title and description metadata. Do not add social preview metadata referencing an asset that does not exist.

## Screenshots

The user supplied gameplay screenshots and a decorative banner as design references. They are not automatically available to the repository. Use actual app screenshots for README only when captured from the working app and saved in the repository. Never present the banner as a gameplay screenshot or fabricate UI imagery.
