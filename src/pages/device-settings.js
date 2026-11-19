import { api, request } from "../core/api.js";

const form = document.querySelector("#device-settings");
const field = document.querySelector("#device-name");
const feedback = document.querySelector("#device-feedback");
const button = form.querySelector("button");

button.disabled = true;
try {
  const { cloudDevice } = await api.storage.local.get("cloudDevice");
  field.value = cloudDevice?.name ?? "";
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
    const result = await request({ type: "cloudRenameDevice", name });
    field.value = name;
    feedback.textContent = result.renamePending
      ? "Name saved. Cloud will update on the next successful sync."
      : name
        ? "Device name saved."
        : "Automatic name restored.";
  } catch (error) {
    feedback.textContent = error.message;
  } finally {
    button.disabled = false;
  }
};
