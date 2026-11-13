# Development reloads and signed releases

## Everyday changes in Mercury
Run:

```sh
npm run dev:mercury
```

This launches Mercury with a dedicated profile in `.dev/mercury-profile`, installs the compatibility extension temporarily, watches `src/` and `package.json`, rebuilds on save, and asks `web-ext` to reload after the build finishes. Keep that terminal running. Refresh store tabs after a content-script change to reconnect the floating button. There is no signing, uploading or manual XPI installation for this development loop.

When you close the browser, run the command again to launch and install it again. This is automated temporary installation, not a permanent signed add-on. The dedicated profile retains development library data between launches; it does not share your everyday browser's library or store login. Import a backup and sign in to stores in this profile if needed. Do not point this command at your everyday profile while it is running.

The default executable is `/Applications/Mercury.app/Contents/MacOS/mercury`. To use another build:

```sh
WEB_EXT_FIREFOX='/path/to/firefox' npm run dev:mercury
```

`node scripts/dev.mjs --check` builds and checks the configuration without opening a browser. Development profiles, reload signals and secrets are ignored by Git.

## Whether to submit to Mozilla
- **Unlisted / On your own:** suitable for personal/private distribution. Mozilla signs the package; it does not publicly list it. Uploading a new version does not by itself update installed copies. Install each signed update yourself, or host signed XPIs and an update manifest for browser-managed updates.
- **Listed / On this site:** suitable when you want a public add-on. Mozilla hosts the listing and distributes approved updates to installed users. Review and publication can take time; uploading is not immediate approval.

Current `dist/firefox-release` targets Firefox **140+** and declares no data collection. It is not the Mercury 129 compatibility package. Use the local development/XPI workflow for Mercury 129, or move to a compatible browser before using this signing build. Do not submit the unsigned compatibility XPI as though it were the modern release package.

## Automate submission and signing
1. Create API credentials at https://addons.mozilla.org/developers/addon/api/key/ .
2. Copy `.env.example` to `.env` and replace the placeholders, or set `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` in your shell/CI secrets. Do not commit `.env`.
3. For every new release, increase the version. Build manifests and archive filenames now derive from `package.json`:

```sh
npm version patch --no-git-tag-version
npm run check
npm run sign:firefox
```

The default channel is **unlisted**. The signing command builds, validates the Firefox release package, uploads it to Mozilla, and downloads a signed XPI into `artifacts/signed/` when available. It does not install the XPI in your browser. It must not run for every source save; use the development command for that. No submission has been performed by preparing these scripts.

For listed releases, complete your initial listing/metadata in the Developer Hub, then submit subsequent versions with:

```sh
npm run sign:firefox -- --channel=listed
```

For initial API submissions needing metadata, the script accepts `--metadata=/path/to/amo-metadata.json`. Keep the same Gecko ID to update the same extension. Do not reuse a previously submitted version. `node scripts/sign-firefox.mjs --check` validates command configuration without uploading.

A CI runner can execute the same signing command using stored secrets, preferably for an explicit release/tag rather than every commit. This repository has no remote or CI provider configured, so no CI upload job has been activated.

## Automatic installation of unlisted updates
For a private release to update automatically after the initial installation, choose an HTTPS host and add a stable `browser_specific_settings.gecko.update_url` pointing to its update manifest. The host serves version metadata and the corresponding Mozilla-signed XPI. Publish new metadata only after the signed XPI is available. Hosting and this update URL are not configured yet; uploading an unlisted version alone does not provide automatic installation.

## References
- [web-ext development and reloading](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)
- [web-ext command reference](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)
- [Signing and distribution](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)
- [Updating your extension](https://extensionworkshop.com/documentation/manage/updating-your-extension/)
