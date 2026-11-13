import { totals } from "./model.js";
export function estimates(parts) {
  return {
    remaining: totals(parts.filter((p) => p.status === "planned")),
    spent: totals(
      parts.filter((p) => p.status === "ordered" || p.status === "received"),
    ),
    value: totals(parts),
    unpriced: parts.filter((p) => p.price === null).length,
  };
}
