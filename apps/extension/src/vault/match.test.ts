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
