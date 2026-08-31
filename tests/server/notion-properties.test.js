import { describe, expect, it } from "vitest";
import {
  parseNotionProperty,
  sanitizeNotionUrl,
} from "../../server/notion/properties.mjs";

describe("parseNotionProperty", () => {
  it("parses common Notion property values", () => {
    expect(
      parseNotionProperty({
        type: "title",
        title: [{ plain_text: "Morning " }, { text: { content: "log" } }],
      }),
    ).toBe("Morning log");
    expect(
      parseNotionProperty({
        type: "date",
        date: { start: "2026-08-31", end: null, time_zone: "Asia/Taipei" },
      }),
    ).toEqual({ start: "2026-08-31", end: null, timeZone: "Asia/Taipei" });
    expect(
      parseNotionProperty({
        type: "multi_select",
        multi_select: [{ name: "School" }, { name: "Deep work" }],
      }),
    ).toEqual(["School", "Deep work"]);
    expect(
      parseNotionProperty({ type: "formula", formula: { type: "number", number: 75 } }),
    ).toBe(75);
  });

  it("returns safe empty values for unknown or malformed properties", () => {
    expect(parseNotionProperty({ type: "future_type", future_type: "secret" })).toBeNull();
    expect(parseNotionProperty(null)).toBeNull();
    expect(parseNotionProperty({ type: "multi_select", multi_select: null })).toEqual([]);
  });
});

describe("sanitizeNotionUrl", () => {
  it("allows only notion.so HTTPS URLs", () => {
    expect(sanitizeNotionUrl("https://www.notion.so/example-abc")).toBe(
      "https://www.notion.so/example-abc",
    );
    expect(sanitizeNotionUrl("https://notion.so/example")).toBe("https://notion.so/example");
    expect(sanitizeNotionUrl("http://www.notion.so/example")).toBeNull();
    expect(sanitizeNotionUrl("https://workspace.notion.so/example")).toBeNull();
    expect(sanitizeNotionUrl("https://notion.so.evil.example/steal")).toBeNull();
    expect(sanitizeNotionUrl("https://user:pass@www.notion.so/private")).toBeNull();
    expect(sanitizeNotionUrl("https://example.com/page")).toBeNull();
    expect(sanitizeNotionUrl("not a URL")).toBeNull();
  });
});
