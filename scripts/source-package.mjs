import { mkdir, readFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
const { version } = JSON.parse(await readFile("package.json", "utf8"));
await mkdir("artifacts", { recursive: true });
const dest = path.resolve(`artifacts/makerparts-source-${version}.zip`);
await rm(dest, { force: true });
execFileSync("zip", [
  "-r",
  "-q",
  dest,
  "src",
  "scripts",
  "tests",
  "docs",
  "release",
  "README.md",
  "LICENSE",
  "package.json",
  "package-lock.json",
]);
console.log(dest);
