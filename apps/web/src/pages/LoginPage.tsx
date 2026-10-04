import { Link } from "react-router-dom";
import { AuthForm } from "../components/molecules/AuthForm";
import { useAuthSubmit } from "./use-auth-submit";
import { useSession } from "../session/SessionContext";

export default function LoginPage() {
  const { auth } = useSession();
  const { pending, error, submit } = useAuthSubmit(auth.login);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-4 text-white">
      <AuthForm
        title="Log in"
        submitLabel="Log in"
        pending={pending}
        error={error}
        onSubmit={submit}
      />
      <p className="text-sm text-slate-400">
        No account?{" "}
        <Link className="text-indigo-400 underline" to="/register">
          Register
        </Link>
      </p>
    </main>
  );
}
