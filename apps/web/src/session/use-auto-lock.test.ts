import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoLock } from "./use-auto-lock";

describe("useAutoLock", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("calls onLock once after the inactivity timeout", () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock(onLock, 1000));
    vi.advanceTimersByTime(999);
    expect(onLock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onLock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it.each(["keydown", "mousemove", "click", "scroll", "touchstart"])(
    "resets the timer on %s",
    (type) => {
      const onLock = vi.fn();
      renderHook(() => useAutoLock(onLock, 1000));
      vi.advanceTimersByTime(800);
      window.dispatchEvent(new Event(type));
      vi.advanceTimersByTime(800);
      expect(onLock).not.toHaveBeenCalled();
      vi.advanceTimersByTime(200);
      expect(onLock).toHaveBeenCalledTimes(1);
    },
  );

  it("clears timers and listeners on unmount", () => {
    const onLock = vi.fn();
    const { unmount } = renderHook(() => useAutoLock(onLock, 1000));
    unmount();
    window.dispatchEvent(new Event("keydown"));
    vi.advanceTimersByTime(5000);
    expect(onLock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("re-arms when timeoutMs changes and uses the latest onLock", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb, ms }) => useAutoLock(cb, ms), {
      initialProps: { cb: first, ms: 1000 },
    });
    rerender({ cb: second, ms: 3000 });
    vi.advanceTimersByTime(2999);
    expect(second).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});
