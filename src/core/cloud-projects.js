import { emptyState, MISC_ID, validateState } from "./model.js";

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

export function readDevices(library) {
  validateState(library);
  return (Array.isArray(library.devices) ? library.devices : [])
    .filter(({ id }) => id !== "legacy")
    .map(({ id, label, snapshot }) => ({
      id,
      label,
      snapshot: validateState(snapshot),
    }));
}

export function browserDeviceLabel(userAgent, customName = "") {
  const browser =
    [
      [/Mercury\//i, "Mercury"],
      [/Edg(?:A|iOS)?\//i, "Edge"],
      [/OPR\//i, "Opera"],
      [/(?:Firefox|FxiOS)\//i, "Firefox"],
      [/Chromium\//i, "Chromium"],
      [/(?:Chrome|CriOS)\//i, "Chrome"],
    ].find(([pattern]) => pattern.test(userAgent))?.[1] ?? "Browser";

  const device =
    [
      [/Android/i, "Android"],
      [/iPad/i, "iPad"],
      [/iPhone/i, "iPhone"],
      [/Windows/i, "Windows"],
      [/CrOS/i, "ChromeOS"],
      [/Macintosh|Mac OS X/i, "macOS"],
      [/Linux/i, "Linux"],
    ].find(([pattern]) => pattern.test(userAgent))?.[1] ?? "Unknown device";

  return `${browser} - ${customName || device}`;
}

export function encodeDevices(devices) {
  // Keep the existing web dashboard and JSON backup readers compatible.
  const library = { ...emptyState(), devices };
  for (const { id, label, snapshot } of devices) {
    const linkedId = (recordId) => JSON.stringify([id, recordId]);
    library.projects.push(
      ...snapshot.projects.map((project) => ({
        ...project,
        id: linkedId(project.id),
        name: `${project.name} (${label})`,
      })),
    );
    library.parts.push(
      ...snapshot.parts.map((part) => ({
        ...part,
        id: linkedId(part.id),
        projectId:
          part.projectId === MISC_ID ? MISC_ID : linkedId(part.projectId),
      })),
    );
  }
  return validateState(library);
}

export function updateDevice(hosted, local, previous) {
  const next = structuredClone(hosted);
  const oldProjects = new Map(previous.projects.map((p) => [p.id, p]));
  const oldParts = new Map(previous.parts.map((p) => [p.id, p]));
  const active = new Set([MISC_ID, ...local.projects.map((p) => p.id)]);
  for (const project of local.projects) {
    const index = next.projects.findIndex((p) => p.id === project.id);
    if (!oldProjects.has(project.id) && index < 0) next.projects.push(project);
    else if (
      index >= 0 &&
      canonical(project) !== canonical(oldProjects.get(project.id))
    )
      next.projects[index] = project;
  }
  const available = new Set([MISC_ID, ...next.projects.map((p) => p.id)]);
  const localParts = new Map(local.parts.map((p) => [p.id, p]));
  next.parts = next.parts.filter((part) => {
    const old = oldParts.get(part.id);
    if (!old || !active.has(old.projectId)) return true;
    const current = localParts.get(part.id);
    return (
      current &&
      (current.projectId === old.projectId || available.has(current.projectId))
    );
  });
  for (const part of local.parts) {
    if (
      !available.has(part.projectId) ||
      canonical(part) === canonical(oldParts.get(part.id))
    )
      continue;
    const index = next.parts.findIndex((p) => p.id === part.id);
    if (index < 0 && oldParts.get(part.id)?.projectId !== part.projectId)
      next.parts.push(part);
    else if (index >= 0) next.parts[index] = part;
  }
  return validateState(next);
}
