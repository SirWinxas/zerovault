import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";
import { copyWithAutoClear } from "./lib/clipboard";
import type { FillMessage, FillResponse, ItemsResponse, LockResponse, LoginResult, Message, StateResponse } from "./lib/messages";
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
    <form onSubmit={submit} className="zv-form">
      <input type="email" placeholder="Email" value={email} required autoComplete="username"
        onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Master password" value={master} required
        autoComplete="current-password" onChange={(e) => setMaster(e.target.value)} />
      {error && <p role="alert" className="zv-error">{error}</p>}
      <button type="submit" className="zv-primary" disabled={busy}>{busy ? "Unlocking..." : "Unlock"}</button>
    </form>
  );
}

function Row({ item, tabId }: { item: DecryptedItem; tabId?: number }) {
  const [hint, setHint] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // No state updates after unmount: clear any pending hint timer.
  useEffect(() => () => clearTimeout(timer.current), []);
  function flash(text: string, ms: number) {
    clearTimeout(timer.current);
    setHint(text);
    timer.current = setTimeout(() => setHint(""), ms);
  }
  async function copy(label: string, value: string) {
    try {
      await copyWithAutoClear(value);
      flash(`${label} copied`, 1500);
    } catch {
      flash("Copy failed", 1500);
    }
  }
  async function fill() {
    let msg = GENERIC_ERROR;
    try {
      const m: FillMessage = { type: "FILL", site: item.site, username: item.username, password: item.password };
      const res = (await chrome.tabs.sendMessage(tabId!, m)) as FillResponse | undefined;
      if (res) msg = res.filled ? "Filled" : "No login form found";
    } catch {
      // Content script unreachable (e.g. restricted page): show the generic hint.
    }
    flash(msg, 2000);
  }
  const bad = hint === "Copy failed" || hint === GENERIC_ERROR || hint === "No login form found";
  return (
    <li className="zv-row">
      <div className="zv-site">{siteHostname(item.site) || item.site}</div>
      <div className="zv-user">{item.username} · ••••••••</div>
      <div className="zv-actions">
        {tabId !== undefined && <button type="button" onClick={fill}>Fill</button>}
        <button type="button" onClick={() => copy("Username", item.username)}>Copy username</button>
        <button type="button" onClick={() => copy("Password", item.password)}>Copy password</button>
        <span aria-live="polite" className={bad ? "zv-hint zv-bad" : "zv-hint"}>{hint}</span>
      </div>
    </li>
  );
}

function Group({ title, items, tabId }: { title: string; items: DecryptedItem[]; tabId?: number }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="zv-group-title">{title}</h2>
      <ul className="zv-list">
        {items.map((i) => <Row key={i.id} item={i} tabId={tabId} />)}
      </ul>
    </section>
  );
}

function VaultList({ onLock }: { onLock: () => void }) {
  const [items, setItems] = useState<DecryptedItem[] | null>(null);
  const [tabUrl, setTabUrl] = useState("");
  const [tabId, setTabId] = useState<number | undefined>();

  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      let url = "";
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        url = tab?.url ?? "";
        setTabId(tab?.id);
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
    return error ? <p role="alert" className="zv-error">{error}</p> : <p className="zv-empty">Loading...</p>;
  }
  const here = items.filter((i) => matchesTab(i.site, tabUrl));
  const rest = items.filter((i) => !here.includes(i));
  return (
    <div>
      <button type="button" onClick={lock}>Lock</button>
      {error && <p role="alert" className="zv-error">{error}</p>}
      <Group title="This site" items={here} tabId={tabId} />
      <Group title={here.length ? "Other" : "All items"} items={rest} />
      {items.length === 0 && <p className="zv-empty">Your vault is empty.</p>}
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
    <main className="zv-popup">
      <h1 className="zv-title">ZeroVault</h1>
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
