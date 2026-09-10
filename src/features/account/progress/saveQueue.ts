import {
  normalizeLibraryProgress,
  payloadsEquivalent,
  type MyCityLibraryProgressV1,
} from "./libraryPayload";
import { saveProgress, type SaveProgressResult } from "./progressClient";

/**
 * Owner-bound, serialized save queue.
 *
 * - one in-flight POST at a time; newer payloads wait and reuse the updated
 *   `baseRevision` (no same-tab duplicate-revision races)
 * - a 409 `revision_conflict` hydrates the server record instead of
 *   last-write-wins
 * - `owner_changed` / abort discards queued work; the queue is bound to the
 *   learner UUID it was created for and is invalidated on identity change
 */
export function createProgressSaveQueue(options: {
  ownerUserId: string;
  isCurrent?: () => boolean;
  origin?: string;
  getRevision: () => number;
  setRevision: (revision: number) => void;
  getLastPayload: () => MyCityLibraryProgressV1 | null;
  setLastPayload: (payload: MyCityLibraryProgressV1) => void;
  onSaving: () => void;
  onSaved: () => void;
  onFailed: () => void;
  onConflict: (payload: MyCityLibraryProgressV1) => void;
  onOwnerChanged?: () => void;
  save?: (
    payload: MyCityLibraryProgressV1,
    baseRevision: number,
    origin: string | undefined,
    init: { expectedOwner: string; signal: AbortSignal },
  ) => Promise<SaveProgressResult>;
}) {
  let alive = true;
  let inFlight = false;
  let queued: MyCityLibraryProgressV1 | null = null;
  const abort = new AbortController();
  const ownerUserId = options.ownerUserId;
  const isCurrent = options.isCurrent ?? (() => true);
  const save =
    options.save ??
    ((payload, baseRevision, origin, init) =>
      saveProgress(payload, baseRevision, {
        expectedOwner: ownerUserId,
        origin,
        signal: init.signal,
      }));

  function active(): boolean {
    return alive && isCurrent();
  }

  function discardQueued(): void {
    queued = null;
  }

  function invalidate(): void {
    alive = false;
    discardQueued();
    abort.abort();
  }

  async function drain(): Promise<void> {
    if (inFlight) {
      return;
    }
    if (!active()) {
      discardQueued();
      return;
    }
    inFlight = true;
    try {
      while (queued) {
        if (!active()) {
          discardQueued();
          return;
        }
        const payload = queued;
        queued = null;
        const last = options.getLastPayload();
        if (last && payloadsEquivalent(last, payload)) {
          continue;
        }
        options.onSaving();
        const result = await save(payload, options.getRevision(), options.origin, {
          expectedOwner: ownerUserId,
          signal: abort.signal,
        });
        if (!active()) {
          return;
        }
        if (!result.ok && (result.error === "owner_changed" || result.error === "aborted")) {
          discardQueued();
          if (result.error === "owner_changed") {
            options.onOwnerChanged?.();
          }
          return;
        }
        if (result.ok) {
          options.setRevision(result.record.revision);
          options.setLastPayload(normalizeLibraryProgress(result.record.payload));
          options.onSaved();
          continue;
        }
        if (result.record) {
          options.setRevision(result.record.revision);
          options.setLastPayload(normalizeLibraryProgress(result.record.payload));
          options.onConflict(result.record.payload);
          if (!queued) {
            options.onSaved();
          }
          continue;
        }
        queued = queued ?? payload;
        options.onFailed();
        return;
      }
    } finally {
      inFlight = false;
    }
  }

  return {
    ownerUserId,
    enqueue(payload: MyCityLibraryProgressV1): Promise<void> {
      if (!active()) {
        return Promise.resolve();
      }
      queued = payload;
      return drain();
    },
    retry(): Promise<void> {
      if (!active()) {
        return Promise.resolve();
      }
      return drain();
    },
    invalidate,
  };
}

export type ProgressSaveQueue = ReturnType<typeof createProgressSaveQueue>;
