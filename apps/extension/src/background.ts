import type { LockResponse, LoginResult, Message } from "./lib/messages";
import { createSessionManager } from "./background/session";

const sessions = createSessionManager();

chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  // Only accept messages from this extension's own pages (popup).
  if (sender.id !== chrome.runtime.id) return false;
  switch (msg.type) {
    case "LOGIN":
      sessions
        .login(msg.email, msg.masterPassword)
        .then(() => sendResponse({ ok: true } satisfies LoginResult))
        .catch(() =>
          sendResponse({
            ok: false,
            error: "Login failed. Check your credentials and connection.",
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
