import { Link } from "react-router-dom";
import { AuthForm } from "../components/molecules/AuthForm";
import { useAuthSubmit } from "./use-auth-submit";
import { useSession } from "../session/SessionContext";

export default function RegisterPage() {
  const { auth } = useSession();
  const { pending, error, submit } = useAuthSubmit(auth.register);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-4">
      <h1 className="font-display uppercase text-5xl leading-[0.8] tracking-tight text-center">
        ZeroVault
      </h1>
      <AuthForm
        title="Create account"
        submitLabel="Register"
        pending={pending}
        error={error}
        onSubmit={submit}
      />
      <p className="text-sm text-carbon/70">
        Already registered?{" "}
        <Link className="font-bold underline underline-offset-2" to="/login">
          Log in
        </Link>
      </p>
    </main>
  );
}
