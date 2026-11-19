import { api, request } from "../core/api.js";
import { CATEGORIES, MISC_ID } from "../core/model.js";
import { renderProjectList } from "../components/project-list.js";
import { renderProjectDetails } from "../components/project-details.js";
import { renderPartList } from "../components/part-list.js";
import { el } from "../components/dom.js";

export function setupCloudView(openLocalProject) {
  const get = (id) => document.getElementById(id);
  const picker = get("cloud-project");
  const copy = get("cloud-copy");
  const remove = get("cloud-delete");
  const refreshButton = get("cloud-refresh");
  const message = (value) => {
    get("cloud-message").textContent = value;
  };
  let entries = new Map();
  let selectedKey = "";
  let deviceGroups = [];
  for (const category of CATEGORIES)
    get("cloud-category").append(new Option(category));
  for (const id of ["cloud-search", "cloud-category", "cloud-status"])
    get(id).addEventListener("input", renderProject);
  function open(key) {
    selectedKey = key;
    for (const id of ["cloud-search", "cloud-category", "cloud-status"])
      get(id).value = "";
    show("cloud");
    renderProject();
  }
  function show(tab) {
    const cloud = tab === "cloud";
    get("local-view").hidden = cloud;
    get("cloud-view").hidden = !cloud;
    get("local-tab").toggleAttribute("data-current", !cloud);
    get("cloud-tab").toggleAttribute("data-current", cloud);
  }
  function renderProject() {
    const selected = entries.get(selectedKey);
    for (const button of picker.querySelectorAll("button")) {
      if (button.value === selectedKey)
        button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    }
    copy.hidden = remove.hidden = !selected;
    get("cloud-totals").hidden = get("cloud-toolbar").hidden = !selected;
    get("cloud-summary").textContent = "";
    get("cloud-heading").textContent = selected?.name || "Cloud projects";
    const root = get("cloud-parts");
    root.replaceChildren();
    if (!selected) {
      for (const { deviceId, label, snapshot, projects } of deviceGroups) {
        const section = el("section", undefined, "cloud-device-projects");
        const cards = el("div");
        section.append(el("h2", label), cards);
        renderProjectList(
          cards,
          projects,
          snapshot.parts,
          (projectId) => open(JSON.stringify([deviceId, projectId])),
          { includeMisc: false },
        );
        root.append(section);
      }
      return;
    }
    const parts = renderProjectDetails({
      all: selected.parts,
      summary: get("cloud-summary"),
      totalRoot: get("cloud-totals"),
      search: get("cloud-search").value,
      category: get("cloud-category").value,
      status: get("cloud-status").value,
    });
    renderPartList({
      root,
      parts,
      hasParts: selected.parts.length > 0,
      projects: [{ id: selected.projectId, name: selected.name }],
    });
  }
  function render(devices) {
    entries = new Map();
    deviceGroups = [];
    const home = el("button", "All projects");
    home.type = "button";
    home.onclick = () => open("");
    picker.replaceChildren(home);
    for (const { id: deviceId, label, snapshot } of devices) {
      if (deviceId === "legacy") continue;
      const group = el("div", undefined, "sidebar-device");
      const heading = el(
        "p",
        label.includes(" - ") ? label : `${label} - Unknown device`,
        "muted",
      );
      group.append(heading);
      const projects = [...snapshot.projects];
      if (snapshot.parts.some((part) => part.projectId === MISC_ID))
        projects.push({ id: MISC_ID, name: "Miscellaneous" });
      if (projects.length)
        deviceGroups.push({
          deviceId,
          label: heading.textContent,
          snapshot,
          projects,
        });
      for (const { id: projectId, name } of projects) {
        const value = JSON.stringify([deviceId, projectId]);
        entries.set(value, {
          deviceId,
          projectId,
          name,
          parts: snapshot.parts.filter((p) => p.projectId === projectId),
        });
        const button = el("button", name);
        button.type = "button";
        button.value = value;
        button.onclick = () => open(value);
        group.append(button);
      }
      if (projects.length) picker.append(group);
    }
    if (!entries.has(selectedKey)) selectedKey = "";
    renderProject();
  }
  async function run(action) {
    for (const button of [refreshButton, copy, remove]) button.disabled = true;
    try {
      const result = await request(action);
      if (action.type === "cloudCopy") {
        show("local");
        openLocalProject(result.id);
      } else {
        render(result.devices);
        message(entries.size ? "" : "No cloud projects yet.");
      }
    } catch (error) {
      message(error.message);
    } finally {
      for (const button of [refreshButton, copy, remove])
        button.disabled = false;
    }
  }
  get("local-tab").onclick = () => show("local");
  get("cloud-tab").onclick = () => {
    open("");
    if (!get("cloud-section").open && !refreshButton.disabled)
      run({ type: "cloudBrowse" });
  };
  refreshButton.onclick = () => run({ type: "cloudBrowse" });
  copy.onclick = () => {
    const selected = entries.get(selectedKey);
    if (selected)
      run({
        type: "cloudCopy",
        deviceId: selected.deviceId,
        projectId: selected.projectId,
      });
  };
  remove.onclick = () => {
    const selected = entries.get(selectedKey);
    if (selected && confirm(`Delete “${selected.name}” from Cloud?`))
      run({
        type: "cloudDelete",
        deviceId: selected.deviceId,
        projectId: selected.projectId,
      });
  };
  api.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.cloudCatalog)
      render(changes.cloudCatalog.newValue || []);
  });
  show("local");
  return () => {
    get("local-section").open = true;
    show("local");
  };
}
