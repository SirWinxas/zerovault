import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CopyIcon, EyeIcon, KeyIcon } from "../components/atoms/Icons";
import PricingSection from "../components/organisms/PricingSection";

const MARQUEE =
  "ZERO-KNOWLEDGE ★ YOUR MASTER NEVER LEAVES YOUR BROWSER ★ THE SERVER ONLY SEES CIPHERTEXT ★ AES-256-GCM · PBKDF2 600K ★ ";

const pillPrimary =
  "inline-flex items-center justify-center rounded-full border-2 border-carbon bg-carbon px-6 py-3 text-sm font-bold tracking-wide text-paper transition active:translate-y-px";
const pillSecondary =
  "inline-flex items-center justify-center rounded-full border-2 border-carbon bg-paper px-6 py-3 text-sm font-bold tracking-wide text-carbon transition active:translate-y-px";

function Feature({
  fill,
  title,
  body,
  icon,
}: {
  fill: string;
  title: string;
  body: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border-2 border-carbon bg-paper p-5">
      <div
        className="grid h-12 w-12 place-items-center rounded-[14px] border-2 border-carbon"
        style={{ backgroundColor: fill }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold leading-tight">{title}</h3>
      <p className="text-sm text-carbon/80">{body}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Marquee */}
      <div className="w-full overflow-hidden border-b-2 border-carbon bg-carbon">
        <div className="animate-marquee py-2 text-xs font-bold uppercase tracking-[0.12em] text-paper">
          <span>{MARQUEE}</span>
          <span>{MARQUEE}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-4">
        <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-carbon bg-paper font-display text-xl leading-none">
          Z
        </div>
        <span className="font-display text-xl uppercase leading-none">
          ZeroVault
        </span>
        <div className="ml-auto flex items-center gap-2">
          <a href="#pricing" className="hidden px-2 text-sm font-bold sm:inline">
            Pricing
          </a>
          <Link to="/login" className={pillSecondary}>
            Log in
          </Link>
          <Link to="/register" className={pillPrimary}>
            Create vault
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="overflow-hidden">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-block rounded-full border-2 border-carbon bg-paper px-4 py-1.5 text-xs font-bold uppercase tracking-wide">
              A zero-knowledge password manager
            </span>
            <h1 className="mt-5 font-display text-6xl uppercase leading-[0.8] sm:text-7xl md:text-8xl">
              Your secrets,
              <br />
              only yours.
            </h1>
            <p className="mt-5 max-w-md text-lg font-medium">
              Everything is encrypted in your browser before it ever leaves it.
              The server stores locked boxes it can never open.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register" className={pillPrimary}>
                Create your vault
              </Link>
              <a href="#pricing" className={pillSecondary}>
                See plans
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {["AES-256-GCM", "PBKDF2 · 600K", "Web Crypto API", "No tracking"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border-2 border-carbon bg-sky px-3 py-1 text-xs font-bold"
                  >
                    {chip}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Product preview card */}
          <div className="rounded-[28px] border-2 border-carbon bg-lavender p-5">
            <div className="flex items-center gap-2 border-b-2 border-carbon pb-3">
              <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-carbon bg-paper font-display text-sm leading-none">
                Z
              </div>
              <span className="font-display text-lg uppercase leading-none">
                Vault
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-[16px] border-2 border-carbon bg-paper p-3">
              <div className="grid h-10 w-10 flex-none place-items-center rounded-[12px] border-2 border-carbon bg-sky">
                <KeyIcon />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">github.com</p>
                <p className="truncate text-xs text-carbon/80">winxe</p>
                <p className="truncate font-mono text-xs text-carbon/80">
                  {"•".repeat(10)}
                </p>
              </div>
              <div className="ml-auto flex gap-1.5">
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-carbon bg-paper">
                  <EyeIcon />
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-carbon bg-paper">
                  <CopyIcon />
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-[16px] border-2 border-carbon bg-paper px-3 py-2 text-xs font-medium">
              <span className="h-2.5 w-2.5 flex-none rounded-full border-2 border-carbon bg-mint" />
              Encrypted locally. The server sees only ciphertext.
            </div>
          </div>
        </div>
      </section>

      {/* How it stays private */}
      <section className="border-t-2 border-carbon bg-paper">
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <h2 className="font-display text-4xl uppercase leading-[0.85] sm:text-5xl">
            How it stays private
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <Feature
              fill="var(--color-lavender)"
              title="Encrypted on your device"
              body="Your vault is sealed with AES-256-GCM using the browser's native Web Crypto API. Plaintext never touches the network."
              icon={<KeyIcon />}
            />
            <Feature
              fill="var(--color-sky)"
              title="The server only sees ciphertext"
              body="The backend stores locked boxes and a session token. A breach of the server or database exposes nothing readable."
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              }
            />
            <Feature
              fill="var(--color-sunburst)"
              title="No backdoor, no recovery"
              body="Your master password never leaves your browser, so no one can reset it. Lose it and the vault is gone — by design."
              icon={
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* CTA band */}
      <section className="border-t-2 border-carbon bg-sky">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-5 px-4 py-12">
          <h2 className="font-display text-5xl uppercase leading-[0.8] sm:text-6xl">
            Ready when you are.
          </h2>
          <p className="max-w-md text-lg font-medium">
            One master password. Everything else encrypted and in your hands.
          </p>
          <Link to="/register" className={pillPrimary}>
            Create your vault
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-4 py-8 text-xs text-carbon/80">
        ZeroVault · a zero-knowledge password manager.
      </footer>
    </div>
  );
}
