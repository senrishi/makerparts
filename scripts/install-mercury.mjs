import { xpiHandoff } from "./xpi-handoff.mjs";
import { spawn, execFileSync } from "node:child_process";
import { readFile, access, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { watch } from "node:fs";
import path from "node:path";
const watchMode = process.argv.includes("--watch");
const dryRun = process.argv.includes("--check");
if (process.platform !== "darwin" && !dryRun)
  throw Error(
    "This installer uses macOS. Use the development profile workflow on other systems.",
  );
const stateFile = path.resolve(".dev/mercury-installer.json");
const app = process.env.MERCURY_APP || "/Applications/Mercury.app";
let busy = false,
  pending = false,
  timer;
async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(Error(`Command exited with ${code}`)),
    );
  });
}
async function install({ build = false, force = false } = {}) {
  if (build) {
    await run(process.execPath, ["scripts/build.mjs"]);
    await run(process.execPath, ["scripts/package.mjs"]);
  }
  const { version } = JSON.parse(await readFile("package.json", "utf8"));
  const file = path.resolve(`artifacts/makerparts-mercury-${version}.xpi`);
  await access(file);
  const manifest = JSON.parse(
    execFileSync("unzip", ["-p", file, "manifest.json"], { encoding: "utf8" }),
  );
  if (
    manifest.version !== version ||
    manifest.browser_specific_settings?.gecko?.strict_min_version !== "115.0"
  )
    throw Error("This is not the expected Mercury compatibility package.");
  const digest = createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
  let previous = {};
  try {
    previous = JSON.parse(await readFile(stateFile, "utf8"));
  } catch {}
  if (dryRun) {
    console.log(
      `Ready to open ${path.basename(file)} in Mercury. No browser action performed.`,
    );
    return;
  }
  if (!force && previous.delivered && previous.digest === digest) return;
  await access(app);
  const handoff = await xpiHandoff(await readFile(file), path.basename(file));
  console.log(
    "Opening a temporary localhost XPI link in Mercury. Approve its install/update prompt if shown.",
  );
  try {
    await run("open", ["-a", app, handoff.url]);
    await handoff.delivered;
  } finally {
    handoff.close();
  }
  await mkdir(path.dirname(stateFile), { recursive: true });
  await writeFile(
    stateFile,
    JSON.stringify({
      version,
      digest,
      delivered: true,
      deliveredAt: new Date().toISOString(),
    }),
  );
  console.log(
    `MakerParts ${version} was served to Mercury. Browser approval may still be required; this is not proof of installation.`,
  );
}
if (!watchMode) {
  await install({ build: !process.argv.includes("--no-build"), force: true });
} else {
  await mkdir("artifacts", { recursive: true });
  async function check() {
    pending = true;
    if (busy) return;
    busy = true;
    while (pending) {
      pending = false;
      try {
        await install();
      } catch (error) {
        if (error.code !== "ENOENT") console.error(error.message);
      }
    }
    busy = false;
  }
  const watcher = watch("artifacts", (_event, file) => {
    if (file?.startsWith("makerparts-mercury-") && file.endsWith(".xpi")) {
      clearTimeout(timer);
      timer = setTimeout(check, 1200);
    }
  });
  await check();
  console.log(
    "Watching packaged Mercury XPIs. Keep this terminal running; future npm run package outputs will open automatically.",
  );
  function stop() {
    watcher.close();
    clearTimeout(timer);
  }
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}
