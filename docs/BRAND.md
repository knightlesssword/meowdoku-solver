# Meowdoku Solver - Brand Assets and Usage

- **Reviewed:** 2026-10-30.
- **Source of truth:** `docs/implementation/brand.md`, plus the two SVG files actually present in the repository.
- **Status:** Both supplied assets are integrated or documented. No placeholder or duplicate logo files were created.

## Supplied assets

| File | Dimensions | View box | Size | Role |
|---|---|---:|---:|---|
| `assets/branding/app-icon.svg` | 256 × 256 (1:1) | `0 0 256 256` | 1,394 bytes | Standalone app icon; header mark and favicon |
| `assets/branding/logo-horizontal.svg` | 940 × 260 (≈ 3.6:1) | `0 0 940 260` | 13,123 bytes | Horizontal wordmark for light-surface documentation and README use |

These are the actual exported filenames. The placeholder names `meowdoku-icon.svg` and `meowdoku-logo.svg` from the original brief were not supplied and do not exist.

## Safety review

Both files were inspected as source before integration.

- Self-contained vector artwork made from `<rect>`, `<path>`, and `<ellipse>` elements.
- No `<script>`, event-handler attributes, `<foreignObject>`, `<image>`, `<use>`, `<style>`, CSS `url(...)`, `@import`, XML entities, embedded `data:` payloads, or external resource references.
- The only HTTP-looking string is the SVG XML namespace `http://www.w3.org/2000/svg`; it is not fetched.
- The wordmark is outlined as paths. It contains no `<text>` elements and therefore needs no external font.
- Both files were served by the local static server with `Content-Type: image/svg+xml` and HTTP 200.
- The assets are used through `<img src>` and a favicon link, never inlined with `innerHTML`.

## App integration

### Header

`index.html` uses the supplied icon directly:

```html
<img class="brand-mark" src="assets/branding/app-icon.svg" alt="" width="42" height="42">
```

The icon is decorative because the adjacent `<h1>` already names the application. CSS renders it at 42 × 42 px on desktop/tablet and 36 × 36 px at 720 px and below. A two-layer `drop-shadow` filter follows the transparent alpha edge and keeps the cream tile legible on both themes without adding a rectangular CSS frame.

The header title remains theme-aware text (`Meowdoku Solver`), so the brown wordmark is not forced onto the dark theme.

### Favicon

`index.html` points at the local asset:

```html
<link rel="icon" type="image/svg+xml" href="assets/branding/app-icon.svg">
```

The icon is square and uses a 256 × 256 view box, so it scales cleanly as a browser favicon. No data-URI duplicate of the icon remains in the document.

## Wordmark usage

Use `assets/branding/logo-horizontal.svg` on light cream or white surfaces, where its cocoa wordmark and muted tagline have sufficient contrast. Preserve its 940:260 aspect ratio; do not stretch or crop it.

Do **not** place the raw wordmark on the dark app background. Its brown `#68452F` wordmark and `#8C6A50` tagline are low-contrast on `#0b1016`; the tagline in particular becomes difficult to read. On dark surfaces, use the app icon with theme-aware text instead.

For a theme-safe README hero, prefer the icon plus a normal heading:

```html
<p align="center">
  <img src="assets/branding/app-icon.svg" alt="Meowdoku Solver app icon" width="96" height="96">
</p>
<h1 align="center">Meowdoku Solver</h1>
```

The horizontal wordmark can still be shown in a light-only README block, documentation cover, or print context. If GitHub dark-mode support is required, keep the icon-and-heading pattern rather than relying on the brown wordmark alone.

## Brand colours observed in the assets

| Colour | Hex | Use |
|---|---|---|
| Cream | `#F4E8D4` | Icon tile and wordmark background |
| Cocoa | `#68452F` | Wordmark "MEOW" |
| Muted cocoa | `#8C6A50` | Wordmark tagline |
| Orange | `#E58B27` | Wordmark "DOKU" |
| Green | `#A9D58E` | Grid tile |
| Pink | `#F5B9CF` | Grid tile |
| Gold | `#F5C16A` | Grid tile |
| Blue | `#91B9EA` | Grid tile |
| Pink/coral | `#F08E82` | Grid tile |
| Deep brown | `#755039` | Grid tile |
| Cat cream | `#FFF8EC` | Cat face |
| Cat cocoa | `#4C3324` | Cat eyes |

The twelve puzzle paint colours remain unchanged in value and index. The brand palette is used for identity and chrome, not as a replacement for the puzzle palette.

## Files deliberately not created

- No rasterised PNG copies of either SVG.
- No dark-mode wordmark variant, because no such export was supplied.
- No social-preview image or banner, because no suitable exported asset exists.
- No external Figma URLs are referenced at runtime.
