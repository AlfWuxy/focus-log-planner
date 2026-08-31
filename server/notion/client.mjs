import { NOTION_API_VERSION } from "./config.mjs";

const NOTION_API_ORIGIN = "https://api.notion.com";
const MAX_QUERY_PAGES = 100;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RATE_LIMIT_RETRIES = 2;
const DEFAULT_RETRY_AFTER_MS = 250;
const MAX_RETRY_AFTER_MS = 2_000;
const DATE_FILTER_OPERATORS = new Set(["equals", "on_or_after"]);

export class NotionUpstreamError extends Error {
  constructor(code = "NOTION_UPSTREAM_ERROR", status = 502) {
    super("The Notion read-only query could not be completed.");
    this.name = "NotionUpstreamError";
    this.code = code;
    this.status = status;
  }
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    throw new NotionUpstreamError("NOTION_INVALID_RESPONSE");
  }
}

function responseHeader(response, name) {
  if (typeof response?.headers?.get === "function") return response.headers.get(name);
  if (!response?.headers || typeof response.headers !== "object") return null;
  const target = name.toLowerCase();
  const match = Object.entries(response.headers).find(([key]) => key.toLowerCase() === target);
  return match ? String(match[1]) : null;
}

function retryAfterMilliseconds(response, now = Date.now()) {
  const value = responseHeader(response, "retry-after")?.trim();
  if (!value) return DEFAULT_RETRY_AFTER_MS;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(Math.ceil(seconds * 1_000), MAX_RETRY_AFTER_MS);
  }

  const retryAt = Date.parse(value);
  if (!Number.isFinite(retryAt)) return DEFAULT_RETRY_AFTER_MS;
  return Math.min(Math.max(0, retryAt - now), MAX_RETRY_AFTER_MS);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function requestQueryPage(endpoint, init, fetchImpl, sleepImpl) {
  for (let retry = 0; retry <= MAX_RATE_LIMIT_RETRIES; retry += 1) {
    let response;
    try {
      response = await fetchImpl(endpoint, init);
    } catch {
      throw new NotionUpstreamError();
    }

    if (response?.status !== 429) return response;
    if (retry === MAX_RATE_LIMIT_RETRIES) {
      throw new NotionUpstreamError("NOTION_RATE_LIMITED");
    }

    try {
      await sleepImpl(retryAfterMilliseconds(response));
    } catch {
      throw new NotionUpstreamError();
    }
  }

  throw new NotionUpstreamError("NOTION_RATE_LIMITED");
}

/**
 * 使用官方数据源查询端点。此客户端只发起查询，不包含任何写入方法。
 */
export async function queryDataSource({
  dataSourceId,
  token,
  date,
  dateField,
  dateOperator = "equals",
  sorts = [],
  maxResults = 100,
  fetchImpl = globalThis.fetch,
  sleepImpl = sleep,
}) {
  if (typeof fetchImpl !== "function") {
    throw new NotionUpstreamError("NOTION_FETCH_UNAVAILABLE");
  }
  if (typeof sleepImpl !== "function") {
    throw new NotionUpstreamError("NOTION_SLEEP_UNAVAILABLE");
  }
  if (!DATE_FILTER_OPERATORS.has(dateOperator)) {
    throw new NotionUpstreamError("NOTION_FILTER_INVALID", 503);
  }
  if (!Number.isInteger(maxResults) || maxResults < 1) {
    throw new NotionUpstreamError("NOTION_RESULT_LIMIT_INVALID", 503);
  }

  const endpoint = `${NOTION_API_ORIGIN}/v1/data_sources/${encodeURIComponent(dataSourceId)}/query`;
  const results = [];
  let startCursor;

  for (let pageNumber = 0; pageNumber < MAX_QUERY_PAGES; pageNumber += 1) {
    const remaining = maxResults - results.length;
    const body = {
      filter: {
        property: dateField,
        date: { [dateOperator]: date },
      },
      page_size: Math.min(100, remaining),
      result_type: "page",
    };

    if (sorts.length > 0) body.sorts = sorts;
    if (startCursor) body.start_cursor = startCursor;

    const response = await requestQueryPage(
      endpoint,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Notion-Version": NOTION_API_VERSION,
        },
        body: JSON.stringify(body),
        redirect: "error",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
      fetchImpl,
      sleepImpl,
    );

    if (!response?.ok) {
      if (response?.status === 400 || response?.status === 404) {
        throw new NotionUpstreamError("NOTION_CONFIGURATION_INVALID", 503);
      }
      if (response?.status === 401 || response?.status === 403) {
        throw new NotionUpstreamError("NOTION_AUTHORIZATION_FAILED", 503);
      }
      throw new NotionUpstreamError();
    }

    const payload = await parseJsonResponse(response);
    if (!Array.isArray(payload?.results)) {
      throw new NotionUpstreamError("NOTION_INVALID_RESPONSE");
    }

    results.push(
      ...payload.results
        .filter((item) => item?.object === "page")
        .slice(0, remaining),
    );
    if (results.length >= maxResults) return results;
    if (!payload.has_more) return results;
    if (typeof payload.next_cursor !== "string" || !payload.next_cursor) {
      throw new NotionUpstreamError("NOTION_INVALID_RESPONSE");
    }
    startCursor = payload.next_cursor;
  }

  throw new NotionUpstreamError("NOTION_PAGINATION_LIMIT");
}
