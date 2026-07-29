import type { PricePeriod } from "@/lib/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const NAIRA_FORMATTER = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const RELATIVE_DAY_FORMATTER = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

export function formatNaira(amount: number): string {
  return NAIRA_FORMATTER.format(amount);
}

export function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso));
}

export function formatRelativeDays(iso: string, nowIso?: string): string {
  const now = nowIso === undefined ? new Date() : new Date(nowIso);
  const then = new Date(iso);
  const diffDays = Math.round((then.getTime() - now.getTime()) / MS_PER_DAY);
  return RELATIVE_DAY_FORMATTER.format(diffDays, "day");
}

export function pricePeriodLabel(period: PricePeriod): string {
  switch (period) {
    case "per_annum":
      return "/year";
    case "per_month":
      return "/month";
    default:
      return "";
  }
}
