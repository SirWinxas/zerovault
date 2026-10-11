export const DEFAULT_CLIPBOARD_CLEAR_MS = 20_000;

/**
 * Copies `text`, then best-effort overwrites the clipboard with an empty
 * string after `clearAfterMs`. The clipboard cannot be read back, so this may
 * overwrite something the user copied in the meantime; failures are ignored.
 * Rejects if the initial write fails.
 */
export async function copyWithAutoClear(
  text: string,
  clearAfterMs: number = DEFAULT_CLIPBOARD_CLEAR_MS,
): Promise<void> {
  await navigator.clipboard.writeText(text);
  setTimeout(() => {
    void navigator.clipboard.writeText("").catch(() => {});
  }, clearAfterMs);
}
