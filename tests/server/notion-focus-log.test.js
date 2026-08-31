import { describe, expect, it, vi } from "vitest";
import { getNotionConfig, NotionConfigurationError } from "../../server/notion/config.mjs";
import { queryDataSource } from "../../server/notion/client.mjs";
import { mapDailyPage, mapNotePage } from "../../server/notion/focus-log.mjs";

const configuredEnv = {
  NOTION_TOKEN: "test-token",
  NOTION_DAILY_DATA_SOURCE_ID: "daily-id",
  NOTION_NOTES_DATA_SOURCE_ID: "notes-id",
  NOTION_DAILY_TITLE_FIELD: "日志名",
  NOTION_DAILY_DATE_FIELD: "日期",
  NOTION_DAILY_BIG_THREE_FIELD: "最重要的三件事",
  NOTION_DAILY_FOCUS_HOURS_FIELD: "专注小时",
  NOTION_DAILY_RESULT_FIELD: "结果",
  NOTION_DAILY_UNFINISHED_FIELD: "有未完成",
  NOTION_DAILY_REASON_FIELD: "原因",
  NOTION_DAILY_NEXT_ACTION_FIELD: "下一步",
  NOTION_DAILY_FOCUS_FIELD: "今日聚焦",
  NOTION_DAILY_PLAN_FIELD: "今日计划",
  NOTION_DAILY_PROGRESS_FIELD: "进度",
  NOTION_DAILY_REFLECTION_FIELD: "复盘",
  NOTION_DAILY_STATUS_FIELD: "状态",
  NOTION_DAILY_TAGS_FIELD: "标签",
  NOTION_DAILY_URL_FIELD: "Notion 链接",
  NOTION_NOTES_TITLE_FIELD: "标题",
  NOTION_NOTES_DATE_FIELD: "日期",
  NOTION_NOTES_CONTENT_FIELD: "内容",
  NOTION_NOTES_STATUS_FIELD: "状态",
  NOTION_NOTES_TAGS_FIELD: "标签",
  NOTION_NOTES_URL_FIELD: "Notion 链接",
};

function richText(value, type = "rich_text") {
  return { type, [type]: [{ plain_text: value }] };
}

describe("getNotionConfig", () => {
  it("fails closed when required configuration is missing", () => {
    expect(() => getNotionConfig({})).toThrow(NotionConfigurationError);
    try {
      getNotionConfig({});
    } catch (error) {
      expect(error.missingVariables).toEqual([
        "NOTION_TOKEN",
        "NOTION_DAILY_DATA_SOURCE_ID",
        "NOTION_NOTES_DATA_SOURCE_ID",
      ]);
      expect(error.message).not.toContain("undefined");
    }
  });

  it("uses configurable field names", () => {
    const config = getNotionConfig(configuredEnv);
    expect(config.daily.fields.bigThree).toBe("最重要的三件事");
    expect(config.daily.fields.focus).toBe("今日聚焦");
    expect(config.notes.fields.content).toBe("内容");
  });

  it("does not silently reuse an unrelated NOTION_API_KEY", () => {
    expect(() =>
      getNotionConfig({
        NOTION_API_KEY: "unrelated-token",
        NOTION_DAILY_DATA_SOURCE_ID: "daily-id",
        NOTION_NOTES_DATA_SOURCE_ID: "notes-id",
      }),
    ).toThrow(NotionConfigurationError);
  });
});

