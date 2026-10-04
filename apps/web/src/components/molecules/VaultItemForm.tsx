import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { TextField } from "../atoms/TextField";
import type { VaultEntry } from "../../vault/vault-entry";

interface VaultItemFormProps {
  initial?: VaultEntry;
  submitLabel?: string;
  onSubmit: (entry: VaultEntry) => void | Promise<void>;
  onCancel: () => void;
}

const EMPTY: VaultEntry = { site: "", username: "", password: "" };

export function VaultItemForm({
  initial = EMPTY,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: VaultItemFormProps) {
  const [entry, setEntry] = useState<VaultEntry>({
    site: initial.site,
    username: initial.username,
    password: initial.password,
  });
  const [busy, setBusy] = useState(false);

  const field = (name: keyof VaultEntry) => ({
    value: entry[name],
    onChange: (e: { target: { value: string } }) =>
      setEntry((prev) => ({ ...prev, [name]: e.target.value })),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(entry);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-800/60 p-4"
    >
      <TextField label="Site" required {...field("site")} />
      <TextField label="Username" required {...field("username")} />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        {...field("password")}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {submitLabel}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          className="bg-slate-600 hover:bg-slate-500"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
