import { MISC_ID } from "./model.js";

export function canonical(value) {
  return JSON.stringify(value, (_, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  );
}

function same(a, b) {
  return canonical(a) === canonical(b);
}

function mergeRecords(base, local, remote) {
  const byId = (records) =>
    new Map(records.map((record) => [record.id, record]));
  const previous = byId(base);
  const device = byId(local);
  const hosted = byId(remote);
  const merged = [];
  for (const id of new Set([...hosted.keys(), ...device.keys()])) {
    const old = previous.get(id);
    const left = device.get(id);
    const right = hosted.get(id);
    let result;
    if (same(left, old)) result = right;
    else if (same(right, old)) result = left;
    else if (!left || !right) result = left ?? right;
    else {
      // Preserve independent field edits. This device wins if both edit one field.
      result = Object.fromEntries(
        [...new Set([...Object.keys(left), ...Object.keys(right)])]
          .map((key) => [
            key,
            same(left[key], old?.[key]) ? right[key] : left[key],
          ])
          .filter(([, value]) => value !== undefined),
      );
    }
    if (result) merged.push(result);
  }
  return merged;
}

export function mergeLibraries(base, local, remote) {
  const projects = mergeRecords(base.projects, local.projects, remote.projects);
  const projectIds = new Set(projects.map(({ id }) => id));
  const parts = mergeRecords(base.parts, local.parts, remote.parts).map(
    (part) =>
      part.projectId === MISC_ID || projectIds.has(part.projectId)
        ? part
        : { ...part, projectId: MISC_ID },
  );
  const remembered =
    local.lastProjectId === base.lastProjectId
      ? remote.lastProjectId
      : local.lastProjectId;
  const next = { version: 1, projects, parts };
  if (remembered !== undefined)
    next.lastProjectId =
      projectIds.has(remembered) || remembered === MISC_ID ? remembered : null;
  return next;
}
