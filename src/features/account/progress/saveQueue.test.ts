import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MyCityLibraryProgressV1 } from "./libraryPayload";
import { createProgressSaveQueue } from "./saveQueue";
import { midMissionPayload, recordFor } from "./testing/fixtures";

function payloadWithArea(area: string): MyCityLibraryProgressV1 {
  return { ...midMissionPayload(), geometry: { area, perimeter: "60" } };
}

async function waitUntil(fn: () => void, timeoutMs = 1000): Promise<void> {
  const started = Date.now();
  let lastError: unknown;
  while (Date.now() - started < timeoutMs) {
    try {
      fn();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  throw lastError;
}

describe("progress save queue", () => {
  it("serializes overlapping enqueues so the latest payload uses the new revision", async () => {
    const calls: number[] = [];
    let revision = 0;
    const persisted: { last: MyCityLibraryProgressV1 | null } = { last: null };
    const queue = createProgressSaveQueue({
      ownerUserId: "learner-a",
      getRevision: () => revision,
      setRevision: (value) => {
        revision = value;
      },
      getLastPayload: () => persisted.last,
      setLastPayload: (value) => {
        persisted.last = value;
      },
      onSaving: () => undefined,
      onSaved: () => undefined,
      onFailed: () => undefined,
      onConflict: () => undefined,
      save: async (next, baseRevision) => {
        calls.push(baseRevision);
        return { ok: true as const, record: recordFor("learner-a", baseRevision + 1, next) };
      },
    });

    await Promise.all([queue.enqueue(payloadWithArea("1")), queue.enqueue(payloadWithArea("2"))]);
    assert.deepEqual(calls, [0, 1]);
    assert.equal(revision, 2);
    assert.equal(persisted.last?.geometry.area, "2");
  });

  it("skips a write whose content equals the last persisted payload", async () => {
    let saves = 0;
    const persisted = payloadWithArea("216");
    const queue = createProgressSaveQueue({
      ownerUserId: "learner-a",
      getRevision: () => 3,
      setRevision: () => undefined,
      getLastPayload: () => persisted,
      setLastPayload: () => undefined,
      onSaving: () => undefined,
      onSaved: () => undefined,
      onFailed: () => undefined,
      onConflict: () => undefined,
      save: async (next) => {
        saves += 1;
        return { ok: true as const, record: recordFor("learner-a", 4, next) };
      },
    });
    await queue.enqueue(JSON.parse(JSON.stringify(persisted)) as MyCityLibraryProgressV1);
    assert.equal(saves, 0);
  });

  it("does not dispatch a queued A payload after identity becomes B", async () => {
    let owner = "learner-a";
    const posted: Array<{ expectedOwner: string; area: string }> = [];
    let releaseFirst: () => void = () => undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let firstStarted = false;
    const queue = createProgressSaveQueue({
      ownerUserId: "learner-a",
      isCurrent: () => owner === "learner-a",
      getRevision: () => 0,
      setRevision: () => undefined,
      getLastPayload: () => null,
      setLastPayload: () => undefined,
      onSaving: () => undefined,
      onSaved: () => undefined,
      onFailed: () => undefined,
      onConflict: () => undefined,
      save: async (next, _revision, _origin, init) => {
        posted.push({ expectedOwner: init.expectedOwner, area: next.geometry.area });
        if (!firstStarted) {
          firstStarted = true;
          await firstGate;
        }
        return { ok: true as const, record: recordFor("learner-a", 1, next) };
      },
    });

    const first = queue.enqueue(payloadWithArea("1"));
    await waitUntil(() => assert.equal(posted.length, 1));
    void queue.enqueue(payloadWithArea("2"));
    owner = "learner-b";
    queue.invalidate();
    releaseFirst();
    await first;
    await Promise.resolve();

    assert.equal(posted.length, 1);
    assert.equal(posted[0].expectedOwner, "learner-a");
    assert.equal(posted.some((post) => post.area === "2"), false);
    await queue.enqueue(payloadWithArea("3"));
    assert.equal(posted.length, 1);
  });

  it("hydrates the server record on stale revision conflict instead of overwriting", async () => {
    const server = payloadWithArea("999");
    const conflicts: MyCityLibraryProgressV1[] = [];
    let revision = 1;
    const queue = createProgressSaveQueue({
      ownerUserId: "learner-a",
      getRevision: () => revision,
      setRevision: (value) => {
        revision = value;
      },
      getLastPayload: () => null,
      setLastPayload: () => undefined,
      onSaving: () => undefined,
      onSaved: () => undefined,
      onFailed: () => undefined,
      onConflict: (next) => {
        conflicts.push(next);
      },
      save: async () => ({
        ok: false as const,
        status: 409,
        error: "revision_conflict",
        record: recordFor("learner-a", 4, server),
      }),
    });
    await queue.enqueue(payloadWithArea("1"));
    assert.equal(conflicts.length, 1);
    assert.equal(conflicts[0].geometry.area, "999");
    assert.equal(revision, 4);
  });

  it("reports owner_changed and discards queued work", async () => {
    let ownerChanged = 0;
    let failed = 0;
    const queue = createProgressSaveQueue({
      ownerUserId: "learner-a",
      getRevision: () => 0,
      setRevision: () => undefined,
      getLastPayload: () => null,
      setLastPayload: () => undefined,
      onSaving: () => undefined,
      onSaved: () => undefined,
      onFailed: () => {
        failed += 1;
      },
      onConflict: () => undefined,
      onOwnerChanged: () => {
        ownerChanged += 1;
      },
      save: async () => ({ ok: false as const, status: 409, error: "owner_changed" }),
    });
    await queue.enqueue(payloadWithArea("1"));
    assert.equal(ownerChanged, 1);
    assert.equal(failed, 0);
  });

  it("keeps the failed payload queued for retry after a transport failure", async () => {
    let attempts = 0;
    let saved = 0;
    const queue = createProgressSaveQueue({
      ownerUserId: "learner-a",
      getRevision: () => 0,
      setRevision: () => undefined,
      getLastPayload: () => null,
      setLastPayload: () => undefined,
      onSaving: () => undefined,
      onSaved: () => {
        saved += 1;
      },
      onFailed: () => undefined,
      onConflict: () => undefined,
      save: async (next) => {
        attempts += 1;
        if (attempts === 1) {
          return { ok: false as const, status: 0, error: "network_failed" };
        }
        return { ok: true as const, record: recordFor("learner-a", 1, next) };
      },
    });
    await queue.enqueue(payloadWithArea("1"));
    assert.equal(saved, 0);
    await queue.retry();
    assert.equal(attempts, 2);
    assert.equal(saved, 1);
  });
});
