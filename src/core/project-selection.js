import { MISC_ID } from "./model.js";
export function defaultProject(state, explicit) {
  const exists = (id) =>
    id === MISC_ID || state.projects.some((project) => project.id === id);
  if (explicit === "__new" || exists(explicit)) return explicit;
  // Older libraries can infer their most recently added part once.
  const last =
    state.lastProjectId === undefined
      ? state.parts.at(-1)?.projectId
      : state.lastProjectId;
  return exists(last) ? last : "__new";
}
