import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { TextField } from "../atoms/TextField";
import type { VaultEntry } from "../../vault/vault-entry";
import { parseTags } from "../../vault/vault-filter";
import { isValidBase32Secret, normalizeSecret } from "../../vault/totp";
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
    totp: initial.totp ?? "",
  });
  const [tagsText, setTagsText] = useState((initial.tags ?? []).join(", "));
  const [totpError, setTotpError] = useState<string | null>(null);
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
        className="accent-violet h-4 w-4"
        checked={genOpts[name]}
        onChange={(e) => setGenOpts((o) => ({ ...o, [name]: e.target.checked }))}
      />
      {text}
    </label>
  );

  const field = (name: keyof VaultEntry) => ({
    value: entry[name] ?? "",
    onChange: (e: { target: { value: string } }) =>
      setEntry((prev) => ({ ...prev, [name]: e.target.value })),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { totp: totpText = "", ...base } = entry;
    const tags = parseTags(tagsText);
    const normalized = normalizeSecret(totpText);
    if (normalized && !isValidBase32Secret(normalized)) {
      setTotpError("Invalid 2FA secret: use Base32 letters A-Z and digits 2-7");
      return;
    }
    setTotpError(null);
    setBusy(true);
    try {
      await onSubmit({
        ...base,
        ...(normalized ? { totp: normalized } : {}),
        ...(tags.length > 0 ? { tags } : {}),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-[20px] border-2 border-carbon bg-paper p-4"
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
      <div className="flex flex-col gap-2 rounded-[16px] border-2 border-carbon p-3 text-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-1">
            Length
            <input
              type="number"
              min={1}
              max={128}
              value={lengthText}
              onChange={(e) => setLengthText(e.target.value)}
              className="w-16 rounded-[10px] border-2 border-carbon bg-paper px-2 py-1"
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
            variant="secondary"
            size="sm"
            onClick={handleGenerate}
          >
            Generate
          </Button>
        </div>
        {genError && (
          <p role="alert" className="font-semibold text-ember">
            {genError}
          </p>
        )}
      </div>
      <TextField
        label="2FA secret (TOTP)"
        autoComplete="off"
        spellCheck={false}
        placeholder="Optional Base32 secret"
        {...field("totp")}
      />
      {totpError && (
        <p role="alert" className="font-semibold text-ember">
          {totpError}
        </p>
      )}
      <TextField
        label="Tags (comma-separated)"
        autoComplete="off"
        spellCheck={false}
        placeholder="e.g. work, finance"
        value={tagsText}
        onChange={(e) => setTagsText(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" disabled={busy}>
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
