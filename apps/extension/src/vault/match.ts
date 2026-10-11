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

/** Gate for autofill: the page the content script runs on must match the credential's site. */
export function shouldFill(credentialSite: string, pageUrl: string): boolean {
  return matchesTab(credentialSite, pageUrl);
}
