# Meowdoku Solver - Brand Assets and Usage

- **Reviewed:** 2026-10-30.
- **Source of truth:** the two SVG files actually present in the repository and the supplied brand direction.
- **Status:** Both supplied assets are integrated or documented. No placeholder or duplicate logo files were created.

## Supplied assets

| File | Dimensions | View box | Size | Role |
|---|---|---:|---:|---|
| `assets/branding/app-icon.svg` | 256 × 256 (1:1) | `0 0 256 256` | 1,394 bytes | Standalone app icon; favicon |
| `assets/branding/logo-horizontal.svg` | 940 × 260 (≈ 3.6:1) | `0 0 940 260` | 13,123 bytes | Centered header wordmark; light-surface documentation and print use |

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

`index.html` uses the supplied horizontal wordmark as the header title:

```html
<h1 class="brand">
  <img class="brand-wordmark" src="assets/branding/logo-horizontal.svg"
       alt="Meowdoku Solver" width="940" height="260">
</h1>
```

The `<h1>` keeps the document heading semantic; the image's `alt` text supplies the accessible name. CSS renders the wordmark at `clamp(150px, 22vw, 250px)` wide and preserves its 940:260 ratio.

The artwork sits on a cream `#F4E8D4` plate with 7 × 10 px padding and a 14 px radius (5 × 8 px at 720 px and below). The plate is intentional: the cocoa wordmark and muted tagline do not have enough contrast on the dark app background. The header itself is centered, while the status pill and theme/help controls stay anchored at the top right.

### Favicon

`index.html` points at the local asset:

```html
<link rel="icon" type="image/svg+xml" href="assets/branding/app-icon.svg">
```

The icon is square and uses a 256 × 256 view box, so it scales cleanly as a browser favicon. No data-URI duplicate of the icon remains in the document.

## Wordmark usage

Use `assets/branding/logo-horizontal.svg` in the app header on its cream plate, or on light cream/white documentation surfaces where its cocoa wordmark and muted tagline have sufficient contrast. Preserve its 940:260 aspect ratio; do not stretch or crop it.

Do **not** place the raw wordmark directly on the dark app background. Its brown `#68452F` wordmark and `#8C6A50` tagline are low-contrast on `#0b1016`; the tagline in particular becomes difficult to read. The header plate solves that for the app; documentation should use a light surface.

For a theme-safe README hero, use the icon plus a normal heading:

```html
<p align="center">
  <img src="assets/branding/app-icon.svg" alt="" width="96" height="96">
</p>
<h1 align="center">Meowdoku Solver</h1>
```

The current README uses that icon-and-heading hero plus two actual screenshots. The horizontal wordmark is reserved for the centered app header and light-surface documentation/print use.

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

- No rasterised PNG copies of either logo asset. The README screenshots are captures of the running application, not converted logo files.
- No dark-mode wordmark variant, because no such export was supplied.
- No social-preview image or banner, because no suitable exported asset exists.
- No external Figma URLs are referenced at runtime.
