import { MISC_ID } from "./model.js";
export function plannedRestore(state, projectId) {
  const project =
    projectId === MISC_ID
      ? { id: MISC_ID, name: "Miscellaneous" }
      : state.projects.find((p) => p.id === projectId);
  if (!project) throw Error("Project not found.");
  const parts = state.parts.filter(
    (p) => p.projectId === projectId && p.status === "planned",
  );
  if (!parts.length) throw Error("This list has no Planned parts to restore.");
  for (const part of parts) {
    const url = new URL(part.url);
    if (
      url.protocol !== "https:" ||
      !["makerbazar.in", "www.makerbazar.in"].includes(url.hostname) ||
      !/\/products\/[^/]+/.test(url.pathname)
    )
      throw Error(
        `“${part.name}” is not a MakerBazar product. Restore supports MakerBazar parts only.`,
      );
  }
  return { project, parts };
}
