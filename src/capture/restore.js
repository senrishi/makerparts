// Self-contained: execute inside a MakerBazar tab using its current cart session.
export async function makerCartOperation(mode, payload = {}) {
  if (
    location.protocol !== "https:" ||
    !["makerbazar.in", "www.makerbazar.in"].includes(location.hostname)
  )
    return { ok: false, error: "Open MakerBazar to manage its cart." };
  const base =
    location.pathname.match(
      /^((?:\/[a-z]{2}(?:-[a-z]{2})?)?)\/cart\/?$/i,
    )?.[1] || "";
  const line = (item) => ({
    id: String(item.variant_id || item.id),
    quantity: item.quantity,
    ...(item.properties && Object.keys(item.properties).length
      ? { properties: item.properties }
      : {}),
    ...(item.selling_plan_allocation?.selling_plan?.id
      ? { selling_plan: item.selling_plan_allocation.selling_plan.id }
      : item.selling_plan
        ? { selling_plan: item.selling_plan }
        : {}),
  });
  const fingerprint = (items) =>
    JSON.stringify(
      items
        .map((item) => {
          const x = line(item);
          if (x.properties)
            x.properties = Object.fromEntries(
              Object.entries(x.properties).sort(),
            );
          return x;
        })
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    );
  async function call(path, body) {
    const response = await fetch(`${base}${path}`, {
      method: body === undefined ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw Error("The store returned an unreadable response.");
    }
    if (!response.ok)
      throw Error(
        data.description ||
          data.message ||
          "MakerBazar could not update the cart.",
      );
    return data;
  }
  const read = () => call("/cart.js");
  const quantities = (items) => {
    const result = {};
    for (const item of items) {
      const id = String(item.variant_id || item.id);
      result[id] = (result[id] || 0) + Number(item.quantity);
    }
    return JSON.stringify(Object.entries(result).sort());
  };
  if (mode === "prepare")
    try {
      if (!Array.isArray(payload.parts) || !payload.parts.length)
        throw Error("No Planned parts to restore.");
      const previous = await read();
      if (!Array.isArray(previous.items))
        throw Error("Unsupported cart response.");
      const cache = new Map();
      const resolved = [];
      for (const part of payload.parts) {
        const url = new URL(part.url);
        if (
          !["makerbazar.in", "www.makerbazar.in"].includes(url.hostname) ||
          url.protocol !== "https:"
        )
          throw Error(`“${part.name}” is not from MakerBazar.`);
        const handle = url.pathname.match(/\/products\/([^/]+)/)?.[1];
        if (!handle) throw Error(`No product link for “${part.name}”.`);
        if (!cache.has(handle))
          cache.set(
            handle,
            await call(
              `/products/${encodeURIComponent(decodeURIComponent(handle))}.js`,
            ),
          );
        const product = cache.get(handle);
        const variants = product.variants || [];
        const id = url.searchParams.get("variant");
        let matches;
        if (id) matches = variants.filter((v) => String(v.id) === id);
        else if (part.sku) matches = variants.filter((v) => v.sku === part.sku);
        else if (part.model)
          matches = variants.filter(
            (v) => v.title === part.model || v.public_title === part.model,
          );
        else matches = variants.length === 1 ? variants : [];
        if (matches.length !== 1)
          throw Error(
            `Choose an exact variant link for “${part.name}” before restoring.`,
          );
        const variant = matches[0];
        if (variant.available === false)
          throw Error(
            `“${part.name}” is sold out. The current cart has not been changed.`,
          );
        if (!Number.isInteger(part.quantity) || part.quantity < 1)
          throw Error(`Invalid quantity for “${part.name}”.`);
        resolved.push({
          id: String(variant.id),
          quantity: part.quantity,
          name: part.name,
          model:
            variant.title === "Default Title"
              ? ""
              : variant.title || part.model || "",
        });
      }
      const merged = new Map();
      for (const item of resolved) {
        const current = merged.get(item.id);
        if (current) current.quantity += item.quantity;
        else merged.set(item.id, { id: item.id, quantity: item.quantity });
      }
      return {
        ok: true,
        origin: location.origin,
        base,
        expected: fingerprint(previous.items),
        previous: previous.items.map((item) => ({
          ...line(item),
          name: item.product_title || item.title || "",
        })),
        items: [...merged.values()],
        parts: resolved,
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  if (mode !== "restore" && mode !== "clear")
    return { ok: false, error: "Unknown cart operation." };
  if (globalThis.__makerpartsCartBusy)
    return { ok: false, error: "A cart update is already in progress." };
  globalThis.__makerpartsCartBusy = true;
  let modified = false;
  try {
    if (mode === "restore") {
      if (payload.origin !== location.origin || payload.base !== base)
        throw Error("The store tab changed. Reopen Restore Project.");
      if (
        !Array.isArray(payload.items) ||
        !payload.items.length ||
        payload.items.some(
          (item) =>
            !/^\d+$/.test(String(item.id)) ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1,
        )
      )
        throw Error("Invalid restore plan.");
      const current = await read();
      if (fingerprint(current.items) !== payload.expected)
        throw Error(
          "Your cart changed since the preview. Reopen Restore Project before replacing it.",
        );
    }
    modified = true;
    await call("/cart/clear.js", {});
    if ((await read()).items.length)
      throw Error("MakerBazar did not empty the cart.");
    if (mode === "restore") {
      await call("/cart/add.js", { items: payload.items });
      if (quantities((await read()).items) !== quantities(payload.items))
        throw Error("The store could not add the exact requested quantities.");
    }
    return { ok: true };
  } catch (error) {
    if (mode === "restore" && modified) {
      try {
        await call("/cart/clear.js", {});
        if (payload.previous.length)
          await call("/cart/add.js", {
            items: payload.previous.map(({ name, ...item }) => item),
          });
        if (fingerprint((await read()).items) !== payload.expected)
          throw Error("Recovery verification failed.");
        return {
          ok: false,
          error: `${error.message} Your previous cart was restored.`,
          recovery: "restored",
        };
      } catch {
        return {
          ok: false,
          error: `${error.message} Automatic recovery failed. Use the previous-cart backup below to rebuild your cart.`,
          recovery: "failed",
        };
      }
    }
    return { ok: false, error: error.message };
  } finally {
    delete globalThis.__makerpartsCartBusy;
  }
}
