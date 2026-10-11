import { useEffect, useState } from "react";
import { Button } from "../atoms/Button";
import {
  CopyIcon,
  EyeIcon,
  KeyIcon,
  PencilIcon,
  TrashIcon,
} from "../atoms/Icons";
import { copyWithAutoClear } from "../../lib/clipboard";
import type { DecryptedVaultItem } from "../../vault/vault-entry";
import { generateTotp, totpRemainingSeconds } from "../../vault/totp";

interface VaultItemCardProps {
  item: DecryptedVaultItem;
  onEdit: (item: DecryptedVaultItem) => void;
  onDelete: (item: DecryptedVaultItem) => void;
}

const CLEAR_MS = 20_000;
const TOTP_PERIOD_S = 30;
const cardClass =
  "flex flex-col gap-3 rounded-[20px] border-2 border-carbon bg-paper p-4 sm:flex-row sm:items-center sm:justify-between";

export function VaultItemCard({ item, onEdit, onDelete }: VaultItemCardProps) {
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(totpRemainingSeconds());
  const [totpInvalid, setTotpInvalid] = useState(false);
  const totpSecret = item.decryptError ? "" : (item.totp ?? "");

  useEffect(() => {
    if (!totpSecret) return;
    let cancelled = false;
    let lastCounter = -1;
    setCode(null);
    setTotpInvalid(false);

    function tick() {
      const now = Date.now();
      setRemaining(totpRemainingSeconds(now));
      const counter = Math.floor(now / 1000 / TOTP_PERIOD_S);
      if (counter === lastCounter) return;
      lastCounter = counter;
      generateTotp(totpSecret, { nowMs: now }).then(
        (c) => {
          if (cancelled) return;
          setCode(c);
          setTotpInvalid(false);
        },
        () => {
          if (cancelled) return;
          setCode(null);
          setTotpInvalid(true);
        },
      );
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [totpSecret]);

  if (item.decryptError) {
    return (
      <li className={cardClass}>
        <p role="status" className="min-w-0 font-semibold text-ember">
          ⚠ Unable to decrypt this item
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="danger"
            size="icon"
            aria-label="Delete"
            onClick={() => onDelete(item)}
          >
            <TrashIcon />
          </Button>
        </div>
      </li>
    );
  }

  async function copy(text: string, message: string) {
    try {
      await copyWithAutoClear(text, CLEAR_MS);
      setHint(message);
      setTimeout(() => setHint(null), CLEAR_MS);
    } catch {
      setHint("Copy failed");
    }
  }

  return (
    <li className={cardClass}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-[14px] border-2 border-carbon bg-sky">
          <KeyIcon />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-bold">{item.site}</p>
          <p className="truncate text-sm text-carbon/80">{item.username}</p>
          <p className="truncate font-mono text-sm text-carbon/80">
            {visible ? item.password : "••••••••"}
          </p>
          {totpSecret && (
            <div className="mt-1 flex items-center gap-2 text-sm">
              {totpInvalid ? (
                <p role="status" className="font-semibold text-ember">
                  Invalid 2FA secret
                </p>
              ) : (
                <>
                  <span
                    aria-label="2FA code"
                    className="font-mono text-base font-bold tracking-wider"
                  >
                    {code ? `${code.slice(0, 3)} ${code.slice(3)}` : "--- ---"}
                  </span>
                  <span className="text-xs text-carbon/80">{remaining}s</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Copy 2FA code"
                    disabled={!code}
                    onClick={() => code && copy(code, "2FA code copied")}
                  >
                    <CopyIcon />
                  </Button>
                </>
              )}
            </div>
          )}
          {hint && (
            <p
              role="status"
              className="mt-1 inline-flex items-center gap-2 rounded-full border-2 border-carbon bg-carbon px-3 py-1.5 text-xs font-semibold text-paper"
            >
              {hint}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          <EyeIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Copy username"
          onClick={() => copy(item.username, "Username copied")}
        >
          <CopyIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Copy password"
          onClick={() =>
            copy(
              item.password,
              `Password copied — clears in ${CLEAR_MS / 1000}s`,
            )
          }
        >
          <CopyIcon />
        </Button>
        <Button
          type="button"
          variant="highlight"
          size="icon"
          aria-label="Edit"
          onClick={() => onEdit(item)}
        >
          <PencilIcon />
        </Button>
        <Button
          type="button"
          variant="danger"
          size="icon"
          aria-label="Delete"
          onClick={() => onDelete(item)}
        >
          <TrashIcon />
        </Button>
      </div>
    </li>
  );
}
