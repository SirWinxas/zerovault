import { describe, expect, it } from "vitest";
import { allTags, filterVaultItems, parseTags } from "./vault-filter";
import type { DecryptedVaultItem } from "./vault-entry";

const github: DecryptedVaultItem = {
  id: "1",
  site: "GitHub.com",
  username: "alice",
  password: "p1",
  tags: ["work", "dev"],
};
const bank: DecryptedVaultItem = {
  id: "2",
  site: "mybank.test",
  username: "bob@example.com",
  password: "p2",
  tags: ["finance"],
};
const plain: DecryptedVaultItem = {
  id: "3",
  site: "news.test",
  username: "carol",
  password: "p3",
};
const broken: DecryptedVaultItem = {
  id: "4",
  site: "",
  username: "",
  password: "",
  decryptError: true,
};
const items = [github, bank, plain, broken];

describe("parseTags", () => {
  it("trims, drops empties, lower-cases and de-duplicates in first-seen order", () => {
    expect(parseTags(" Work, dev ,, WORK,Finance ,  ")).toEqual([
      "work",
      "dev",
      "finance",
    ]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseTags("  , ,")).toEqual([]);
    expect(parseTags("")).toEqual([]);
  });
});

describe("allTags", () => {
  it("returns unique tags sorted ascending", () => {
    const more = { ...plain, id: "5", tags: ["dev", "alpha"] };
    expect(allTags([...items, more])).toEqual(["alpha", "dev", "finance", "work"]);
  });

  it("is empty when no item has tags", () => {
    expect(allTags([plain, broken])).toEqual([]);
  });
});

describe("filterVaultItems", () => {
  it("returns all items for an empty query and no tags", () => {
    expect(filterVaultItems(items, {})).toEqual(items);
    expect(filterVaultItems(items, { query: "", tags: [] })).toEqual(items);
  });

  it("matches the query against site, username and tags", () => {
    expect(filterVaultItems(items, { query: "github" })).toEqual([github]);
    expect(filterVaultItems(items, { query: "bob@" })).toEqual([bank]);
    expect(filterVaultItems(items, { query: "finan" })).toEqual([bank]);
  });

  it("is case-insensitive", () => {
    expect(filterVaultItems(items, { query: "GITHUB" })).toEqual([github]);
    expect(filterVaultItems(items, { query: "WoRk" })).toEqual([github]);
  });

  it("requires every selected tag (AND)", () => {
    expect(filterVaultItems(items, { tags: ["work"] })).toEqual([github]);
    expect(filterVaultItems(items, { tags: ["work", "dev"] })).toEqual([github]);
    expect(filterVaultItems(items, { tags: ["work", "finance"] })).toEqual([]);
  });

  it("matches selected tags case-insensitively", () => {
    expect(filterVaultItems(items, { tags: ["WORK"] })).toEqual([github]);
    expect(filterVaultItems(items, { tags: ["Work", "DEV"] })).toEqual([github]);
  });

  it("combines query and tags (both must match)", () => {
    expect(filterVaultItems(items, { query: "alice", tags: ["work"] })).toEqual([github]);
    expect(filterVaultItems(items, { query: "bob", tags: ["work"] })).toEqual([]);
  });

  it("handles decryptError items without crashing and excludes them on a query", () => {
    expect(filterVaultItems([broken], { query: "x" })).toEqual([]);
    expect(filterVaultItems([broken], { tags: ["work"] })).toEqual([]);
    expect(filterVaultItems([broken], {})).toEqual([broken]);
  });
});
