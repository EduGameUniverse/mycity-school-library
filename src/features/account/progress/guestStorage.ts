import {
  GUEST_PROGRESS_SCHEMA,
  GUEST_PROGRESS_STORAGE_KEY,
  PROGRESS_ACTIVITY_KEY,
  PROGRESS_MODULE_KEY,
  PROGRESS_STATE_VERSION,
} from "./ids";
import { parseLibraryProgressV1, type MyCityLibraryProgressV1 } from "./libraryPayload";

export { GUEST_PROGRESS_STORAGE_KEY };

/**
 * Guest (signed-out) progress lives only in this device's localStorage under
 * the frozen key, wrapped in the shared `edugame.guest-progress.v0` envelope.
 * No guest UUID exists and nothing is sent to the Portal while signed out.
 */
export type GuestProgressRecord = {
  schema: typeof GUEST_PROGRESS_SCHEMA;
  moduleKey: typeof PROGRESS_MODULE_KEY;
  activityKey: typeof PROGRESS_ACTIVITY_KEY;
  stateVersion: typeof PROGRESS_STATE_VERSION;
  payload: MyCityLibraryProgressV1;
  updatedAt: string;
  migratedToUserId?: string;
  conflictKeptLocal?: boolean;
};

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;
type RemovableStorage = Pick<Storage, "removeItem">;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function defaultStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** Strict envelope + payload validation; anything malformed is treated as absent. */
export function parseGuestProgressRecord(value: unknown): GuestProgressRecord | null {
  if (!isObject(value)) {
    return null;
  }
  if (value.schema !== GUEST_PROGRESS_SCHEMA) {
    return null;
  }
  if (value.moduleKey !== PROGRESS_MODULE_KEY || value.activityKey !== PROGRESS_ACTIVITY_KEY) {
    return null;
  }
  if (value.stateVersion !== PROGRESS_STATE_VERSION) {
    return null;
  }
  if (!isObject(value.payload) || typeof value.updatedAt !== "string") {
    return null;
  }
  const payload = parseLibraryProgressV1(value.payload);
  if (!payload) {
    return null;
  }
  return {
    schema: GUEST_PROGRESS_SCHEMA,
    moduleKey: PROGRESS_MODULE_KEY,
    activityKey: PROGRESS_ACTIVITY_KEY,
    stateVersion: PROGRESS_STATE_VERSION,
    payload,
    updatedAt: value.updatedAt,
    migratedToUserId:
      typeof value.migratedToUserId === "string" && value.migratedToUserId.length > 0
        ? value.migratedToUserId
        : undefined,
    conflictKeptLocal: value.conflictKeptLocal === true,
  };
}

export function readGuestProgress(
  storage: ReadableStorage | null = defaultStorage(),
): GuestProgressRecord | null {
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(GUEST_PROGRESS_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return parseGuestProgressRecord(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function writeGuestProgress(
  record: GuestProgressRecord,
  storage: WritableStorage | null = defaultStorage(),
): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(GUEST_PROGRESS_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    // Private mode / quota errors must never break play.
    return false;
  }
}

export function clearGuestProgress(
  storage: RemovableStorage | null = defaultStorage(),
): void {
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(GUEST_PROGRESS_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function markGuestMigrated(
  record: GuestProgressRecord,
  userId: string,
): GuestProgressRecord {
  return {
    ...record,
    migratedToUserId: userId,
    conflictKeptLocal: false,
    updatedAt: new Date().toISOString(),
  };
}

export function markGuestConflict(record: GuestProgressRecord): GuestProgressRecord {
  return {
    ...record,
    conflictKeptLocal: true,
    updatedAt: new Date().toISOString(),
  };
}

export function guestBelongsToOtherLearner(
  guest: GuestProgressRecord | null | undefined,
  userId: string,
): boolean {
  return Boolean(guest?.migratedToUserId && guest.migratedToUserId !== userId);
}

export function guestRecordFromPayload(payload: MyCityLibraryProgressV1): GuestProgressRecord {
  return {
    schema: GUEST_PROGRESS_SCHEMA,
    moduleKey: PROGRESS_MODULE_KEY,
    activityKey: PROGRESS_ACTIVITY_KEY,
    stateVersion: PROGRESS_STATE_VERSION,
    payload,
    updatedAt: new Date().toISOString(),
  };
}
