import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PROGRESS_OWNER_HEADER } from "./ids";
import {
  guestRecordFromPayload,
  markGuestMigrated,
  readGuestProgress,
  writeGuestProgress,
  type GuestProgressRecord,
} from "./guestStorage";
import {
  emptyLibraryProgress,
  payloadsEquivalent,
  type MyCityLibraryProgressV1,
} from "./libraryPayload";
import { fetchProgress, migrateProgress, type ProgressRecord } from "./progressClient";
import { runRestoreSync, type ProgressUiStatus, type RestoreSyncDeps } from "./restoreSync";
import {
  completedLibraryPayload,
  jsonResponse,
  memoryStorage,
  midMissionPayload,
  recordFor,
} from "./testing/fixtures";

const ORIGIN = "http://portal.test";

type Call = { url: string; method: string; owner: string | null; body: Record<string, unknown> | null };

/**
 * Minimal in-memory Portal double: GET/POST/migrate for one learner, using the
 * real progress client so headers and bodies are the ones production sends.
 */
function fakePortal(initialRows: Record<string, ProgressRecord | undefined> = {}) {
  const rows = new Map<string, ProgressRecord>();
  for (const [userId, record] of Object.entries(initialRows)) {
    if (record) {
      rows.set(userId, record);
    }
  }
  const calls: Call[] = [];
  let sessionUser = "learner-a";
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null;
    calls.push({
      url,
      method: init?.method ?? "GET",
      owner: headers.get(PROGRESS_OWNER_HEADER),
      body,
    });
    if (url.includes("/api/progress/migrate")) {
      if (headers.get(PROGRESS_OWNER_HEADER) !== sessionUser) {
        return jsonResponse({ error: "owner_changed" }, 409);
      }
      const existing = rows.get(sessionUser);
      if (existing) {
        return jsonResponse({ record: existing, migrated: false, conflict: true }, 200);
      }
      const record = recordFor(sessionUser, 1, body?.payload as MyCityLibraryProgressV1);
      rows.set(sessionUser, record);
      return jsonResponse({ record, migrated: true, conflict: false }, 201);
    }
    if (url.includes("/api/progress")) {
      return jsonResponse({ record: rows.get(sessionUser) ?? null });
    }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
  return {
    calls,
    rows,
    fetchImpl,
    setSession(userId: string) {
      sessionUser = userId;
    },
  };
}

function harness(options: {
  authenticated: boolean;
  userId: string;
  portal: ReturnType<typeof fakePortal>;
  storage: ReturnType<typeof memoryStorage>;
  stillOwner?: () => boolean;
  fetchRemote?: RestoreSyncDeps["fetchRemote"];
}) {
  const statuses: ProgressUiStatus[] = [];
  const hydrated: MyCityLibraryProgressV1[] = [];
  let revision = -1;
  let ready = false;
  let adopted = false;
  const deps: RestoreSyncDeps = {
    authenticated: options.authenticated,
    userId: options.userId,
    stillOwner: options.stillOwner ?? (() => true),
    readGuest: () => readGuestProgress(options.storage),
    writeGuest: (record) => {
      writeGuestProgress(record, options.storage);
    },
    fetchRemote: options.fetchRemote ?? (() => fetchProgress(ORIGIN, options.portal.fetchImpl)),
    migrateRemote: (payload, expectedOwner) =>
      migrateProgress(payload, { expectedOwner, origin: ORIGIN, fetchImpl: options.portal.fetchImpl }),
  };
  const run = () =>
    runRestoreSync(deps, {
      hydrate: (payload) => hydrated.push(payload),
      setStatus: (status) => statuses.push(status),
      setRevision: (value) => {
        revision = value;
      },
      adoptCurrentAsPersisted: () => {
        adopted = true;
      },
      markReady: () => {
        ready = true;
      },
    });
  return {
    run,
    statuses,
    hydrated,
    get revision() {
      return revision;
    },
    get ready() {
      return ready;
    },
    get adopted() {
      return adopted;
    },
  };
}

function guestWith(payload: MyCityLibraryProgressV1): GuestProgressRecord {
  return guestRecordFromPayload(payload);
}

describe("restore sync — guest", () => {
  it("signed-out learner with meaningful guest progress is restored without any Portal call", async () => {
    const portal = fakePortal();
    const storage = memoryStorage();
    writeGuestProgress(guestWith(midMissionPayload()), storage);
    const h = harness({ authenticated: false, userId: "", portal, storage });
    assert.equal(await h.run(), "guest_restored");
    assert.equal(portal.calls.length, 0);
    assert.equal(h.hydrated.length, 1);
    assert.equal(h.hydrated[0].geometry.area, "216");
    assert.deepEqual(h.statuses, ["guest_retained"]);
    assert.equal(h.ready, true);
  });

  it("signed-out learner with no guest data starts idle and never writes guest storage", async () => {
    const portal = fakePortal();
    const storage = memoryStorage();
    const h = harness({ authenticated: false, userId: "", portal, storage });
    assert.equal(await h.run(), "guest_idle");
    assert.equal(h.hydrated.length, 0);
    assert.equal(h.adopted, true);
    assert.deepEqual(Object.keys(storage.dump()), []);
    assert.deepEqual(h.statuses, ["idle"]);
  });
});

