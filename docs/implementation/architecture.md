# Meowdoku Solver - Architecture and Refactoring Requirements

## Target architecture

```text
index.html
css/style.css
js/app.js
assets/branding/
assets/screenshots/
docs/
.github/
```

Keep three primary application files. Do not create a framework, build pipeline, package manager, backend, or runtime dependency. Keep one primary `app.js` unless evidence demonstrates a substantial benefit to introducing additional native browser-compatible files.

## Extraction strategy

1. Inventory current markup, styles, scripts, DOM IDs, state variables, event binding, startup sequence, storage keys, and solver functions.
2. Apply and test product behaviour corrections in the original document before extraction, where practical, so the structural extraction is not mixed with unrelated behavioural changes.
3. Extract markup to root `index.html`, CSS to `css/style.css`, and JavaScript to `js/app.js`.
4. Use relative paths and `defer` for the external script.
5. Remove duplicate/obsolete inline content. A minimal theme bootstrap may remain only if necessary and reviewed.
6. Compare the pre/post feature inventory and run tests after extraction.

## JavaScript organization

Use logical comment sections, not artificial nested abstractions. Organize around actual responsibilities:

1. constants and configuration;
2. DOM references;
3. state;
4. utilities;
5. theme;
6. palette and mode;
7. board rendering and coordinates;
8. editing and undo/redo;
9. validation and diagnostics;
10. solver search;
11. candidate and forced-step rendering;
12. history;
13. dialogs and toasts;
14. data validation and serialization;
15. named persistence;
16. autosave and recovery;
17. import/export;
18. event bindings and startup.

Preserve function semantics and initialization order. Avoid accidental globals, duplicate listeners, unnecessary state copies, and giant functions where a small helper makes responsibilities clearer.

## State invariants

- Cell values remain stable integer colour indices or the existing unpainted sentinel.
- Preserve current colour order and values.
- Cats remain cell indices in the current board coordinate model.
- Row/column and neighbour functions must preserve board-size correctness.
- Orthogonal adjacency is used for colour-region connectivity.
- Eight-direction adjacency is used for cat no-touching.
- A board edit invalidates derived solver results consistently.
- Manual cats are hard solver constraints.
- A maximum region-size constraint does not exist.
- Capped searches never produce definitive uniqueness or forced-placement claims.

## Persistence invariants

- Preserve verified legacy named-save key prefix and theme key.
- Preserve support for existing valid payload versions.
- Ignore obsolete `maxRegion` during legacy data validation.
- New saves/exports/autosaves omit the obsolete field.
- Keep autosave storage separate from user-named saves.
- Validate an entire payload before applying it to active state.

## HTML and CSS

HTML is semantic structure and accessible labels. CSS owns presentation and responsive design. No application logic in inline handlers. Avoid style attributes for normal styling. Use CSS classes/custom properties for dynamic visual states where practical.

## Documentation comments

Use comments to explain invariants and non-obvious algorithmic decisions. JSDoc important public/internal functions where useful. Do not narrate trivial assignments or add comments that become stale.
