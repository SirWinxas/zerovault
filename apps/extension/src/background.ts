import type { CopyResponse, FillResult, LockResponse, LoginResult, Message } from "./lib/messages";
import { createSessionManager, LoginInProgressError } from "./background/session";

const sessions = createSessionManager();

chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  // Only accept messages from this extension's own pages (popup).
  if (sender.id !== chrome.runtime.id) return false;
  switch (msg.type) {
    case "LOGIN":
      sessions
        .login(msg.email, msg.masterPassword)
        .then(() => sendResponse({ ok: true } satisfies LoginResult))
        .catch((err: unknown) =>
          sendResponse({
            ok: false,
            error:
              err instanceof LoginInProgressError
                ? "A sign-in is already in progress."
                : "Login failed. Check your credentials and connection.",
          } satisfies LoginResult),
        );
      return true;
    case "STATE":
      sendResponse(sessions.state());
      return false;
    case "ITEMS":
      sendResponse(sessions.labels());
      return false;
    case "FILL": {
      const item = sessions.credentialFor(msg.id);
      if (!item || typeof msg.tabId !== "number") {
        sendResponse({ filled: false } satisfies FillResult);
        return false;
      }
      void (async () => {
        try {
          // The REAL tab URL is read here; whatever the popup claims is never trusted.
          const tab = await chrome.tabs.get(msg.tabId);
          const cred = sessions.resolveFill(item, tab.url ?? "");
          if (!cred) return sendResponse({ filled: false } satisfies FillResult);
          const res = (await chrome.tabs.sendMessage(msg.tabId, { type: "FILL", ...cred })) as
            | FillResult
            | undefined;
          sendResponse({ filled: res?.filled === true } satisfies FillResult);
        } catch {
          sendResponse({ filled: false } satisfies FillResult);
        }
      })();
      return true;
    }
    case "COPY": {
      const item = sessions.credentialFor(msg.id);
      if (!item || (msg.field !== "username" && msg.field !== "password")) {
        sendResponse({ error: "Unavailable" } satisfies CopyResponse);
      } else {
        sendResponse({ value: item[msg.field] } satisfies CopyResponse);
      }
      return false;
    }
    case "LOCK":
      sessions.lock();
      sendResponse({ ok: true } satisfies LockResponse);
      return false;
    default:
      return false;
  }
});

// Best-effort proactive idle lock; state()/items() also enforce it lazily.
if (typeof chrome.alarms !== "undefined") {
  chrome.alarms.create("zv-idle-check", { periodInMinutes: 1 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "zv-idle-check") sessions.state();
  });
}
