import { spawn } from "node:child_process";
try {
  process.loadEnvFile(".env");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const channel =
  process.argv.find((arg) => arg.startsWith("--channel="))?.split("=")[1] ||
  "unlisted";
if (!["listed", "unlisted"].includes(channel))
  throw Error("Channel must be listed or unlisted.");
if (process.argv.includes("--check")) {
  console.log(
    `Signing command ready (${channel}); no upload performed. Credentials ${process.env.WEB_EXT_API_KEY && process.env.WEB_EXT_API_SECRET ? "present" : "not configured"}.`,
  );
  process.exit(0);
}
if (!process.env.WEB_EXT_API_KEY || !process.env.WEB_EXT_API_SECRET) {
  console.error(
    "Signing is not configured. Set WEB_EXT_API_KEY and WEB_EXT_API_SECRET in your environment or ignored .env file. See docs/DEVELOPMENT.md. No upload performed.",
  );
  process.exit(1);
}
function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      env: process.env,
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(Error(`Command failed (${code})`)),
    );
  });
}
await run(["scripts/build.mjs"]);
await run([
  "node_modules/web-ext/bin/web-ext.js",
  "lint",
  "--source-dir",
  "dist/firefox-release",
  "--warnings-as-errors",
  "--no-config-discovery",
]);
const metadata = process.argv
  .find((arg) => arg.startsWith("--metadata="))
  ?.slice("--metadata=".length);
await run([
  "node_modules/web-ext/bin/web-ext.js",
  "sign",
  "--source-dir",
  "dist/firefox-release",
  "--artifacts-dir",
  "artifacts/signed",
  "--channel",
  channel,
  "--no-config-discovery",
  ...(metadata ? ["--amo-metadata", metadata] : []),
]);
