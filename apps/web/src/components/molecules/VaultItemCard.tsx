import { useState } from "react";
import { Button } from "../atoms/Button";
import { copyWithAutoClear } from "../../lib/clipboard";
import type { DecryptedVaultItem } from "../../vault/vault-entry";

interface VaultItemCardProps {
  item: DecryptedVaultItem;
  onEdit: (item: DecryptedVaultItem) => void;
  onDelete: (item: DecryptedVaultItem) => void;
}

const CLEAR_MS = 20_000;
const secondary = "bg-slate-600 hover:bg-slate-500";
const cardClass =
  "flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-800/60 p-4 sm:flex-row sm:items-center sm:justify-between";

export function VaultItemCard({ item, onEdit, onDelete }: VaultItemCardProps) {
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  if (item.decryptError) {
    return (
      <li className={cardClass}>
        <p role="status" className="min-w-0 text-amber-300">
          ⚠ Unable to decrypt this item
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => onDelete(item)}
            className="bg-red-600 hover:bg-red-500"
          >
            Delete
          </Button>
        </div>
      </li>
    );
  }

  async function copy(text: string, message: string) {
    try {
      await copyWithAutoClear(text, CLEAR_MS);
      setHint(message);
      setTimeout(() => setHint(null), CLEAR_MS);
    } catch {
      setHint("Copy failed");
    }
  }

  return (
    <li className={cardClass}>
      <div className="min-w-0">
        <p className="truncate font-semibold">{item.site}</p>
        <p className="truncate text-sm text-slate-300">{item.username}</p>
        <p className="truncate font-mono text-sm text-slate-400">
          {visible ? item.password : "••••••••"}
        </p>
        {hint && (
          <p role="status" className="text-xs text-emerald-300">
            {hint}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={secondary}
        >
          {visible ? "Hide" : "Show"}
        </Button>
        <Button
          type="button"
          onClick={() => copy(item.username, "Username copied")}
          className={secondary}
        >
          Copy username
        </Button>
        <Button
          type="button"
          onClick={() =>
            copy(
              item.password,
              `Password copied — clears in ${CLEAR_MS / 1000}s`,
            )
          }
          className={secondary}
        >
          Copy password
        </Button>
        <Button type="button" onClick={() => onEdit(item)}>
          Edit
        </Button>
        <Button
          type="button"
          onClick={() => onDelete(item)}
          className="bg-red-600 hover:bg-red-500"
        >
          Delete
        </Button>
      </div>
    </li>
  );
}
