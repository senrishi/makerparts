import { setupCloudView } from "./cloud-library.js";
import { renderCostOverview } from "../components/cost-overview.js";
import { renderProjectList } from "../components/project-list.js";
import { renderProjectDetails } from "../components/project-details.js";
import { CATEGORIES, MISC_ID } from "../core/model.js";
import { api, request } from "../core/api.js";
import { renderPartList } from "../components/part-list.js";
import { partForm } from "../components/part-form.js";
import { el } from "../components/dom.js";
import { money } from "../core/format.js";
let state,
  selected = location.hash.slice(1);
const $ = (s) => document.querySelector(s);
const message = (text) => ($("#message").textContent = text);
CATEGORIES.forEach((c) => {
  const o = el("option", c);
  o.value = c;
  $("#category-filter").append(o);
});
function edit(part = {}) {
  partForm($("#form-root"), state, { projectId: selected, ...part }, (next) => {
    state = next;
    $("#editor").close();
    render();
    message("✓ Part saved.");
  });
  $("#editor-title").textContent = part.id ? "Edit part" : "Add a part";
  $("#editor").showModal();
}
function selectList(id) {
  showLocal();
  selected = id;
  $("#search").value = "";
  $("#category-filter").value = "";
  $("#status-filter").value = "";
  history.replaceState(null, "", id ? `#${id}` : location.pathname);
  render();
}
function render() {
  if (
    selected &&
    selected !== MISC_ID &&
    !state.projects.some((p) => p.id === selected)
  )
    selected = "";
  const picker = $("#local-project");
  picker.replaceChildren();
  for (const { id, name } of [
    { id: "", name: "All projects" },
    { id: MISC_ID, name: "Miscellaneous" },
    ...state.projects,
  ]) {
    const button = el("button", name);
    button.type = "button";
    if (!id) button.className = "sidebar-home";
    if (id === selected) button.setAttribute("aria-current", "true");
    button.onclick = () => selectList(id);
    picker.append(button);
  }
  const project = state.projects.find((p) => p.id === selected);
  $("#heading").textContent =
    project?.name || (selected === MISC_ID ? "Miscellaneous" : "Projects");
  const home = !selected;
  $("#restore-project").hidden = home;
  $("#restore-project").disabled = !state.parts.some(
    (part) => part.projectId === selected && part.status === "planned",
  );
  $("#totals").hidden = home;
  $("#cost-overview").hidden = !home;
  $("#part-toolbar").hidden = home;
  $("#copy-menu").hidden = home;
  if (home) {
    $("#summary").textContent = "";
    renderCostOverview($("#cost-overview"), state.parts);
    renderProjectList($("#parts"), state.projects, state.parts, selectList);
    return;
  }
  $("#rename-project").hidden = $("#delete-project").hidden = !project;
  const all = state.parts.filter((p) => p.projectId === selected);
  const parts = renderProjectDetails({
    all,
    summary: $("#summary"),
    totalRoot: $("#totals"),
    search: $("#search").value,
    category: $("#category-filter").value,
    status: $("#status-filter").value,
  });
  renderPartList({
    root: $("#parts"),
    parts,
    hasParts: all.length > 0,
    projects: state.projects,
    onAdd: () => edit(),
    onEdit: edit,
    onRemove: async (part) => {
      if (!confirm(`Remove “${part.name}”?`)) return;
      try {
        state = await request({ type: "deletePart", id: part.id });
        render();
      } catch (error) {
        message(error.message);
      }
    },
  });
}
function projectText(withLinks = true) {
  const project = state.projects.find((item) => item.id === selected);
  const name = project?.name || "Miscellaneous";
  const parts = state.parts.filter((part) => part.projectId === selected);
  const lines = [name, ""];
  for (const category of CATEGORIES) {
    const group = parts.filter((part) => part.category === category);
    if (!group.length) continue;
    lines.push(category, "=".repeat(category.length));
    for (const part of group) {
      lines.push(`• ${part.name}`);
      if (part.model) lines.push(`  Model: ${part.model}`);
      lines.push(`  Quantity: ${part.quantity}`);
      lines.push(
        `  Unit price: ${part.price === null ? "Unknown" : money(part.price, part.currency)}`,
      );
      if (part.notes) lines.push(`  Notes: ${part.notes}`);
      if (withLinks) lines.push(`  Link: ${part.url}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
async function copyProject(withLinks = true) {
  const parts = state.parts.filter((part) => part.projectId === selected);
  if (!parts.length) {
    message("There are no parts in this list to copy.");
    return;
  }
  try {
    await navigator.clipboard.writeText(projectText(withLinks));
    $("#copy-menu details").open = false;
    message(
      withLinks
        ? "Project copied with links."
        : "Project copied without links.",
    );
  } catch {
    message(
      "Could not copy to clipboard. Check browser clipboard permissions.",
    );
  }
}
$("#restore-project").onclick = () =>
  api.windows.create({
    url: api.runtime.getURL(
      `pages/restore.html?view=restore&projectId=${encodeURIComponent(selected)}`,
    ),
    type: "popup",
    width: 540,
    height: 700,
  });
$("#copy-project").onclick = () => copyProject(true);
$("#copy-menu [data-copy-links='true']").onclick = () => copyProject(true);
$("#copy-menu [data-copy-links='false']").onclick = () => copyProject(false);
$("#add-part").onclick = () => edit();
$("#close-editor").onclick = () => $("#editor").close();
for (const id of ["#search", "#category-filter", "#status-filter"])
  $(id).addEventListener("input", render);
function projectDialog(rename = false) {
  $("#project-title").textContent = rename ? "Rename project" : "New project";
  $("#project-name").value = rename
    ? state.projects.find((p) => p.id === selected).name
    : "";
  $("#project-error").textContent = "";
  $("#project-dialog").dataset.rename = String(rename);
  $("#project-dialog").showModal();
  $("#project-name").focus();
}
$("#new-project").onclick = () => projectDialog();
$("#rename-project").onclick = () => projectDialog(true);
$("#cancel-project").onclick = () => $("#project-dialog").close();
$("#project-form").onsubmit = async (e) => {
  e.preventDefault();
  try {
    const id =
      $("#project-dialog").dataset.rename === "true"
        ? selected
        : crypto.randomUUID();
    state = await request({
      type: "project",
      id,
      name: $("#project-name").value,
    });
    $("#project-dialog").close();
    selectList(id);
  } catch (e) {
    $("#project-error").textContent = e.message;
  }
};
$("#delete-project").onclick = async () => {
  if (
    !confirm(
      "Delete this project and all its parts? Export a backup first if you need to keep them.",
    )
  )
    return;
  try {
    state = await request({ type: "deleteProject", id: selected });
    selected = "";
    render();
  } catch (e) {
    message(e.message);
  }
};
api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.library) {
    state = changes.library.newValue;
    render();
  }
});
const showLocal = setupCloudView(selectList);
try {
  state = await request({ type: "read" });
  render();
} catch (e) {
  message(e.message);
}
