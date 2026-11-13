import { showSaveSuccess } from "../components/save-feedback.js";
import { api, request } from "../core/api.js";
import { suggestCategory, totals } from "../core/model.js";
import { money } from "../core/format.js";
import { el } from "../components/dom.js";
import { projectPicker } from "../components/project-picker.js";
import { captureCart } from "../capture/cart.js";
const root = document.querySelector("#form-root");
const message = document.querySelector("#message");
async function load() {
  root.replaceChildren(el("p", "Reading your cart…", "muted"));
  message.textContent = "";
  try {
    const sourceTab = Number(
      new URL(location.href).searchParams.get("sourceTab"),
    );
    if (!Number.isInteger(sourceTab) || sourceTab <= 0)
      throw Error("Open Save Cart from the MakerBazar cart page.");
    const state = await request({ type: "read" });
    const [result] = await api.scripting.executeScript({
      target: { tabId: sourceTab },
      func: captureCart,
    });
    if (result?.error)
      throw Error(result.error.message || "Could not read your cart.");
    if (!result?.result)
      throw Error("Could not read your cart. Refresh MakerBazar and retry.");
    const parts = result.result.parts.map((part) => ({
      ...part,
      category: suggestCategory(`${part.name} ${part.model}`),
    }));
    if (!parts.length) {
      root.replaceChildren(el("p", "Your MakerBazar cart is empty.", "muted"));
      return;
    }
    const form = el("form", undefined, "part-form");
    form.innerHTML = `<div class="form-fields"><label>Project<select name="project" required></select></label><label id="new-project-field">New project name<input name="newProject" maxlength="100" placeholder="Leave blank for Miscellaneous"></label><p id="cart-summary"></p><div id="cart-items"></div></div><div class="form-actions"><p class="form-error" role="alert"></p><button class="primary save" type="submit">Save entire cart</button></div>`;
    const destination = projectPicker(form, state);
    const total = Object.entries(totals(parts))
      .map(([currency, value]) => money(value, currency))
      .join(" + ");
    form.querySelector("#cart-summary").textContent =
      `${parts.length} parts · ${parts.reduce((sum, p) => sum + p.quantity, 0)} units · ${total}`;
    for (const part of parts) {
      const row = el("article", undefined, "cart-line");
      row.append(
        el("strong", part.name),
        el(
          "p",
          [part.model, part.sku && `SKU: ${part.sku}`]
            .filter(Boolean)
            .join(" · "),
          "muted",
        ),
        el("p", `${part.quantity} × ${money(part.price, part.currency)}`),
      );
      form.querySelector("#cart-items").append(row);
    }
    form.onsubmit = async (event) => {
      event.preventDefault();
      const button = form.querySelector("button.save");
      button.disabled = true;
      form.querySelector(".form-error").textContent = "";
      try {
        const next = await request({
          type: "saveCart",
          ...destination(),
          parts,
        });
        const saved = next.parts.at(-1);
        const name =
          next.projects.find((p) => p.id === saved.projectId)?.name ||
          "Miscellaneous";
        showSaveSuccess(root, `Saved ${parts.length} parts to ${name}.`);
        message.textContent = "";
      } catch (error) {
        form.querySelector(".form-error").textContent = error.message;
        button.disabled = false;
      }
    };
    root.replaceChildren(form);
  } catch (error) {
    root.replaceChildren(el("p", error.message, "form-error"));
    const retry = el("button", "Retry");
    retry.onclick = load;
    root.append(retry);
  }
}
load();
