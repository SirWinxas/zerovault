import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { KeyIcon } from "../components/atoms/Icons";
import { VaultItemCard } from "../components/molecules/VaultItemCard";
import PricingSection from "../components/organisms/PricingSection";
import type { DecryptedVaultItem } from "../vault/vault-entry";

const GITHUB_URL = "https://github.com/SirWinxas/zerovault";

const SAMPLE_ITEM: DecryptedVaultItem = {
  id: "preview",
  site: "github.com",
  username: "you@example.com",
  password: "correct-horse-battery",
};

const STEPS = [
  {
    title: "Create your vault",
    body: "Pick one master password. It's the only key, and it never leaves your device.",
  },
  {
    title: "Save your passwords",
    body: "Add your logins and secrets. Each one is encrypted in your browser with AES-256-GCM before it's sent.",
  },
  {
    title: "Open anywhere",
    body: "Log in and unlock with your master password; your vault decrypts locally. The server never sees plaintext.",
  },
];

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: "What if I forget my master password?",
    a: "There's no reset and no backdoor. Your master password is the only key and it never reaches our servers, so a forgotten master password means the vault can't be decrypted. That's the tradeoff for real zero-knowledge.",
  },
  {
    q: "Can ZeroVault see my passwords?",
    a: "No. Everything is encrypted in your browser before it's sent. The server only ever stores ciphertext and a session token.",
  },
  {
    q: "What encryption does it use?",
    a: "AES-256-GCM for your data, with keys derived from your master password via PBKDF2 (600,000 iterations), all through the browser's native Web Crypto API.",
  },
  {
    q: "Is it open source?",
    a: (
      <>
        Yes. ZeroVault was built as a Master's thesis and the full source is on{" "}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="font-bold underline underline-offset-2"
        >
          GitHub
        </a>
        .
      </>
    ),
  },
  {
    q: "Is the checkout real?",
    a: "No — the checkout is a demo and never charges a card.",
  },
];

const FOOTER_LINK = "font-bold underline-offset-2 hover:underline";

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
      <div
        aria-hidden="true"
        className="w-full overflow-hidden border-b-2 border-carbon bg-carbon"
      >
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
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden px-2 text-sm font-bold sm:inline"
          >
            GitHub
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
              <Link to="/login?demo=1" className={pillSecondary}>
                Try the demo
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
            <p className="mt-4 text-sm text-carbon/80">
              Open source · built as a Master's thesis —{" "}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="font-bold underline underline-offset-2"
              >
                view it on GitHub
              </a>
            </p>
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
            <ul className="mt-4" aria-hidden="true" inert>
              <VaultItemCard
                item={SAMPLE_ITEM}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </ul>
            <div className="mt-3 flex items-center gap-2 rounded-[16px] border-2 border-carbon bg-paper px-3 py-2 text-xs font-medium">
              <span className="h-2.5 w-2.5 flex-none rounded-full border-2 border-carbon bg-mint" />
              Encrypted locally. The server sees only ciphertext.
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t-2 border-carbon">
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <h2 className="font-display text-4xl uppercase leading-[0.85] sm:text-5xl">
            How it works
          </h2>
          <ol className="mt-7 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-[20px] border-2 border-carbon bg-paper p-5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-carbon bg-sunburst font-display text-xl leading-none text-carbon">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-bold leading-tight">{step.title}</h3>
                <p className="text-sm text-carbon/80">{step.body}</p>
              </li>
            ))}
          </ol>
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

      {/* FAQ */}
      <section id="faq" className="border-t-2 border-carbon">
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <h2 className="font-display text-4xl uppercase leading-[0.85] sm:text-5xl">
            FAQ
          </h2>
          <div className="mt-7 flex flex-col gap-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="rounded-[16px] border-2 border-carbon bg-paper px-4 py-3"
              >
                <summary className="cursor-pointer font-bold">{f.q}</summary>
                <p className="mt-2 text-sm text-carbon/80">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t-2 border-carbon bg-sky">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-5 px-4 py-12">
          <h2 className="font-display text-5xl uppercase leading-[0.8] sm:text-6xl">
            Ready when you are.
          </h2>
          <p className="max-w-md text-lg font-medium">
            One master password. Everything else encrypted and in your hands.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className={pillPrimary}>
              Create your vault
            </Link>
            <Link to="/login?demo=1" className={pillSecondary}>
              Try the demo
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-carbon">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xl uppercase leading-none">
              ZeroVault
            </p>
            <p className="mt-2 text-xs text-carbon/80">
              A zero-knowledge password manager. Built as a Master's thesis.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="#how" className={FOOTER_LINK}>
              How it works
            </a>
            <a href="#pricing" className={FOOTER_LINK}>
              Pricing
            </a>
            <a href="#faq" className={FOOTER_LINK}>
              FAQ
            </a>
            <Link to="/login" className={FOOTER_LINK}>
              Log in
            </Link>
            <Link to="/register" className={FOOTER_LINK}>
              Create vault
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={FOOTER_LINK}
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
