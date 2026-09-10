import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GUEST_PROGRESS_STORAGE_KEY,
  guestBelongsToOtherLearner,
  guestRecordFromPayload,
  markGuestConflict,
  markGuestMigrated,
  parseGuestProgressRecord,
  readGuestProgress,
  writeGuestProgress,
} from "./guestStorage";
import { emptyLibraryProgress, isMeaningfulProgress, payloadsEquivalent } from "./libraryPayload";
import { completedLibraryPayload, memoryStorage, midMissionPayload } from "./testing/fixtures";

describe("guest progress storage", () => {
  it("persists meaningful guest progress under the frozen key and wrapper schema", () => {
    const storage = memoryStorage();
    const payload = midMissionPayload();
    assert.equal(isMeaningfulProgress(payload), true);
    assert.equal(writeGuestProgress(guestRecordFromPayload(payload), storage), true);

    const raw = storage.getItem(GUEST_PROGRESS_STORAGE_KEY);
    assert.ok(raw);
    const wrapper = JSON.parse(raw) as Record<string, unknown>;
    assert.equal(wrapper.schema, "edugame.guest-progress.v0");
    assert.equal(wrapper.moduleKey, "mycity");
    assert.equal(wrapper.activityKey, "bem-mission-01-school-library");
    assert.equal(wrapper.stateVersion, 1);
    assert.equal("userId" in wrapper, false);
    assert.equal(Object.keys(storage.dump()).length, 1);
  });

  it("restores the same source state after a simulated refresh", () => {
    const storage = memoryStorage();
    const payload = completedLibraryPayload();
    writeGuestProgress(guestRecordFromPayload(payload), storage);
    const restored = readGuestProgress(storage);
    assert.ok(restored);
    assert.equal(payloadsEquivalent(restored.payload, payload), true);
    assert.equal(restored.payload.geometry.area, "216");
    assert.equal(restored.payload.compact.form.bPrimeX, "17");
    assert.equal(restored.payload.reportAnswers.arabic.readingSupport.length > 10, true);
    assert.equal(restored.payload.completed, true);
  });

  it("does not treat the untouched initial state as guest data", () => {
    assert.equal(isMeaningfulProgress(emptyLibraryProgress()), false);
  });

  it("rejects malformed, foreign or oversized guest records instead of hydrating them", () => {
    const good = guestRecordFromPayload(midMissionPayload());
    assert.ok(parseGuestProgressRecord(JSON.parse(JSON.stringify(good))));
    assert.equal(parseGuestProgressRecord({ ...good, schema: "other" }), null);
    assert.equal(parseGuestProgressRecord({ ...good, moduleKey: "talk2ai" }), null);
    assert.equal(
      parseGuestProgressRecord({ ...good, activityKey: "bac-mission-01-trigonometry-tower" }),
      null,
    );
    assert.equal(parseGuestProgressRecord({ ...good, stateVersion: 2 }), null);
    assert.equal(parseGuestProgressRecord({ ...good, updatedAt: 1 }), null);
    assert.equal(
      parseGuestProgressRecord({ ...good, payload: { ...good.payload, userId: "x" } }),
      null,
    );
    assert.equal(parseGuestProgressRecord({ ...good, payload: "corrupted" }), null);

    const storage = memoryStorage({ [GUEST_PROGRESS_STORAGE_KEY]: "{not json" });
    assert.equal(readGuestProgress(storage), null);
    const throwing = {
      getItem() {
        throw new Error("blocked");
      },
    };
    assert.equal(readGuestProgress(throwing), null);
    assert.equal(
      writeGuestProgress(good, {
        setItem() {
          throw new Error("quota");
        },
      }),
      false,
    );
  });

  it("marks migration/conflict and never attaches an A-migrated guest to B", () => {
    const migrated = markGuestMigrated(guestRecordFromPayload(midMissionPayload()), "learner-a");
    assert.equal(migrated.migratedToUserId, "learner-a");
    assert.equal(migrated.conflictKeptLocal, false);
    assert.equal(guestBelongsToOtherLearner(migrated, "learner-a"), false);
    assert.equal(guestBelongsToOtherLearner(migrated, "learner-b"), true);
    assert.equal(guestBelongsToOtherLearner(null, "learner-b"), false);
    const conflict = markGuestConflict(guestRecordFromPayload(midMissionPayload()));
    assert.equal(conflict.conflictKeptLocal, true);
    assert.equal(conflict.migratedToUserId, undefined);
  });
});