describe("restore sync — guest→account migration", () => {
  it("migrates eligible guest progress when the account has no row, bound to the owner", async () => {
    const portal = fakePortal();
    const storage = memoryStorage();
    writeGuestProgress(guestWith(midMissionPayload()), storage);
    const h = harness({ authenticated: true, userId: "learner-a", portal, storage });

    assert.equal(await h.run(), "migrated");
    const migrate = portal.calls.find((call) => call.url.endsWith("/api/progress/migrate"));
    assert.ok(migrate);
    assert.equal(migrate.owner, "learner-a");
    assert.equal(migrate.body?.userId, undefined);
    assert.equal(migrate.body?.moduleKey, "mycity");
    assert.equal(portal.rows.get("learner-a")?.revision, 1);
    assert.equal(h.revision, 1);
    assert.equal(payloadsEquivalent(h.hydrated[0], midMissionPayload()), true);
    assert.equal(readGuestProgress(storage)?.migratedToUserId, "learner-a");
    assert.deepEqual(h.statuses, ["migrating", "migrated"]);
  });

  it("does not migrate twice: a marked guest is not re-sent and the server row is restored", async () => {
    const portal = fakePortal();
    const storage = memoryStorage();
    writeGuestProgress(guestWith(midMissionPayload()), storage);
    const first = harness({ authenticated: true, userId: "learner-a", portal, storage });
    await first.run();
    const migrateCalls = () =>
      portal.calls.filter((call) => call.url.endsWith("/api/progress/migrate")).length;
    assert.equal(migrateCalls(), 1);

    const second = harness({ authenticated: true, userId: "learner-a", portal, storage });
    assert.equal(await second.run(), "server_restored");
    assert.equal(migrateCalls(), 1);
    assert.equal(second.revision, 1);
    assert.deepEqual(second.statuses, ["saved"]);
  });

  it("a duplicate migrate answered as conflict by the Portal is still one row and treated as migrated", async () => {
    const portal = fakePortal();
    const storage = memoryStorage();
    writeGuestProgress(guestWith(midMissionPayload()), storage);
    const h = harness({
      authenticated: true,
      userId: "learner-a",
      portal,
      storage,
      // Simulate a GET that raced ahead of a previous successful insert: no row visible yet.
      fetchRemote: async () => ({ ok: true, record: null }),
    });
    portal.rows.set("learner-a", recordFor("learner-a", 1, midMissionPayload()));
    assert.equal(await h.run(), "migrated");
    assert.equal(portal.rows.size, 1);
    assert.equal(h.revision, 1);
    assert.equal(readGuestProgress(storage)?.migratedToUserId, "learner-a");
  });

  it("existing server row wins: different guest progress is kept locally, never merged", async () => {
    const portal = fakePortal({
      "learner-a": recordFor("learner-a", 5, completedLibraryPayload()),
    });
    const storage = memoryStorage();
    writeGuestProgress(guestWith(midMissionPayload()), storage);
    const h = harness({ authenticated: true, userId: "learner-a", portal, storage });

    assert.equal(await h.run(), "conflict_kept_local");
    assert.equal(portal.calls.some((call) => call.url.endsWith("/api/progress/migrate")), false);
    assert.equal(h.revision, 5);
    assert.equal(h.hydrated[0].completed, true);
    const guest = readGuestProgress(storage);
    assert.equal(guest?.conflictKeptLocal, true);
    assert.equal(guest?.migratedToUserId, undefined);
    assert.equal(payloadsEquivalent(guest!.payload, midMissionPayload()), true);
    assert.deepEqual(h.statuses, ["conflict_kept_local"]);
  });

  it("equivalent guest and server payloads are marked migrated without a migrate call", async () => {
    const portal = fakePortal({
      "learner-a": recordFor("learner-a", 2, midMissionPayload()),
    });
    const storage = memoryStorage();
    writeGuestProgress(guestWith(midMissionPayload()), storage);
    const h = harness({ authenticated: true, userId: "learner-a", portal, storage });
    assert.equal(await h.run(), "migrated_equivalent");
    assert.equal(portal.calls.some((call) => call.url.endsWith("/api/progress/migrate")), false);
    assert.equal(readGuestProgress(storage)?.migratedToUserId, "learner-a");
    assert.equal(h.revision, 2);
  });

  it("untouched guest state is never migrated", async () => {
    const portal = fakePortal();
    const storage = memoryStorage();
    writeGuestProgress(guestWith(emptyLibraryProgress()), storage);
    const h = harness({ authenticated: true, userId: "learner-a", portal, storage });
    assert.equal(await h.run(), "empty");
    assert.equal(portal.calls.some((call) => call.url.endsWith("/api/progress/migrate")), false);
    assert.equal(h.revision, 0);
  });
});

