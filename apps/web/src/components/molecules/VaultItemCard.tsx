import { useState } from "react";
import { Button } from "../atoms/Button";
import type { DecryptedVaultItem } from "../../vault/vault-entry";

interface VaultItemCardProps {
  item: DecryptedVaultItem;
  onEdit: (item: DecryptedVaultItem) => void;
  onDelete: (item: DecryptedVaultItem) => void;
}

export function VaultItemCard({ item, onEdit, onDelete }: VaultItemCardProps) {
  const [visible, setVisible] = useState(false);
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-800/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold">{item.site}</p>
        <p className="truncate text-sm text-slate-300">{item.username}</p>
        <p className="truncate font-mono text-sm text-slate-400">
          {visible ? item.password : "••••••••"}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="bg-slate-600 hover:bg-slate-500"
        >
          {visible ? "Hide" : "Show"}
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
