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
