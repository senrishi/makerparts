import { el } from "./dom.js";
import { api } from "../core/api.js";
export function showSaveSuccess(root, detail) {
  const notice = el("div", undefined, "save-notice");
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  notice.append(
    el("span", "✓", "save-check"),
    el("h2", "Saved successfully"),
    el("p", detail, "muted"),
  );
  root.replaceChildren(notice);
  const floating = new URL(location.href).searchParams.has("sourceTab");
  const toolbar = api.extension?.getViews?.({ type: "popup" }).includes(window);
  if (floating || toolbar) setTimeout(() => window.close(), 1400);
}
