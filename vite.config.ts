import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { configDefaults, defineConfig } from "vitest/config";

const FRONTEND_ORIGIN = "http://127.0.0.1:5173";

const restrictLocalApiProxy = () => ({
  name: "restrict-local-api-proxy",
  configureServer(server: { middlewares: { use: (path: string, handler: (
    request: { headers: Record<string, string | string[] | undefined> },
    response: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void },
    next: () => void,
  ) => void) => void } }) {
    server.middlewares.use("/api", (request, response, next) => {
      const fetchSite = request.headers["sec-fetch-site"];
      const referer = request.headers.referer;
      const fromFrontend = fetchSite === "same-origin" &&
        typeof referer === "string" &&
        referer.startsWith(`${FRONTEND_ORIGIN}/`);

      if (!fromFrontend) {
        response.statusCode = 403;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        response.end(JSON.stringify({
          error: {
            code: "LOCAL_PROXY_FORBIDDEN",
            message: "Use the Focus Log page at http://127.0.0.1:5173.",
          },
        }));
        return;
      }

      next();
    });
  },
});

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "PORT");
  const configuredPort = Number.parseInt(environment.PORT || "8787", 10);
  const apiPort = Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort <= 65_535
    ? configuredPort
    : 8787;

  return {
    base: process.env.GITHUB_ACTIONS ? "/focus-log-planner/" : "/",
    plugins: [react(), restrictLocalApiProxy()],
    optimizeDeps: {
      entries: ["index.html"],
    },
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: false,
          configure(proxy) {
            proxy.on("proxyReq", (proxyRequest) => {
              // 浏览器的同源 GET 可能省略 Origin，由本地开发代理写入唯一允许的来源。
              proxyRequest.setHeader("Origin", FRONTEND_ORIGIN);
            });
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      environmentOptions: {
        jsdom: { url: FRONTEND_ORIGIN },
      },
      setupFiles: "./src/test/setup.ts",
      exclude: [...configDefaults.exclude, "tests/e2e/**"],
      pool: "threads",
      maxWorkers: 1,
      fileParallelism: false,
      coverage: {
        reporter: ["text", "html"],
      },
    },
  };
});
