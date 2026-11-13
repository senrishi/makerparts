# Project details

## Requirements
- Chrome and Firefox; persistence across browser restarts.
- Fast product capture with editable name, URL and price.
- Choose an existing project or create a project while saving.
- Categories for microcontrollers, active and passive components and other useful types.
- Library with project totals, quantities, purchase status, search and editing.
- Local storage and portable backups; no accounts, analytics or backend.

## Design
Shared vanilla HTML/CSS/JavaScript, Manifest V3, separate browser manifests. Toolbar popup handles capture; library tab handles management. `activeTab` and `scripting` only access a page when the user clicks the extension. Automatic content access is limited to `https://makerbazar.in/*` and `https://www.makerbazar.in/*` for the requested floating button and selected-variant capture. Other sites require a toolbar click. Product metadata is advisory and always editable. Prices are entered per unit; totals stay separated by currency.

A background message handler serializes all data mutations to avoid concurrent popup/library writes losing data. Browser storage persists in the current profile. Removing the extension or profile can remove data, so export backups. Firefox release requires Mozilla signing for permanent installation.

## Deferred store support
User explicitly deferred deeper support for Robu, Amazon and other large electronics stores. Generic toolbar capture/manual entry remains available, but custom selectors, selected-variant adapters, store-specific pricing and floating buttons beyond MakerBazar are out of the current scope.
