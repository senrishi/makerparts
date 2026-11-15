# Architecture

MakerParts is a shared JavaScript WebExtension with browser-specific Manifest V3 builds. The Chrome service worker and Firefox background script use the same message and storage model.

## Extension surfaces

| Area              | Responsibility                                                            |
| ----------------- | ------------------------------------------------------------------------- |
| `src/pages/`      | Toolbar popup, project library, settings, cart save, and restore views    |
| `src/components/` | Shared forms, project picker, part lists, totals, and save feedback       |
| `src/core/`       | Library schema, validation, estimates, messaging, storage, and formatting |
| `src/background/` | Message routing, serialized writes, tab operations, and capture windows   |
| `src/capture/`    | Product, cart, and restore data extraction in the active tab              |
| `src/content/`    | MakerBazar-only floating capture button                                   |
| `src/styles/`     | Shared neutral theme and responsive page styles                           |

Build outputs are generated from `src/`. `dist/chrome` is the unpacked Chrome extension. `dist/firefox` is the Firefox-compatible build for local development and Mercury. `dist/firefox-release` is the signed-distribution build for Firefox 140 and newer.

## Library data

The library is stored in `browser.storage.local` under one validated state object. Projects contain parts with a name, product URL, category, quantity, currency, optional price, status, and optional model, SKU, and notes. The built-in Miscellaneous destination does not require a project record. `lastProjectId` remembers the destination used for the most recently added part.

The background message handler serializes writes so popup and library operations cannot overwrite one another. Import validates the complete backup before replacing the current state. There is no account service or cloud database.

## Site access

The toolbar uses `activeTab` and `scripting` after a user clicks the extension. Persistent host access and the floating content script are restricted to `makerbazar.in` and `www.makerbazar.in`.

Product metadata is advisory and remains editable. MakerBazar variant capture uses the selected variant when the page exposes it, including its price, SKU, and variant-specific URL. Store cart operations are user-triggered: Save Cart reads the current cart, while Clear Cart and Restore Project modify it. Restore Project validates planned variants, shows the existing cart before replacement, stores a local recovery copy, and attempts to restore the previous cart if adding the planned items fails.

## Browser storage and permissions

Chrome and Firefox profiles are separate. Backups are the supported way to move a library between them. The extension requests storage and user-triggered tab access; MakerBazar has the only persistent website permission. More detail is in [Privacy and permissions](PRIVACY.md).
