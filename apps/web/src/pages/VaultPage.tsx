import { useSession } from "../session/SessionContext";
import { Button } from "../components/atoms/Button";

export default function VaultPage() {
  const { session, lock } = useSession();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 p-4 text-white">
      <h1 className="text-2xl font-bold">Vault — coming soon</h1>
      <p className="text-slate-300">Signed in as {session?.email}</p>
      <Button onClick={lock}>Lock</Button>
    </main>
  );
}
