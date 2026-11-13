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

## Save Cart and home cost overview
- MakerBazar cart pages now show Save Cart instead of the single-part button. It reads the current cart through Shopify's read-only cart endpoint, previews all lines, quantities and prices, and asks for one destination.
- Added shared project picker for individual and cart capture. Blank new-project names fall back to Miscellaneous; existing projects and explicit Miscellaneous selection are supported.
- Bulk save validates and commits all lines together, preserving variant names, SKU, variant links, quantity and per-unit price. Empty carts and loading failures have explicit UI; the store cart is never changed.
- Added compact Still to buy / Already spent / Total parts value cards on home, plus per-project values. Planned parts are remaining; ordered and received parts are spent. Totals include Miscellaneous and stay separated by currency. Unpriced parts are counted separately.

## Sidebar hierarchy and save confirmation
- Distinguished Projects home navigation with a house icon, border, heavier label and spacing from destination lists; active navigation has `aria-current`.
- Individual and cart popouts now show an accessible Saved successfully notice after the storage write succeeds, then close automatically after 1.4 seconds. Errors and empty carts remain open. Ordinary full-page development views do not auto-close.
- Corrected name/value spacing with separate rows and explicit gaps in home cost cards and project tiles. Build now combines modular CSS into a revisioned stylesheet to avoid stale imported styles after reload.
- Final validation: 11 model tests pass; Chromium integration passes cart saves to new/existing projects, empty-cart handling, cost overview calculations, name/value spacing (at least 10px), Projects home navigation, and success-notice-driven auto-close for individual and cart popouts.
- Visually inspected final matte project home and cart preview. Firefox release lint reports zero errors/notices/warnings; formatting checks pass. Browser packages regenerated. Live MakerBazar/Mercury behavior still needs user confirmation after extension and tab reloads.

## Cart preview and library navigation polish
- Removed SKU display from the Save Cart preview; variant labels remain visible, and SKUs are still preserved in saved records.
- Promoted Open project library to a 15px, bordered, 40px-minimum-height footer link in both save views.
- Validation: all 11 model tests and Chromium integration pass, including hidden cart SKUs, visible variant names, larger library shortcut, narrow/wide capture layouts and automatic close. Firefox release validation has zero errors/notices/warnings. Rebuilt packages.

## Compact footer and toolbar cart routing
- Reduced Open project library to a 13px text link with no large button background; removed Stored on this device from both popouts.
- Toolbar popup now checks the active tab first and routes MakerBazar cart pages to Save Cart, preserving toolbar-safe sizing. Floating captures continue using responsive window sizing.
- Added site/cart routing tests and a browser integration check that opens the toolbar entry while the cart tab is active and verifies the cart preview.
- Validation: 12 domain tests and Chromium integration pass, including toolbar cart routing and absence of removed footer text.

## Mercury permanent-install handoff
- Prepared an unsigned Mercury-compatible XPI from `dist/firefox`, separate from the Firefox 140+ signing package.
- Documented normal Add-ons Manager installation and the signature preference used by builds permitting unsigned extensions, with a library export/import step before replacing a temporary install.
- Reviewed Mercury source signing configuration; macOS binary enforcement and restart persistence for a permanent install remain to be verified by the user.

## Development reload and signing automation
- Added `dev:mercury`: dedicated persistent development profile, source watcher, serialized/debounced rebuilds, and web-ext reload after build completion.
- Added `sign:firefox`: explicit unlisted/listed submission command, ignored environment credentials, release lint before upload, and signed output artifacts. No upload performed.
- Build versions and package names now follow package.json so release version bumps propagate consistently.
- Documented private/public distribution, local temporary-install lifecycle, Firefox 140+ signing vs Mercury 129 compatibility, and the need for HTTPS update hosting for unlisted auto-updates.
- Validation: 12 model tests pass; development configuration check finds the Mercury executable and prepares the dedicated profile/reload signal; signing check confirms configuration without uploading. Verified secrets and development data are Git-ignored. Live Mercury watcher/reload and Mozilla signing remain unexecuted; credentials are not configured.

