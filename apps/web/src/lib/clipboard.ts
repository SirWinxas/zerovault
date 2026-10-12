export const DEFAULT_CLIPBOARD_CLEAR_MS = 20_000;

// One pending clear at a time: a newer copy supersedes the previous timer so
// an earlier copy can never wipe a later one.
let clearTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Copies `text`, then best-effort overwrites the clipboard with an empty
 * string after `clearAfterMs`. The clipboard cannot be read back, so this may
 * overwrite something the user copied in the meantime; failures are ignored.
 */
export async function copyWithAutoClear(
  text: string,
  clearAfterMs: number = DEFAULT_CLIPBOARD_CLEAR_MS,
): Promise<void> {
  await navigator.clipboard.writeText(text);
  clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    clearTimer = undefined;
    void navigator.clipboard.writeText("").catch(() => {});
  }, clearAfterMs);
}
