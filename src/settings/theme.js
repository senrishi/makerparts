const api = globalThis.browser || chrome;
const system = matchMedia("(prefers-color-scheme: dark)");
let preference = "system";
function apply() {
  document.documentElement.dataset.theme =
    preference === "system" ? (system.matches ? "dark" : "light") : preference;
  for (const select of document.querySelectorAll("[data-theme-picker]"))
    select.value = preference;
}
api.storage.local.get("theme").then((data) => {
  preference = data.theme || "system";
  apply();
});
system.addEventListener("change", apply);
api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.theme) {
    preference = changes.theme.newValue || "system";
    apply();
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const select = document.querySelector("[data-theme-picker]");
  if (select) {
    select.onchange = async () => {
      preference = select.value;
      apply();
      await api.storage.local.set({ theme: preference });
    };
  } else {
    const link = document.createElement("a");
    link.href = api.runtime.getURL("pages/settings.html");
    link.target = "_blank";
    link.className = "settings-link";
    link.textContent = "⚙";
    link.setAttribute("aria-label", "Settings");
    link.title = "Settings";
    (
      document.querySelector("aside") || document.querySelector("header")
    ).append(link);
  }
  apply();
});
