import { readFile } from "node:fs/promises";
const { version } = JSON.parse(await readFile("package.json", "utf8"));
const ref = process.env.GITHUB_REF || "";
if (ref.startsWith("refs/tags/") && ref !== `refs/tags/v${version}`)
  throw Error(`Release tag must be v${version}, matching package.json.`);
const metadata = JSON.parse(
  await readFile("release/amo-metadata.json", "utf8"),
);
if (
  !metadata.summary?.["en-US"] ||
  !metadata.categories?.length ||
  !metadata.version?.license
)
  throw Error("Missing initial Mozilla listing metadata.");
console.log(
  `Firefox release ${version} ready; metadata present. No upload performed.`,
);
