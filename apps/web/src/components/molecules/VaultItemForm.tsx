import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { TextField } from "../atoms/TextField";
import type { VaultEntry } from "../../vault/vault-entry";
import {
  DEFAULT_PASSWORD_OPTIONS,
  generatePassword,
  type PasswordOptions,
} from "../../vault/password-generator";

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
  const [genOpts, setGenOpts] = useState<PasswordOptions>(
    DEFAULT_PASSWORD_OPTIONS,
  );
  const [lengthText, setLengthText] = useState(
    String(DEFAULT_PASSWORD_OPTIONS.length),
  );
  const [genError, setGenError] = useState<string | null>(null);

  function handleGenerate() {
    try {
      const password = generatePassword({
        ...genOpts,
        length: Number.parseInt(lengthText, 10),
      });
      setEntry((prev) => ({ ...prev, password }));
      setGenError(null);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Could not generate");
    }
  }

  const toggle = (name: "lowercase" | "uppercase" | "digits" | "symbols", text: string) => (
    <label className="flex items-center gap-1">
      <input
        type="checkbox"
        checked={genOpts[name]}
        onChange={(e) => setGenOpts((o) => ({ ...o, [name]: e.target.checked }))}
      />
      {text}
    </label>
  );

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
      <div className="flex flex-col gap-2 rounded-md border border-slate-700 p-3 text-sm text-slate-300">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-1">
            Length
            <input
              type="number"
              min={1}
              max={128}
              value={lengthText}
              onChange={(e) => setLengthText(e.target.value)}
              className="w-16 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-white"
            />
          </label>
          {toggle("lowercase", "a-z")}
          {toggle("uppercase", "A-Z")}
          {toggle("digits", "0-9")}
          {toggle("symbols", "Symbols")}
        </div>
        <div>
          <Button
            type="button"
            onClick={handleGenerate}
            className="bg-slate-600 hover:bg-slate-500"
          >
            Generate
          </Button>
        </div>
        {genError && (
          <p role="alert" className="text-red-300">
            {genError}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
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
