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

For development only: open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, select `dist/firefox/manifest.json`. This build requires Firefox 140+. For Firefox 115–139 (including older Firefox-based browsers), select `dist/firefox-legacy/manifest.json` instead. The legacy build omits the Firefox 140 data-consent manifest field and is intended for local temporary testing. Both builds use the same extension ID; do not load them simultaneously. Export a backup before removing or replacing a development install.

## Daily use
- Click the toolbar icon on a product page. Name, link and structured product price are suggested when the store supplies metadata. Review prices, variants and currency; shipping and taxes are not included automatically.
- Choose an existing project or **Create a new project**. Select a category, quantity, status and optional notes.
- Open **project library** to search, filter, edit, move a part to another project, or track planned → ordered → received.
- Prices are per unit; totals multiply by quantity and remain separate for each currency. Missing prices are called out.
- Export a JSON backup periodically. Import **replaces** the current library after confirmation. Chrome and Firefox libraries are separate; use export/import to transfer.

## Privacy and storage
No server, telemetry, remote scripts or automatic shopping actions. Product capture uses temporary access granted by your toolbar click. Parts are stored in `storage.local` in the current browser profile. Closing the browser preserves them; uninstalling the extension or deleting the profile can remove them.

## References
- [Firefox temporary installation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)
- [Mozilla signing](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)
- [Chrome storage](https://developer.chrome.com/docs/extensions/reference/api/storage)
