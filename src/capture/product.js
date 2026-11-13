// Self-contained so scripting.executeScript can serialize this function.
export async function captureProduct() {
  const meta = (...keys) => {
    for (const key of keys) {
      const el = document.querySelector(
        `meta[property="${key}"],meta[name="${key}"]`,
      );
      if (el?.content) return el.content;
    }
    return "";
  };
  let product;
  const find = (x) => {
    if (!x || typeof x !== "object") return;
    if ([].concat(x["@type"] || []).includes("Product")) product ||= x;
    if (Array.isArray(x)) x.forEach(find);
    else if (x["@graph"]) find(x["@graph"]);
  };
  for (const script of document.querySelectorAll(
    'script[type="application/ld+json"]',
  ))
    try {
      find(JSON.parse(script.textContent));
    } catch {}
  const forms = [...document.querySelectorAll('form[action*="/cart/add"]')];
  const form = forms.find((f) => f.getClientRects().length) || forms[0];
  const selectedId =
    form?.querySelector('[name="id"]')?.value ||
    new URL(location.href).searchParams.get("variant");
  let variant;
  // Shopify themes expose product JSON either directly or inside a product wrapper.
  for (const script of document.querySelectorAll(
    'script[type="application/json"],script[data-product-json]',
  )) {
    try {
      const data = JSON.parse(script.textContent);
      const products = [
        data,
        data.product,
        ...(Array.isArray(data) ? data : []),
      ];
      for (const p of products) {
        if (!p?.variants) continue;
        variant ||= p.variants.find((v) => String(v.id) === String(selectedId));
      }
    } catch {}
  }
  // Shopify's public product endpoint covers themes that omit embedded variant JSON.
  if (
    !variant &&
    selectedId &&
    ["makerbazar.in", "www.makerbazar.in"].includes(location.hostname)
  ) {
    const match = location.pathname.match(/\/products\/([^/]+)/);
    if (match)
      try {
        const response = await fetch(`/products/${match[1]}.js`, {
          credentials: "omit",
          signal: AbortSignal.timeout(4000),
        });
        if (response.ok) {
          const data = await response.json();
          variant = data.variants?.find(
            (v) => String(v.id) === String(selectedId),
          );
        }
      } catch {}
  }
  const selections = [];
  const scope =
    form?.closest(
      "product-info,product-section,.product,.product-detail,.product-detail-section",
    ) || document;
  for (const select of scope.querySelectorAll(
    'select[name^="options"],select.single-option-selector,select[data-option-selector]',
  )) {
    const text = select.selectedOptions[0]?.textContent?.trim();
    if (text) selections.push(text);
  }
  for (const input of scope.querySelectorAll('input[type="radio"]:checked')) {
    if (!/option|variant|size|style|model|type|color/i.test(input.name))
      continue;
    selections.push(input.value);
  }
  const offers = [].concat(product?.offers || []);
  const offer =
    offers.find(
      (o) =>
        selectedId &&
        ((variant?.sku && String(o.sku) === String(variant.sku)) ||
          String(o.url || "").includes(`variant=${selectedId}`)),
    ) || (offers.length === 1 ? offers[0] : undefined);
  const optionTitle =
    variant?.public_title ||
    variant?.title ||
    [...new Set(selections)].join(" / ");
  const model = String(
    optionTitle && optionTitle !== "Default Title"
      ? optionTitle
      : product?.model?.name || product?.model || product?.mpn || "",
  ).slice(0, 250);
  const url = new URL(location.href);
  if (selectedId) url.searchParams.set("variant", selectedId);
  const price =
    variant?.price != null
      ? Number(variant.price) / 100
      : (offer?.price ??
        (offers.length > 1
          ? ""
          : meta("product:price:amount", "og:price:amount")));
  return {
    name: String(
      product?.name ||
        meta("og:title") ||
        document.querySelector("h1")?.textContent?.trim() ||
        document.title,
    ).slice(0, 250),
    model,
    sku: String(variant?.sku || offer?.sku || product?.sku || "").slice(0, 250),
    url: url.href,
    price: String(price ?? ""),
    currency: String(
      offer?.priceCurrency ||
        meta("product:price:currency", "og:price:currency"),
    ),
  };
}
