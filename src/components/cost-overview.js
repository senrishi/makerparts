import { estimates } from "../core/estimates.js";
import { money } from "../core/format.js";
import { el } from "./dom.js";
export function renderCostOverview(root, parts) {
  root.replaceChildren();
  const costs = estimates(parts);
  const currencies = Object.keys(costs.value);
  const grid = el("div", undefined, "cost-grid");
  for (const [key, label, hint] of [
    ["remaining", "Still to buy", "Planned parts"],
    ["spent", "Already spent", "Ordered and received parts"],
    ["value", "Total parts value", "All saved parts, including Miscellaneous"],
  ]) {
    const card = el("section", undefined, "cost-card");
    card.title = hint;
    card.append(el("span", label, "cost-label"));
    const amounts = el("div", undefined, "cost-amounts");
    if (!currencies.length) amounts.append(el("strong", "—"));
    else
      for (const currency of currencies)
        amounts.append(
          el("strong", money(costs[key][currency] || 0, currency)),
        );
    card.append(document.createTextNode(" "), amounts);
    grid.append(card);
  }
  root.append(grid);
  if (costs.unpriced)
    root.append(
      el(
        "p",
        `${costs.unpriced} part${costs.unpriced === 1 ? " needs" : "s need"} a price`,
        "muted estimate-note",
      ),
    );
}
