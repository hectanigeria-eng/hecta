import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatNaira,
  formatRelativeDays,
  pricePeriodLabel,
} from "@/lib/format";

describe("formatNaira", () => {
  it("includes the naira sign and no decimal places", () => {
    const result = formatNaira(1_500_000);
    expect(result).toContain("₦");
    expect(result).not.toContain(".");
    expect(result).toBe("₦1,500,000");
  });

  it("rounds to whole naira for fractional amounts", () => {
    expect(formatNaira(1_000.5)).not.toContain(".");
  });
});

describe("formatDate", () => {
  it("formats an ISO date as 'D Mon YYYY'", () => {
    expect(formatDate("2026-07-12T00:00:00Z")).toBe("12 Jul 2026");
  });
});

describe("formatRelativeDays", () => {
  it("reports a 3-day gap in the past as '3 days ago'", () => {
    const now = "2026-07-29T09:00:00.000Z";
    const threeDaysAgo = "2026-07-26T09:00:00.000Z";
    expect(formatRelativeDays(threeDaysAgo, now)).toBe("3 days ago");
  });

  it("reports a future 3-day gap as 'in 3 days'", () => {
    const now = "2026-07-29T09:00:00.000Z";
    const threeDaysAhead = "2026-08-01T09:00:00.000Z";
    expect(formatRelativeDays(threeDaysAhead, now)).toBe("in 3 days");
  });

  it("reports the same day as 'today'", () => {
    const now = "2026-07-29T09:00:00.000Z";
    expect(formatRelativeDays(now, now)).toBe("today");
  });
});

describe("pricePeriodLabel", () => {
  it("labels per_annum as /year", () => {
    expect(pricePeriodLabel("per_annum")).toBe("/year");
  });

  it("labels per_month as /month", () => {
    expect(pricePeriodLabel("per_month")).toBe("/month");
  });

  it("labels outright as an empty string", () => {
    expect(pricePeriodLabel("outright")).toBe("");
  });
});
