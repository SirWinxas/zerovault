import type { LockResponse, LoginResult, Message } from "./lib/messages";
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
      sendResponse(sessions.items());
      return false;
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
