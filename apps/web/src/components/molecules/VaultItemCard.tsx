import { useState } from "react";
import { Button } from "../atoms/Button";
import {
  CopyIcon,
  EyeIcon,
  KeyIcon,
  PencilIcon,
  TrashIcon,
} from "../atoms/Icons";
import { copyWithAutoClear } from "../../lib/clipboard";
import type { DecryptedVaultItem } from "../../vault/vault-entry";

interface VaultItemCardProps {
  item: DecryptedVaultItem;
  onEdit: (item: DecryptedVaultItem) => void;
  onDelete: (item: DecryptedVaultItem) => void;
}

const CLEAR_MS = 20_000;
const cardClass =
  "flex flex-col gap-3 rounded-[20px] border-2 border-carbon bg-paper p-4 sm:flex-row sm:items-center sm:justify-between";

export function VaultItemCard({ item, onEdit, onDelete }: VaultItemCardProps) {
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  if (item.decryptError) {
    return (
      <li className={cardClass}>
        <p role="status" className="min-w-0 font-semibold text-ember">
          ⚠ Unable to decrypt this item
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="danger"
            size="icon"
            aria-label="Delete"
            onClick={() => onDelete(item)}
          >
            <TrashIcon />
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
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-[14px] border-2 border-carbon bg-sky">
          <KeyIcon />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-bold">{item.site}</p>
          <p className="truncate text-sm text-carbon/70">{item.username}</p>
          <p className="truncate font-mono text-sm text-carbon/60">
            {visible ? item.password : "••••••••"}
          </p>
          {hint && (
            <p
              role="status"
              className="mt-1 inline-flex items-center gap-2 rounded-full border-2 border-carbon bg-carbon px-3 py-1.5 text-xs font-semibold text-paper"
            >
              {hint}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          <EyeIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Copy username"
          onClick={() => copy(item.username, "Username copied")}
        >
          <CopyIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Copy password"
          onClick={() =>
            copy(
              item.password,
              `Password copied — clears in ${CLEAR_MS / 1000}s`,
            )
          }
        >
          <CopyIcon />
        </Button>
        <Button
          type="button"
          variant="highlight"
          size="icon"
          aria-label="Edit"
          onClick={() => onEdit(item)}
        >
          <PencilIcon />
        </Button>
        <Button
          type="button"
          variant="danger"
          size="icon"
          aria-label="Delete"
          onClick={() => onDelete(item)}
        >
          <TrashIcon />
        </Button>
      </div>
    </li>
  );
}
