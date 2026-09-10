import { identityOrigin } from "../identity/identityClient";
import {
  PROGRESS_ACTIVITY_KEY,
  PROGRESS_MODULE_KEY,
  PROGRESS_OWNER_HEADER,
  PROGRESS_STATE_VERSION,
} from "./ids";
import { parseLibraryProgressV1, type MyCityLibraryProgressV1 } from "./libraryPayload";

/**
 * Portal BFF progress client. Every call uses `credentials: "include"`; the
 * session cookie is the only authorization. Mutations add the non-authoritative
 * owner-binding header and never put a `userId` in the body.
 */

export type ProgressRecord = {
  userId: string;
  moduleKey: typeof PROGRESS_MODULE_KEY;
  activityKey: typeof PROGRESS_ACTIVITY_KEY;
  stateVersion: number;
  revision: number;
  payload: MyCityLibraryProgressV1;
  updatedAt: string;
};

export type ProgressMutationRequest = {
  expectedOwner: string;
  origin?: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
};

export type FetchProgressResult =
  | { ok: true; record: ProgressRecord | null }
  | { ok: false; status: number; error: string };

export type SaveProgressResult =
  | { ok: true; record: ProgressRecord }
  | { ok: false; status: number; error: string; record?: ProgressRecord };

export type MigrateProgressResult =
  | { ok: true; record: ProgressRecord; migrated: boolean; conflict: boolean }
  | { ok: false; status: number; error: string };

function progressOrigin(origin?: string): string | undefined {
  return origin ?? identityOrigin();
}

function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function mutationHeaders(expectedOwner: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    [PROGRESS_OWNER_HEADER]: expectedOwner,
  };
}

export function parseProgressRecord(value: unknown): ProgressRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.userId !== "string" || typeof record.revision !== "number") {
    return null;
  }
  if (record.moduleKey !== PROGRESS_MODULE_KEY || record.activityKey !== PROGRESS_ACTIVITY_KEY) {
    return null;
  }
  if (record.stateVersion !== PROGRESS_STATE_VERSION) {
    return null;
  }
  const payload = parseLibraryProgressV1(record.payload);
  if (!payload) {
    return null;
  }
  return {
    userId: record.userId,
    moduleKey: PROGRESS_MODULE_KEY,
    activityKey: PROGRESS_ACTIVITY_KEY,
    stateVersion: record.stateVersion,
    revision: record.revision,
    payload,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
  };
}

export async function fetchProgress(
  origin = progressOrigin(),
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<FetchProgressResult> {
  if (!origin) {
    return { ok: false, status: 0, error: "unconfigured" };
  }
  const url = `${origin}/api/progress?moduleKey=${PROGRESS_MODULE_KEY}&activityKey=${PROGRESS_ACTIVITY_KEY}`;
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      credentials: "include",
      signal,
    });
    if (!response.ok) {
      return { ok: false, status: response.status, error: "read_failed" };
    }
    const body = (await response.json().catch(() => ({}))) as { record?: unknown };
    return { ok: true, record: parseProgressRecord(body.record) };
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) {
      return { ok: false, status: 0, error: "aborted" };
    }
    return { ok: false, status: 0, error: "network_failed" };
  }
}

async function postMutation(
  path: string,
  body: unknown,
  request: ProgressMutationRequest,
): Promise<Response | { aborted: true } | { failed: true }> {
  const origin = progressOrigin(request.origin);
  if (!origin) {
    throw new Error("unconfigured");
  }
  const fetchImpl = request.fetchImpl ?? fetch;
  try {
    return await fetchImpl(`${origin}${path}`, {
      method: "POST",
      credentials: "include",
      headers: mutationHeaders(request.expectedOwner),
      body: JSON.stringify(body),
      signal: request.signal,
    });
  } catch (error) {
    if (request.signal?.aborted || isAbortError(error)) {
      return { aborted: true };
    }
    return { failed: true };
  }
}

export async function saveProgress(
  payload: MyCityLibraryProgressV1,
  baseRevision: number,
  request: ProgressMutationRequest,
): Promise<SaveProgressResult> {
  if (!progressOrigin(request.origin)) {
    return { ok: false, status: 0, error: "unconfigured" };
  }
  const response = await postMutation(
    "/api/progress",
    {
      moduleKey: PROGRESS_MODULE_KEY,
      activityKey: PROGRESS_ACTIVITY_KEY,
      stateVersion: PROGRESS_STATE_VERSION,
      baseRevision,
      payload,
    },
    request,
  );
  if ("aborted" in response) {
    return { ok: false, status: 0, error: "aborted" };
  }
  if ("failed" in response) {
    return { ok: false, status: 0, error: "network_failed" };
  }
  const body = (await response.json().catch(() => ({}))) as { record?: unknown; error?: string };
  const record = parseProgressRecord(body.record);
  if (!response.ok || !record) {
    return {
      ok: false,
      status: response.status,
      error: typeof body.error === "string" ? body.error : "save_failed",
      record: record ?? undefined,
    };
  }
  return { ok: true, record };
}

export async function migrateProgress(
  payload: MyCityLibraryProgressV1,
  request: ProgressMutationRequest,
): Promise<MigrateProgressResult> {
  if (!progressOrigin(request.origin)) {
    return { ok: false, status: 0, error: "unconfigured" };
  }
  const response = await postMutation(
    "/api/progress/migrate",
    {
      moduleKey: PROGRESS_MODULE_KEY,
      activityKey: PROGRESS_ACTIVITY_KEY,
      stateVersion: PROGRESS_STATE_VERSION,
      payload,
    },
    request,
  );
  if ("aborted" in response) {
    return { ok: false, status: 0, error: "aborted" };
  }
  if ("failed" in response) {
    return { ok: false, status: 0, error: "network_failed" };
  }
  const body = (await response.json().catch(() => ({}))) as {
    record?: unknown;
    migrated?: unknown;
    conflict?: unknown;
    error?: string;
  };
  const record = parseProgressRecord(body.record);
  if (!response.ok || !record) {
    return {
      ok: false,
      status: response.status,
      error: typeof body.error === "string" ? body.error : "migrate_failed",
    };
  }
  return {
    ok: true,
    record,
    migrated: body.migrated === true,
    conflict: body.conflict === true,
  };
}
