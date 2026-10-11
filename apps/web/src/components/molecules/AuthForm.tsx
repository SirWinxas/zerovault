import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { LockIcon } from "../atoms/Icons";
import { TextField } from "../atoms/TextField";

interface AuthFormProps {
  title: string;
  submitLabel: string;
  pending: boolean;
  error: string | null;
  onSubmit: (email: string, masterPassword: string) => void;
}

/** Presentational email + master password form. */
export function AuthForm({
  title,
  submitLabel,
  pending,
  error,
  onSubmit,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && (
        <p role="alert" className="text-sm font-semibold text-ember">
          {error}
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
