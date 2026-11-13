// Intentionally limited in both the manifest and this guard to MakerBazar.
(() => {
  if (
    !["makerbazar.in", "www.makerbazar.in"].includes(location.hostname) ||
    document.getElementById("makerparts-floating")
  )
    return;
  const host = document.createElement("div");
  host.id = "makerparts-floating";
  host.style.cssText =
    "position:fixed;right:20px;bottom:24px;z-index:2147483647";
  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent =
    "button{font:600 14px system-ui;cursor:pointer;color:#fff;background:#303030;border:1px solid #aaaaaa;border-radius:28px;padding:14px 20px;box-shadow:0 4px 20px #0004}button:hover{background:#181818}button:focus-visible{outline:3px solid #aaaaaa;outline-offset:3px}";
  const button = document.createElement("button");
  const isCart = () =>
    /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?cart\/?$/i.test(location.pathname);
  const updateLabel = () => {
    button.textContent = isCart() ? "Save Cart" : "＋ Save to MakerParts";
    button.title = isCart()
      ? "Save all cart items to a project"
      : "Save this page and selected variant to a project";
    host.setAttribute("aria-label", button.textContent);
  };
  const clear = document.createElement("button");
  clear.textContent = "Clear Cart";
  clear.style.cssText = "display:block;margin:0 0 8px auto;background:#242424";
  clear.onclick = async () => {
    clear.disabled = true;
    button.disabled = true;
    clear.textContent = "Clearing…";
    try {
      const response = await (globalThis.browser || chrome).runtime.sendMessage(
        { channel: "makerparts", action: { type: "clearStoreCart" } },
      );
      if (!response?.ok)
        throw Error(response?.error || "Could not clear cart.");
      clear.textContent = "Cart cleared";
      setTimeout(() => location.reload(), 350);
    } catch {
      clear.textContent = "Clear failed · retry";
      clear.disabled = false;
      button.disabled = false;
    }
  };
  clear.style.display = isCart() ? "block" : "none";
  window.addEventListener("popstate", () => {
    clear.style.display = isCart() ? "block" : "none";
  });
  updateLabel();
  window.addEventListener("popstate", updateLabel);
  button.onclick = async () => {
    button.disabled = true;
    try {
      const response = await (globalThis.browser || chrome).runtime.sendMessage(
        {
          channel: "makerparts",
          action: { type: isCart() ? "openCartCapture" : "openCapture" },
        },
      );
      if (response?.error) throw Error(response.error);
    } catch {
      button.textContent = "Reload page to reconnect";
    } finally {
      button.disabled = false;
    }
  };
  shadow.append(style, clear, button);
  document.documentElement.append(host);
})();
