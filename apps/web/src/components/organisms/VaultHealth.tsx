import { analyzeVaultHealth } from "../../vault/health";
import type { DecryptedVaultItem } from "../../vault/vault-entry";

interface VaultHealthProps {
  items: DecryptedVaultItem[];
}

const chipClass =
  "inline-flex items-center gap-2 rounded-full border-2 border-carbon px-3 py-1 text-sm font-semibold";

export function VaultHealth({ items }: VaultHealthProps) {
  const { items: analyzed, summary } = analyzeVaultHealth(items);
  if (summary.total === 0 && summary.unreadable === 0) return null;

  const flagged = analyzed.filter((i) => i.weak || i.reused);

  return (
    <section
      aria-labelledby="vault-health-title"
      className="flex flex-col gap-3 rounded-[20px] border-2 border-carbon bg-paper p-4"
    >
      <h2
        id="vault-health-title"
        className="font-display uppercase text-2xl leading-none"
      >
        Vault health
      </h2>
      <ul className="flex flex-wrap gap-2">
        <li className={`${chipClass} ${summary.weak > 0 ? "bg-ember" : ""}`}>
          Weak: {summary.weak}
        </li>
        <li className={`${chipClass} ${summary.reused > 0 ? "bg-ember" : ""}`}>
          Reused: {summary.reused}
        </li>
        <li className={`${chipClass} bg-mint`}>Okay: {summary.okay}</li>
      </ul>
      {summary.unreadable > 0 && (
        <p className="text-sm text-carbon/80">
          {summary.unreadable} item{summary.unreadable === 1 ? "" : "s"} could
          not be analyzed.
        </p>
      )}
      {flagged.length > 0 && (
        <ul aria-label="Items needing attention" className="flex flex-col gap-2">
          {flagged.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-2 rounded-[14px] border-2 border-carbon bg-sky px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-bold">{i.site}</p>
                <p className="truncate text-sm text-carbon/80">{i.username}</p>
              </div>
              <p className="flex-none text-sm font-semibold text-ember">
                {[i.weak && "Weak", i.reused && "Reused"]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
