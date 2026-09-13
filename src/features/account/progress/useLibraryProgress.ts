"use client";

/* Owner-bound Account v0 queue follows the proven Metaverse/PyGame
 * generation/ref pattern. Refs must update during render so stale A callbacks
 * never apply as B. Unrelated re-renders do not bump generation or abort
 * migrate.
 */
/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useIdentity } from "../identity/IdentityProvider";
import {
  guestBelongsToOtherLearner,
  guestRecordFromPayload,
  markGuestMigrated,
  readGuestProgress,
  writeGuestProgress,
} from "./guestStorage";
import {
  isMeaningfulProgress,
  normalizeLibraryProgress,
  payloadsEquivalent,
  payloadWithinPortalLimit,
  type MyCityLibraryProgressV1,
} from "./libraryPayload";
import { fetchProgress, migrateProgress, saveProgress } from "./progressClient";
import {
  shouldAbortInFlightOnIdentityTick,
  shouldSkipSaveForMonotonicCompletion,
} from "./progressOwner";
import { runRestoreSync, type ProgressUiStatus } from "./restoreSync";
import { createProgressSaveQueue, type ProgressSaveQueue } from "./saveQueue";
import { createProgressSaveScheduler, type ProgressSaveScheduler } from "./saveScheduler";

export type { ProgressUiStatus } from "./restoreSync";

export const SAVE_DEBOUNCE_MS = 400;

function rememberGuestAfterSave(payload: MyCityLibraryProgressV1, userId: string): void {
  const existing = readGuestProgress();
  if (!existing || existing.conflictKeptLocal) {
    return;
  }
  if (guestBelongsToOtherLearner(existing, userId)) {
    return;
  }
  writeGuestProgress(markGuestMigrated({ ...existing, payload }, userId));
}

/**
 * Account v0 progress lifecycle for the School Library mission.
 *
 * `payload` is the canonical source snapshot for the current render. The hook
 * restores (guest or Portal), migrates guest→account, and schedules saves keyed
 * on the payload fingerprint. `hydrate` applies a payload to the page and
 * `resetHost` clears A's state before B is hydrated.
 */
