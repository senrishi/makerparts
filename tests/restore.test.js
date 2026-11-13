import test from "node:test";
import assert from "node:assert/strict";
import { makerCartOperation } from "../src/capture/restore.js";
import { plannedRestore } from "../src/core/restore-plan.js";
const part = {
  id: "part",
  projectId: "p",
  name: "Board",
  url: "https://makerbazar.in/products/board?variant=22",
  quantity: 2,
  status: "planned",
  model: "Type-C",
};
const old = {
  id: 11,
  variant_id: 11,
  quantity: 1,
  product_title: "Old item",
  properties: { Color: "Black" },
};
function fixture({
  failAdd = false,
  failRecovery = false,
  limited = false,
} = {}) {
  let cart = [structuredClone(old)];
  const calls = [];
  globalThis.location = {
    protocol: "https:",
    hostname: "makerbazar.in",
    origin: "https://makerbazar.in",
    pathname: "/cart",
  };
  globalThis.fetch = async (url, options = {}) => {
    calls.push([url, options.method]);
    let data;
    let status = 200;
    if (url === "/cart.js")
      data = { items: structuredClone(cart), currency: "INR" };
    else if (url === "/products/board.js")
      data = {
        variants: [
          { id: 22, title: "Type-C", available: true },
          { id: 23, title: "Micro-USB", available: true },
        ],
      };
    else if (url === "/cart/clear.js") {
      cart = [];
      data = { items: [] };
    } else if (url === "/cart/add.js") {
      const items = JSON.parse(options.body).items;
      if (
        (items.some((item) => String(item.id) === "22") && failAdd) ||
        (items.some((item) => String(item.id) === "11") && failRecovery)
      ) {
        status = 422;
        data = { description: "Sold out" };
      } else {
        cart = items.map((item) => ({
          ...item,
          variant_id: item.id,
          quantity: limited && String(item.id) === "22" ? 1 : item.quantity,
        }));
        data = { items: cart };
      }
    } else throw Error(`Unexpected URL ${url}`);
    return { ok: status === 200, json: async () => data };
  };
  return {
    calls,
    getCart: () => cart,
    setCart: (items) => {
      cart = items;
    },
  };
}
test("restore selects only Planned parts and rejects other stores", () => {
  const state = {
    projects: [{ id: "p", name: "Build" }],
    parts: [
      part,
      { ...part, id: "received", status: "received" },
      { ...part, id: "ordered", status: "ordered" },
    ],
  };
  assert.equal(plannedRestore(state, "p").parts.length, 1);
  assert.throws(
    () =>
      plannedRestore(
        { ...state, parts: [{ ...part, url: "https://amazon.in/product" }] },
        "p",
      ),
    /MakerBazar/,
  );
  assert.throws(
    () => plannedRestore({ ...state, parts: [] }, "p"),
    /no Planned/,
  );
});
test("prepare is read only, restore replaces cart with exact quantities", async () => {
  const f = fixture();
  const plan = await makerCartOperation("prepare", { parts: [part] });
  assert.equal(plan.ok, true);
  assert.ok(f.calls.every(([, method]) => method === "GET"));
  assert.deepEqual(plan.items, [{ id: "22", quantity: 2 }]);
  const result = await makerCartOperation("restore", plan);
  assert.equal(result.ok, true);
  assert.equal(f.getCart()[0].quantity, 2);
  assert.equal(String(f.getCart()[0].id), "22");
});
test("ambiguous variants and changed carts are blocked before clear", async () => {
  const f = fixture();
  const bad = await makerCartOperation("prepare", {
    parts: [
      { ...part, url: "https://makerbazar.in/products/board", model: "" },
    ],
  });
  assert.equal(bad.ok, false);
  assert.match(bad.error, /exact variant/);
  const plan = await makerCartOperation("prepare", { parts: [part] });
  f.setCart([{ ...old, quantity: 3 }]);
  assert.equal((await makerCartOperation("restore", plan)).ok, false);
  assert.ok(!f.calls.some(([url]) => url === "/cart/clear.js"));
});
test("add failures and stock quantity reductions restore the previous cart", async () => {
  for (const options of [{ failAdd: true }, { limited: true }]) {
    const f = fixture(options);
    const plan = await makerCartOperation("prepare", { parts: [part] });
    const result = await makerCartOperation("restore", plan);
    assert.equal(result.recovery, "restored");
    assert.equal(String(f.getCart()[0].id), "11");
    assert.deepEqual(f.getCart()[0].properties, { Color: "Black" });
  }
});
test("failed recovery is explicit and retains preview backup", async () => {
  fixture({ failAdd: true, failRecovery: true });
  const plan = await makerCartOperation("prepare", { parts: [part] });
  const result = await makerCartOperation("restore", plan);
  assert.equal(result.recovery, "failed");
  assert.match(result.error, /backup/);
  assert.equal(plan.previous[0].name, "Old item");
});
test("clear operates directly without confirmation and checks empty result", async () => {
  const f = fixture();
  assert.deepEqual(await makerCartOperation("clear"), { ok: true });
  assert.deepEqual(f.getCart(), []);
  assert.deepEqual(f.calls[0], ["/cart/clear.js", "POST"]);
});
