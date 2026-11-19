import { api, request } from "../core/api.js";
import { MISC_ID, validUrl } from "../core/model.js";
import { money } from "../core/format.js";
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
  function show(tab) {
    const cloud = tab === "cloud";
    get("local-view").hidden =
      get("local-nav").hidden =
      get("new-project").hidden =
        cloud;
    get("cloud-view").hidden = get("cloud-nav").hidden = !cloud;
    get("local-tab").setAttribute("aria-pressed", String(!cloud));
    get("cloud-tab").setAttribute("aria-pressed", String(cloud));
  }
  function renderProject() {
    const selected = entries.get(picker.value);
    copy.hidden = remove.hidden = !selected;
    get("cloud-heading").textContent = selected?.name || "Cloud projects";
    const root = get("cloud-parts");
    root.replaceChildren();
    if (!selected) return;
    if (!selected.parts.length)
      root.append(el("p", "No parts in this project.", "muted"));
    for (const part of selected.parts) {
      const link = el("a", part.name, "part-name");
      link.href = validUrl(part.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const price =
        part.price === null ? "Unpriced" : money(part.price, part.currency);
      const row = el("article", undefined, "part-card");
      row.append(
        link,
        el("span", `${part.category} · ${part.quantity} × ${price}`, "muted"),
      );
      root.append(row);
    }
  }
  function render(devices) {
    const selected = picker.value;
    entries = new Map();
    picker.replaceChildren(new Option("Select a cloud project", ""));
    for (const { id: deviceId, label, snapshot } of devices) {
      const group = document.createElement("optgroup");
      group.label =
        deviceId === "legacy" ? label : `${label} · ${deviceId.slice(0, 6)}`;
      const projects = [...snapshot.projects];
      if (snapshot.parts.some((part) => part.projectId === MISC_ID))
        projects.push({ id: MISC_ID, name: "Miscellaneous" });
      for (const { id: projectId, name } of projects) {
        const value = JSON.stringify([deviceId, projectId]);
        entries.set(value, {
          deviceId,
          projectId,
          name,
          parts: snapshot.parts.filter((p) => p.projectId === projectId),
        });
        group.append(new Option(name, value));
      }
      if (group.children.length) picker.append(group);
    }
    picker.value = entries.has(selected) ? selected : "";
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
    show("cloud");
    if (!refreshButton.disabled) run({ type: "cloudBrowse" });
  };
  refreshButton.onclick = () => run({ type: "cloudBrowse" });
  picker.onchange = renderProject;
  copy.onclick = () => {
    const selected = entries.get(picker.value);
    if (selected)
      run({
        type: "cloudCopy",
        deviceId: selected.deviceId,
        projectId: selected.projectId,
      });
  };
  remove.onclick = () => {
    const selected = entries.get(picker.value);
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
}
