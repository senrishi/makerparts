import { readdir, rm } from "node:fs/promises";
import path from "node:path";
// Only generated MakerParts release packages are eligible for removal.
export async function pruneOldPackages(version, directory = "artifacts") {
  const removed = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const match = entry.name.match(
      /^makerparts-(chrome|firefox|mercury|source)-(\d+\.\d+\.\d+(?:-[\w.-]+)?)\.(zip|xpi)$/,
    );
    if (entry.isFile() && match && match[2] !== version) {
      await rm(path.join(directory, entry.name));
      removed.push(entry.name);
    }
  }
  return removed;
}
