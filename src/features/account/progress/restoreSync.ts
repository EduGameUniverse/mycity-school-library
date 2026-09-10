import {
  guestBelongsToOtherLearner,
  markGuestConflict,
  markGuestMigrated,
  type GuestProgressRecord,
} from "./guestStorage";
import {
  emptyLibraryProgress,
  isMeaningfulProgress,
  payloadsEquivalent,
  type MyCityLibraryProgressV1,
} from "./libraryPayload";
import type { FetchProgressResult, MigrateProgressResult } from "./progressClient";

export type ProgressUiStatus =
  | "idle"
  | "restoring"
  | "saving"
  | "saved"
  | "save_failed"
  | "migrating"
  | "migrated"
  | "migration_failed"
  | "conflict_kept_local"
  | "guest_retained"
  | "owner_changed";

export type RestoreSyncOutcome =
  | "cancelled"
  | "guest_restored"
  | "guest_idle"
  | "read_failed"
  | "guest_foreign"
  | "migrated_equivalent"
  | "conflict_kept_local"
  | "migrated"
  | "migration_failed"
  | "migration_aborted"
  | "server_restored"
  | "empty";

export type RestoreSyncDeps = {
  authenticated: boolean;
  userId: string;
  /** False once the owner/generation that started this sync is gone. */
  stillOwner: () => boolean;
  readGuest: () => GuestProgressRecord | null;
  writeGuest: (record: GuestProgressRecord) => void;
  fetchRemote: () => Promise<FetchProgressResult>;
  migrateRemote: (
    payload: MyCityLibraryProgressV1,
    expectedOwner: string,
  ) => Promise<MigrateProgressResult>;
};

export type RestoreSyncEffects = {
  hydrate: (payload: MyCityLibraryProgressV1) => void;
  setStatus: (status: ProgressUiStatus) => void;
  setRevision: (revision: number) => void;
  /** Guest with nothing stored: the current in-memory payload is the baseline. */
  adoptCurrentAsPersisted: () => void;
  markReady: () => void;
};

/**
 * Restore + guest→account migration decision procedure.
 *
 * Rules (Account v0):
 * - signed-out: hydrate meaningful guest progress; never call the Portal
 * - authenticated: GET first; an existing server row always wins
 * - eligible guest + no server row → insert-only migrate bound to the owner
 * - guest already migrated to another learner is never attached to this one
 * - every step re-checks `stillOwner()` so an A→B change discards A's work
 */
export async function runRestoreSync(
  deps: RestoreSyncDeps,
  effects: RestoreSyncEffects,
): Promise<RestoreSyncOutcome> {
  const guest = deps.readGuest();

  if (!deps.authenticated) {
    if (!deps.stillOwner()) {
      return "cancelled";
    }
    if (guest && isMeaningfulProgress(guest.payload)) {
      effects.hydrate(guest.payload);
      effects.setStatus("guest_retained");
      effects.markReady();
      return "guest_restored";
    }
    effects.adoptCurrentAsPersisted();
    effects.setStatus("idle");
    effects.markReady();
    return "guest_idle";
  }

  const remote = await deps.fetchRemote();
  if (!deps.stillOwner()) {
    return "cancelled";
  }

  if (!remote.ok) {
    if (
      guest &&
      isMeaningfulProgress(guest.payload) &&
      !guestBelongsToOtherLearner(guest, deps.userId)
    ) {
      effects.hydrate(guest.payload);
    } else {
      effects.hydrate(emptyLibraryProgress());
    }
    effects.setStatus("save_failed");
    effects.markReady();
    return "read_failed";
  }

  const server = remote.record;

  if (guestBelongsToOtherLearner(guest, deps.userId)) {
    if (server) {
      effects.setRevision(server.revision);
      effects.hydrate(server.payload);
      effects.setStatus("saved");
    } else {
      effects.setRevision(0);
      effects.hydrate(emptyLibraryProgress());
      effects.setStatus("idle");
    }
    effects.markReady();
    return "guest_foreign";
  }

  const guestEligible = Boolean(
    guest && isMeaningfulProgress(guest.payload) && !guest.migratedToUserId,
  );

  if (guest && guestEligible) {
    if (server) {
      if (payloadsEquivalent(server.payload, guest.payload)) {
        deps.writeGuest(markGuestMigrated(guest, deps.userId));
        effects.setRevision(server.revision);
        effects.hydrate(server.payload);
        effects.setStatus("migrated");
        effects.markReady();
        return "migrated_equivalent";
      }
      deps.writeGuest(markGuestConflict(guest));
      effects.setRevision(server.revision);
      effects.hydrate(server.payload);
      effects.setStatus("conflict_kept_local");
      effects.markReady();
      return "conflict_kept_local";
    }

    effects.setStatus("migrating");
    if (!deps.stillOwner()) {
      return "cancelled";
    }
    const migrated = await deps.migrateRemote(guest.payload, deps.userId);
    if (!deps.stillOwner()) {
      return "cancelled";
    }
    if (!migrated.ok) {
      if (migrated.error === "aborted") {
        return "migration_aborted";
      }
      effects.setStatus("migration_failed");
      effects.markReady();
      return "migration_failed";
    }
    deps.writeGuest(markGuestMigrated(guest, deps.userId));
    effects.setRevision(migrated.record.revision);
    effects.hydrate(migrated.record.payload);
    effects.setStatus("migrated");
    effects.markReady();
    return "migrated";
  }

  if (server) {
    effects.setRevision(server.revision);
    effects.hydrate(server.payload);
    effects.setStatus("saved");
    effects.markReady();
    return "server_restored";
  }

  effects.setRevision(0);
  effects.hydrate(emptyLibraryProgress());
  effects.setStatus("idle");
  effects.markReady();
  return "empty";
}
