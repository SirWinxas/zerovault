export interface FieldInfo {
  type: string;
  name: string;
  id: string;
  autocomplete: string;
  placeholder: string;
  /** Rendered and not hidden. Absent = assumed visible (pure-heuristic callers). */
  visible?: boolean;
  /** Not disabled and not read-only. Absent = assumed enabled. */
  enabled?: boolean;
  /** Identity of the owning form (null/undefined = no form). */
  formId?: number | null;
}

/** True when an input can legitimately receive an autofilled value. */
export function isFillableField(f: FieldInfo): boolean {
  return f.type.toLowerCase() !== "hidden" && f.visible !== false && f.enabled !== false;
}

const HINT = /user|email|login/i;
const TEXT_LIKE = new Set(["text", "email", ""]);

/** Last (nearest to the password) index in `candidates` satisfying `pred`. */
function nearest(fields: FieldInfo[], end: number, pred: (f: FieldInfo) => boolean): number {
  for (let i = end - 1; i >= 0; i--) if (pred(fields[i])) return i;
  return -1;
}

/** Pure heuristic: locate the username and password inputs of a login form. */
export function pickLoginFields(
  fields: FieldInfo[],
): { usernameIndex: number; passwordIndex: number } | null {
  const passwordIndex = fields.findIndex((f) => f.type.toLowerCase() === "password");
  if (passwordIndex < 0) return null;

  const tiers: Array<(f: FieldInfo) => boolean> = [
    (f) => ["username", "email"].includes(f.autocomplete.toLowerCase().trim()),
    (f) => f.type.toLowerCase() === "email",
    (f) => TEXT_LIKE.has(f.type.toLowerCase()) && (HINT.test(f.name) || HINT.test(f.id) || HINT.test(f.placeholder)),
    (f) => TEXT_LIKE.has(f.type.toLowerCase()),
  ];
  for (const pred of tiers) {
    const sameForm = (f: FieldInfo) => (f.formId ?? null) === (fields[passwordIndex].formId ?? null);
    const usernameIndex = nearest(fields, passwordIndex, (f) => sameForm(f) && pred(f));
    if (usernameIndex >= 0) return { usernameIndex, passwordIndex };
  }
  return null;
}