## GitHub runner publication setup
- User approved private `senrishi/makerparts` repository and public AMO listing with Mozilla-managed updates.
- Added push/PR build-and-test workflow and version-tag/manual Firefox publication workflow, with pinned actions, read-only GitHub permissions and release version preflight.
- Added initial public listing metadata, All Rights Reserved license, reviewer notes and reproducible source ZIP upload.
- Signing credentials remain in GitHub secrets; no Mozilla upload attempted. Initial publication requires the user to add AMO_JWT_ISSUER and AMO_JWT_SECRET and run Publish Firefox.
- Made Chromium integration portable to Linux runners.
- Created and pushed the private GitHub repository with full commit history.
- First hosted Linux build passed: https://github.com/senrishi/makerparts/actions/runs/43475093463 . This includes all 12 model tests, strict Firefox validation, Chromium integration, browser packages and reviewer source artifact upload.
- Both workflows are active; repository is confirmed private. Mozilla secrets are not configured, so public submission has not run. User setup steps and release commands are documented in docs/GITHUB_RELEASES.md.

## First Mozilla submission
- Configured the user-provided Mozilla credentials as GitHub Actions secrets; did not add them to repository files.
- Run https://github.com/senrishi/makerparts/actions/runs/43476458088 passed build/testing and successfully created MakerParts 0.1.0 on AMO.
- Authenticated Mozilla status: nominated/unreviewed, not signed, awaiting review. Listing: https://addons.mozilla.org/en-US/firefox/addon/makerparts/ ; version management: https://addons.mozilla.org/en-US/developers/addon/makerparts/versions/6705287 .
- Stopped the original runner's post-submission approval wait; this does not withdraw the accepted submission. Listed releases now use approval-timeout=0 so successful submission completes without waiting for human review.
- Verified latest official Mercury remains 129.0.2; browser-fork work is a separate future project.

## Chrome stale-background cart failure (0.1.1)
- User screenshot showed Save Cart returning Unknown action. Current cart integration passes; likely cause is an older running Chrome background module paired with newly rebuilt page files.
- Added source-build fingerprints to the generated UI/background, preflight read checks before mutations, and server-side rejection of stale view writes. Legacy/mismatched builds now show explicit reload instructions instead of an unexplained Unknown action.
- Added messaging tests for legacy workers, matching builds and a mid-request update. Bumped patch version to 0.1.1; the pending Mozilla 0.1.0 submission remains unchanged, with no new publication tag created.
- Validation: 15 unit tests pass; Chromium integration passes cart saving and rejects an intentionally stale view without changing library data. Updated the move-part integration check to wait for asynchronous completion rather than assuming the click has finished the write. Strict Firefox release validation reports zero errors/notices/warnings. Rebuilt 0.1.1 browser packages.

## Restore Project, immediate Clear Cart and pinned sidebar
- Added MakerBazar Restore Project for Planned parts only, preserving quantities and excluding Ordered/Received. Preflight resolves exact variants, blocks other stores/ambiguous or sold-out variants, and previews the current cart before explicit replacement confirmation.
- Cart replacement rechecks the preview snapshot, backs up previous cart lines locally, verifies exact resulting quantities and attempts rollback on failure. Recovery failure is explicit and a previous-cart JSON download is available.
- Added immediate Clear Cart above Save Cart only on MakerBazar cart pages, without a confirmation dialog per user instruction. Success refreshes the cart; extension library records are unchanged.
- Pinned the desktop sidebar to the viewport, with independent project-list scrolling and always-visible backup/settings controls. Narrow screens retain compact layout.
- Added restore, stock-failure, rollback, cart-change and direct-clear unit coverage. Chromium integration verified Planned-only restore, exact quantities, persisted previous-cart backup, no-confirmation clear and sticky controls with a long page/navigation.
- Existing Mozilla 0.1.0 review submission is unchanged; future release metadata now describes the explicit store-cart write features accurately.
- Final validation: 21 unit tests and full Chromium integration pass. Visually checked the pinned sidebar and restore success view. Strict Firefox release lint is clean. Store mutation tests use controlled fixtures; no live user cart was changed during development. Live MakerBazar theme/session behavior still requires a user check after reloading.

## Local Mercury install handoff and automatic release attempt (0.1.2)
- Added one-shot install:mercury and package-watching watch:mercury-updates commands. Local packages are checked for the current version and Mercury compatibility manifest.
- Direct macOS file-open did not show a verifiable installer, so the helper uses a short-lived localhost URL with Firefox's XPI installer MIME type. Only the selected package is exposed under a random path; no browser profile files or signature settings are changed.
- Browser approval can still be required. This removes manual file picking, not the browser's security approval. Added a loopback handoff test.
- Bumped to 0.1.2 for the requested automatic tagged Mozilla release submission.