describe("restore sync — owner isolation (A→B)", () => {
  it("a guest already migrated to A is never attached to B; B starts from B's own row", async () => {
    const portal = fakePortal();
    const storage = memoryStorage();
    writeGuestProgress(markGuestMigrated(guestWith(midMissionPayload()), "learner-a"), storage);
    portal.setSession("learner-b");
    const h = harness({ authenticated: true, userId: "learner-b", portal, storage });

    assert.equal(await h.run(), "guest_foreign");
    assert.equal(portal.calls.some((call) => call.url.endsWith("/api/progress/migrate")), false);
    assert.equal(h.hydrated.length, 1);
    assert.equal(payloadsEquivalent(h.hydrated[0], emptyLibraryProgress()), true);
    assert.equal(h.revision, 0);
    assert.equal(readGuestProgress(storage)?.migratedToUserId, "learner-a");
  });

  it("B sees B's server row, not A's", async () => {
    const aRow = recordFor("learner-a", 3, completedLibraryPayload());
    const bRow = recordFor("learner-b", 1, midMissionPayload());
    const portal = fakePortal({ "learner-a": aRow, "learner-b": bRow });
    portal.setSession("learner-b");
    const h = harness({
      authenticated: true,
      userId: "learner-b",
      portal,
      storage: memoryStorage(),
    });
    assert.equal(await h.run(), "server_restored");
    assert.equal(h.hydrated[0].completed, false);
    assert.equal(h.revision, 1);
  });

  it("an owner change while the GET is in flight discards A's result entirely", async () => {
    const portal = fakePortal({
      "learner-a": recordFor("learner-a", 3, completedLibraryPayload()),
    });
    let owner = "learner-a";
    const h = harness({
      authenticated: true,
      userId: "learner-a",
      portal,
      storage: memoryStorage(),
      stillOwner: () => owner === "learner-a",
      fetchRemote: async () => {
        owner = "learner-b"; // identity ticked to B before the response is applied
        return fetchProgress(ORIGIN, portal.fetchImpl);
      },
    });
    assert.equal(await h.run(), "cancelled");
    assert.equal(h.hydrated.length, 0);
    assert.equal(h.statuses.length, 0);
    assert.equal(h.ready, false);
  });

  it("an owner change during migrate never hydrates A's guest payload as B", async () => {
    const portal = fakePortal();
    const storage = memoryStorage();
    writeGuestProgress(guestWith(midMissionPayload()), storage);
    let owner = "learner-a";
    const h = harness({
      authenticated: true,
      userId: "learner-a",
      portal,
      storage,
      stillOwner: () => owner === "learner-a",
      fetchRemote: async () => {
        const result = await fetchProgress(ORIGIN, portal.fetchImpl);
        queueMicrotask(() => {
          owner = "learner-b";
        });
        return result;
      },
    });
    const outcome = await h.run();
    assert.equal(outcome, "cancelled");
    assert.equal(h.hydrated.length, 0);
    assert.equal(readGuestProgress(storage)?.migratedToUserId, undefined);
  });
});

describe("restore sync — failures", () => {
  it("keeps guest progress locally when the Portal read fails and offers retry", async () => {
    const portal = fakePortal();
    const storage = memoryStorage();
    writeGuestProgress(guestWith(midMissionPayload()), storage);
    const h = harness({
      authenticated: true,
      userId: "learner-a",
      portal,
      storage,
      fetchRemote: async () => ({ ok: false, status: 0, error: "network_failed" }),
    });
    assert.equal(await h.run(), "read_failed");
    assert.equal(payloadsEquivalent(h.hydrated[0], midMissionPayload()), true);
    assert.deepEqual(h.statuses, ["save_failed"]);
    assert.equal(readGuestProgress(storage)?.migratedToUserId, undefined);
  });

  it("a failed migrate keeps the guest record unmarked for retry", async () => {
    const storage = memoryStorage();
    writeGuestProgress(guestWith(midMissionPayload()), storage);
    const failing = fakePortal();
    const h = harness({
      authenticated: true,
      userId: "learner-a",
      portal: failing,
      storage,
      fetchRemote: async () => ({ ok: true, record: null }),
    });
    failing.setSession("learner-z"); // Portal session no longer matches the queue owner
    assert.equal(await h.run(), "migration_failed");
    assert.deepEqual(h.statuses, ["migrating", "migration_failed"]);
    assert.equal(readGuestProgress(storage)?.migratedToUserId, undefined);
    assert.equal(h.hydrated.length, 0);
  });
});
