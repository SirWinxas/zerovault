import { pickLoginFields } from "./content/detect";
import type { FieldInfo } from "./content/detect";
import { shouldFill } from "./vault/match";
import type { FillMessage, FillResponse } from "./lib/messages";

function setValue(input: HTMLInputElement, value: string): void {
  // Use the native setter so React-controlled inputs register the change.
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function fill(username: string, password: string): boolean {
  const inputs = Array.from(document.querySelectorAll("input"));
  const infos: FieldInfo[] = inputs.map((i) => ({
    type: i.type,
    name: i.name,
    id: i.id,
    autocomplete: i.autocomplete,
    placeholder: i.placeholder,
  }));
  const picked = pickLoginFields(infos);
  if (!picked) return false;
  setValue(inputs[picked.usernameIndex], username);
  setValue(inputs[picked.passwordIndex], password);
  return true;
}

chrome.runtime.onMessage.addListener((msg: FillMessage, sender, sendResponse: (r: FillResponse) => void) => {
  if (sender.id !== chrome.runtime.id) return false;
  if (msg?.type !== "FILL") return false;
  // Defense in depth: refuse if the page is not the credential's site (e.g. tab navigated).
  if (!shouldFill(String(msg.site), window.location.href)) {
    sendResponse({ filled: false });
    return false;
  }
  try {
    sendResponse({ filled: fill(String(msg.username), String(msg.password)) });
  } catch {
    sendResponse({ filled: false });
  }
  return false;
});
