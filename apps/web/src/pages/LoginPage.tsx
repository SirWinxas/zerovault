import { Link } from "react-router-dom";
import { AuthForm } from "../components/molecules/AuthForm";
import { useAuthSubmit } from "./use-auth-submit";
import { useSession } from "../session/SessionContext";

export default function LoginPage() {
  const { auth } = useSession();
  const { pending, error, submit } = useAuthSubmit(auth.login);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-4">
      <h1 className="font-display uppercase text-5xl leading-[0.8] tracking-tight text-center">
        ZeroVault
      </h1>
      <AuthForm
        title="Log in"
        submitLabel="Log in"
        pending={pending}
        error={error}
        onSubmit={submit}
      />
      <p className="text-sm text-carbon/80">
        No account?{" "}
        <Link className="font-bold underline underline-offset-2" to="/register">
          Register
        </Link>
      </p>
    </main>
  );
}
