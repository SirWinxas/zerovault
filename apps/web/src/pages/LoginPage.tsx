import { Link, useSearchParams } from "react-router-dom";
import { AuthForm } from "../components/molecules/AuthForm";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../lib/demo";
import { useAuthSubmit } from "./use-auth-submit";
import { useSession } from "../session/SessionContext";

export default function LoginPage() {
  const { auth } = useSession();
  const { pending, error, submit } = useAuthSubmit(auth.login);
  const [params] = useSearchParams();
  const isDemo = params.has("demo");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-4">
      <h1 className="font-display uppercase text-5xl leading-[0.8] tracking-tight text-center">
        ZeroVault
      </h1>
      {isDemo && (
        <div className="w-full max-w-sm rounded-[16px] border-2 border-carbon bg-lavender px-3.5 py-3 text-[13px] font-medium">
          Demo account — just press Log in. Email: {DEMO_EMAIL} · Password:{" "}
          {DEMO_PASSWORD}
        </div>
      )}
      <AuthForm
        title="Log in"
        submitLabel="Log in"
        pending={pending}
        error={error}
        onSubmit={submit}
        initialEmail={isDemo ? DEMO_EMAIL : undefined}
        initialPassword={isDemo ? DEMO_PASSWORD : undefined}
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
