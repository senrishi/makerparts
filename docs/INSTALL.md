# Installing MakerParts

## Chrome — persists across restarts
1. Run `npm install` then `npm run build` in this repository.
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and choose this repository's `dist/chrome` folder.
3. Pin MakerParts in the extensions menu. Click it on a product page, review the fields and save.
4. Keep that folder in place. The installation and saved library remain across normal browser restarts. After rebuilding, click Reload on the extension card.

## Firefox — permanent installation
Regular Firefox requires a **Mozilla-signed XPI**. A temporary add-on from `about:debugging` is deliberately removed on browser restart; changing our code cannot override that browser rule.

1. Run `npm run build` and `npm run package`.
2. Sign `artifacts/makerparts-firefox-0.1.0.zip` using a Mozilla Add-ons developer account at https://addons.mozilla.org/developers/ . Choose **On your own** distribution for a private/unlisted extension. Upload this package, complete the submission and download Mozilla's signed `.xpi` when available. The unsigned ZIP is not permanently installable in regular Firefox.
3. In Firefox open `about:addons`, choose the gear menu → **Install Add-on From File…**, and select the **signed XPI**.
4. Keep the same Gecko ID (`makerparts@local.extension`) for future versions. Increment the manifest/build version, sign again, and install the update without uninstalling to retain data.

Signing needs your Mozilla account and may involve review. This repository does not include a signed XPI or credentials.

For development only: open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, select `dist/firefox/manifest.json`. This default development build supports Firefox 115+ and Mercury 129.0.2 at the manifest level. The obsolete `dist/firefox-legacy` alias has been removed; use `dist/firefox`. The signed-distribution package is built from `dist/firefox-release` and requires Firefox 140+. Do not load multiple variants simultaneously: they use the same extension ID. Export a backup before removing or replacing a development install. Mercury runtime functionality remains to be verified.

## Daily use
- Click the toolbar icon on a product page. Name, link and structured product price are suggested when the store supplies metadata. Review prices, variants and currency; shipping and taxes are not included automatically.
- Choose an existing project or **Create a new project**. Select a category, quantity, status and optional notes.
- Open **project library** to search, filter, edit, move a part to another project, or track planned → ordered → received.
- Prices are per unit; totals multiply by quantity and remain separate for each currency. Missing prices are called out.
- Export a JSON backup periodically. Import **replaces** the current library after confirmation. Chrome and Firefox libraries are separate; use export/import to transfer.

## Variants and appearance
- The form includes editable **Model / selected variant** and **SKU / part number** fields. On MakerBazar, choose the desired variant on the product page before saving. Capture uses the selected variant ID, its price, SKU and variant-specific link when the page provides them; it does not guess an exact board revision from a generic family name.
- MakerBazar product JSON is read from the page, or its public same-origin Shopify product endpoint if needed. Prices and variant labels still need review, especially if a store's theme changes.
- The floating **Save to MakerParts** button appears only on `makerbazar.in` / `www.makerbazar.in`. It opens quick-add in a small window. Refresh an already-open store page after reloading the extension.
- Open the **gear icon** in the popup or library to reach the separate Settings tab. Choose **Dark mode**, **Light mode** or **System theme** there. The preference is shared and persists across restarts.
- **Resistors** and **Capacitors** have separate categories. Existing Passive components records keep their category; edit them to recategorize.

## Privacy and storage
No server, telemetry, remote scripts or automatic shopping actions. MakerBazar alone has persistent site access for the floating save button and selected-variant capture; other sites use temporary access granted by your toolbar click. Parts are stored in `storage.local` in the current browser profile. Closing the browser preserves them; uninstalling the extension or deleting the profile can remove them.

## References
- [Firefox temporary installation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)
- [Mozilla signing](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)
- [Chrome storage](https://developer.chrome.com/docs/extensions/reference/api/storage)

## Project hub and loose parts
The home page shows project names and Miscellaneous. Open a list to view its parts. The quick-add form defaults to **Create a new project**, with the new name field visible. Enter a name to create/use that project; leave it blank to save to **Miscellaneous**. Miscellaneous is also in the dropdown. Edit a part to move it to another list. Existing project assignments remain unchanged.

The hub uses larger text and a matte black/gray default appearance. Your explicit theme preference is retained. The floating save window resizes with its window; the toolbar popup keeps a compact fixed size.

## Save a MakerBazar cart
On MakerBazar's cart page, the floating button changes to **Save Cart**. Click it to preview the cart, then choose an existing project, name a new one, or leave the new name blank for Miscellaneous. **Save entire cart** copies all listed variants and quantities into that list without changing the store cart. Repeating the save adds another copy. The preview is a snapshot; reopen it if the store cart changes.

Home estimates use listed unit prices × quantities. **Still to buy** covers planned parts; **Already spent** covers ordered and received parts; **Total parts value** covers all saved parts including Miscellaneous. Currencies remain separate and missing prices are flagged. Shipping and checkout-only adjustments are not estimated.

After a successful individual or cart save, the popout shows **Saved successfully** and closes after 1.4 seconds. Errors stay open for correction. After updating this development build, reload the extension in `about:debugging` / `chrome://extensions`, then refresh both your library and MakerBazar tabs so their code and styles match.
