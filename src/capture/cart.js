// Runs in the MakerBazar tab so its existing cart session is used.
export async function captureCart() {
  if (!["makerbazar.in", "www.makerbazar.in"].includes(location.hostname))
    throw Error("Cart capture is only available on MakerBazar.");
  const prefix = location.pathname.match(/^(.*)\/cart\/?$/)?.[1] || "";
  const response = await fetch(`${prefix}/cart.js`, {
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok)
    throw Error(
      "Could not read your cart. Refresh the store page and try again.",
    );
  const cart = await response.json();
  if (!Array.isArray(cart.items) || !/^[A-Z]{3}$/.test(cart.currency))
    throw Error("The store returned an unsupported cart format.");
  return {
    currency: cart.currency,
    parts: cart.items.map((item) => {
      const quantity = Number(item.quantity);
      const cents = Number(item.final_price ?? item.price);
      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !Number.isFinite(cents) ||
        cents < 0
      )
        throw Error("A cart item has an invalid price or quantity.");
      const url = new URL(item.url, location.origin);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.origin !== location.origin
      )
        throw Error("A cart item has an invalid product link.");
      if (item.variant_id)
        url.searchParams.set("variant", String(item.variant_id));
      return {
        name: String(item.product_title || item.title || "").slice(0, 250),
        model:
          item.variant_title === "Default Title"
            ? ""
            : String(item.variant_title || "").slice(0, 250),
        sku: String(item.sku || "").slice(0, 250),
        url: url.href,
        price: cents / 100,
        currency: cart.currency,
        quantity,
        status: "planned",
        notes: "",
      };
    }),
  };
}
