import { api, request } from "../core/api.js";
import { browserDeviceLabel } from "../core/cloud-projects.js";

const form = document.querySelector("#device-settings");
const field = document.querySelector("#device-name");
const label = document.querySelector("#device-label");
const feedback = document.querySelector("#device-feedback");
const button = form.querySelector("button");

function showName(name = "") {
  field.value = name;
  label.textContent =
    "Cloud label: " + browserDeviceLabel(navigator.userAgent, name);
}

button.disabled = true;
try {
  const { cloudDevice } = await api.storage.local.get("cloudDevice");
  showName(cloudDevice?.name);
} catch (error) {
  feedback.textContent = error.message;
} finally {
  button.disabled = false;
}

form.onsubmit = async (event) => {
  event.preventDefault();
  const name = field.value.trim();
  button.disabled = true;
  try {
    await request({ type: "cloudRenameDevice", name });
    showName(name);
    feedback.textContent = name
      ? "Device name saved."
      : "Automatic name restored.";
  } catch (error) {
    feedback.textContent = error.message;
  } finally {
    button.disabled = false;
  }
};
