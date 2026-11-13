// Only the standalone capture window should follow its viewport dimensions.
// Toolbar popups keep explicit intrinsic dimensions for Firefox auto-sizing.
const params = new URL(location.href).searchParams;
if (params.has("sourceTab") && params.get("view") !== "toolbar") {
  document.documentElement.classList.add("capture-window");
}
