import { describe, expect, it } from "vitest";
import { formatDay, formatDayShort } from "./format";

describe("calendar day formatting", () => {
  it("formats a yyyy-mm-dd day without shifting it across time zones", () => {
    expect(formatDay("2026-10-20")).toBe("20/10/2026");
    expect(formatDay("2026-01-01")).toBe("01/01/2026");
  });

  it("formats a short day with the weekday", () => {
    expect(formatDayShort("2026-10-20")).toBe("mar 20/10");
    expect(formatDayShort("2026-10-25")).toBe("dom 25/10");
  });
});
