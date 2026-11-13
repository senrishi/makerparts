import { isMakerCart } from "../core/sites.js";
import { showSaveSuccess } from "../components/save-feedback.js";
import { api, request } from "../core/api.js";
import { partForm } from "../components/part-form.js";
import { suggestCategory } from "../core/model.js";
import { captureProduct } from "../capture/product.js";
const message = document.querySelector("#message");
async function initialize() {
  try {
    const params = new URL(location.href).searchParams;
    const sourceTab = params.get("sourceTab");
    let tab;
    try {
      tab = sourceTab
        ? await api.tabs.get(Number(sourceTab))
        : (await api.tabs.query({ active: true, currentWindow: true }))[0];
    } catch {}
    if (isMakerCart(tab?.url)) {
      const mode =
        sourceTab && params.get("view") !== "toolbar" ? "" : "&view=toolbar";
      location.replace(
        api.runtime.getURL(`pages/cart.html?sourceTab=${tab.id}${mode}`),
      );
      return;
    }
    const state = await request({ type: "read" });
    let part = {};
    let dirty = false;
    const root = document.querySelector("#form-root");
    root.addEventListener("input", () => {
      dirty = true;
    });
    const mount = (data, initial) =>
      partForm(root, data, initial, (next) => {
        dirty = true;
        message.textContent = "";
        const saved = next.parts.at(-1);
        const name =
          next.projects.find((project) => project.id === saved.projectId)
            ?.name || "Miscellaneous";
        showSaveSuccess(root, `Saved to ${name}.`);
      });
    mount(state, {});
    try {
      if (tab && /^https?:/.test(tab.url || "")) {
        part = { name: tab.title, url: tab.url };
        const [result] = await api.scripting.executeScript({
          target: { tabId: tab.id },
          func: captureProduct,
        });
        if (result?.result) part = result.result;
      } else
        document.querySelector("#capture-hint").textContent =
          "Paste a product link below to save it.";
    } catch {
      document.querySelector("#capture-hint").textContent =
        "Page details unavailable. You can enter them below.";
    }
    if (
      part.price !== undefined &&
      (part.price === "" ||
        !Number.isFinite(Number(part.price)) ||
        Number(part.price) < 0)
    )
      part.price = null;
    part.category = suggestCategory(part.name);
    if (!dirty) mount(state, part);
  } catch (error) {
    document.querySelector("#form-root").replaceChildren();
    message.textContent = `Could not load your library: ${error.message}. Reload the extension and try again.`;
  }
}
initialize();
