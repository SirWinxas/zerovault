// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyWithAutoClear } from "./clipboard";

describe("copyWithAutoClear", () => {
  const writeText = vi.fn<(t: string) => Promise<void>>();
  beforeEach(() => {
    vi.useFakeTimers();
    writeText.mockReset().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("writes the text, then clears it after the delay", async () => {
    await copyWithAutoClear("secret", 1000);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenLastCalledWith("secret");

    await vi.advanceTimersByTimeAsync(999);
    expect(writeText).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(writeText).toHaveBeenLastCalledWith("");
  });

  it("swallows errors from the clearing write", async () => {
    await copyWithAutoClear("secret", 10);
    writeText.mockRejectedValueOnce(new Error("denied"));
    await expect(vi.advanceTimersByTimeAsync(10)).resolves.not.toThrow();
  });

  it("propagates errors from the initial write", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    await expect(copyWithAutoClear("x", 10)).rejects.toThrow("denied");
  });

  it("a second copy cancels the first timer so it is not cleared early", async () => {
    await copyWithAutoClear("A"); // default 20s, t=0
    await vi.advanceTimersByTimeAsync(15_000);
    await copyWithAutoClear("B"); // t=15s
    await vi.advanceTimersByTimeAsync(5_000); // t=20s: A's timer would fire here
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(writeText).toHaveBeenLastCalledWith("B");
    await vi.advanceTimersByTimeAsync(15_000); // t=35s
    expect(writeText).toHaveBeenCalledTimes(3);
    expect(writeText).toHaveBeenLastCalledWith("");
  });
});
