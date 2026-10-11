import { StrictMode, useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { copyWithAutoClear } from "./lib/clipboard";
import type { ItemsResponse, LockResponse, LoginResult, Message, StateResponse } from "./lib/messages";
import type { DecryptedItem } from "./vault/entry";
import { matchesTab, siteHostname } from "./vault/match";

const GENERIC_ERROR = "Something went wrong, try again.";

/** Never rejects: a failed send or an empty response resolves to `null`. */
async function send<T>(msg: Message): Promise<T | null> {
  try {
    const res = (await chrome.runtime.sendMessage(msg)) as T | undefined;
    return res ?? null;
  } catch {
    return null;
  }
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [master, setMaster] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await send<LoginResult>({ type: "LOGIN", email, masterPassword: master });
    setMaster("");
    setBusy(false);
    if (!res) setError(GENERIC_ERROR);
    else if (res.ok) onDone();
    else setError(res.error);
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
      <input type="email" placeholder="Email" value={email} required autoComplete="username"
        onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Master password" value={master} required
        autoComplete="current-password" onChange={(e) => setMaster(e.target.value)} />
      {error && <p role="alert" style={{ color: "#b00020", margin: 0, fontSize: 12 }}>{error}</p>}
      <button type="submit" disabled={busy}>{busy ? "Unlocking..." : "Unlock"}</button>
    </form>
  );
}

function Row({ item }: { item: DecryptedItem }) {
  const [hint, setHint] = useState("");
  async function copy(label: string, value: string) {
    try {
      await copyWithAutoClear(value);
      setHint(`${label} copied`);
    } catch {
      setHint("Copy failed");
    }
    setTimeout(() => setHint(""), 1500);
  }
  return (
    <li style={{ borderBottom: "1px solid #ddd", padding: "6px 0", listStyle: "none" }}>
      <div style={{ fontWeight: 600 }}>{siteHostname(item.site) || item.site}</div>
      <div style={{ fontSize: 12, color: "#555" }}>{item.username} · ••••••••</div>
      <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={() => copy("Username", item.username)}>Copy username</button>
        <button type="button" onClick={() => copy("Password", item.password)}>Copy password</button>
        <span aria-live="polite" style={{ fontSize: 11, color: hint === "Copy failed" ? "#b00020" : "#2e7d32" }}>{hint}</span>
      </div>
    </li>
  );
}

function Group({ title, items }: { title: string; items: DecryptedItem[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 style={{ fontSize: 13, margin: "12px 0 4px" }}>{title}</h2>
      <ul style={{ margin: 0, padding: 0 }}>
        {items.map((i) => <Row key={i.id} item={i} />)}
      </ul>
    </section>
  );
}

function VaultList({ onLock }: { onLock: () => void }) {
  const [items, setItems] = useState<DecryptedItem[] | null>(null);
  const [tabUrl, setTabUrl] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      let url = "";
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        url = tab?.url ?? "";
      } catch {
        // No tab info: everything is listed under "All items".
      }
      setTabUrl(url);
      const res = await send<ItemsResponse>({ type: "ITEMS" });
      if (!res) setError(GENERIC_ERROR);
      else if (res.locked) onLock();
      else setItems(res.items);
    })();
  }, [onLock]);

  async function lock() {
    const res = await send<LockResponse>({ type: "LOCK" });
    if (!res) setError(GENERIC_ERROR);
    else onLock();
  }

  if (!items) {
    return error ? <p role="alert" style={{ color: "#b00020", fontSize: 12 }}>{error}</p> : <p>Loading...</p>;
  }
  const here = items.filter((i) => matchesTab(i.site, tabUrl));
  const rest = items.filter((i) => !here.includes(i));
  return (
    <div>
      <button type="button" onClick={lock}>Lock</button>
      {error && <p role="alert" style={{ color: "#b00020", margin: "4px 0 0", fontSize: 12 }}>{error}</p>}
      <Group title="This site" items={here} />
      <Group title={here.length ? "Other" : "All items"} items={rest} />
      {items.length === 0 && <p style={{ fontSize: 12 }}>Your vault is empty.</p>}
    </div>
  );
}

function Popup() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const onLock = useCallback(() => setUnlocked(false), []);
  useEffect(() => {
    void send<StateResponse>({ type: "STATE" }).then((s) => setUnlocked(s ? s.unlocked : false));
  }, []);

  return (
    <main style={{ width: 320, padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 18, margin: "0 0 12px" }}>ZeroVault</h1>
      {unlocked === null ? null : unlocked ? (
        <VaultList onLock={onLock} />
      ) : (
        <LoginForm onDone={() => setUnlocked(true)} />
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Popup />
  </StrictMode>,
);
