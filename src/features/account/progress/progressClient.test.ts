import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PROGRESS_OWNER_HEADER } from "./ids";
import { fetchProgress, migrateProgress, saveProgress } from "./progressClient";
import { jsonResponse, midMissionPayload, recordFor } from "./testing/fixtures";

const ORIGIN = "http://portal.test";

describe("progress client", () => {
  it("reads with credentials, no owner header, and validates the record payload", async () => {
    const seen: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      seen.push({ url, init });
      return jsonResponse({ record: recordFor("learner-a", 2, midMissionPayload()) });
    }) as unknown as typeof fetch;

    const result = await fetchProgress(ORIGIN, fetchImpl);
    assert.equal(seen.length, 1);
    assert.equal(
      seen[0].url,
      `${ORIGIN}/api/progress?moduleKey=mycity&activityKey=bem-mission-01-school-library`,
    );
    assert.equal(seen[0].init?.credentials, "include");
    assert.equal(JSON.stringify(seen[0].init?.headers ?? {}).includes(PROGRESS_OWNER_HEADER), false);
    assert.equal(/supabase|service.role|access_token/i.test(JSON.stringify(seen[0].init)), false);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.record?.revision, 2);
      assert.equal(result.record?.payload.geometry.area, "216");
    }
  });

  it("treats a record whose payload fails strict validation as absent", async () => {
    const corrupted = recordFor("learner-a", 2, midMissionPayload()) as unknown as {
      payload: Record<string, unknown>;
    };
    corrupted.payload = { ...corrupted.payload, score: 100 };
    const fetchImpl = (async () => jsonResponse({ record: corrupted })) as unknown as typeof fetch;
    const result = await fetchProgress(ORIGIN, fetchImpl);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.record, null);
    }
  });

  it("treats a record without the Store validation-intent flags as absent (same as any unknown shape)", async () => {
    const legacy = recordFor("learner-a", 2, midMissionPayload()) as unknown as {
      payload: Record<string, unknown>;
    };
    const { constructionOrderChecked: _c, libraryItemsOrderChecked: _l, ...withoutFlags } =
      legacy.payload;
    void _c;
    void _l;
    legacy.payload = withoutFlags;
    const fetchImpl = (async () => jsonResponse({ record: legacy })) as unknown as typeof fetch;
    const result = await fetchProgress(ORIGIN, fetchImpl);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.record, null);
    }
  });

  it("does not throw on network failure and reports unconfigured without an origin", async () => {
    const failing = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    const result = await fetchProgress(ORIGIN, failing);
    assert.deepEqual(result, { ok: false, status: 0, error: "network_failed" });
    assert.deepEqual(await fetchProgress(undefined, failing), {
      ok: false,
      status: 0,
      error: "unconfigured",
    });
  });

  it("saves with the owner header, CAS baseRevision, frozen ids and no body userId", async () => {
    let body: Record<string, unknown> = {};
    let headers = new Headers();
    let url = "";
    const fetchImpl = (async (requestUrl: string, init?: RequestInit) => {
      url = requestUrl;
      headers = new Headers(init?.headers);
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      assert.equal(init?.credentials, "include");
      assert.equal(init?.method, "POST");
      return jsonResponse({ record: recordFor("learner-a", 4, midMissionPayload()) });
    }) as unknown as typeof fetch;

    const result = await saveProgress(midMissionPayload(), 3, {
      expectedOwner: "learner-a",
      origin: ORIGIN,
      fetchImpl,
    });
    assert.equal(url, `${ORIGIN}/api/progress`);
    assert.equal(headers.get(PROGRESS_OWNER_HEADER), "learner-a");
    assert.equal(body.moduleKey, "mycity");
    assert.equal(body.activityKey, "bem-mission-01-school-library");
    assert.equal(body.stateVersion, 1);
    assert.equal(body.baseRevision, 3);
    assert.equal("userId" in body, false);
    assert.equal(JSON.stringify(body).includes("userId"), false);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.record.revision, 4);
    }
  });

  it("returns the server record on revision_conflict so the client can hydrate", async () => {
    const server = { ...midMissionPayload(), geometry: { area: "216", perimeter: "61" } };
    const fetchImpl = (async () =>
      jsonResponse(
        { error: "revision_conflict", record: recordFor("learner-a", 7, server) },
        409,
      )) as unknown as typeof fetch;
    const result = await saveProgress(midMissionPayload(), 2, {
      expectedOwner: "learner-a",
      origin: ORIGIN,
      fetchImpl,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 409);
      assert.equal(result.error, "revision_conflict");
      assert.equal(result.record?.revision, 7);
      assert.equal(result.record?.payload.geometry.perimeter, "61");
    }
  });

  it("treats owner_changed as a failed mutation without applying a record", async () => {
    const fetchImpl = (async () =>
      jsonResponse({ error: "owner_changed" }, 409)) as unknown as typeof fetch;
    const result = await saveProgress(midMissionPayload(), 0, {
      expectedOwner: "learner-a",
      origin: ORIGIN,
      fetchImpl,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "owner_changed");
      assert.equal(result.record, undefined);
    }
  });

  it("does not claim success on 5xx or transport errors", async () => {
    const serverError = (async () => new Response("{}", { status: 500 })) as unknown as typeof fetch;
    const failed = await saveProgress(midMissionPayload(), 0, {
      expectedOwner: "learner-a",
      origin: ORIGIN,
      fetchImpl: serverError,
    });
    assert.equal(failed.ok, false);
    const network = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    const offline = await saveProgress(midMissionPayload(), 0, {
      expectedOwner: "learner-a",
      origin: ORIGIN,
      fetchImpl: network,
    });
    assert.deepEqual(offline, { ok: false, status: 0, error: "network_failed" });
  });

  it("sends migrate with owner binding, no baseRevision and no client userId", async () => {
    let body: Record<string, unknown> = {};
    let headers = new Headers();
    let url = "";
    const fetchImpl = (async (requestUrl: string, init?: RequestInit) => {
      url = requestUrl;
      headers = new Headers(init?.headers);
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      assert.equal(init?.credentials, "include");
      return jsonResponse(
        { migrated: true, conflict: false, record: recordFor("learner-a", 1, midMissionPayload()) },
        201,
      );
    }) as unknown as typeof fetch;
    const result = await migrateProgress(midMissionPayload(), {
      expectedOwner: "learner-a",
      origin: ORIGIN,
      fetchImpl,
    });
    assert.equal(url, `${ORIGIN}/api/progress/migrate`);
    assert.equal(headers.get(PROGRESS_OWNER_HEADER), "learner-a");
    assert.equal("userId" in body, false);
    assert.equal("baseRevision" in body, false);
    assert.equal(body.stateVersion, 1);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.migrated, true);
      assert.equal(result.record.revision, 1);
    }
  });

  it("treats a second migrate as an idempotent conflict with the same row", async () => {
    const fetchImpl = (async () =>
      jsonResponse(
        { migrated: false, conflict: true, record: recordFor("learner-a", 1, midMissionPayload()) },
        200,
      )) as unknown as typeof fetch;
    const result = await migrateProgress(midMissionPayload(), {
      expectedOwner: "learner-a",
      origin: ORIGIN,
      fetchImpl,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.conflict, true);
      assert.equal(result.migrated, false);
      assert.equal(result.record.revision, 1);
    }
  });

  it("reports aborted mutations distinctly so they are never shown as failures", async () => {
    const controller = new AbortController();
    const fetchImpl = (async (_url: string, init?: RequestInit) => {
      controller.abort();
      const error = new Error("aborted");
      error.name = "AbortError";
      assert.equal(init?.signal?.aborted, true);
      throw error;
    }) as unknown as typeof fetch;
    const result = await saveProgress(midMissionPayload(), 0, {
      expectedOwner: "learner-a",
      origin: ORIGIN,
      fetchImpl,
      signal: controller.signal,
    });
    assert.deepEqual(result, { ok: false, status: 0, error: "aborted" });
  });
});
