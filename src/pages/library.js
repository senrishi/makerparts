import { renderProjectList } from "../components/project-list.js";
import { CATEGORIES, totals, MISC_ID } from "../core/model.js";
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
  $("#projects").replaceChildren();
  const nav = (id, name) => {
    const b = el("button", name, selected === id ? "selected" : "");
    b.onclick = () => {
      selectList(id);
    };
    $("#projects").append(b);
  };
  nav("", "Projects");
  nav(MISC_ID, "Miscellaneous");
  state.projects.forEach((p) => nav(p.id, p.name));
  const project = state.projects.find((p) => p.id === selected);
  $("#heading").textContent =
    project?.name || (selected === MISC_ID ? "Miscellaneous" : "Projects");
  const home = !selected;
  $("#totals").hidden = home;
  $("#part-toolbar").hidden = home;
  if (home) {
    $("#summary").textContent = "";
    renderProjectList($("#parts"), state.projects, selectList);
    return;
  }
  $("#rename-project").hidden = $("#delete-project").hidden = !project;
  const all = state.parts.filter((p) => p.projectId === selected);
  $("#summary").textContent =
    `${all.length} part${all.length === 1 ? "" : "s"} · ${all.filter((p) => p.status === "received").length} received${selected ? "" : ` · ${state.projects.length} projects`}`;
  $("#totals").replaceChildren();
  for (const [currency, total] of Object.entries(totals(all))) {
    const box = el("div", undefined, "total");
    box.append(
      el("span", `${currency} · ESTIMATED TOTAL`, "eyebrow"),
      el("strong", money(total, currency)),
    );
    $("#totals").append(box);
  }
  const unknown = all.filter((p) => p.price === null).length;
  if (unknown)
    $("#totals").append(
      el(
        "p",
        `${unknown} part${unknown === 1 ? "" : "s"} without a price`,
        "muted",
      ),
    );
  const query = $("#search").value.toLowerCase();
  const parts = all.filter(
    (p) =>
      (!$("#category-filter").value ||
        p.category === $("#category-filter").value) &&
      (!$("#status-filter").value || p.status === $("#status-filter").value) &&
      [p.name, p.notes, p.url, p.model || "", p.sku || ""].some((v) =>
        v.toLowerCase().includes(query),
      ),
  );
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
$("#export").onclick = async () => {
  try {
    const latest = await request({ type: "read" });
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(latest, null, 2)], { type: "application/json" }),
    );
    const a = el("a");
    a.href = url;
    a.download = `makerparts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    message(e.message);
  }
};
$("#import").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 10_000_000)
      throw Error("Backup is too large (maximum 10 MB).");
    const imported = JSON.parse(await file.text());
    if (
      confirm(
        "Replace your current library with this backup? Export your current library first to keep it.",
      )
    ) {
      state = await request({ type: "import", state: imported });
      selected = "";
      render();
      message("Backup restored.");
    }
  } catch (e) {
    message(e.message);
  } finally {
    e.target.value = "";
  }
};
api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.library) {
    state = changes.library.newValue;
    render();
  }
});
try {
  state = await request({ type: "read" });
  render();
} catch (e) {
  message(e.message);
}
