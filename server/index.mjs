import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { createNodeHandler } from "./http.mjs";

export function startServer({ port = Number(process.env.PORT) || 8787 } = {}) {
  const server = createServer(createNodeHandler());
  server.listen(port, "127.0.0.1", () => {
    // 只监听本机，避免把私有 Notion 读取接口暴露到局域网。
    console.log(`Focus Log API listening on http://127.0.0.1:${port}`);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
