import { describe, expect, it, vi } from "vitest";
import {
  handleApiRequest,
  isAllowedLocalOrigin,
  isValidCalendarDate,
  isValidLocalAccessToken,
} from "../../server/http.mjs";

const LOCAL_ACCESS_TOKEN = "focus-log-local-test-key-0123456789abcdef";
const AUTHORIZED_HEADERS = {
  origin: "http://127.0.0.1:5173",
  "x-focus-log-token": LOCAL_ACCESS_TOKEN,
};

describe("HTTP safety boundaries", () => {
  it("allows only the fixed local frontend origin", () => {
    expect(isAllowedLocalOrigin("http://127.0.0.1:5173")).toBe(true);
    expect(isAllowedLocalOrigin("http://localhost:5173")).toBe(false);
    expect(isAllowedLocalOrigin("http://127.0.0.1:4173")).toBe(false);
    expect(isAllowedLocalOrigin()).toBe(false);
    expect(isAllowedLocalOrigin("https://example.com")).toBe(false);
    expect(isAllowedLocalOrigin("http://localhost.evil.example")).toBe(false);
  });

  it("requires a substantial local access token", () => {
    expect(isValidLocalAccessToken(LOCAL_ACCESS_TOKEN)).toBe(true);
    expect(isValidLocalAccessToken("short-local-key")).toBe(false);
    expect(isValidLocalAccessToken()).toBe(false);
  });

  it("validates real calendar dates", () => {
    expect(isValidCalendarDate("2028-02-29")).toBe(true);
    expect(isValidCalendarDate("2026-02-29")).toBe(false);
    expect(isValidCalendarDate("2026-8-31")).toBe(false);
  });

  it("returns a safe missing-configuration error without calling Notion", async () => {
    const fetchImpl = vi.fn();
    const result = await handleApiRequest(
      {
        method: "GET",
        url: "/api/notion/focus-log?date=2026-08-31",
        headers: AUTHORIZED_HEADERS,
      },
      { env: { FOCUS_LOG_LOCAL_TOKEN: LOCAL_ACCESS_TOKEN }, fetchImpl },
    );

    expect(result.status).toBe(503);
    expect(JSON.parse(result.body)).toEqual({
      error: {
        code: "NOTION_NOT_CONFIGURED",
        message: "Notion read-only integration is not configured.",
      },
    });
    expect(result.body).not.toContain("NOTION_TOKEN");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects remote origins before reading configuration", async () => {
    const result = await handleApiRequest({
      method: "GET",
      url: "/api/notion/focus-log?date=2026-08-31",
      headers: { origin: "https://attacker.example" },
    });
    expect(result.status).toBe(403);
    expect(result.headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });

  it("rejects an Origin-less request before reading configuration", async () => {
    const fetchImpl = vi.fn();
    const result = await handleApiRequest(
      {
        method: "GET",
        url: "/api/notion/focus-log?date=2026-08-31",
        headers: { "x-focus-log-token": LOCAL_ACCESS_TOKEN },
      },
      { env: { FOCUS_LOG_LOCAL_TOKEN: LOCAL_ACCESS_TOKEN }, fetchImpl },
    );

    expect(result.status).toBe(403);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("requires the server-side local access key configuration", async () => {
    const fetchImpl = vi.fn();
    const result = await handleApiRequest(
      {
        method: "GET",
        url: "/api/notion/focus-log?date=2026-08-31",
        headers: AUTHORIZED_HEADERS,
      },
      { env: {}, fetchImpl },
    );

    expect(result.status).toBe(503);
    expect(JSON.parse(result.body)).toEqual({
      error: {
        code: "LOCAL_API_SECURITY_NOT_CONFIGURED",
        message: "Local API access key is not configured.",
      },
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a missing or incorrect local access key before contacting Notion", async () => {
    const fetchImpl = vi.fn();
    const result = await handleApiRequest(
      {
        method: "GET",
        url: "/api/notion/focus-log?date=2026-08-31",
        headers: {
          origin: "http://127.0.0.1:5173",
          "x-focus-log-token": `${LOCAL_ACCESS_TOKEN.slice(0, -1)}0`,
        },
      },
      { env: { FOCUS_LOG_LOCAL_TOKEN: LOCAL_ACCESS_TOKEN }, fetchImpl },
    );

    expect(result.status).toBe(401);
    expect(result.headers["WWW-Authenticate"]).toBe("FocusLogToken");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects write methods before contacting Notion", async () => {
    const fetchImpl = vi.fn();
    const result = await handleApiRequest(
      {
        method: "POST",
        url: "/api/notion/focus-log?date=2026-08-31",
        headers: AUTHORIZED_HEADERS,
      },
      { env: {}, fetchImpl },
    );

    expect(result.status).toBe(405);
    expect(result.headers.Allow).toBe("GET, OPTIONS");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("queries both data sources and returns normalized data", async () => {
    const env = {
      FOCUS_LOG_LOCAL_TOKEN: LOCAL_ACCESS_TOKEN,
      NOTION_TOKEN: "test-token",
      NOTION_DAILY_DATA_SOURCE_ID: "daily-source",
      NOTION_NOTES_DATA_SOURCE_ID: "notes-source",
    };
    const fetchImpl = vi.fn(async (url) => {
      const isDaily = url.includes("daily-source");
      return {
        ok: true,
        json: async () => ({
          has_more: false,
          next_cursor: null,
          results: [
            {
              object: "page",
              id: isDaily ? "daily-page" : "note-page",
              url: `https://www.notion.so/${isDaily ? "daily-page" : "note-page"}`,
              properties: isDaily
                ? {
                    Name: { type: "title", title: [{ plain_text: "Today" }] },
                    Date: { type: "date", date: { start: "2026-08-31" } },
                    Focus: { type: "rich_text", rich_text: [{ plain_text: "Draft" }] },
                  }
                : {
                    Name: { type: "title", title: [{ plain_text: "Idea" }] },
                    Date: { type: "date", date: { start: "2026-08-31" } },
                    Content: { type: "rich_text", rich_text: [{ plain_text: "Check sources" }] },
                  },
            },
          ],
        }),
      };
    });

    const result = await handleApiRequest(
      {
        method: "GET",
        url: "/api/notion/focus-log?date=2026-08-31",
        headers: AUTHORIZED_HEADERS,
      },
      { env, fetchImpl },
    );

    expect(result.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(JSON.parse(result.body)).toMatchObject({
      date: "2026-08-31",
      source: "notion",
      daily: [{ id: "daily-page", focus: "Draft" }],
      notes: [{ id: "note-page", content: "Check sources" }],
      meta: { dailyCount: 1, notesCount: 1 },
    });
  });

  it("maps invalid Notion configuration without leaking upstream details", async () => {
    const env = {
      FOCUS_LOG_LOCAL_TOKEN: LOCAL_ACCESS_TOKEN,
      NOTION_TOKEN: "test-token",
      NOTION_DAILY_DATA_SOURCE_ID: "daily-source",
      NOTION_NOTES_DATA_SOURCE_ID: "notes-source",
    };
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "private workspace payload",
    });

    const result = await handleApiRequest(
      {
        method: "GET",
        url: "/api/notion/focus-log?date=2026-08-31",
        headers: AUTHORIZED_HEADERS,
      },
      { env, fetchImpl },
    );

    expect(result.status).toBe(503);
    expect(JSON.parse(result.body)).toEqual({
      error: {
        code: "NOTION_CONFIGURATION_INVALID",
        message: "Notion data source or field mapping is invalid.",
      },
    });
    expect(result.body).not.toContain("private workspace payload");
    expect(result.body).not.toContain("test-token");
  });
});
