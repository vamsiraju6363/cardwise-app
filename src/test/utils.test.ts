import { describe, it, expect } from "vitest";
import { formatCurrency, formatPercent, isOfferExpiringSoon } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it('formats zero as "$0.00"', () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it('formats $0.10 correctly', () => {
    expect(formatCurrency(0.10)).toBe("$0.10");
  });

  it('formats $1,234.56 with thousands separator', () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it('formats a whole dollar amount with two decimal places', () => {
    expect(formatCurrency(100)).toBe("$100.00");
  });

  it('formats a large amount correctly', () => {
    expect(formatCurrency(1_000_000)).toBe("$1,000,000.00");
  });

  it('rounds to two decimal places', () => {
    expect(formatCurrency(1.999)).toBe("$2.00");
  });
});

// ─── formatPercent ────────────────────────────────────────────────────────────

describe("formatPercent", () => {
  it('formats decimal fraction 0.05 as "5.00%"', () => {
    expect(formatPercent(0.05)).toBe("5.00%");
  });

  it('formats whole number 5 as "5.00%"', () => {
    expect(formatPercent(5)).toBe("5.00%");
  });

  it('formats 0.005 (0.5%) as "0.50%"', () => {
    expect(formatPercent(0.005)).toBe("0.50%");
  });

  it('formats 1 (treated as 100%) as "100.00%"', () => {
    // Values <= 1 are multiplied by 100, so 1 → 100%
    expect(formatPercent(1)).toBe("100.00%");
  });

  it('formats 100 as "100.00%"', () => {
    expect(formatPercent(100)).toBe("100.00%");
  });

  it('formats 0.015 as "1.50%"', () => {
    expect(formatPercent(0.015)).toBe("1.50%");
  });

  it('formats 0.025 as "2.50%"', () => {
    expect(formatPercent(0.025)).toBe("2.50%");
  });
});

// ─── isOfferExpiringSoon ──────────────────────────────────────────────────────

describe("isOfferExpiringSoon", () => {
  it("returns false when validUntil is null", () => {
    expect(isOfferExpiringSoon(null)).toBe(false);
  });

  it("returns false when offer expires 30 days from now (outside 14-day window)", () => {
    const thirtyDaysOut = new Date(Date.now() + 30 * DAY_MS);
    expect(isOfferExpiringSoon(thirtyDaysOut)).toBe(false);
  });

  it("returns true when offer expires 7 days from now (inside 14-day window)", () => {
    const sevenDaysOut = new Date(Date.now() + 7 * DAY_MS);
    expect(isOfferExpiringSoon(sevenDaysOut)).toBe(true);
  });

  it("returns true when offer already expired yesterday", () => {
    // Already-expired offers are treated as urgently expiring so the UI can warn the user
    const yesterday = new Date(Date.now() - DAY_MS);
    expect(isOfferExpiringSoon(yesterday)).toBe(true);
  });

  it("returns true when offer expires exactly at the boundary (14 days - 1 second)", () => {
    const boundary = new Date(Date.now() + 14 * DAY_MS - 1000);
    expect(isOfferExpiringSoon(boundary)).toBe(true);
  });

  it("returns false when offer expires exactly at 14 days + 1 second (outside window)", () => {
    const justOutside = new Date(Date.now() + 14 * DAY_MS + 1000);
    expect(isOfferExpiringSoon(justOutside)).toBe(false);
  });

  it("respects a custom days window", () => {
    const fiveDaysOut = new Date(Date.now() + 5 * DAY_MS);
    expect(isOfferExpiringSoon(fiveDaysOut, 7)).toBe(true);
    expect(isOfferExpiringSoon(fiveDaysOut, 3)).toBe(false);
  });
});
