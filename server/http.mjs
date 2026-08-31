import { timingSafeEqual } from "node:crypto";
import { NotionConfigurationError } from "./notion/config.mjs";
import { NotionUpstreamError } from "./notion/client.mjs";
import { loadFocusLog } from "./notion/focus-log.mjs";

const API_PATH = "/api/notion/focus-log";
const FRONTEND_ORIGIN = "http://127.0.0.1:5173";
const LOCAL_ACCESS_HEADER = "x-focus-log-token";
const MIN_LOCAL_TOKEN_BYTES = 32;

function requestHeader(headers, name) {
  if (typeof headers?.get === "function") return headers.get(name);
  if (!headers || typeof headers !== "object") return null;
  const target = name.toLowerCase();
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === target);
  return match ? String(match[1]) : null;
}

export function isAllowedLocalOrigin(origin) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return (
      url.origin === FRONTEND_ORIGIN &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function isValidLocalAccessToken(value) {
  return typeof value === "string" && Buffer.byteLength(value.trim(), "utf8") >= MIN_LOCAL_TOKEN_BYTES;
}

function configuredLocalAccessToken(env) {
  const token = typeof env?.FOCUS_LOG_LOCAL_TOKEN === "string"
    ? env.FOCUS_LOG_LOCAL_TOKEN.trim()
    : "";
  return isValidLocalAccessToken(token) ? token : null;
}

function matchesLocalAccessToken(presented, configured) {
  if (typeof presented !== "string" || !configured) return false;
  const presentedBytes = Buffer.from(presented, "utf8");
  const configuredBytes = Buffer.from(configured, "utf8");
  return presentedBytes.length === configuredBytes.length && timingSafeEqual(presentedBytes, configuredBytes);
}

export function isValidCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return false;

  const [, year, month, day] = match.map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function responseHeaders(origin) {
  const headers = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function jsonResult(status, payload, origin, extraHeaders = {}) {
  return {
    status,
    headers: { ...responseHeaders(origin), ...extraHeaders },
    body: JSON.stringify(payload),
  };
}

function publicError(error) {
  if (error instanceof NotionConfigurationError) {
    return {
      status: error.status,
      code: error.code,
      message: "Notion read-only integration is not configured.",
    };
  }
  if (error instanceof NotionUpstreamError) {
    if (error.code === "NOTION_CONFIGURATION_INVALID") {
      return {
        status: error.status,
        code: error.code,
        message: "Notion data source or field mapping is invalid.",
      };
    }
    if (error.code === "NOTION_AUTHORIZATION_FAILED") {
      return {
        status: error.status,
        code: error.code,
        message: "Notion token or data source access is invalid.",
      };
    }
    if (error.code === "NOTION_RATE_LIMITED") {
      return {
        status: error.status,
        code: error.code,
        message: "Notion rate limit reached. Try again shortly.",
      };
    }
    return {
      status: error.status,
      code: error.code,
      message: "Notion is temporarily unavailable. Try again later.",
    };
  }
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "The focus log could not be loaded.",
  };
}

/**
 * 纯路由层方便单元测试，不在错误响应中返回环境变量或上游响应。
 */
export async function handleApiRequest(
  request,
  { env = process.env, fetchImpl = globalThis.fetch } = {},
) {
  const origin = requestHeader(request.headers, "origin");
  if (!isAllowedLocalOrigin(origin)) {
    return jsonResult(403, { error: { code: "ORIGIN_FORBIDDEN", message: "Origin is not allowed." } });
  }

  const url = new URL(request.url, "http://localhost");
  if (url.pathname !== API_PATH) {
    return jsonResult(404, { error: { code: "NOT_FOUND", message: "Route not found." } }, origin);
  }

  if (request.method === "OPTIONS") {
    return {
      status: 204,
      headers: {
        ...responseHeaders(origin),
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Accept, Content-Type, X-Focus-Log-Token",
        "Access-Control-Max-Age": "600",
      },
      body: "",
    };
  }

  if (request.method !== "GET") {
    return jsonResult(
      405,
      { error: { code: "METHOD_NOT_ALLOWED", message: "Only GET is allowed." } },
      origin,
      { Allow: "GET, OPTIONS" },
    );
  }

  const configuredToken = configuredLocalAccessToken(env);
  if (!configuredToken) {
    return jsonResult(
      503,
      {
        error: {
          code: "LOCAL_API_SECURITY_NOT_CONFIGURED",
          message: "Local API access key is not configured.",
        },
      },
      origin,
    );
  }

  const presentedToken = requestHeader(request.headers, LOCAL_ACCESS_HEADER);
  if (!matchesLocalAccessToken(presentedToken, configuredToken)) {
    return jsonResult(
      401,
      { error: { code: "LOCAL_API_UNAUTHORIZED", message: "Local access key is invalid." } },
      origin,
      { "WWW-Authenticate": "FocusLogToken" },
    );
  }

  const date = url.searchParams.get("date");
  if (!isValidCalendarDate(date)) {
    return jsonResult(
      400,
      { error: { code: "INVALID_DATE", message: "date must use YYYY-MM-DD." } },
      origin,
    );
  }

  try {
    const focusLog = await loadFocusLog(date, { env, fetchImpl });
    return jsonResult(200, focusLog, origin);
  } catch (error) {
    const safe = publicError(error);
    return jsonResult(
      safe.status,
      { error: { code: safe.code, message: safe.message } },
      origin,
    );
  }
}

export function createNodeHandler(dependencies = {}) {
  return async (request, response) => {
    const result = await handleApiRequest(request, dependencies);
    response.writeHead(result.status, result.headers);
    response.end(result.body);
  };
}
