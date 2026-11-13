import { chromium } from "@playwright/test";
import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
const profile = await mkdtemp(path.join(tmpdir(), "makerparts-test-"));
const extension = path.resolve("dist/chrome");
const launch = () =>
  chromium.launchPersistentContext(profile, {
    executablePath:
      process.env.CHROMIUM_PATH ||
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    headless: true,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
  });
let context = await launch();
const worker =
  context.serviceWorkers()[0] ||
  (await context.waitForEvent("serviceworker", { timeout: 15000 }));
const id = new URL(worker.url()).host;
console.log("Extension loaded", id);
let page = await context.newPage();
context.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`chrome-extension://${id}/pages/library.html`);
await page.getByRole("button", { name: "New project", exact: false }).click();
await page.getByLabel("Project name").fill("Weather station");
await page.getByRole("button", { name: "Save project" }).click();
await page.getByRole("button", { name: "Add a part", exact: false }).click();
await page.getByLabel("Part name").fill("ESP32 board");
await page.getByLabel("Product link").fill("https://example.com/esp32");
await page.getByLabel("Unit price").fill("450");
await page.getByLabel("Quantity").fill("2");
await page
  .locator("select[name=category]")
  .selectOption("Microcontrollers & boards");
await page.getByRole("button", { name: "Save part", exact: true }).click();
await page.getByRole("link", { name: "ESP32 board" }).waitFor();
assert.match(await page.locator("#totals").innerText(), /900/);
await page.getByRole("button", { name: "Edit", exact: true }).click();
await page.locator("summary").click();
await page.locator("select[name=status]").selectOption("received");
await page.getByRole("button", { name: "Save changes" }).click();
await page.locator(".status.received").waitFor();
await mkdir("artifacts", { recursive: true });
await page.screenshot({ path: "artifacts/library.png", fullPage: true });
console.log("Saved and edited");
await context.close();
context = await launch();
page = await context.newPage();
await page.goto(`chrome-extension://${id}/pages/library.html`);
await page
  .locator(".project-tile")
  .filter({ hasText: "Weather station" })
  .waitFor();
assert.equal(await page.locator(".part-card").count(), 0);
await page
  .locator(".project-tile")
  .filter({ hasText: "Weather station" })
  .click();
await page.getByRole("link", { name: "ESP32 board" }).waitFor();
assert.equal(
  (await page.locator(".status").innerText()).toLowerCase(),
  "received",
);
await page.goto(`chrome-extension://${id}/pages/popup.html`);
// Regression: the popup must retain intrinsic dimensions during tiny initial sizing.
await page.setViewportSize({ width: 100, height: 100 });
assert.equal(
  await page
    .locator("body")
    .evaluate((body) => body.getBoundingClientRect().height),
  560,
);
assert.equal(
  await page
    .locator("body")
    .evaluate((body) => body.getBoundingClientRect().width),
  460,
);
await page.setViewportSize({ width: 460, height: 560 });
const settingsTabPromise = context.waitForEvent("page");
await page.getByRole("link", { name: "Settings", exact: true }).click();
const settingsTab = await settingsTabPromise;
await settingsTab.waitForLoadState();
await settingsTab.getByLabel("Appearance").waitFor();
await settingsTab.close();
assert.equal(await page.locator("select[name=project]").inputValue(), "__new");
await page.getByLabel("New project name").waitFor();
assert.equal(
  await page.getByLabel("New project name").getAttribute("required"),
  null,
);
await page.getByLabel("Part name").fill("10k resistor");
await page.getByLabel("Product link").fill("https://example.com/resistor");
await page.locator("select[name=category]").selectOption("Resistors");
await page.getByRole("button", { name: "Save part", exact: true }).click();
await page.getByRole("status").filter({ hasText: "Saved" }).waitFor();
await page.goto(`chrome-extension://${id}/pages/library.html`);
await page.goto(`chrome-extension://${id}/pages/settings.html`);
await page.getByLabel("Appearance").selectOption("dark");
assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
await page.reload();
await page.waitForFunction(
  () => document.documentElement.dataset.theme === "dark",
);
await page.goto(`chrome-extension://${id}/pages/library.html`);
await page.waitForFunction(
  () => document.documentElement.dataset.theme === "dark",
);
await page
  .locator(".project-tile")
  .filter({ hasText: "Weather station" })
  .waitFor();
assert.equal(await page.locator(".part-card").count(), 0);
await page.setViewportSize({ width: 1280, height: 800 });
await page.screenshot({ path: "artifacts/projects-home.png", fullPage: true });
await page
  .locator(".project-tile")
  .filter({ hasText: "Miscellaneous" })
  .click();
