import { describe, expect, it } from "vitest";
import {
  addDays,
  describeRelativeDate,
  formatLongDate,
  formatShortDate,
  formatWeekday,
} from "./date";

describe("date helpers", () => {
  it("formats the concept date without timezone drift", () => {
    expect(formatLongDate("2026-08-31")).toBe("Monday, Aug 31");
    expect(formatShortDate("2026-09-01")).toBe("Sep 1");
    expect(formatWeekday("2026-09-06")).toBe("SUN");
  });

  it("adds days safely across month and leap-year boundaries", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("describes nearby dates", () => {
    expect(describeRelativeDate("2026-09-01", "2026-08-31")).toBe("Tomorrow");
    expect(describeRelativeDate("2026-09-02", "2026-08-31")).toBe("Wednesday");
  });

  it("rejects malformed dates", () => {
    expect(() => formatLongDate("08/31/2026")).toThrow("Invalid ISO date");
  });
});
