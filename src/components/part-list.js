import { CATEGORIES, MISC_ID } from "../core/model.js";
import { el } from "./dom.js";
import { money } from "../core/format.js";
export function renderPartList({
  root,
  parts,
  hasParts,
  projects,
  onAdd,
  onEdit,
  onRemove,
}) {
  root.replaceChildren();
  if (!parts.length) {
    const empty = el("div", undefined, "empty");
    empty.append(
      el("h2", hasParts ? "No matching parts" : "No parts yet"),
      el("p", hasParts ? "Try another search or filter." : "", "muted"),
    );
    const b = el("button", "＋ Add your first part", "primary");
    b.onclick = () => onAdd();
    if (!hasParts) empty.append(b);
    root.append(empty);
    return;
  }
  for (const category of CATEGORIES) {
    const group = parts.filter((p) => p.category === category);
    if (!group.length) continue;
    root.append(el("h2", `${category} · ${group.length}`, "category-heading"));
    for (const p of group) {
      const card = el("article", undefined, "part-card");
      const info = el("div", undefined, "part-info");
      const link = el("a", p.name, "part-name");
      link.href = p.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      info.append(
        link,
        el(
          "p",
          `${new URL(p.url).hostname} · ${p.projectId === MISC_ID ? "Miscellaneous" : projects.find((x) => x.id === p.projectId)?.name}`,
          "muted",
        ),
      );
      if (p.model || p.sku)
        info.append(
          el(
            "p",
            [p.model, p.sku && `SKU: ${p.sku}`].filter(Boolean).join(" · "),
            "model-detail",
          ),
        );
      if (p.notes) info.append(el("p", p.notes, "notes"));
      const price = el("div", undefined, "part-price");
      price.append(
        el(
          "strong",
          p.price === null
            ? "Price unknown"
            : money(p.price * p.quantity, p.currency),
        ),
        el(
          "small",
          `${p.quantity} × ${p.price === null ? "—" : money(p.price, p.currency)}`,
        ),
      );
      const status = el("span", p.status, "status " + p.status);
      const actions = el("div", undefined, "actions");
      const editButton = el("button", "Edit");
      editButton.onclick = () => onEdit(p);
      const remove = el("button", "Remove");
      remove.onclick = () => onRemove(p);
      actions.append(editButton, remove);
      card.append(info, price, status, actions);
      root.append(card);
    }
  }
}
