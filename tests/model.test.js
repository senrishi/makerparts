import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyState,
  mutate,
  validateState,
  totals,
} from "../src/core/model.js";
const part = {
  name: "ESP32",
  url: "https://example.com/esp32",
  category: "Microcontrollers & boards",
  price: 450,
  currency: "INR",
  quantity: 2,
  status: "planned",
  notes: "",
};
test("create a project while saving, update, total, and cascade delete", () => {
  let s = mutate(emptyState(), {
    type: "save",
    newProject: "Weather station",
    part,
  });
  assert.equal(s.parts[0].projectId, s.projects[0].id);
  assert.deepEqual(totals(s.parts), { INR: 900 });
  s = mutate(s, { type: "save", part: { ...s.parts[0], quantity: 3 } });
  assert.equal(s.parts.length, 1);
  assert.deepEqual(totals(s.parts), { INR: 1350 });
  s = mutate(s, { type: "deleteProject", id: s.projects[0].id });
  assert.equal(s.parts.length, 0);
});
test("currencies stay separate and unknown prices do not become zero quotes", () =>
  assert.deepEqual(
    totals([
      { ...part },
      { ...part, currency: "USD", price: 5 },
      { ...part, price: null },
    ]),
    { INR: 900, USD: 10 },
  ));
test("reject dangerous URLs, malformed imports, duplicate IDs and orphan parts", () => {
  assert.throws(() =>
    mutate(emptyState(), {
      type: "save",
      newProject: "X",
      part: { ...part, url: "javascript:alert(1)" },
    }),
  );
  const s = mutate(emptyState(), { type: "save", newProject: "X", part });
  for (const bad of [
    { ...s, parts: [...s.parts, ...s.parts] },
    { ...s, projects: [] },
    { ...s, parts: [{ ...s.parts[0], quantity: 0 }] },
    { ...s, parts: [{ ...s.parts[0], price: -1 }] },
  ])
    assert.throws(() => validateState(bad));
});
test("backup round trip and failed mutations leave original untouched", () => {
  const s = mutate(emptyState(), { type: "save", newProject: "X", part });
  assert.deepEqual(
    mutate(emptyState(), {
      type: "import",
      state: JSON.parse(JSON.stringify(s)),
    }),
    s,
  );
  assert.throws(() => mutate(s, { type: "project", name: "x" }));
  assert.equal(s.projects.length, 1);
});
test("suggest common electronics categories without forcing a guess", async () => {
  const { suggestCategory } = await import("../src/core/model.js");
  assert.equal(
    suggestCategory("ESP32 development board"),
    "Microcontrollers & boards",
  );
  assert.equal(suggestCategory("10k resistor pack"), "Resistors");
  assert.equal(suggestCategory("Unusual widget"), "Other");
});
test("model and SKU survive backup round trip; older records still validate", () => {
  const s = mutate(emptyState(), {
    type: "save",
    newProject: "Variants",
    part: { ...part, model: "ESP32-S3 N16R8 / Type-C", sku: "S3-22" },
  });
  assert.equal(
    validateState(JSON.parse(JSON.stringify(s))).parts[0].model,
    "ESP32-S3 N16R8 / Type-C",
  );
  assert.equal(
    validateState(JSON.parse(JSON.stringify(s))).parts[0].sku,
    "S3-22",
  );
  const old = mutate(emptyState(), { type: "save", newProject: "Old", part });
  assert.equal(validateState(old).parts[0].model, undefined);
});
test("capacitors have a dedicated suggestion", async () => {
  const { suggestCategory } = await import("../src/core/model.js");
  assert.equal(suggestCategory("100uF electrolytic capacitor"), "Capacitors");
});
test("loose parts default to Miscellaneous and can move into projects", async () => {
  const { MISC_ID } = await import("../src/core/model.js");
  let s = mutate(emptyState(), { type: "save", part });
  assert.equal(s.projects.length, 0);
  assert.equal(s.parts[0].projectId, MISC_ID);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))), s);
  s = mutate(s, { type: "project", id: "build", name: "Build" });
  s = mutate(s, { type: "save", part: { ...s.parts[0], projectId: "build" } });
  assert.equal(s.parts.length, 1);
  assert.equal(s.parts[0].projectId, "build");
  assert.throws(() => mutate(s, { type: "deleteProject", id: MISC_ID }));
});
test("new-project default with a blank name falls back to Miscellaneous", async () => {
  const { MISC_ID } = await import("../src/core/model.js");
  for (const name of ["", "   "]) {
    const s = mutate(emptyState(), {
      type: "save",
      newProject: name,
      part: { ...part, projectId: "__new" },
    });
    assert.equal(s.projects.length, 0);
    assert.equal(s.parts[0].projectId, MISC_ID);
  }
  const s = mutate(emptyState(), {
    type: "save",
    newProject: "  Radio build  ",
    part: { ...part, projectId: "__new" },
  });
  assert.equal(s.projects[0].name, "Radio build");
  assert.equal(s.parts[0].projectId, s.projects[0].id);
});
test("cart batch assigns one project, keeps quantities, and rejects atomically", () => {
  const state = emptyState();
  const parts = [
    { ...part, quantity: 3 },
    { ...part, name: "Capacitor", category: "Capacitors", quantity: 5 },
  ];
  const s = mutate(state, {
    type: "saveCart",
    newProject: "Cart build",
    parts,
  });
  assert.equal(s.projects.length, 1);
  assert.equal(s.parts.length, 2);
  assert.ok(s.parts.every((p) => p.projectId === s.projects[0].id));
  assert.equal(s.parts[1].quantity, 5);
  assert.throws(() =>
    mutate(state, {
      type: "saveCart",
      newProject: "Bad cart",
      parts: [parts[0], { ...parts[1], quantity: 0 }],
    }),
  );
  assert.deepEqual(state, emptyState());
  assert.throws(() => mutate(state, { type: "saveCart", parts: [] }));
  const misc = mutate(state, {
    type: "saveCart",
    projectId: "__new",
    newProject: "",
    parts,
  });
  assert.ok(misc.parts.every((p) => p.projectId === "__misc__"));
});
test("cost estimates split planned from purchased and retain currencies", async () => {
  const { estimates } = await import("../src/core/estimates.js");
  assert.deepEqual(
    estimates([
      { ...part, price: 100, quantity: 2 },
      { ...part, price: 50, quantity: 3, status: "ordered" },
      { ...part, price: 10, currency: "USD", quantity: 1, status: "received" },
      { ...part, price: null },
    ]),
    {
      remaining: { INR: 200 },
      spent: { INR: 150, USD: 10 },
      value: { INR: 350, USD: 10 },
      unpriced: 1,
    },
  );
});
