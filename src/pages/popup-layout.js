// Only the standalone capture window should follow its viewport dimensions.
// Toolbar popups keep explicit intrinsic dimensions for Firefox auto-sizing.
if (new URL(location.href).searchParams.has("sourceTab")) {
  document.documentElement.classList.add("capture-window");
}
