import { describe, expect, it } from "vitest";
import { matchesTab, shouldFill, siteHostname } from "./match";

describe("siteHostname", () => {
  it("normalizes bare hosts and lower-cases", () => {
    expect(siteHostname("GitHub.com")).toBe("github.com");
  });
  it("strips scheme, path, port and www", () => {
    expect(siteHostname("https://github.com/login")).toBe("github.com");
    expect(siteHostname("github.com/path")).toBe("github.com");
    expect(siteHostname("http://www.Example.com:8080/a?b=1")).toBe("example.com");
  });
  it("returns empty string for empty/garbage", () => {
    expect(siteHostname("")).toBe("");
    expect(siteHostname("   ")).toBe("");
    expect(siteHostname("not a url !!")).toBe("");
  });
});

describe("matchesTab", () => {
  it("matches exact host", () => {
    expect(matchesTab("github.com", "https://github.com/login")).toBe(true);
  });
  it("matches www vs apex", () => {
    expect(matchesTab("www.github.com", "https://github.com/")).toBe(true);
    expect(matchesTab("github.com", "https://www.github.com/")).toBe(true);
  });
  it("matches subdomain vs apex both ways", () => {
    expect(matchesTab("example.com", "https://sub.example.com/")).toBe(true);
    expect(matchesTab("sub.example.com", "https://example.com/")).toBe(true);
  });
  it("rejects different domains and look-alike suffixes", () => {
    expect(matchesTab("github.com", "https://gitlab.com/")).toBe(false);
    expect(matchesTab("example.com", "https://evilexample.com/")).toBe(false);
  });
  it("rejects empty/garbage", () => {
    expect(matchesTab("", "https://github.com")).toBe(false);
    expect(matchesTab("github.com", "")).toBe(false);
    expect(matchesTab("github.com", "chrome://extensions")).toBe(false);
    expect(matchesTab("???", "###")).toBe(false);
  });
});

describe("shouldFill", () => {
  it("allows a matching origin and refuses a mismatched or invalid one", () => {
    expect(shouldFill("github.com", "https://github.com/login")).toBe(true);
    expect(shouldFill("github.com", "https://evil.example/login")).toBe(false);
    expect(shouldFill("github.com", "https://github.com.evil.example/")).toBe(false);
    expect(shouldFill("", "https://github.com/")).toBe(false);
  });

  it("allows a subdomain of the credential site but NOT the parent (no reverse)", () => {
    // A credential for github.com fills on its subdomains.
    expect(shouldFill("github.com", "https://gist.github.com/")).toBe(true);
    expect(shouldFill("github.com", "https://www.github.com/")).toBe(true);
    // A credential scoped to a subdomain must NOT fill on the broader parent domain.
    expect(shouldFill("sub.example.com", "https://example.com/")).toBe(false);
    expect(shouldFill("accounts.google.com", "https://google.com/")).toBe(false);
  });
});

describe("shouldFill (public-suffix aware)", () => {
  it("fills a registrable-domain credential on its subdomains", () => {
    expect(shouldFill("github.com", "https://gist.github.com")).toBe(true);
  });
  it("never fills for public-suffix credentials", () => {
    expect(shouldFill("github.io", "https://x.github.io")).toBe(false);
    expect(shouldFill("vercel.app", "https://foo.vercel.app")).toBe(false);
    expect(shouldFill("co.uk", "https://foo.co.uk")).toBe(false);
  });
  it("does not fill across sibling tenants of a public suffix", () => {
    expect(shouldFill("a.github.io", "https://b.github.io")).toBe(false);
    expect(shouldFill("a.github.io", "https://a.github.io")).toBe(true);
  });
  it("refuses http downgrade except on loopback", () => {
    expect(shouldFill("github.com", "http://github.com")).toBe(false);
    expect(shouldFill("localhost:3000", "http://localhost:3000")).toBe(true);
    expect(shouldFill("localhost", "http://127.0.0.1")).toBe(false);
    expect(shouldFill("127.0.0.1", "http://127.0.0.1")).toBe(true);
  });
  it("requires the port to match when the credential specifies one", () => {
    expect(shouldFill("localhost:3000", "http://localhost:4000")).toBe(false);
  });
  it("treats IP hosts as exact-only", () => {
    expect(shouldFill("1.2.3.4", "https://1.2.3.4")).toBe(true);
    expect(shouldFill("1.2.3.4", "https://5.1.2.3.4")).toBe(false);
  });
  it("rejects lookalikes and reverse subdomain", () => {
    expect(shouldFill("github.com", "https://github.com.evil.example")).toBe(false);
    expect(shouldFill("sub.example.com", "https://example.com")).toBe(false);
  });
  it("rejects non-http(s) pages", () => {
    expect(shouldFill("github.com", "ftp://github.com")).toBe(false);
    expect(shouldFill("github.com", "garbage")).toBe(false);
  });
});
