import { describe, expect, it } from "vitest";
import { matchesTab, siteHostname } from "./match";

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
