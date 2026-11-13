import test from "node:test";
import assert from "node:assert/strict";
import { createRequest, RELOAD_MESSAGE } from "../src/core/messaging.js";
test("legacy backgrounds are rejected before a cart write", async () => {
  const actions = [];
  const request = createRequest(
    {
      sendMessage: async (message) => {
        actions.push(message.action.type);
        return { state: { parts: [] } };
      },
    },
    "new",
  );
  await assert.rejects(request({ type: "saveCart", parts: [] }), {
    message: RELOAD_MESSAGE,
  });
  assert.deepEqual(actions, ["read"]);
});
test("matching builds perform one preflight and one write", async () => {
  const actions = [];
  const request = createRequest(
    {
      sendMessage: async (message) => {
        actions.push(message.action.type);
        assert.equal(message.buildId, "same");
        return {
          state: { saved: message.action.type === "saveCart" },
          buildId: "same",
        };
      },
    },
    "same",
  );
  assert.deepEqual(await request({ type: "saveCart" }), { saved: true });
  assert.deepEqual(actions, ["read", "saveCart"]);
});
test("a background update between preflight and write gets an actionable error", async () => {
  let n = 0;
  const request = createRequest(
    {
      sendMessage: async () =>
        ++n === 1
          ? { buildId: "old", state: {} }
          : { buildId: "new", error: RELOAD_MESSAGE },
    },
    "old",
  );
  await assert.rejects(request({ type: "saveCart" }), {
    message: RELOAD_MESSAGE,
  });
});
