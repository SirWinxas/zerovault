import { VaultItemCard } from "../molecules/VaultItemCard";
import type { DecryptedVaultItem } from "../../vault/vault-entry";

interface VaultListProps {
  items: DecryptedVaultItem[];
  onEdit: (item: DecryptedVaultItem) => void;
  onDelete: (item: DecryptedVaultItem) => void;
}

export function VaultList({ items, onEdit, onDelete }: VaultListProps) {
  if (items.length === 0) {
    return (
      <p className="text-slate-400">Your vault is empty. Add your first item.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <VaultItemCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
