import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfferBadge } from "@/components/offers/OfferBadge";

// ─── OfferBadge ───────────────────────────────────────────────────────────────
//
// OfferBadge accepts rewardPct as either:
//   - a decimal fraction (0.05 = 5%)
//   - a whole number (5 = 5%)
//
// Color tiers (applied to the outer <span>):
//   >= 4%  → bg-emerald-100 text-emerald-700
//   >= 2%  → bg-blue-100    text-blue-700
//   <  2%  → bg-gray-100    text-gray-600

describe("OfferBadge", () => {
  // ── Percentage text rendering ───────────────────────────────────────────────

  describe("percentage display", () => {
    it("renders a whole-number decimal fraction as an integer percentage", () => {
      render(<OfferBadge rewardPct={0.05} rewardType="CASHBACK" />);
      expect(screen.getByText(/5%/)).toBeInTheDocument();
    });

    it("renders a fractional decimal with two decimal places", () => {
      render(<OfferBadge rewardPct={0.025} rewardType="CASHBACK" />);
      expect(screen.getByText(/2\.50%/)).toBeInTheDocument();
    });

    it("renders a whole-number input (5) as '5%'", () => {
      render(<OfferBadge rewardPct={5} rewardType="CASHBACK" />);
      expect(screen.getByText(/5%/)).toBeInTheDocument();
    });

    it("renders 1% (0.01) correctly", () => {
      render(<OfferBadge rewardPct={0.01} rewardType="CASHBACK" />);
      expect(screen.getByText(/1%/)).toBeInTheDocument();
    });

    it("appends the label when provided", () => {
      render(<OfferBadge rewardPct={0.05} rewardType="CASHBACK" label="at Target" />);
      expect(screen.getByText(/· at Target/)).toBeInTheDocument();
    });
  });

  // ── Reward type icons ───────────────────────────────────────────────────────

  describe("reward type icons", () => {
    it("shows $ icon for CASHBACK", () => {
      render(<OfferBadge rewardPct={0.05} rewardType="CASHBACK" />);
      expect(screen.getByText("$")).toBeInTheDocument();
    });

    it("shows ★ icon for POINTS", () => {
      render(<OfferBadge rewardPct={0.05} rewardType="POINTS" />);
      expect(screen.getByText("★")).toBeInTheDocument();
    });

    it("shows ✈ icon for MILES", () => {
      render(<OfferBadge rewardPct={0.05} rewardType="MILES" />);
      expect(screen.getByText("✈")).toBeInTheDocument();
    });
  });

  // ── Colour tiers ────────────────────────────────────────────────────────────

  describe("colour tiers", () => {
    it("applies emerald classes for rewardPct >= 4% (decimal: 0.04)", () => {
      const { container } = render(<OfferBadge rewardPct={0.04} rewardType="CASHBACK" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-emerald-100");
      expect(badge.className).toContain("text-emerald-700");
    });

    it("applies emerald classes for rewardPct >= 4% (whole number: 5)", () => {
      const { container } = render(<OfferBadge rewardPct={5} rewardType="CASHBACK" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-emerald-100");
    });

    it("applies emerald classes for exactly 4% (0.04)", () => {
      const { container } = render(<OfferBadge rewardPct={0.04} rewardType="CASHBACK" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-emerald-100");
    });

    it("applies blue classes for rewardPct in 2–3.99% range (0.03)", () => {
      const { container } = render(<OfferBadge rewardPct={0.03} rewardType="CASHBACK" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-blue-100");
      expect(badge.className).toContain("text-blue-700");
    });

    it("applies blue classes for exactly 2% (0.02)", () => {
      const { container } = render(<OfferBadge rewardPct={0.02} rewardType="CASHBACK" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-blue-100");
    });

    it("applies gray classes for rewardPct < 2% (0.01)", () => {
      const { container } = render(<OfferBadge rewardPct={0.01} rewardType="CASHBACK" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-gray-100");
      expect(badge.className).toContain("text-gray-600");
    });

    it("applies gray classes for 0% (no reward)", () => {
      const { container } = render(<OfferBadge rewardPct={0} rewardType="CASHBACK" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("bg-gray-100");
    });

    it("does NOT apply emerald classes for a blue-tier offer (0.03)", () => {
      const { container } = render(<OfferBadge rewardPct={0.03} rewardType="CASHBACK" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).not.toContain("bg-emerald-100");
    });

    it("does NOT apply blue classes for a gray-tier offer (0.01)", () => {
      const { container } = render(<OfferBadge rewardPct={0.01} rewardType="CASHBACK" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).not.toContain("bg-blue-100");
    });
  });
});