await page.getByRole("link", { name: "10k resistor", exact: true }).waitFor();
assert.equal(
  await page.getByRole("link", { name: "ESP32 board", exact: true }).count(),
  0,
);
await page.screenshot({ path: "artifacts/library-dark.png", fullPage: true });
const shop = await context.newPage();
await context.route("https://makerbazar.in/products/test-board*", (route) =>
  route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><html><head><meta property="product:price:currency" content="INR"><script type="application/ld+json">{"@type":"Product","name":"ESP32 board","offers":[{"url":"https://makerbazar.in/products/test-board?variant=11","price":"300","priceCurrency":"INR"},{"url":"https://makerbazar.in/products/test-board?variant=22","price":"599","priceCurrency":"INR"}]}</script><script type="application/json">{"variants":[{"id":11,"title":"ESP32 WROOM / Micro-USB","sku":"WROOM-11","price":30000},{"id":22,"title":"ESP32-S3 N16R8 / Type-C","sku":"S3-22","price":59900}]}</script></head><body><h1>ESP32 board</h1><form action="/cart/add"><input name="id" value="11"><select name="options[Model]" onchange="document.querySelector('[name=id]').value=this.value"><option value="11">ESP32 WROOM / Micro-USB</option><option value="22">ESP32-S3 N16R8 / Type-C</option></select></form></body></html>`,
  }),
);
await shop.goto("https://makerbazar.in/products/test-board");
await shop.locator("select").selectOption("22");
await shop.locator("#makerparts-floating").waitFor();
const captureWindow = context.waitForEvent("page");
await shop.locator("#makerparts-floating").click();
const capture = await captureWindow;
await capture.waitForLoadState();
await capture.waitForFunction(() =>
  document.querySelector("[name=model]")?.value.includes("ESP32-S3"),
);
await capture.setViewportSize({ width: 460, height: 560 });
// Standalone capture windows should resize; toolbar sizing stays intrinsic.
for (const viewport of [
  { width: 1000, height: 650 },
  { width: 340, height: 440 },
]) {
  await capture.setViewportSize(viewport);
  assert.equal(
    await capture
      .locator("body")
      .evaluate((body) => body.getBoundingClientRect().width),
    viewport.width,
  );
  const bounds = await capture.locator(".save").boundingBox();
  assert.ok(bounds.y + bounds.height <= viewport.height);
  assert.ok(bounds.x + bounds.width <= viewport.width);
  assert.equal(
    await capture.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
}
await capture.setViewportSize({ width: 1000, height: 650 });
await capture.screenshot({
  path: "artifacts/capture-resized.png",
  fullPage: true,
});
await capture.setViewportSize({ width: 460, height: 560 });
await capture.screenshot({ path: "artifacts/quick-save.png", fullPage: true });
console.log(
  "Capture layout",
  await capture.evaluate(() => ({
    height: innerHeight,
    body: document.body.scrollHeight,
    footer: document.querySelector("footer").textContent,
    footerY: document.querySelector("footer").getBoundingClientRect().y,
  })),
);
assert.equal(await capture.locator("details").getAttribute("open"), null);
let saveBounds = await capture.locator(".save").boundingBox();
assert.ok(saveBounds.y + saveBounds.height <= 560);
await capture.locator("summary").click();
saveBounds = await capture.locator(".save").boundingBox();
assert.ok(saveBounds.y + saveBounds.height <= 560);
assert.equal(
  await capture.locator("[name=model]").inputValue(),
  "ESP32-S3 N16R8 / Type-C",
);
assert.equal(await capture.locator("[name=sku]").inputValue(), "S3-22");
assert.equal(await capture.locator("[name=price]").inputValue(), "599");
assert.match(await capture.locator("[name=url]").inputValue(), /variant=22/);
await capture.getByRole("button", { name: "Save part", exact: true }).click();
await capture
  .getByRole("status")
  .filter({ hasText: "Saved successfully" })
  .waitFor();
await capture.waitForEvent("close");
await page.reload();
await page
  .getByText("ESP32-S3 N16R8 / Type-C · SKU: S3-22", { exact: true })
  .waitFor();
// Move a loose part into a project without duplicating it.
const variantCard = page.locator(".part-card").filter({ hasText: "S3-22" });
await variantCard.getByRole("button", { name: "Edit", exact: true }).click();
await page
  .locator("select[name=project]")
  .selectOption({ label: "Weather station" });
await page.getByRole("button", { name: "Save changes" }).click();
assert.equal(
  await page
    .getByText("ESP32-S3 N16R8 / Type-C · SKU: S3-22", { exact: true })
    .count(),
  0,
);
await page
  .locator("nav")
  .getByRole("button", { name: "Weather station", exact: true })
  .click();
await page
  .getByText("ESP32-S3 N16R8 / Type-C · SKU: S3-22", { exact: true })
  .waitFor();
await page.screenshot({ path: "artifacts/project-parts.png", fullPage: true });
// Exercise the MakerBazar public JSON fallback when a theme omits embedded product JSON.
await context.route("https://makerbazar.in/products/test-board.js", (route) =>
  route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      variants: [
        {
          id: 11,
          title: "ESP32 WROOM / Micro-USB",
          sku: "WROOM-11",
          price: 30000,
        },
      ],
    }),
  }),
);
await shop.evaluate(() =>
  document.querySelector('script[type="application/json"]').remove(),
);
await shop.locator("select").selectOption("11");
const fallbackWindow = context.waitForEvent("page");
await shop.locator("#makerparts-floating").click();
const fallback = await fallbackWindow;
await fallback.waitForLoadState();
await fallback.waitForFunction(() =>
  document.querySelector("[name=model]")?.value.includes("WROOM"),
);
assert.equal(
  await fallback.locator("[name=model]").inputValue(),
  "ESP32 WROOM / Micro-USB",
);
assert.equal(await fallback.locator("[name=price]").inputValue(), "300");
await fallback.close();
let cartPayload = {
  currency: "INR",
  items: [
    {
      product_title: "10k resistor pack",
      variant_title: "1/4 W / 100 pcs",
      variant_id: 101,
      sku: "R-101",
      url: "/products/resistors?variant=101",
      quantity: 3,
      final_price: 2500,
    },
    {
      product_title: "Ceramic capacitor",
      variant_title: "100 nF",
      variant_id: 202,
      sku: "C-202",
      url: "/products/capacitor?variant=202",
      quantity: 5,
      final_price: 1000,
    },
  ],
};
await context.route("https://makerbazar.in/cart", (route) =>
  route.fulfill({ contentType: "text/html", body: "<h1>Your cart</h1>" }),
);
await context.route("https://makerbazar.in/cart.js", (route) =>
  route.fulfill({
    contentType: "application/json",
    body: JSON.stringify(cartPayload),
  }),
);
await shop.goto("https://makerbazar.in/cart");
await shop.locator("#makerparts-floating").waitFor();
assert.equal(
  await shop.locator("#makerparts-floating").getAttribute("aria-label"),
  "Save Cart",
);
let cartWindowPromise = context.waitForEvent("page");
await shop.locator("#makerparts-floating").click();
let cartWindow = await cartWindowPromise;
await cartWindow.waitForLoadState();
await cartWindow.getByLabel("New project name").fill("Cart build");
await cartWindow.locator(".cart-line").first().waitFor();
assert.equal(await cartWindow.locator(".cart-line").count(), 2);
assert.match(await cartWindow.locator("#cart-summary").innerText(), /8 units/);
await cartWindow.screenshot({
  path: "artifacts/cart-preview.png",
  fullPage: true,
});
await cartWindow.getByRole("button", { name: "Save entire cart" }).click();
await cartWindow
  .getByText("Saved 2 parts to Cart build.", { exact: true })
  .waitFor();
await cartWindow.waitForEvent("close");
await page.goto(`chrome-extension://${id}/pages/library.html`);
await page.locator(".project-tile").filter({ hasText: "Cart build" }).click();
assert.equal(await page.locator(".part-card").count(), 2);
assert.match(await page.locator("#totals").innerText(), /125/);
await page
  .getByRole("link", { name: "10k resistor pack", exact: true })
  .waitFor();
cartWindowPromise = context.waitForEvent("page");
await shop.locator("#makerparts-floating").click();
cartWindow = await cartWindowPromise;
await cartWindow.waitForLoadState();
await cartWindow
  .locator("select[name=project]")
  .selectOption({ label: "Weather station" });
await cartWindow.getByRole("button", { name: "Save entire cart" }).click();
await cartWindow
  .getByText("Saved 2 parts to Weather station.", { exact: true })
  .waitFor();
await cartWindow.waitForEvent("close");
cartPayload = { currency: "INR", items: [] };
cartWindowPromise = context.waitForEvent("page");
await shop.locator("#makerparts-floating").click();
cartWindow = await cartWindowPromise;
await cartWindow.waitForLoadState();
await cartWindow
  .getByText("Your MakerBazar cart is empty.", { exact: true })
  .waitFor();
assert.equal(
  await cartWindow.getByRole("button", { name: "Save entire cart" }).count(),
  0,
);
await cartWindow.close();
await page.goto(`chrome-extension://${id}/pages/library.html`);
await page.locator(".project-tile").filter({ hasText: "Cart build" }).waitFor();
assert.equal(await page.locator(".cost-card").count(), 3);
for (const card of await page.locator(".cost-card").all()) {
  const label = await card.locator(".cost-label").boundingBox();
  const amount = await card.locator(".cost-amounts").boundingBox();
  assert.ok(amount.y - (label.y + label.height) >= 10);
}
for (const tile of await page.locator(".project-tile").all()) {
  const name = await tile.locator("strong").boundingBox();
  const price = await tile.locator(".project-value").boundingBox();
  assert.ok(price.y - (name.y + name.height) >= 10);
}
assert.equal(
  await page.locator("nav .nav-home").getAttribute("aria-label"),
  "Projects",
);
assert.equal(await page.locator(".part-card").count(), 0);
await page.screenshot({ path: "artifacts/projects-home.png", fullPage: true });
await context.route("https://example.com/*", (route) =>
  route.fulfill({ contentType: "text/html", body: "<h1>Other store</h1>" }),
);
await shop.goto("https://example.com/product");
assert.equal(await shop.locator("#makerparts-floating").count(), 0);
assert.deepEqual(errors, []);
await context.close();
console.log(
  "PASS: Chromium create/save/edit, totals, full browser restart persistence, popup save, dark theme persistence, selected variant price/SKU/link, MakerBazar-only floating capture, cart preview/bulk save to new and existing projects, empty cart, home cost overview.",
);
