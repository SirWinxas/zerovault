import { describe, expect, it } from "vitest";
import {
  PLANS,
  annualSavingsPct,
  billedAmount,
  formatEur,
  getPlan,
  monthlyPrice,
} from "./plans";

describe("plan catalog", () => {
  it("exposes free, premium and teams in display order", () => {
    expect(PLANS.map((p) => p.id)).toEqual(["free", "premium", "teams"]);
  });

  it("looks up a plan by id and returns undefined for an unknown id", () => {
    expect(getPlan("premium")?.name).toBe("Premium");
    expect(getPlan("teams")?.perUser).toBe(true);
    expect(getPlan("nope")).toBeUndefined();
  });

  it("marks exactly one plan as highlighted", () => {
    expect(PLANS.filter((p) => p.highlighted)).toHaveLength(1);
  });
});

describe("pricing helpers", () => {
  const premium = getPlan("premium")!;
  const free = getPlan("free")!;

  it("formats euro amounts, treating zero as Free", () => {
    expect(formatEur(0)).toBe("Free");
    expect(formatEur(1.99)).toBe("€1.99");
    expect(formatEur(19)).toBe("€19.00");
  });

  it("charges the monthly rate on monthly billing", () => {
    expect(billedAmount(premium, "monthly")).toBe(1.99);
    expect(monthlyPrice(premium, "monthly")).toBe(1.99);
  });

  it("charges the annual total and shows the per-month equivalent on annual billing", () => {
    expect(billedAmount(premium, "annual")).toBe(19);
    expect(formatEur(monthlyPrice(premium, "annual"))).toBe("€1.58");
  });

  it("keeps the free plan free on every cycle", () => {
    expect(billedAmount(free, "annual")).toBe(0);
    expect(formatEur(monthlyPrice(free, "monthly"))).toBe("Free");
  });

  it("computes the annual saving as a whole percentage, zero when there is nothing to save", () => {
    expect(annualSavingsPct(premium)).toBe(20);
    expect(annualSavingsPct(free)).toBe(0);
  });
});
