import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "../session/SessionContext";
import { Button } from "../components/atoms/Button";
import { LockIcon } from "../components/atoms/Icons";
import { TextField } from "../components/atoms/TextField";
import { allTags, filterVaultItems } from "../vault/vault-filter";
import { VaultItemForm } from "../components/molecules/VaultItemForm";
import { VaultHealth } from "../components/organisms/VaultHealth";
import { VaultList } from "../components/organisms/VaultList";
import { createVaultService } from "../vault/vault-service";
import type { DecryptedVaultItem, VaultEntry } from "../vault/vault-entry";

type Editing =
  | { kind: "none" }
  | { kind: "new" }
  | { kind: "edit"; item: DecryptedVaultItem };

export default function VaultPage() {
  const { session, lock, api } = useSession();
  // The AES key comes only from the in-memory session; it is never persisted.
  const key = session?.encryptionKey ?? null;
  const vault = useMemo(() => createVaultService(api, () => key), [api, key]);

  const [items, setItems] = useState<DecryptedVaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>({ kind: "none" });

  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const tags = useMemo(() => allTags(items), [items]);
  // Drop any selected tag that no longer exists (e.g. its last item was deleted),
  // so a vanished chip cannot leave the list stuck on an invisible filter.
  const activeTags = useMemo(
    () => selectedTags.filter((t) => tags.includes(t)),
    [selectedTags, tags],
  );
  const visible = useMemo(
    () => filterVaultItems(items, { query, tags: activeTags }),
    [items, query, activeTags],
  );
  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const reload = useCallback(async () => {
    setError(null);
    try {
      setItems(await vault.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vault");
    } finally {
      setLoading(false);
    }
  }, [vault]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      setEditing({ kind: "none" });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed");
    }
  }

  const handleSubmit = (entry: VaultEntry) =>
    run(() =>
      editing.kind === "edit"
        ? vault.update(editing.item.id, entry)
        : vault.create(entry),
    );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-display uppercase text-5xl leading-[0.8]">
            Vault
          </h1>
          <p className="mt-2 truncate text-sm text-carbon/80">
            Signed in as {session?.email}
          </p>
        </div>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Lock vault"
          onClick={lock}
        >
          <LockIcon />
        </Button>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-[16px] border-2 border-carbon bg-ember px-4 py-3 font-semibold text-paper"
        >
          {error}
        </p>
      )}

      {!loading && <VaultHealth items={items} />}

      {editing.kind === "none" ? (
        <div>
          <Button variant="primary" onClick={() => setEditing({ kind: "new" })}>
            New item
          </Button>
        </div>
      ) : (
        <VaultItemForm
          key={editing.kind === "edit" ? editing.item.id : "new"}
          initial={editing.kind === "edit" ? editing.item : undefined}
          onSubmit={handleSubmit}
          onCancel={() => setEditing({ kind: "none" })}
        />
      )}

      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-2">
          <TextField
            label="Search vault"
            type="search"
            autoComplete="off"
            placeholder="Site, username or tag"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {tags.length > 0 && (
            <div
              role="group"
              aria-label="Filter by tag"
              className="flex flex-wrap gap-1.5"
            >
              {tags.map((tag) => {
                const on = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border-2 border-carbon px-3 py-1 text-xs font-semibold focus-visible:ring-4 focus-visible:ring-blue/50 outline-none ${
                      on ? "bg-carbon text-paper" : "bg-paper text-carbon"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-carbon/80">Loading...</p>
      ) : visible.length === 0 && items.length > 0 ? (
        <p role="status" className="text-carbon/80">
          No items match your search.
        </p>
      ) : (
        <VaultList
          items={visible}
          onEdit={(item) => setEditing({ kind: "edit", item })}
          onDelete={(item) => run(() => vault.remove(item.id))}
        />
      )}
    </main>
  );
}
