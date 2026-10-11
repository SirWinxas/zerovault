import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  billedAmount,
  formatEur,
  getPlan,
  type BillingCycle,
} from "../lib/plans";

const field =
  "w-full rounded-[14px] border-2 border-carbon bg-paper px-3 py-2.5 text-sm font-medium outline-none focus:bg-sky";
const label = "text-xs font-bold uppercase tracking-wide text-carbon/70";
const ctaPrimary =
  "inline-flex items-center justify-center rounded-full border-2 border-carbon bg-carbon px-6 py-3 text-sm font-bold tracking-wide text-paper transition active:translate-y-px";
const ctaSecondary =
  "inline-flex items-center justify-center rounded-full border-2 border-carbon bg-paper px-6 py-3 text-sm font-bold tracking-wide text-carbon transition active:translate-y-px";

function parseCycle(raw: string | null): BillingCycle {
  return raw === "monthly" ? "monthly" : "annual";
}

export default function CheckoutPage() {
  const [params] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);

  const plan = getPlan(params.get("plan") ?? "");
  const cycle = parseCycle(params.get("billing"));

  // Free or unknown plans have nothing to pay for — go straight to account creation.
  if (!plan || (plan.monthly === 0 && plan.annual === 0)) {
    return <Navigate to="/register" replace />;
  }

  const total = billedAmount(plan, cycle);
  const cycleLabel = cycle === "annual" ? "Billed yearly" : "Billed monthly";
  const perUser = plan.perUser ? " / user" : "";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-carbon bg-carbon">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-4 text-paper">
          <Link
            to="/"
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-paper font-display text-lg leading-none"
          >
            Z
          </Link>
          <span className="font-display text-lg uppercase leading-none">
            ZeroVault
          </span>
          <span className="ml-auto text-xs font-bold uppercase tracking-wide opacity-80">
            Secure checkout · demo
          </span>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-10 md:grid-cols-[0.9fr_1.1fr]">
        {/* Order summary */}
        <section className="flex flex-col gap-4 rounded-[24px] border-2 border-carbon bg-lavender p-6">
          <h1 className="font-display text-3xl uppercase leading-[0.85]">
            Order summary
          </h1>
          <div className="rounded-[16px] border-2 border-carbon bg-paper p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-bold">{plan.name}</span>
              <span className="font-display text-2xl leading-none">
                {formatEur(total)}
                {perUser}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-carbon/60">
              {cycleLabel} · {plan.tagline}
            </p>
            <ul className="mt-3 flex flex-col gap-1 border-t-2 border-carbon/10 pt-3 text-sm font-medium text-carbon/80">
              {plan.features.slice(0, 4).map((f) => (
                <li key={f}>— {f}</li>
              ))}
            </ul>
          </div>
          <div className="flex items-baseline justify-between border-t-2 border-carbon pt-3">
            <span className="font-bold uppercase tracking-wide">Total due</span>
            <span className="font-display text-3xl leading-none">
              {formatEur(total)}
              {perUser}
            </span>
          </div>
        </section>

        {/* Payment / success */}
        <section className="flex flex-col gap-4">
          <div className="rounded-[14px] border-2 border-carbon bg-sunburst px-4 py-3 text-sm font-bold">
            Demo checkout — no real payment is processed and no card data is
            sent anywhere. ZeroVault is a zero-knowledge password manager
            (academic project).
          </div>

          {submitted ? (
            <div className="flex flex-col gap-4 rounded-[24px] border-2 border-carbon bg-mint p-6">
              <h2 className="font-display text-3xl uppercase leading-[0.85]">
                Payment successful
              </h2>
              <p className="text-sm font-medium">
                You picked <strong>{plan.name}</strong> ({cycleLabel.toLowerCase()}).
                This is a demo, so nothing was charged. Create your vault to
                finish setting up — your master password never leaves your
                browser.
              </p>
              <div className="mt-1 flex flex-wrap gap-3">
                <Link to="/register" className={ctaPrimary}>
                  Create your vault
                </Link>
                <Link to="/" className={ctaSecondary}>
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 rounded-[24px] border-2 border-carbon bg-paper p-6"
            >
              <h2 className="font-display text-2xl uppercase leading-none">
                Payment details
              </h2>

              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="co-name">
                  Cardholder name
                </label>
                <input
                  id="co-name"
                  className={field}
                  autoComplete="off"
                  placeholder="Ada Lovelace"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="co-email">
                  Email for the receipt
                </label>
                <input
                  id="co-email"
                  type="email"
                  className={field}
                  autoComplete="off"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={label} htmlFor="co-card">
                  Card number
                </label>
                <input
                  id="co-card"
                  className={`${field} font-mono`}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="4242 4242 4242 4242"
                  defaultValue="4242 4242 4242 4242"
                  required
                />
                <span className="text-[11px] font-medium text-carbon/50">
                  Prefilled demo value — any input works, nothing is validated or
                  stored.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={label} htmlFor="co-exp">
                    Expiry
                  </label>
                  <input
                    id="co-exp"
                    className={`${field} font-mono`}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="12 / 30"
                    defaultValue="12 / 30"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={label} htmlFor="co-cvc">
                    CVC
                  </label>
                  <input
                    id="co-cvc"
                    className={`${field} font-mono`}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="123"
                    defaultValue="123"
                    required
                  />
                </div>
              </div>

              <button type="submit" className={`${ctaPrimary} mt-2 w-full`}>
                Pay {formatEur(total)}
                {perUser} (demo)
              </button>

              <p className="text-center text-xs font-medium text-carbon/50">
                Free plan?{" "}
                <Link
                  to="/register"
                  className="font-bold underline underline-offset-2"
                >
                  Skip payment and create a vault
                </Link>
              </p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
