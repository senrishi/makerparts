import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
export async function xpiHandoff(bytes, filename, { timeoutMs = 120000 } = {}) {
  const route = `/${randomUUID()}/${encodeURIComponent(filename)}`;
  let resolveDelivery;
  let rejectDelivery;
  const delivered = new Promise((resolve, reject) => {
    resolveDelivery = resolve;
    rejectDelivery = reject;
  });
  const server = createServer((request, response) => {
    if (request.url !== route || !["GET", "HEAD"].includes(request.method)) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": "application/x-xpinstall",
      "Content-Length": bytes.length,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
      Connection: "close",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    response.once("finish", () => resolveDelivery());
    response.end(bytes);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const timeout = setTimeout(
    () =>
      rejectDelivery(
        Error(
          "Mercury did not request the XPI within two minutes. Run the installer again and approve the browser prompt.",
        ),
      ),
    timeoutMs,
  );
  const close = () => {
    clearTimeout(timeout);
    server.close();
  };
  return {
    url: `http://127.0.0.1:${server.address().port}${route}`,
    delivered,
    close,
  };
}
