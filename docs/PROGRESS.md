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
