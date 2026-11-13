import { el } from "./dom.js";
import { MISC_ID } from "../core/model.js";
export function renderProjectList(root, projects, onOpen) {
  root.replaceChildren();
  const grid = el("div", undefined, "project-grid");
  for (const project of [...projects, { id: MISC_ID, name: "Miscellaneous" }]) {
    const button = el("button", project.name, "project-tile");
    button.onclick = () => onOpen(project.id);
    grid.append(button);
  }
  root.append(grid);
}
