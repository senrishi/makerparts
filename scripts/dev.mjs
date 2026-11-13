import { watch } from "node:fs";
import { mkdir, writeFile, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
const browser =
  process.env.WEB_EXT_FIREFOX ||
  "/Applications/Mercury.app/Contents/MacOS/mercury";
const profile = path.resolve(".dev/mercury-profile");
const signal = path.resolve(".dev/reload");
await mkdir(profile, { recursive: true });
function build() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/build.mjs"], {
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(Error(`Build failed (${code})`)),
    );
  });
}
await build();
await writeFile(signal, `${Date.now()}\n`);
const args = [
  "node_modules/web-ext/bin/web-ext.js",
  "run",
  "--source-dir",
  "dist/firefox",
  "--firefox",
  browser,
  "--firefox-profile",
  profile,
  "--keep-profile-changes",
  "--profile-create-if-missing",
  "--watch-file",
  signal,
  "--start-url",
  "https://makerbazar.in/",
  "--no-config-discovery",
];
try {
  await access(browser);
} catch {
  if (browser.includes("/")) {
    console.error(
      "Browser executable not found. Set WEB_EXT_FIREFOX to your Mercury or Firefox executable.",
    );
    process.exit(1);
  }
}
if (process.argv.includes("--check")) {
  console.log(
    "Development configuration ready: dedicated profile, rebuild watcher and web-ext reload signal.",
  );
  process.exit(0);
}
let pending = false,
  running = false,
  timer;
async function rebuild() {
  pending = true;
  if (running) return;
  running = true;
  while (pending) {
    pending = false;
    try {
      await build();
      await writeFile(signal, `${Date.now()}\n`);
      console.log(
        "Rebuilt. Extension reload requested. Refresh a store page to reconnect its button.",
      );
    } catch (error) {
      console.error(error.message);
    }
  }
  running = false;
}
const watcher = watch("src", { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 250);
});
const packageWatcher = watch("package.json", () => {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 250);
});
const runner = spawn(process.execPath, args, { stdio: "inherit" });
function stop() {
  watcher.close();
  packageWatcher.close();
  clearTimeout(timer);
  runner.kill("SIGTERM");
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
runner.once("error", (error) => {
  console.error(error.message);
  stop();
  process.exitCode = 1;
});
runner.once("exit", (code) => {
  watcher.close();
  packageWatcher.close();
  clearTimeout(timer);
  process.exitCode = code || 0;
});
