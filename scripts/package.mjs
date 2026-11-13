import { pruneOldPackages } from "./artifact-retention.mjs";
import { mkdir, rm, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
const { version } = JSON.parse(await readFile("package.json", "utf8"));
await mkdir("artifacts", { recursive: true });
for (const browser of ["chrome", "firefox"]) {
  const dest = path.resolve(`artifacts/makerparts-${browser}-${version}.zip`);
  await rm(dest, { force: true });
  execFileSync("zip", ["-r", "-q", dest, "."], {
    cwd: browser === "firefox" ? "dist/firefox-release" : `dist/${browser}`,
  });
  console.log(dest);
}

// Compatibility package for local Mercury installs; intentionally unsigned.
const mercury = path.resolve(`artifacts/makerparts-mercury-${version}.xpi`);
await rm(mercury, { force: true });
execFileSync("zip", ["-r", "-q", mercury, "."], { cwd: "dist/firefox" });
console.log(mercury);

await pruneOldPackages(version);
