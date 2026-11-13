import { api, request } from "../core/api.js";
import { plannedRestore } from "../core/restore-plan.js";
import { makerCartOperation } from "../capture/restore.js";
import { el } from "../components/dom.js";
const root = document.querySelector("#form-root");
const message = document.querySelector("#message");
async function storeTab() {
  const tabs = await api.tabs.query({
    url: ["https://makerbazar.in/*", "https://www.makerbazar.in/*"],
  });
  const tab =
    tabs.find((tab) => /\/cart\/?(?:\?|$)/.test(tab.url)) ||
    tabs[0] ||
    (await api.tabs.create({
      url: "https://makerbazar.in/cart",
      active: false,
    }));
  if (tab.status === "complete") return tab;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      api.tabs.onUpdated.removeListener(listener);
      reject(Error("MakerBazar did not finish loading. Try again."));
    }, 20000);
    const listener = (id, change) => {
      if (id === tab.id && change.status === "complete") {
        clearTimeout(timer);
        api.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    api.tabs.onUpdated.addListener(listener);
    api.tabs.get(tab.id).then((current) => {
      if (current.status === "complete")
        listener(tab.id, { status: "complete" });
    });
  });
  return tab;
}
async function run(tabId, mode, payload) {
  const [result] = await api.scripting.executeScript({
    target: { tabId },
    func: makerCartOperation,
    args: [mode, payload],
  });
  if (!result?.result)
    throw Error("MakerBazar did not respond. Reopen Restore Project.");
  return result.result;
}
function download(data) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = el("a");
  a.href = url;
  a.download = "makerparts-previous-cart.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
try {
  const projectId = new URL(location.href).searchParams.get("projectId");
  const original = plannedRestore(await request({ type: "read" }), projectId);
  const tab = await storeTab();
  const plan = await run(tab.id, "prepare", { parts: original.parts });
  if (!plan.ok) throw Error(plan.error);
  const form = el("form", undefined, "part-form");
  const fields = el("div", undefined, "form-fields");
  fields.append(
    el("h2", original.project.name),
    el(
      "p",
      `${plan.parts.length} Planned parts · ${plan.parts.reduce((sum, p) => sum + p.quantity, 0)} units`,
    ),
  );
  for (const part of plan.parts) {
    const row = el("div", undefined, "cart-line");
    row.append(el("strong", `${part.quantity} × ${part.name}`));
    if (part.model) row.append(el("p", part.model, "muted"));
    fields.append(row);
  }
  const previous = el("details", undefined, "previous-cart");
  previous.append(
    el(
      "summary",
      `Replace current cart (${plan.previous.reduce((sum, p) => sum + p.quantity, 0)} units)`,
    ),
  );
  for (const part of plan.previous)
    previous.append(el("p", `${part.quantity} × ${part.name}`));
  fields.append(previous);
  const confirmation = el("label", undefined, "restore-confirm");
  const checkbox = el("input");
  checkbox.type = "checkbox";
  checkbox.required = true;
  checkbox.id = "confirm-replace";
  confirmation.append(
    checkbox,
    document.createTextNode(
      "Replace the existing MakerBazar cart with these Planned parts.",
    ),
  );
  fields.append(confirmation);
  const actions = el("div", undefined, "form-actions");
  const button = el("button", "Restore project", "primary save");
  button.type = "submit";
  const error = el("p", undefined, "form-error");
  error.setAttribute("role", "alert");
  actions.append(error, button);
  form.append(fields, actions);
  root.replaceChildren(form);
  form.onsubmit = async (event) => {
    event.preventDefault();
    button.disabled = true;
    error.textContent = "";
    message.textContent = "Restoring cart…";
    try {
      const latest = plannedRestore(await request({ type: "read" }), projectId);
      if (JSON.stringify(latest.parts) !== JSON.stringify(original.parts))
        throw Error(
          "The project changed. Reopen Restore Project to refresh the preview.",
        );
      const backup = {
        createdAt: new Date().toISOString(),
        store: plan.origin,
        items: plan.previous,
      };
      await api.storage.local.set({ previousCartBackup: backup });
      const backupButton = el("button", "Download previous cart backup");
      backupButton.type = "button";
      backupButton.onclick = () => download(backup);
      const result = await run(tab.id, "restore", plan);
      message.textContent = "";
      if (!result.ok) {
        root.replaceChildren(el("p", result.error, "form-error"), backupButton);
        return;
      }
      root.replaceChildren(
        el("h2", "Project restored"),
        el("p", "Your MakerBazar cart now contains only the Planned parts."),
      );
      const open = el("button", "Open MakerBazar cart", "primary");
      open.onclick = () =>
        api.tabs.update(tab.id, {
          url: `${plan.origin}${plan.base}/cart`,
          active: true,
        });
      const actions = el("div", undefined, "restore-actions");
      actions.append(open, backupButton);
      root.append(actions);
      await api.tabs.update(tab.id, { url: `${plan.origin}${plan.base}/cart` });
    } catch (e) {
      error.textContent = e.message;
      message.textContent = "";
      button.disabled = false;
    }
  };
} catch (error) {
  root.replaceChildren(el("p", error.message, "form-error"));
}
