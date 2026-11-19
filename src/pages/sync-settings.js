import { api, request } from "../core/api.js";
import { dataTypes, origin } from "../core/cloud.js";

const get = (id) => document.getElementById(id);
const panel = get("sync");
const form = get("sync-login");
const output = get("sync-status");

function render(state) {
  form.hidden = Boolean(state.email) && !state.reconnect;
  get("sync-controls").hidden = !state.email;
  get("sync-conflict").hidden = !state.conflict;
  get("sync-account").textContent = state.email || "";
  output.textContent = state.message;
}

async function run(action) {
  const buttons = [...panel.querySelectorAll("button")];
  buttons.forEach((button) => {
    button.disabled = true;
  });
  try {
    render(await request(action));
  } catch (error) {
    output.textContent = error.message;
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
      output.textContent = "Cloud sync access was declined.";
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
    output.textContent = error.message;
  }
};

for (const button of panel.querySelectorAll("[data-action]")) {
  button.onclick = () => {
    if (button.dataset.confirm && !confirm(button.dataset.confirm)) return;
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
