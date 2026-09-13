import { payloadFingerprint, type MyCityLibraryProgressV1 } from "./libraryPayload";

/**
 * Debounced persistence scheduling keyed on the canonical payload fingerprint.
 *
 * The mission page re-renders constantly (typing, hover, preview polygons,
 * language switches) and hands the progress hook a fresh payload object each
 * time. The scheduler never trusts object identity: it compares fingerprints
 * and touches the timer only when persistable content actually changes.
 *
 * - equivalent to the last persisted payload → nothing to do (a moot pending
 *   write is cancelled)
 * - same fingerprint as the already-scheduled change → leave the timer alone
 * - different fingerprint → coalesce: re-arm one timer for the latest content
 */
export type SaveSchedulerDecision = "unchanged" | "pending" | "scheduled";

export type ProgressSaveSchedulerOptions = {
  debounceMs: number;
  flush: (payload: MyCityLibraryProgressV1) => void;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
};

export type ProgressSaveScheduler = {
  observe(
    payload: MyCityLibraryProgressV1,
    lastPersisted: MyCityLibraryProgressV1 | null,
  ): SaveSchedulerDecision;
  cancel(): void;
  hasPending(): boolean;
};

const defaultSetTimer = (callback: () => void, ms: number): unknown =>
  globalThis.setTimeout(callback, ms);
const defaultClearTimer = (handle: unknown): void => {
  globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>);
};

export function createProgressSaveScheduler(
  options: ProgressSaveSchedulerOptions,
): ProgressSaveScheduler {
  const setTimer = options.setTimer ?? defaultSetTimer;
  const clearTimer = options.clearTimer ?? defaultClearTimer;

  let timer: unknown = null;
  let pendingFingerprint: string | null = null;
  let pendingPayload: MyCityLibraryProgressV1 | null = null;
  let cachedLastRef: MyCityLibraryProgressV1 | null = null;
  let cachedLastFingerprint: string | null = null;

  function lastFingerprint(last: MyCityLibraryProgressV1 | null): string | null {
    if (!last) {
      return null;
    }
    if (last !== cachedLastRef) {
      cachedLastRef = last;
      cachedLastFingerprint = payloadFingerprint(last);
    }
    return cachedLastFingerprint;
  }

  function reset(): void {
    timer = null;
    pendingFingerprint = null;
    pendingPayload = null;
  }

  function cancel(): void {
    if (timer !== null) {
      clearTimer(timer);
    }
    reset();
  }

  function fire(): void {
    const payload = pendingPayload;
    reset();
    if (payload) {
      options.flush(payload);
    }
  }

  return {
    observe(payload, lastPersisted) {
      const fingerprint = payloadFingerprint(payload);
      if (lastFingerprint(lastPersisted) === fingerprint) {
        if (timer !== null) {
          cancel();
        }
        return "unchanged";
      }
      if (pendingFingerprint === fingerprint) {
        return "pending";
      }
      if (timer !== null) {
        clearTimer(timer);
      }
      pendingFingerprint = fingerprint;
      pendingPayload = payload;
      timer = setTimer(fire, options.debounceMs);
      return "scheduled";
    },
    cancel,
    hasPending() {
      return timer !== null;
    },
  };
}
