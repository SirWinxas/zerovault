import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { LockIcon } from "../atoms/Icons";
import { TextField } from "../atoms/TextField";
import { isWeak } from "../../vault/health";

interface AuthFormProps {
  title: string;
  submitLabel: string;
  pending: boolean;
  error: string | null;
  onSubmit: (email: string, masterPassword: string) => void;
  initialEmail?: string;
  initialPassword?: string;
  /** "register" adds a confirm field and blocks weak/mismatched passwords. */
  mode?: "login" | "register";
}

/** Presentational email + master password form. */
export function AuthForm({
  title,
  submitLabel,
  pending,
  error,
  onSubmit,
  initialEmail = "",
  initialPassword = "",
  mode = "login",
}: AuthFormProps) {
  const isRegister = mode === "register";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isRegister) {
      if (password !== confirm) {
        setLocalError("Master passwords do not match.");
        return;
      }
      if (isWeak(password)) {
        setLocalError(
          "Master password is too weak. Use at least 12 characters with a mix of letters, numbers and symbols.",
        );
        return;
      }
    }
    setLocalError(null);
    onSubmit(email, password);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-[36px] border-2 border-carbon bg-paper p-6"
    >
      <h2 className="font-display uppercase text-4xl leading-none">{title}</h2>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Master password"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {isRegister && (
        <TextField
          label="Confirm master password"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      )}
      {(localError ?? error) && (
        <p role="alert" className="text-sm font-semibold text-ember">
          {localError ?? error}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={pending}
      >
        {pending ? "Working…" : submitLabel}
      </Button>
      <div className="flex items-center gap-2.5 rounded-[20px] border-2 border-carbon bg-lavender px-3.5 py-3 text-[13px] font-medium">
        <LockIcon />
        <span>
          Your master password never leaves your browser. Lose it and the vault
          is gone.
        </span>
      </div>
    </form>
  );
}
