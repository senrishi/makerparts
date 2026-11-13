import { api, request } from "../core/api.js";
import { partForm } from "../components/part-form.js";
import { suggestCategory } from "../core/model.js";
import { captureProduct } from "../capture/product.js";
const message = document.querySelector("#message");
try {
  const state = await request({ type: "read" });
  let part = {};
  let dirty = false;
  const root = document.querySelector("#form-root");
  root.addEventListener("input", () => {
    dirty = true;
  });
  const mount = (data, initial) =>
    partForm(root, data, initial, (next) => {
      message.textContent = "✓ Saved to your project.";
      mount(next, {});
    });
  mount(state, {});
  try {
    const sourceTab = new URL(location.href).searchParams.get("sourceTab");
    const tab = sourceTab
      ? await api.tabs.get(Number(sourceTab))
      : (await api.tabs.query({ active: true, currentWindow: true }))[0];
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
