import { mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
await mkdir("artifacts", { recursive: true });
for (const browser of ["chrome", "firefox"]) {
  const dest = path.resolve(`artifacts/makerparts-${browser}-0.1.0.zip`);
  await rm(dest, { force: true });
  execFileSync("zip", ["-r", "-q", dest, "."], {
    cwd: browser === "firefox" ? "dist/firefox-release" : `dist/${browser}`,
  });
  console.log(dest);
}

// Compatibility package for local Mercury installs; intentionally unsigned.
const mercury = path.resolve("artifacts/makerparts-mercury-0.1.0.xpi");
await rm(mercury, { force: true });
execFileSync("zip", ["-r", "-q", mercury, "."], { cwd: "dist/firefox" });
console.log(mercury);
