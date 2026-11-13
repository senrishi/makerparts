# GitHub Actions and Mozilla publication

Repository: https://github.com/senrishi/makerparts (private).
Public Firefox distribution is independent of repository visibility. The listing metadata uses All Rights Reserved so this does not grant an open-source license.

## One-time setup
1. Generate your API key/JWT issuer and secret at https://addons.mozilla.org/developers/addon/api/key/ . Accept any required Developer Agreement in the Mozilla account.
2. Open https://github.com/senrishi/makerparts/settings/secrets/actions . Add two repository secrets:
   - `AMO_JWT_ISSUER`: Mozilla's JWT issuer/API key.
   - `AMO_JWT_SECRET`: Mozilla's JWT secret.
3. Review `release/amo-metadata.json`: public summary/description, category, license and reviewer notes. It is included with initial submission and subsequent updates. Keep the current extension ID to retain update continuity.
4. Open https://github.com/senrishi/makerparts/actions/workflows/firefox-release.yml and choose **Run workflow** on main to submit the first version. No local secret file or terminal upload is required.
5. Follow the run's submission output and check your Mozilla Developer Hub for the created listing, validation, requested information and review status. Listed submission is not instant approval. Add the listing's screenshots and any required details there. Do not manually upload the same version in parallel with the runner.

The workflow is prepared but no Mozilla upload has been performed while credentials are absent. Current public signing build requires Firefox 140+, and cannot be installed in Mercury 129. Use the local Mercury compatibility workflow until you use a compatible browser. Public listing does not bypass that version requirement.

## What runs automatically
- **Push main / pull request:** Node 24 install, formatting check, 12 model tests, builds, strict Firefox release lint, real Chromium integration, install ZIPs/XPI and reviewer source archive. Artifacts are attached to the run for 14 days.
- **Push `v*` tag:** the same checks must pass first. The publication job verifies the tag matches package.json, builds/validates again, uploads readable reviewer source and the release package to Mozilla's listed channel.
- **Manual Publish Firefox run:** submits the checked-out version through the same pipeline, useful for the initial submission. A previously submitted version cannot be reused.

Actions are pinned to commit SHAs. Jobs have read-only repository permission. Mozilla secrets are only available to the submission step; pull requests and ordinary builds do not upload to Mozilla. Publication jobs are serialized to avoid simultaneous release submissions. There is no GitHub Pages hosting or private update server: approved public AMO releases are distributed by Mozilla.

## Subsequent releases
After your changes are committed:

```sh
npm version patch --no-git-tag-version
# Version now comes from package.json for every manifest and package filename.
git add package.json package-lock.json
git commit -m "release: bump extension version"
git push origin main
git tag v0.1.1  # replace with the actual package.json version
git push origin v0.1.1
```

Use a new version for each submission. After Mozilla approves/publishes a release, existing compatible installations from the listing receive updates through Firefox's add-on update system. The CI submission does not install it into your local browser, and cannot guarantee Mozilla review timing. Manual workflow retries should only be used when the previous attempt did not successfully submit that version.

## Source and privacy
The reviewer source ZIP contains only source, scripts, tests, docs, release metadata, license and package manifests. Secrets, browser profiles, node_modules and development data are excluded. Runtime code is readable JS; the build combines readable CSS. No user parts or carts are uploaded by the release workflow.

## References
- https://extensionworkshop.com/documentation/develop/web-ext-command-reference/
- https://extensionworkshop.com/documentation/manage/updating-your-extension/
- https://mozilla.github.io/addons-server/topics/api/licenses.html

## First submission status
MakerParts 0.1.0 was accepted into Mozilla review. Manage it at https://addons.mozilla.org/en-US/developers/addon/makerparts/versions/6705287 . The public URL is https://addons.mozilla.org/en-US/firefox/addon/makerparts/ and may not be available until publication. Do not submit 0.1.0 again. Listed release runs finish after successful submission rather than waiting for review/signing; check the Developer Hub for the later review outcome.
