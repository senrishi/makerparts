import test from "node:test";
import assert from "node:assert/strict";
import { xpiHandoff } from "../scripts/xpi-handoff.mjs";
test("XPI handoff serves only one random path with the Firefox installer MIME type", async () => {
  const bytes = Buffer.from("fixture extension archive");
  const server = await xpiHandoff(bytes, "makerparts-test.xpi", {
    timeoutMs: 10000,
  });
  try {
    const url = new URL(server.url);
    assert.equal(url.hostname, "127.0.0.1");
    const missing = await fetch(`${url.origin}/`);
    assert.equal(missing.status, 404);
    const response = await fetch(server.url);
    assert.equal(
      response.headers.get("content-type"),
      "application/x-xpinstall",
    );
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    await server.delivered;
  } finally {
    server.close();
  }
});
