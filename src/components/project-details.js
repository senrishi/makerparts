import { totals } from "../core/model.js";
import { money } from "../core/format.js";
import { el } from "./dom.js";

export function renderProjectDetails({
  all,
  summary,
  totalRoot,
  search,
  category,
  status,
}) {
  summary.textContent = `${all.length} part${all.length === 1 ? "" : "s"} · ${all.filter((p) => p.status === "received").length} received`;
  totalRoot.replaceChildren();
  for (const [currency, total] of Object.entries(totals(all))) {
    const box = el("div", undefined, "total");
    box.append(
      el("span", `${currency} · ESTIMATED TOTAL`, "eyebrow"),
      el("strong", money(total, currency)),
    );
    totalRoot.append(box);
  }
  const unknown = all.filter((p) => p.price === null).length;
  if (unknown)
    totalRoot.append(
      el(
        "p",
        `${unknown} part${unknown === 1 ? "" : "s"} without a price`,
        "muted",
      ),
    );
  const query = search.toLowerCase();
  const parts = all.filter(
    (p) =>
      (!category || p.category === category) &&
      (!status || p.status === status) &&
      [p.name, p.notes, p.url, p.model || "", p.sku || ""].some((v) =>
        v.toLowerCase().includes(query),
      ),
  );
  return parts;
}
