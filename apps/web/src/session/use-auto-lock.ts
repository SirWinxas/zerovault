import { useEffect, useRef } from "react";

export const DEFAULT_AUTO_LOCK_MS = 5 * 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
] as const;

/** Calls `onLock` after `timeoutMs` without user activity on the window. */
export function useAutoLock(
  onLock: () => void,
  timeoutMs: number = DEFAULT_AUTO_LOCK_MS,
): void {
  const onLockRef = useRef(onLock);
  useEffect(() => {
    onLockRef.current = onLock;
  }, [onLock]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onLockRef.current(), timeoutMs);
    };
    arm();
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, arm, { passive: true });
    }
    return () => {
      clearTimeout(timer);
      for (const ev of ACTIVITY_EVENTS) window.removeEventListener(ev, arm);
    };
  }, [timeoutMs]);
}
