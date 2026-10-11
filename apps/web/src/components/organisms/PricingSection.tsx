import { useState } from "react";
import { Link } from "react-router-dom";
import {
  PLANS,
  annualSavingsPct,
  billedAmount,
  formatEur,
  monthlyPrice,
  type BillingCycle,
  type Plan,
} from "../../lib/plans";

const cardBase =
  "flex flex-col gap-5 rounded-[24px] border-2 border-carbon p-6";
const ctaPrimary =
  "mt-auto inline-flex items-center justify-center rounded-full border-2 border-carbon bg-carbon px-6 py-3 text-sm font-bold tracking-wide text-paper transition active:translate-y-px";
const ctaSecondary =
  "mt-auto inline-flex items-center justify-center rounded-full border-2 border-carbon bg-paper px-6 py-3 text-sm font-bold tracking-wide text-carbon transition active:translate-y-px";

function Check() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 flex-none"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function isFree(plan: Plan): boolean {
  return plan.monthly === 0 && plan.annual === 0;
}

function planHref(plan: Plan, cycle: BillingCycle): string {
  if (isFree(plan)) return "/register";
  return `/checkout?plan=${plan.id}&billing=${cycle}`;
}

function PlanCard({ plan, cycle }: { plan: Plan; cycle: BillingCycle }) {
  const free = isFree(plan);
  const perMonth = formatEur(monthlyPrice(plan, cycle));
  const annualTotal = formatEur(billedAmount(plan, "annual"));

  return (
    <div
      className={`${cardBase} ${
        plan.highlighted ? "bg-sunburst" : "bg-paper"
      }`}
    >
      <div className="flex items-center gap-2">
        <h3 className="font-display text-2xl uppercase leading-none">
          {plan.name}
        </h3>
        {plan.highlighted && (
          <span className="rounded-full border-2 border-carbon bg-paper px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            Most popular
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-carbon/80">{plan.tagline}</p>

      <div>
        <div className="flex items-end gap-1">
          <span className="font-display text-5xl leading-[0.8]">{perMonth}</span>
          {!free && (
            <span className="pb-1 text-sm font-bold text-carbon/80">
              /mo{plan.perUser ? " · user" : ""}
            </span>
          )}
        </div>
        <p className="mt-2 h-4 text-xs font-medium text-carbon/80">
          {free
            ? ""
            : cycle === "annual"
              ? `Billed ${annualTotal}/yr${plan.perUser ? " per user" : ""}`
              : "Billed monthly"}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2 text-sm font-medium">
            <Check />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        to={planHref(plan, cycle)}
        className={plan.highlighted ? ctaPrimary : ctaSecondary}
      >
        {plan.ctaLabel}
      </Link>
    </div>
  );
}

export default function PricingSection() {
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const savings = annualSavingsPct(PLANS.find((p) => p.highlighted) ?? PLANS[0]);

  return (
    <section id="pricing" className="border-t-2 border-carbon bg-mist">
      <div className="mx-auto w-full max-w-5xl px-4 py-12">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-4xl uppercase leading-[0.85] sm:text-5xl">
              Pick your vault
            </h2>
            <p className="mt-3 max-w-md text-lg font-medium">
              Same zero-knowledge core on every plan. Pay for reach and extra
              protection, never for access to your own data.
            </p>
          </div>

          {/* Billing toggle */}
          <div
            className="inline-flex self-start rounded-full border-2 border-carbon bg-paper p-1"
            role="group"
            aria-label="Billing cycle"
          >
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              aria-pressed={cycle === "monthly"}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                cycle === "monthly" ? "bg-carbon text-paper" : "text-carbon"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle("annual")}
              aria-pressed={cycle === "annual"}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                cycle === "annual" ? "bg-carbon text-paper" : "text-carbon"
              }`}
            >
              Annual
              {savings > 0 && (
                <span className="ml-1 font-medium opacity-80">
                  · save {savings}%
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} cycle={cycle} />
          ))}
        </div>

        <p className="mt-6 text-xs font-medium text-carbon/80">
          Prices in EUR. Checkout is a demo for this project — no real payment is
          processed.
        </p>
      </div>
    </section>
  );
}
