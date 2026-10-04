import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
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
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-slate-800/60 p-6 shadow-lg"
    >
      <h1 className="text-2xl font-bold">{title}</h1>
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
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Working…" : submitLabel}
      </Button>
    </form>
  );
}
