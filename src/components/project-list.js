import { el } from "./dom.js";
import { money } from "../core/format.js";
import { MISC_ID, totals } from "../core/model.js";
export function renderProjectList(
  root,
  projects,
  parts,
  onOpen,
  { includeMisc = true } = {},
) {
  root.replaceChildren();
  const grid = el("div", undefined, "project-grid");
  for (const project of [
    ...projects,
    ...(includeMisc ? [{ id: MISC_ID, name: "Miscellaneous" }] : []),
  ]) {
    const button = el("button", undefined, "project-tile");
    button.append(el("strong", project.name), document.createTextNode(" "));
    const projectParts = parts.filter((p) => p.projectId === project.id);
    const values = Object.entries(totals(projectParts));
    button.append(
      el(
        "span",
        values.length
          ? values
              .map(([currency, value]) => money(value, currency))
              .join(" · ")
          : "—",
        "project-value",
      ),
    );
    const unpriced = projectParts.filter((p) => p.price === null).length;
    if (unpriced)
      button.append(el("span", `${unpriced} unpriced`, "project-unpriced"));
    button.onclick = () => onOpen(project.id);
    grid.append(button);
  }
  root.append(grid);
}
