import { api, request } from "../core/api.js";
import { dataTypes, origin } from "../core/cloud.js";

const get = (id) => document.getElementById(id);
const panel = get("sync");
const form = get("sync-login");
const output = get("sync-status");

function notice(title, detail = "", kind = "success") {
  get("sync-notice").dataset.kind = kind;
  get("sync-notice-title").textContent = title;
  get("sync-notice-detail").textContent = detail;
}

function render(state) {
  form.hidden = Boolean(state.email) && !state.reconnect;
  get("sync-controls").hidden = !state.email;
  get("sync-intro").hidden = Boolean(state.email);
  panel.querySelector('[data-action="cloudLogout"]').hidden = !state.email;
  get("sync-account").textContent = state.email || "";
  output.textContent = state.message;
}

async function run(action) {
  const buttons = [...panel.querySelectorAll("button")];
  buttons.forEach((button) => {
    button.disabled = true;
  });
  if (action.type === "cloudSync") output.textContent = "Syncing…";
  try {
    const state = await request(action);
    render(state);
    if (action.type === "cloudLogin" && state.email) {
      notice("Signed in successfully");
    } else if (action.type === "cloudLogout") {
      notice("Signed out");
    }
  } catch (error) {
    notice("Cloud sync error", error.message, "error");
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
    });
  }
}

form.onsubmit = async (event) => {
  event.preventDefault();
  const access = { origins: [origin + "/*"] };
  if (
    api.runtime.getManifest().browser_specific_settings?.gecko
      ?.data_collection_permissions?.optional
  )
    access.data_collection = dataTypes;
  try {
    if (!(await api.permissions.request(access))) {
      notice(
        "Cloud sync access declined",
        "Try signing in again and allow access when prompted.",
        "error",
      );
      return;
    }
    const input = new FormData(form);
    form.reset();
    await run({
      type: "cloudLogin",
      email: input.get("email"),
      password: input.get("password"),
    });
  } catch (error) {
    notice("Cloud sync error", error.message, "error");
  }
};

for (const button of panel.querySelectorAll("[data-action]")) {
  button.onclick = () => {
    return run({ type: button.dataset.action });
  };
}
api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.cloud)
    request({ type: "cloudStatus" })
      .then(render)
      .catch(() => {});
});
await run({ type: "cloudStatus" });
