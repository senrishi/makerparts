# MakerParts
A local-first Chrome and Firefox extension for collecting electronics parts by project, outside store carts.

## Development
Requires Node.js 22+. Run `npm install`, `npm run check`. Load `dist/chrome` as an unpacked extension in Chrome. See [installation](docs/INSTALL.md) for Firefox and permanent installation.

## Planned workflow
Save the current product from the toolbar, choose or create a project, review its name and price, and categorize it. Manage all projects in a full-page library. Data stays in the browser profile; JSON backups allow transfer between browsers.

See [project details](docs/PROJECT.md) and [progress](docs/PROGRESS.md).

## Commands
- `npm run check` — domain tests and both browser builds.
- `npm run lint:firefox` — Mozilla extension validation.
- `npm run smoke` — real Chromium integration test, including profile persistence after a full browser restart. Uses macOS Chromium by default; set `CHROMIUM_PATH` for another installation.
- `npm run package` — unsigned Chrome/Firefox ZIPs in `artifacts/`.

No runtime dependencies or server. Developer tooling is locked in `package-lock.json`. The Firefox ZIP must be Mozilla-signed before permanent installation in standard Firefox.

Source modules and build output are described in [architecture](docs/ARCHITECTURE.md). Run `npm run format` to format source or `npm run format:check` to verify formatting. Generated browser builds and artifacts are excluded from Git.

For automatic Mercury development reloads, run `npm run dev:mercury`. For Mozilla signing, versioning, and distribution choices, see [development and releases](docs/DEVELOPMENT.md). Signing runs only when explicitly invoked with credentials; no upload is performed by the development command.
