export interface FieldInfo {
  type: string;
  name: string;
  id: string;
  autocomplete: string;
  placeholder: string;
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
    const usernameIndex = nearest(fields, passwordIndex, pred);
    if (usernameIndex >= 0) return { usernameIndex, passwordIndex };
  }
  return null;
}
