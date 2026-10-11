import type { DecryptedVaultItem } from "./vault-entry";

export interface VaultFilterCriteria {
  query?: string;
  tags?: string[];
}

/** Split a comma-separated string into trimmed, lower-cased, unique tags (first-seen order). */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  for (const part of input.split(",")) {
    const tag = part.trim().toLowerCase();
    if (tag) seen.add(tag);
  }
  return [...seen];
}

/** Unique tags across all items, sorted ascending. */
export function allTags(items: DecryptedVaultItem[]): string[] {
  const set = new Set<string>();
  for (const item of items) for (const tag of item.tags ?? []) set.add(tag);
  return [...set].sort();
}

/** Client-side filter: text query (site/username/tags) AND every selected tag. */
export function filterVaultItems(
  items: DecryptedVaultItem[],
  { query = "", tags = [] }: VaultFilterCriteria,
): DecryptedVaultItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    const itemTags = item.tags ?? [];
    if (!tags.every((t) => itemTags.includes(t))) return false;
    if (!q) return true;
    return (
      item.site.toLowerCase().includes(q) ||
      item.username.toLowerCase().includes(q) ||
      itemTags.some((t) => t.toLowerCase().includes(q))
    );
  });
}
