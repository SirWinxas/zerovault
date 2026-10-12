import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api-client";

// Never confirm whether an email exists (account-enumeration neutral).
const REGISTER_FAILED =
  "Could not complete registration. If you already have an account, log in.";

/** Container logic shared by Login/Register: run action, surface error, navigate. */
export function useAuthSubmit(
  action: (email: string, masterPassword: string) => Promise<void>,
) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(email: string, masterPassword: string) {
    setPending(true);
    setError(null);
    try {
      await action(email, masterPassword);
      navigate("/vault");
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 401
            ? "Invalid email or master password."
            : e.status === 409
              ? REGISTER_FAILED
              : `Request failed (${e.status}).`
          : "Something went wrong. Please try again.",
      );
      setPending(false);
    }
  }

  return { pending, error, submit };
}
