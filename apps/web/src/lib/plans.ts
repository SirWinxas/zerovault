/**
 * Plan catalog and pricing helpers for the sales landing and the demo checkout.
 *
 * Frontend-only: nothing here charges money or talks to the API. Prices are the single
 * source of truth for the landing, the pricing cards and the checkout summary, so a real
 * payment provider can later be wired at the CTA/checkout boundary without touching copy.
 */

export type BillingCycle = "monthly" | "annual";

export type PlanId = "free" | "premium" | "teams";

export interface Plan {
  readonly id: PlanId;
  readonly name: string;
  readonly tagline: string;
  /** € charged per month on monthly billing (0 for free). */
  readonly monthly: number;
  /** € charged once per year on annual billing (0 for free). */
  readonly annual: number;
  /** Whether the price is per user (teams) rather than per account. */
  readonly perUser: boolean;
  /** The single plan the pricing grid emphasises. */
  readonly highlighted: boolean;
  readonly ctaLabel: string;
  readonly features: readonly string[];
}

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Zero-knowledge, forever free.",
    monthly: 0,
    annual: 0,
    perUser: false,
    highlighted: false,
    ctaLabel: "Create free vault",
    features: [
      "Unlimited passwords & secure notes",
      "AES-256-GCM, encrypted on your device",
      "One user, access from any browser",
      "Open-source cryptographic core",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "For people who guard everything.",
    monthly: 1.99,
    annual: 19,
    perUser: false,
    highlighted: true,
    ctaLabel: "Get Premium",
    features: [
      "Everything in Free",
      "Built-in 2FA / TOTP codes",
      "Password health dashboard",
      "Breach monitoring (HIBP, k-anonymity)",
      "Priority email support",
    ],
  },
  {
    id: "teams",
    name: "Teams",
    tagline: "Shared secrets, kept private.",
    monthly: 3.99,
    annual: 39,
    perUser: true,
    highlighted: false,
    ctaLabel: "Start Teams",
    features: [
      "Everything in Premium",
      "Shared team vaults",
      "Admin console & access policies",
      "Centralized billing",
      "SSO (coming soon)",
    ],
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

/** Amount charged now for the chosen cycle: the monthly rate, or the yearly total. */
export function billedAmount(plan: Plan, cycle: BillingCycle): number {
  return cycle === "annual" ? plan.annual : plan.monthly;
}

/** Per-month figure shown on the card: the annual total spread across 12 months. */
export function monthlyPrice(plan: Plan, cycle: BillingCycle): number {
  return cycle === "annual" ? plan.annual / 12 : plan.monthly;
}

/** Whole-percent saving of annual vs. paying monthly for a year; 0 when there is nothing to save. */
export function annualSavingsPct(plan: Plan): number {
  const yearAtMonthly = plan.monthly * 12;
  if (yearAtMonthly <= 0) return 0;
  return Math.round((1 - plan.annual / yearAtMonthly) * 100);
}

/** Formats a euro amount for display; a zero amount reads as "Free". */
export function formatEur(amount: number): string {
  if (amount <= 0) return "Free";
  return `€${amount.toFixed(2)}`;
}