export function useLibraryProgress(
  payload: MyCityLibraryProgressV1,
  options: {
    hydrate: (payload: MyCityLibraryProgressV1) => void;
    resetHost: () => void;
  },
) {
  const { snapshot, status: identityStatus, origin } = useIdentity();
  const hydrateRef = useRef(options.hydrate);
  const resetHostRef = useRef(options.resetHost);
  hydrateRef.current = options.hydrate;
  resetHostRef.current = options.resetHost;

  const authenticated = snapshot.authenticated;
  const userId = snapshot.authenticated ? snapshot.userId : "";
  const originConfigured = Boolean(origin);
  const [uiStatus, setUiStatus] = useState<ProgressUiStatus>("idle");
  const [accountCompletionLocked, setAccountCompletionLocked] = useState(false);
  const revisionRef = useRef(0);
  const readyRef = useRef(false);
  const restoringRef = useRef(false);
  const lastPayloadRef = useRef<MyCityLibraryProgressV1 | null>(null);
  const retryRef = useRef<null | (() => Promise<void>)>(null);
  const ownerRef = useRef(userId);
  const previousUserIdRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const generationOwnerRef = useRef(userId);
  const schedulerRef = useRef<ProgressSaveScheduler | null>(null);
  const migrateAbortRef = useRef<AbortController | null>(null);
  const queueRef = useRef<ProgressSaveQueue | null>(null);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  ownerRef.current = userId;
  if (generationOwnerRef.current !== userId) {
    generationRef.current += 1;
    generationOwnerRef.current = userId;
  }
  const generation = generationRef.current;

  const hydrate = useCallback((next: MyCityLibraryProgressV1) => {
    restoringRef.current = true;
    const normalized = normalizeLibraryProgress(next);
    hydrateRef.current(normalized);
    lastPayloadRef.current = normalized;
    setAccountCompletionLocked(normalized.completed === true);
  }, []);

  const resetInMemoryProgress = useCallback(() => {
    revisionRef.current = 0;
    readyRef.current = false;
    restoringRef.current = true;
    lastPayloadRef.current = null;
    setAccountCompletionLocked(false);
    resetHostRef.current();
  }, []);

  const queue = useMemo(() => {
    const queueUserId = userId;
    const queueGeneration = generation;
    const current = () =>
      ownerRef.current === queueUserId && generationRef.current === queueGeneration;
    return createProgressSaveQueue({
      ownerUserId: queueUserId,
      origin,
      isCurrent: current,
      getRevision: () => revisionRef.current,
      setRevision: (revision) => {
        if (current()) {
          revisionRef.current = revision;
        }
      },
      getLastPayload: () => lastPayloadRef.current,
      setLastPayload: (nextPayload) => {
        if (current()) {
          lastPayloadRef.current = nextPayload;
        }
      },
      onSaving: () => {
        if (current()) {
          setUiStatus("saving");
        }
      },
      onSaved: () => {
        if (!current()) {
          return;
        }
        if (lastPayloadRef.current) {
          rememberGuestAfterSave(lastPayloadRef.current, queueUserId);
        }
        setUiStatus("saved");
      },
      onFailed: () => {
        if (current()) {
          setUiStatus("save_failed");
        }
      },
      onOwnerChanged: () => {
        if (current()) {
          setUiStatus("owner_changed");
        }
      },
      onConflict: (nextPayload) => {
        if (current()) {
          hydrate(nextPayload);
        }
      },
      save: (nextPayload, baseRevision, saveOrigin, init) => {
        if (!current()) {
          return Promise.resolve({ ok: false as const, status: 0, error: "owner_changed" });
        }
        return saveProgress(nextPayload, baseRevision, {
          expectedOwner: queueUserId,
          origin: saveOrigin,
          signal: init.signal,
        });
      },
    });
  }, [generation, hydrate, origin, userId]);

  /* Persistence scheduling is keyed on the canonical payload fingerprint, never
   * on render identity: typing in an unrelated field, hovering, or switching
   * language re-renders the page but must not re-arm, cancel, or duplicate a
   * pending save. The scheduler is bound to the owner-generation queue so a
   * genuine A→B change drops pending work.
   */
  const scheduler = useMemo(
    () =>
      createProgressSaveScheduler({
        debounceMs: SAVE_DEBOUNCE_MS,
        flush: (nextPayload) => {
          if (ownerRef.current !== queue.ownerUserId) {
            return;
          }
          retryRef.current = () => queue.retry();
          void queue.enqueue(nextPayload);
        },
      }),
    [queue],
  );
  schedulerRef.current = scheduler;

  useLayoutEffect(() => {
    return () => {
      scheduler.cancel();
    };
  }, [scheduler]);

  const retry = useCallback(() => {
    void retryRef.current?.();
  }, []);

  useLayoutEffect(() => {
    const previous = queueRef.current;
    if (previous && previous !== queue) {
      previous.invalidate();
    }
    queueRef.current = queue;
    return () => {
      queue.invalidate();
    };
  }, [queue]);

  useLayoutEffect(() => {
    if (!originConfigured || identityStatus !== "ready") {
      return;
    }
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = userId;
    schedulerRef.current?.cancel();
    if (
      shouldAbortInFlightOnIdentityTick({
        previousUserId,
        nextUserId: userId,
        authenticated,
      })
    ) {
      migrateAbortRef.current?.abort();
      migrateAbortRef.current = new AbortController();
      resetInMemoryProgress();
      setUiStatus("restoring");
    } else if (!migrateAbortRef.current || migrateAbortRef.current.signal.aborted) {
      migrateAbortRef.current = new AbortController();
    }
  }, [authenticated, identityStatus, originConfigured, resetInMemoryProgress, userId]);

  useEffect(() => {
    if (!originConfigured || identityStatus !== "ready") {
      return;
    }

    let cancelled = false;
    readyRef.current = false;
    restoringRef.current = true;
    setUiStatus("restoring");
    const syncOwner = userId;
    const syncGeneration = generationRef.current;

    function stillOwner(): boolean {
      return (
        !cancelled && ownerRef.current === syncOwner && generationRef.current === syncGeneration
      );
    }

    async function sync() {
      retryRef.current = sync;
      if (!migrateAbortRef.current || migrateAbortRef.current.signal.aborted) {
        migrateAbortRef.current = new AbortController();
      }
      const signal = migrateAbortRef.current.signal;
      await runRestoreSync(
        {
          authenticated,
          userId: syncOwner,
          stillOwner,
          readGuest: () => readGuestProgress(),
          writeGuest: (record) => {
            writeGuestProgress(record);
          },
          fetchRemote: () => fetchProgress(origin, fetch, signal),
          migrateRemote: (guestPayload, expectedOwner) =>
            migrateProgress(guestPayload, { expectedOwner, origin, signal }),
        },
        {
          hydrate,
          setStatus: (status) => {
            if (stillOwner()) {
              setUiStatus(status);
            }
          },
          setRevision: (revision) => {
            if (stillOwner()) {
              revisionRef.current = revision;
            }
          },
          adoptCurrentAsPersisted: () => {
            if (stillOwner()) {
              lastPayloadRef.current = payloadRef.current;
            }
          },
          markReady: () => {
            if (stillOwner()) {
              readyRef.current = true;
            }
          },
        },
      );
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [authenticated, hydrate, identityStatus, origin, originConfigured, userId]);

  useEffect(() => {
    if (!originConfigured || !readyRef.current || restoringRef.current) {
      return;
    }
    if (shouldSkipSaveForMonotonicCompletion(accountCompletionLocked, payload)) {
      return;
    }
    if (!payloadWithinPortalLimit(payload)) {
      return;
    }

    if (!authenticated) {
      if (lastPayloadRef.current && payloadsEquivalent(lastPayloadRef.current, payload)) {
        return;
      }
      if (!isMeaningfulProgress(payload)) {
        return;
      }
      const existing = readGuestProgress();
      writeGuestProgress({
        ...(existing ?? guestRecordFromPayload(payload)),
        payload,
        updatedAt: new Date().toISOString(),
      });
      lastPayloadRef.current = payload;
      setUiStatus("guest_retained");
      return;
    }

    if (identityStatus !== "ready" || !origin || !userId) {
      return;
    }

    scheduler.observe(payload, lastPayloadRef.current);
  }, [
    accountCompletionLocked,
    authenticated,
    identityStatus,
    origin,
    originConfigured,
    payload,
    scheduler,
    userId,
  ]);

  useEffect(() => {
    if (restoringRef.current) {
      restoringRef.current = false;
    }
  }, [payload]);

  return { uiStatus, retry, accountCompletionLocked };
}