describe("Focus Log mapping", () => {
  it("normalizes a daily page through configured property names", () => {
    const config = getNotionConfig(configuredEnv);
    const page = {
      id: "daily-page",
      object: "page",
      url: "https://www.notion.so/daily-page",
      created_time: "2026-08-31T01:00:00.000Z",
      last_edited_time: "2026-08-31T02:00:00.000Z",
      properties: {
        日志名: richText("周日日志", "title"),
        日期: { type: "date", date: { start: "2026-08-31", end: null } },
        最重要的三件事: richText("① 写提纲\n② 做练习\n③ 发邮件"),
        专注小时: { type: "number", number: 2.5 },
        结果: { type: "select", select: { name: "Partial" } },
        有未完成: { type: "checkbox", checkbox: true },
        原因: { type: "select", select: { name: "Low energy" } },
        下一步: richText("写第一段"),
        今日聚焦: richText("写研究笔记"),
        今日计划: richText("完成三个小步骤"),
        进度: { type: "number", number: 60 },
        复盘: richText("下午更专注"),
        状态: { type: "status", status: { name: "In progress" } },
        标签: { type: "multi_select", multi_select: [{ name: "Research" }] },
        "Notion 链接": { type: "url", url: "https://example.com/unsafe" },
      },
    };

    expect(mapDailyPage(page, config.daily.fields, "2026-08-31")).toEqual({
      id: "daily-page",
      type: "daily",
      title: "周日日志",
      date: "2026-08-31",
      bigThree: "① 写提纲\n② 做练习\n③ 发邮件",
      focusHours: 2.5,
      result: "Partial",
      unfinished: true,
      reason: "Low energy",
      nextAction: "写第一段",
      focus: "写研究笔记",
      plan: "完成三个小步骤",
      progress: "60",
      reflection: "下午更专注",
      status: "In progress",
      tags: ["Research"],
      url: "https://www.notion.so/daily-page",
      createdTime: "2026-08-31T01:00:00.000Z",
      lastEditedTime: "2026-08-31T02:00:00.000Z",
    });
  });

  it("normalizes a note and fills stable defaults", () => {
    const config = getNotionConfig(configuredEnv);
    expect(
      mapNotePage(
        {
          id: "note-page",
          object: "page",
          url: "https://www.notion.so/note-page",
          properties: {
            标题: richText("一条笔记", "title"),
            内容: richText("记下当时的想法"),
          },
        },
        config.notes.fields,
        "2026-08-31",
      ),
    ).toMatchObject({
      id: "note-page",
      type: "note",
      title: "一条笔记",
      date: "2026-08-31",
      content: "记下当时的想法",
      status: "",
      tags: [],
      url: "https://www.notion.so/note-page",
    });
  });
});

describe("queryDataSource", () => {
  it("uses the 2026-03-11 read-only query endpoint and date filter", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], has_more: false, next_cursor: null }),
    });

    await queryDataSource({
      dataSourceId: "source/id",
      token: "private-token",
      date: "2026-08-31",
      dateField: "日期",
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.notion.com/v1/data_sources/source%2Fid/query");
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("error");
    expect(init.headers["Notion-Version"]).toBe("2026-03-11");
    expect(init.headers.Authorization).toBe("Bearer private-token");
    expect(JSON.parse(init.body)).toMatchObject({
      filter: { property: "日期", date: { equals: "2026-08-31" } },
      result_type: "page",
    });
  });

  it("supports upcoming filters, sorting, and a bounded result count", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { object: "page", id: "one" },
          { object: "page", id: "two" },
          { object: "page", id: "three" },
        ],
        has_more: true,
        next_cursor: "unused",
      }),
    });

    const results = await queryDataSource({
      dataSourceId: "notes",
      token: "private-token",
      date: "2026-08-31",
      dateField: "日期",
      dateOperator: "on_or_after",
      sorts: [{ property: "日期", direction: "ascending" }],
      maxResults: 2,
      fetchImpl,
    });

    expect(results.map((item) => item.id)).toEqual(["one", "two"]);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({
      filter: { property: "日期", date: { on_or_after: "2026-08-31" } },
      page_size: 2,
      sorts: [{ property: "日期", direction: "ascending" }],
    });
  });

  it("retries a rate-limited query without exposing the response body", async () => {
    const sleepImpl = vi.fn().mockResolvedValue(undefined);
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: { get: () => "0" },
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], has_more: false, next_cursor: null }),
      });

    await expect(
      queryDataSource({
        dataSourceId: "daily",
        token: "private-token",
        date: "2026-08-31",
        dateField: "Date",
        fetchImpl,
        sleepImpl,
      }),
    ).resolves.toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleepImpl).toHaveBeenCalledWith(0);
  });

  it.each([
    [400, "NOTION_CONFIGURATION_INVALID"],
    [404, "NOTION_CONFIGURATION_INVALID"],
    [401, "NOTION_AUTHORIZATION_FAILED"],
    [403, "NOTION_AUTHORIZATION_FAILED"],
  ])("maps upstream status %s to a safe code", async (status, code) => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status });
    await expect(
      queryDataSource({
        dataSourceId: "daily",
        token: "private-token",
        date: "2026-08-31",
        dateField: "Date",
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code });
  });
});
