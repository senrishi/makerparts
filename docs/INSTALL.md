# Install MakerParts

## Chrome

1. Download the latest `makerparts-chrome-<version>.zip` from the `makerparts-build` artifact attached to a successful [Build and test run](https://github.com/senrishi/makerparts/actions/workflows/ci.yml).
2. Extract the ZIP into a folder that you will keep in place.
3. Open `chrome://extensions`, turn on **Developer mode**, choose **Load unpacked**, and select the extracted folder.
4. Pin MakerParts from Chrome’s Extensions menu for quick access.

This installation remains available across browser restarts while the extracted folder stays in place. After replacing its files with a newer package, use **Reload** on the MakerParts card and refresh open MakerBazar tabs.

## Firefox

Firefox requires Mozilla-signed add-ons for a permanent installation. Temporary add-ons loaded from `about:debugging` are removed when Firefox closes.

To install a signed XPI from a file:

1. Save the XPI to your computer.
2. In Firefox, open `about:addons` and select the gear menu.
3. Choose **Install Add-on From File**, select the XPI, then confirm **Add**.

The current self-distributed signed package is attached as a `mozilla-output` artifact to the latest successful [Firefox signing run](https://github.com/senrishi/makerparts/actions/workflows/firefox-release.yml). Download and extract `makerparts-<version>.xpi` from that artifact. The public AMO listing is a separate distribution channel. Once Mozilla publishes it, users can install from the [MakerParts listing](https://addons.mozilla.org/en-US/firefox/addon/makerparts/).

The signed Firefox build targets Firefox 140 and newer. The separate Mercury-compatible build targets older Firefox APIs but is unsigned and is not a permanent install package for standard Firefox.

## Your library

Each browser profile has its own Local library. Sign in to view projects from all connected browsers in the Cloud tab. Use **Copy to Local** to bring a cloud project into this browser. Use **Settings → Backup data** to export or import a JSON backup. Import asks for confirmation before replacing data.

Update all connected browsers before enabling sync with 0.1.9. Earlier versions use a shared library format and can overwrite browser grouping if they keep syncing.

Updating MakerParts with the same extension ID preserves its library. Uninstalling the extension or deleting its browser profile may remove the library, so keep a backup if the data matters to you.
