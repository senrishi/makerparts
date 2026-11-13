# Progress

## Milestone 1 — foundation
- Initialized local Git repository.
- Recorded requirements, privacy and persistence design.
- Confirmed Firefox temporary installation is removed on restart; permanent release installs require signing.

## Milestone 2 — working extension
- Implemented shared MV3 extension with browser-specific background configuration.
- Added user-triggered product metadata capture with manual fallback.
- Built project library, categories, per-currency totals, editable parts, quantities and purchase status.
- Added serialized persistent writes, validated backup import and JSON export.
- Added model tests covering save/edit/delete, totals, backup round trips and invalid data.
- `npm run check` passes (4 tests; both browser builds).

## Milestone 3 — validation and installation handoff
- Chromium integration test passed: project creation, part save/edit, quantities and totals, popup save, and persistence through full browser shutdown/relaunch using the same profile.
- Visually inspected the rendered project library (`artifacts/library.png`).
- Mozilla `web-ext lint`: zero errors, notices or warnings.
- Added category suggestions for common component names; all suggested metadata remains editable.
- Added reproducible packaging, dependency lockfile and permanent-install instructions.
- Produced unsigned browser ZIPs in `artifacts/`.
- Remaining external step: sign the Firefox ZIP with the owner's Mozilla developer account and install the signed XPI. No Firefox runtime is installed in this environment; Firefox runtime and signed-install verification remain untested.

## Future improvements
- Store-specific product metadata adapters, if generic structured metadata proves insufficient.
- Optional duplicate detection and CSV BOM export.
- Signed distribution and update hosting after the owner chooses a distribution channel.

## Compatibility fix — older Firefox temporary installs
- Reported installation failure came from the release build's Firefox 140 minimum.
- Added `dist/firefox-legacy` for Firefox 115–139 with the same functionality and extension ID, omitting the newer data-consent manifest field.
- Kept the Firefox 140+ signing build and its no-data-collection declaration intact.
- Legacy build is for temporary local testing; runtime compatibility is not yet verified.

## Mercury 129 installation path fix
- User confirmed Mercury 129.0.2 and repeated the Firefox 140 minimum error.
- Made the original `dist/firefox/manifest.json` path use the Firefox 115+ compatibility manifest, so selecting the original path no longer selects an incompatible build.
- Moved modern signing manifest to `dist/firefox-release`; packaging still uses that modern build.
- Confirmed generated default manifest declares minimum 115.0, below Mercury 129.0.2. Full Mercury runtime behavior remains unverified.

## Milestone 4 — variants, appearance, and MakerBazar shortcut
- Added optional model/variant and SKU fields, saved and searchable in the project library. Older parts/backups remain compatible.
- Capture reads selected Shopify variant ID, matching product JSON/offer, selected option labels, exact variant price and SKU; stores a variant-specific URL. Unknown model fields remain editable rather than inferred from a generic ESP32 name.
- Added Light/Dark/System appearance preference shared across popup and library through persistent browser storage.
- Added separate Resistors and Capacitors categories with automatic suggestions; retained Passive components for existing records and other passives.
- Added a floating save button only for `makerbazar.in` and `www.makerbazar.in`. It opens the same quick-add form in a small extension window.
- Added narrow MakerBazar host access for this requested shortcut; other stores retain user-triggered toolbar capture only.
- Live store HTML fetch was rate limited; variant behavior is checked with representative Shopify product fixtures. Live theme-specific extraction still needs a check on the user's actual product pages.
- Chromium integration checks passed for dark theme persistence, MakerBazar-only floating button, and selected variant model/SKU/price/link captured and saved.
- Added a read-only same-origin Shopify product JSON fallback on MakerBazar when selected variant metadata is absent from the HTML.
- User requested Robu/Amazon/other electronics store enhancements later; recorded as deferred scope, with MakerBazar the current focus.
- Final validation: 7 domain tests pass; Chromium integration passes including both embedded and fetched variant metadata; dark library visually inspected; Firefox release manifest validation reports zero errors/notices/warnings. Compatibility manifest has the expected missing modern data-consent warning for local Mercury use.

## Compact save UI and dedicated settings
- Reduced save form/header spacing and kept name, model/variant, project, category, price, currency and quantity in the main view.
- Moved link, SKU, notes and status into expandable details; opens automatically for manual link entry and invalid hidden required fields.
- Kept Save fixed within the form while its fields scroll; reduced the floating capture window height.
- Moved appearance controls into a dedicated Settings tab, opened through an accessible gear icon. Removed the popup tagline and instruction line as requested.
- Model/variant name remains visible before saving; SKU/part number is stored separately.
- Validation: 7 domain tests and Chromium integration pass; Save stays within a 560px viewport with details both collapsed and expanded. Visually verified compact dark popup. Settings preference persists across reload and applies to library/capture. Release Firefox validation has zero errors/notices/warnings.

## Popup visibility fix and module cleanup
- Screenshot shows toolbar popup failing to open in Mercury. Removed circular viewport-dependent popup size constraints and set intrinsic 460 × 560 dimensions; this addresses a likely auto-sizing cause, pending Mercury confirmation.
- Mounted the form before metadata extraction finishes and preserved in-progress edits when asynchronous capture completes.
- Organized source into pages, components, core, background, capture, content, settings, styles and assets. Extracted shared form/list rendering, storage queue, messaging and formatting.
- Split stylesheet into functional modules and formatted source for maintainability.
- Removed the redundant generated Firefox legacy alias; original `dist/firefox/manifest.json` path remains the Mercury development entry point.
- Packaging now recreates ZIPs so obsolete files are removed after source moves.
- Validation after cleanup: 7 model tests pass; Chromium integration passes including a tiny initial viewport sizing regression, opening Settings through the gear, selected-variant capture, backups' data model, theme persistence and restart persistence. Visually checked compact popup after stylesheet split.
- Modern Firefox release lint: zero errors/notices/warnings. Formatting check passes. Rebuilt ZIP contents contain only the new module paths. Mercury toolbar runtime confirmation still requires reloading the updated temporary extension in the user's browser.

## Hub simplification and Miscellaneous workflow
- Home now lists project names and the built-in Miscellaneous list, with no parts/totals/part filters until a list is opened.
- Enlarged hub navigation, part names, metadata, controls and category text; removed sidebar slogans and redundant header copy.
- Replaced green styling with matte black/charcoal/neutral gray, including icons and the MakerBazar button. Dark is the initial theme; existing explicit appearance preferences remain respected.
- Added a built-in Miscellaneous destination without requiring a project record. Existing projects and parts retain their assignments.
- Updated per user clarification: default dropdown is Create a new project with the name field visible and optional. A blank/whitespace-only name saves to Miscellaneous; a filled name creates/uses a project. Miscellaneous is also explicitly selectable. Parts can be moved between lists through Edit.

## Responsive capture window
- User screenshot revealed the floating capture window retained toolbar-sized content when enlarged.
- Added an early standalone-window class only for source-tab capture URLs. Standalone capture fills its window and centers content up to 760px; toolbar popup keeps explicit intrinsic dimensions.
- Narrow standalone windows stack project/category fields and scroll only the form fields while Save remains in view.
- Validated 9 model tests, project-only home, Miscellaneous default fallback, moving a part into a project, and responsive capture at 1000×650 and 340×440 with Save visible. Release Firefox lint and format checks pass. Corrected hub auto margins so short project lists start at the top.
