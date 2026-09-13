// Minimal EduGame Portal double for MyCity Account v0 browser tests.
//
// Implements just enough of the frozen contract to exercise the client:
// cookie session identity, CORS with credentials, GET/POST /api/progress with
// CAS + owner binding + monotonic completion, insert-only /api/progress/migrate,
// and a private /__e2e control surface for assertions. Never deployed.

import { createServer } from "node:http";

const MODULE_KEY = "mycity";
const ACTIVITY_KEY = "bem-mission-01-school-library";
const STATE_VERSION = 1;
const OWNER_HEADER = "x-edugame-progress-owner";
const SESSION_COOKIE = "edugame_e2e_session";
const MAX_PAYLOAD_BYTES = 16_384;

function json(response, status, body, extraHeaders = {}) {
  const text = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "private, no-store",
    ...extraHeaders,
  });
  response.end(text);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({ raw: "", value: null });
        return;
      }
      try {
        resolve({ raw, value: JSON.parse(raw) });
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function parseCookies(header) {
  const cookies = {};
  for (const part of (header ?? "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name) {
      cookies[name] = decodeURIComponent(rest.join("="));
    }
  }
  return cookies;
}

export function startMockPortal({ port, allowedOrigins }) {
  const rows = new Map();
  const calls = [];

  function corsHeaders(request) {
    const origin = request.headers.origin;
    if (!origin || !allowedOrigins.includes(origin)) {
      return {};
    }
    return {
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type, x-edugame-progress-owner",
      vary: "Origin",
    };
  }

  function record(userId, revision, payload) {
    return {
      userId,
      moduleKey: MODULE_KEY,
      activityKey: ACTIVITY_KEY,
      stateVersion: STATE_VERSION,
      revision,
      payload,
      updatedAt: new Date().toISOString(),
    };
  }

  const server = createServer(async (request, response) => {
    const url = new URL(request.url, `http://localhost:${port}`);
    const cors = corsHeaders(request);

    if (request.method === "OPTIONS") {
      response.writeHead(204, cors);
      response.end();
      return;
    }

    // --- private control surface (Node side only) -------------------------
    if (url.pathname === "/__e2e/state") {
      json(response, 200, { rows: [...rows.values()], calls });
      return;
    }
    if (url.pathname === "/__e2e/reset") {
      rows.clear();
      calls.length = 0;
      json(response, 200, { ok: true });
      return;
    }
    if (url.pathname === "/__e2e/seed" && request.method === "POST") {
      const { value } = await readBody(request);
      rows.set(value.userId, record(value.userId, value.revision ?? 1, value.payload));
      json(response, 200, { ok: true });
      return;
    }

    const cookies = parseCookies(request.headers.cookie);
    const sessionUser = cookies[SESSION_COOKIE] || null;
    let body = { raw: "", value: null };
    if (request.method === "POST") {
      try {
        body = await readBody(request);
      } catch {
        json(response, 400, { error: "invalid_body" }, cors);
        return;
      }
    }
    calls.push({
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      owner: request.headers[OWNER_HEADER] ?? null,
      sessionUser,
      bodyKeys: body.value && typeof body.value === "object" ? Object.keys(body.value) : [],
      bodyHasUserId: Boolean(body.value && typeof body.value === "object" && "userId" in body.value),
      payloadGeometryArea: body.value?.payload?.geometry?.area ?? null,
      baseRevision: body.value?.baseRevision ?? null,
      origin: request.headers.origin ?? null,
      credentials: Boolean(request.headers.cookie),
    });

    // --- identity ---------------------------------------------------------
    if (url.pathname === "/api/identity/me" && request.method === "GET") {
      if (!sessionUser) {
        json(response, 200, { authenticated: false }, cors);
        return;
      }
      json(
        response,
        200,
        {
          authenticated: true,
          profile: { userId: sessionUser, educationTier: "BEM", preferredLanguage: "en" },
        },
        cors,
      );
      return;
    }
    if (url.pathname === "/api/identity/logout" && request.method === "POST") {
      json(response, 200, { authenticated: false }, {
        ...cors,
        "set-cookie": `${SESSION_COOKIE}=; Path=/; Max-Age=0`,
      });
      return;
    }

    // --- progress ---------------------------------------------------------
    if (url.pathname.startsWith("/api/progress")) {
      if (!sessionUser) {
        json(response, 401, { error: "unauthenticated" }, cors);
        return;
      }
      if (request.method === "GET") {
        if (
          url.searchParams.get("moduleKey") !== MODULE_KEY ||
          url.searchParams.get("activityKey") !== ACTIVITY_KEY
        ) {
          json(response, 400, { error: "invalid_identifier" }, cors);
          return;
        }
        json(response, 200, { record: rows.get(sessionUser) ?? null }, cors);
        return;
      }
      if (request.method !== "POST" || !body.value || typeof body.value !== "object") {
        json(response, 400, { error: "invalid_body" }, cors);
        return;
      }
      const owner = request.headers[OWNER_HEADER];
      if (!owner || String(owner).trim() !== sessionUser) {
        json(response, 409, { error: "owner_changed" }, cors);
        return;
      }
      if ("userId" in body.value && body.value.userId != null) {
        json(response, 400, { error: "invalid_body" }, cors);
        return;
      }
      if (body.value.moduleKey !== MODULE_KEY || body.value.activityKey !== ACTIVITY_KEY) {
        json(response, 400, { error: "invalid_identifier" }, cors);
        return;
      }
      if (body.value.stateVersion !== STATE_VERSION) {
        json(response, 400, { error: "invalid_version" }, cors);
        return;
      }
      const payload = body.value.payload;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        json(response, 400, { error: "invalid_payload" }, cors);
        return;
      }
      if (Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_PAYLOAD_BYTES) {
        json(response, 413, { error: "payload_too_large" }, cors);
        return;
      }
      const existing = rows.get(sessionUser) ?? null;

      if (url.pathname === "/api/progress/migrate") {
        if (existing) {
          json(response, 200, { record: existing, migrated: false, conflict: true }, cors);
          return;
        }
        const inserted = record(sessionUser, 1, payload);
        rows.set(sessionUser, inserted);
        json(response, 201, { record: inserted, migrated: true, conflict: false }, cors);
        return;
      }

      if (url.pathname === "/api/progress") {
        const baseRevision = body.value.baseRevision;
        if (!Number.isInteger(baseRevision) || baseRevision < 0) {
          json(response, 400, { error: "invalid_revision" }, cors);
          return;
        }
        if (!existing) {
          if (baseRevision !== 0) {
            json(response, 409, { error: "revision_conflict", record: null }, cors);
            return;
          }
          const inserted = record(sessionUser, 1, payload);
          rows.set(sessionUser, inserted);
          json(response, 200, { record: inserted }, cors);
          return;
        }
        if (baseRevision !== existing.revision) {
          json(response, 409, { error: "revision_conflict", record: existing }, cors);
          return;
        }
        if (existing.payload.completed === true && payload.completed !== true) {
          json(response, 409, { error: "progress_regression", record: existing }, cors);
          return;
        }
        const updated = record(sessionUser, existing.revision + 1, payload);
        rows.set(sessionUser, updated);
        json(response, 200, { record: updated }, cors);
        return;
      }
    }

    json(response, 404, { error: "not_found" }, cors);
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      resolve({
        server,
        origin: `http://localhost:${port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}`) {
  const port = Number(process.env.MOCK_PORTAL_PORT ?? 4310);
  const allowed = (process.env.MOCK_PORTAL_ALLOWED_ORIGINS ?? "http://localhost:3100").split(",");
  startMockPortal({ port, allowedOrigins: allowed }).then(({ origin }) => {
    console.log(`mock portal listening on ${origin} (allowed: ${allowed.join(", ")})`);
  });
}
