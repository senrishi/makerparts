import { createHash } from "node:crypto";
import { mkdir, cp, writeFile, rm, readFile, readdir } from "node:fs/promises";
// Keep source styles modular, but ship one revisioned stylesheet per build.
const imports = await readFile("src/styles/main.css", "utf8");
const cssFiles = [...imports.matchAll(/@import url\("\.\/(.+?)"\);/g)].map(
  (match) => match[1],
);
const stylesheet = (
  await Promise.all(
    cssFiles.map((file) => readFile(`src/styles/${file}`, "utf8")),
  )
).join("\n");
const styleRevision = createHash("sha256")
  .update(stylesheet)
  .digest("hex")
  .slice(0, 12);
const { version } = JSON.parse(await readFile("package.json", "utf8"));
const sourceHash = createHash("sha256");
async function fingerprint(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await fingerprint(file);
    else sourceHash.update(file).update(await readFile(file));
  }
}
await fingerprint("src");
sourceHash.update(version).update(await readFile("scripts/build.mjs"));
const buildId = sourceHash.digest("hex").slice(0, 16);
const base = {
  manifest_version: 3,
  name: "MakerParts",
  version,
  description:
    "Save electronics parts into projects, with prices, categories and shopping progress.",
  permissions: ["storage", "activeTab", "scripting"],
  host_permissions: ["https://makerbazar.in/*", "https://www.makerbazar.in/*"],
  content_scripts: [
    {
      matches: ["https://makerbazar.in/*", "https://www.makerbazar.in/*"],
      js: ["content/floating.js"],
      run_at: "document_idle",
    },
  ],
  action: {
    default_popup: "pages/popup.html",
    default_title: "Save to MakerParts",
  },
  icons: { 48: "assets/icons/icon.svg", 96: "assets/icons/icon.svg" },
  options_ui: { page: "pages/settings.html", open_in_tab: true },
};
// Remove only the obsolete generated compatibility alias.
await rm("dist/firefox-legacy", { recursive: true, force: true });
for (const target of ["chrome", "firefox", "firefox-release"]) {
  const dir = `dist/${target}`;
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await cp("src", dir, { recursive: true });
  await writeFile(
    `${dir}/core/build-info.js`,
    `export const BUILD_ID=${JSON.stringify(buildId)};\n`,
  );
  await writeFile(`${dir}/styles/main.css`, stylesheet);
  for (const page of await readdir(`${dir}/pages`))
    if (page.endsWith(".html")) {
      const file = `${dir}/pages/${page}`;
      const html = await readFile(file, "utf8");
      await writeFile(
        file,
        html.replace(
          'href="../styles/main.css"',
          `href="../styles/main.css?v=${styleRevision}"`,
        ),
      );
    }
  const manifest = {
    ...base,
    background:
      target === "chrome"
        ? { service_worker: "background/index.js", type: "module" }
        : { scripts: ["background/index.js"], type: "module" },
  };
  // Chrome extension icons require raster assets; use generated PNGs for both browsers.
  manifest.icons = {
    48: "assets/icons/icon48.png",
    128: "assets/icons/icon128.png",
  };
  if (target.startsWith("firefox"))
    manifest.browser_specific_settings = {
      gecko_android: { strict_min_version: "142.0" },
      gecko: {
        id: "makerparts@local.extension",
        strict_min_version: "140.0",
        data_collection_permissions: { required: ["none"] },
      },
    };
  if (target === "firefox")
    manifest.browser_specific_settings = {
      gecko: { id: "makerparts@local.extension", strict_min_version: "115.0" },
    };
  await writeFile(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2));
}
console.log(
  "Built Chrome, Firefox/Mercury compatibility, and Firefox release builds",
);
