import { LockIcon } from "../atoms/Icons";
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
      <div className="flex flex-col items-center gap-3 rounded-[20px] border-2 border-dashed border-carbon p-8 text-center">
        <LockIcon size={40} />
        <p className="font-bold">Nothing here yet.</p>
        <p className="text-sm text-carbon/80">
          Add your first credential and it is encrypted before it leaves this
          device.
        </p>
      </div>
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
