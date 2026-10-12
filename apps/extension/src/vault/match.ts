import { getDomain } from "tldts";

const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

/** Normalize a stored site ("GitHub.com", "https://x.com/a") to a lower-case hostname, or "". */
export function siteHostname(site: string): string {
  const raw = (site ?? "").trim();
  if (!raw || /\s/.test(raw)) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return "";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "";
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  return HOST_RE.test(host) ? host : "";
}

/** True when hosts are equal or one is a subdomain of the other (on a dot boundary). */
export function matchesTab(itemSite: string, tabUrl: string): boolean {
  const item = siteHostname(itemSite);
  const tab = siteHostname(tabUrl);
  if (!item || !tab) return false;
  return item === tab || tab.endsWith(`.${item}`) || item.endsWith(`.${tab}`);
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

function withScheme(site: string): string {
  const raw = (site ?? "").trim();
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function isIp(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
}

/**
 * Gate for autofill (stricter than `matchesTab`). Fill only when:
 * - the page is https (http only on loopback hosts);
 * - the page host equals the credential host, or is a subdomain of it AND the
 *   credential host is a registrable domain or deeper (never a public suffix such as
 *   `github.io`, `vercel.app`, `co.uk`; private suffixes included);
 * - IP hosts match exactly only;
 * - when the credential specifies a port, the page port is identical.
 * A credential scoped to a subdomain never fills on its parent.
 */
export function shouldFill(credentialSite: string, pageUrl: string): boolean {
  const cred = siteHostname(credentialSite);
  const page = siteHostname(pageUrl);
  if (!cred || !page) return false;

  let pageU: URL;
  try {
    pageU = new URL(pageUrl);
  } catch {
    return false;
  }
  if (pageU.protocol !== "https:" && !(pageU.protocol === "http:" && LOOPBACK.has(pageU.hostname))) return false;

  let credPort = "";
  try {
    credPort = new URL(withScheme(credentialSite)).port;
  } catch {
    return false;
  }
  if (credPort && credPort !== pageU.port) return false;

  if (page === cred) return true;
  if (isIp(cred) || isIp(page)) return false;
  return page.endsWith(`.${cred}`) && getDomain(cred, { allowPrivateDomains: true }) !== null;
}
