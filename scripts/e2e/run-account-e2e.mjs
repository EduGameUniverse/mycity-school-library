// MyCity Account v0 browser evidence: refresh restore, guest→account migration,
// authenticated CAS saves, A→B same-tab isolation, RTL identity chrome and
// completion monotonicity — against a local mock Portal (scripts/e2e/mock-portal.mjs).
//
// Usage: npm run test:account:e2e
// Requires Playwright's Chromium (npx playwright install chromium).

import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startMockPortal } from "./mock-portal.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");

const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3100);
const PORTAL_PORT = Number(process.env.E2E_PORTAL_PORT ?? 4310);
const NEXT_MODE = process.env.E2E_NEXT_MODE === "start" ? "start" : "dev";
const APP_ORIGIN = `http://localhost:${APP_PORT}`;
const PORTAL_ORIGIN = `http://localhost:${PORTAL_PORT}`;
const MISSION_URL = `${APP_ORIGIN}/bem/mission-01-school-library`;
const GUEST_KEY = "edugame.progress.v0.guest.mycity.bem-mission-01-school-library";
const SESSION_COOKIE = "edugame_e2e_session";
const USER_A = "aaaaaaaa-0000-4000-8000-00000000000a";
const USER_B = "bbbbbbbb-0000-4000-8000-00000000000b";
const USER_C = "cccccccc-0000-4000-8000-00000000000c";
const PAYLOAD_KEYS = [
  "plotInspected",
  "geometry",
  "compact",
  "twoBuilding",
  "lShaped",
  "finalArchitectureId",
  "storeSelections",
  "reportAnswers",
  "completed",
];

const results = [];

async function scenario(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - started });
    console.log(`[PASS] ${name}`);
  } catch (error) {
    results.push({ name, ok: false, ms: Date.now() - started, error });
    console.log(`[FAIL] ${name}\n       ${error?.stack ?? error}`);
  }
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function waitFor(predicate, { timeout = 15_000, interval = 100, label = "condition" } = {}) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeout) {
    try {
      const value = await predicate();
      if (value) {
        return value;
      }
    } catch (error) {
      last = error;
    }
    await sleep(interval);
  }
  throw new Error(`Timed out waiting for ${label}${last ? `: ${last}` : ""}`);
}

async function mockState() {
  const response = await fetch(`${PORTAL_ORIGIN}/__e2e/state`);
  return response.json();
}

async function mockReset() {
  await fetch(`${PORTAL_ORIGIN}/__e2e/reset`, { method: "POST" });
}

async function mockSeed(userId, revision, payload) {
  await fetch(`${PORTAL_ORIGIN}/__e2e/seed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId, revision, payload }),
  });
}

function progressCalls(state, since = 0) {
  return state.calls.slice(since).filter((call) => call.path.startsWith("/api/progress"));
}

function rowFor(state, userId) {
  return state.rows.find((row) => row.userId === userId) ?? null;
}

async function setSession(context, userId) {
  await context.clearCookies();
  if (userId) {
    await context.addCookies([
      { name: SESSION_COOKIE, value: userId, domain: "localhost", path: "/", sameSite: "Lax" },
    ]);
  }
}

async function readGuest(page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, GUEST_KEY);
}

async function waitForStatus(page, status, timeout = 20_000) {
  await page.waitForSelector(`[data-testid="progress-status"][data-status="${status}"]`, { timeout });
}

async function waitForIdentity(page, state, timeout = 20_000) {
  await page.waitForSelector(`[data-testid="learner-identity-bar"][data-identity-state="${state}"]`, {
    timeout,
  });
}

/**
 * The plot button is clip-path'd to the perspective polygon
 * A(40,68) B(68.5,90) C(99.5,63.5) D(70.5,48.5) (screen %), so click its centroid.
 */
async function clickPlot(page) {
  const button = page.getByRole("button", { name: /click to inspect/ });
  const box = await button.boundingBox();
  await button.click({ position: { x: box.width * 0.696, y: box.height * 0.675 } });
}

async function inspectPlotAndAnswerGeometry(page, { area = "216", perimeter = "60" } = {}) {
  await clickPlot(page);
  await page.fill('input[name="plot-area"]', area);
  await page.fill('input[name="plot-perimeter"]', perimeter);
  await page.getByRole("button", { name: "Check my answers" }).click();
}

function completedPayloadFixture() {
  const tsxCli = join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const output = execFileSync(
    process.execPath,
    [tsxCli, join(here, "emit-completed-payload.ts")],
    { cwd: repoRoot, encoding: "utf8" },
  );
  return JSON.parse(output);
}

function startNext() {
  const nextBin = join(repoRoot, "node_modules", "next", "dist", "bin", "next");
  const args = NEXT_MODE === "start" ? ["start", "-p", String(APP_PORT)] : ["dev", "-p", String(APP_PORT)];
  const child = spawn(process.execPath, [nextBin, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NEXT_PUBLIC_EDUGAME_IDENTITY_ORIGIN: PORTAL_ORIGIN,
      NEXT_TELEMETRY_DISABLED: "1",
      BROWSER: "none",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (chunk) => {
    log += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    log += chunk.toString();
  });
  return {
    child,
    log: () => log,
    stop: () => {
      if (child.exitCode !== null) {
        return;
      }
      if (process.platform === "win32") {
        try {
          execFileSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
        } catch {
          child.kill();
        }
      } else {
        child.kill("SIGTERM");
      }
    },
  };
}

async function waitForApp(next) {
  await waitFor(
    async () => {
      if (next.child.exitCode !== null) {
        throw new Error(`next exited: ${next.log()}`);
      }
      const response = await fetch(MISSION_URL).catch(() => null);
      return response?.status === 200;
    },
    { timeout: 180_000, interval: 1_000, label: "Next.js app" },
  );
}

async function main() {
  if (!existsSync(join(repoRoot, "node_modules", "playwright"))) {
    throw new Error("playwright is not installed (npm install).");
  }
  const portal = await startMockPortal({ port: PORTAL_PORT, allowedOrigins: [APP_ORIGIN] });
  const next = startNext();
  let browser = null;
  try {
    console.log(`mock portal: ${PORTAL_ORIGIN}; app (${NEXT_MODE}): ${APP_ORIGIN}`);
    await waitForApp(next);
    browser = await chromium.launch();

    // ----------------------------------------------------------------------
    // Guest learner: untouched state, meaningful persistence, refresh restore,
    // then guest→account migration, authenticated CAS saves, A→B isolation,
    // Arabic RTL chrome — all in one tab to model a real session.
    // ----------------------------------------------------------------------
    await mockReset();
    const context = await browser.newContext();
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("pageerror", (error) => consoleErrors.push(String(error)));

    await scenario("guest: untouched initial state creates no guest data and no Portal progress calls", async () => {
      await page.goto(MISSION_URL);
      await waitForIdentity(page, "unauthenticated");
      await sleep(800);
      assert.equal(await readGuest(page), null);
      const state = await mockState();
      assert.equal(progressCalls(state).length, 0);
      assert.ok(state.calls.some((call) => call.path === "/api/identity/me"));
    });

    await scenario("guest: meaningful progress persists under the frozen key with the guest wrapper", async () => {
      await inspectPlotAndAnswerGeometry(page);
      await page.waitForSelector('[data-testid="geometry-result"][data-valid="true"]');
      await page.getByLabel("A′ x (m)").fill("1");
      const guest = await waitFor(
        async () => {
          const record = await readGuest(page);
          return record?.payload?.geometry?.area === "216" && record?.payload?.compact?.form?.aPrimeX === "1"
            ? record
            : null;
        },
        { label: "guest record" },
      );
      assert.equal(guest.schema, "edugame.guest-progress.v0");
      assert.equal(guest.moduleKey, "mycity");
      assert.equal(guest.activityKey, "bem-mission-01-school-library");
      assert.equal(guest.stateVersion, 1);
      assert.deepEqual(Object.keys(guest.payload), PAYLOAD_KEYS);
      assert.equal(JSON.stringify(guest).includes("userId"), false);
      await waitForStatus(page, "guest_retained");
      assert.equal(progressCalls(await mockState()).length, 0, "guests never call /api/progress");
    });

    await scenario("guest: refresh restores plot gate, geometry answers, validation and form values", async () => {
      await page.reload();
      await waitForStatus(page, "guest_retained");
      assert.equal(await page.inputValue('input[name="plot-area"]'), "216");
      assert.equal(await page.inputValue('input[name="plot-perimeter"]'), "60");
      await page.waitForSelector('[data-testid="geometry-result"][data-valid="true"]');
      assert.equal(await page.getByLabel("A′ x (m)").inputValue(), "1");
      assert.equal(progressCalls(await mockState()).length, 0);
    });

    let migrateCallCount = 0;
    await scenario("guest→account: signing in as A migrates once with owner binding and no body userId", async () => {
      await setSession(context, USER_A);
      await page.reload();
      await waitForIdentity(page, "authenticated");
      await waitForStatus(page, "migrated");
      const state = await mockState();
      const migrations = state.calls.filter((call) => call.path === "/api/progress/migrate");
      migrateCallCount = migrations.length;
      assert.equal(migrations.length, 1);
      assert.equal(migrations[0].owner, USER_A);
      assert.equal(migrations[0].sessionUser, USER_A);
      assert.equal(migrations[0].bodyHasUserId, false);
      assert.deepEqual(migrations[0].bodyKeys.sort(), ["activityKey", "moduleKey", "payload", "stateVersion"]);
      const row = rowFor(state, USER_A);
      assert.equal(row.revision, 1);
      assert.equal(row.payload.geometry.area, "216");
      assert.equal(row.payload.compact.form.aPrimeX, "1");
      const uuid = page.getByTestId("learner-uuid");
      assert.equal((await uuid.textContent()).trim(), USER_A);
      assert.equal(await uuid.getAttribute("dir"), "ltr");
      const guest = await readGuest(page);
      assert.equal(guest.migratedToUserId, USER_A);
      assert.equal(await page.inputValue('input[name="plot-area"]'), "216");
    });

    await scenario("account: an edit saves once via CAS (baseRevision 1 → revision 2); unrelated renders add no writes", async () => {
      const before = (await mockState()).calls.length;
      await page.fill('input[name="plot-perimeter"]', "61");
      await waitForStatus(page, "saved");
      const saves = await waitFor(
        async () => {
          const calls = progressCalls(await mockState(), before).filter(
            (call) => call.method === "POST" && call.path === "/api/progress",
          );
          return calls.length > 0 ? calls : null;
        },
        { label: "authenticated save" },
      );
      assert.equal(saves.length, 1);
      assert.equal(saves[0].owner, USER_A);
      assert.equal(saves[0].baseRevision, 1);
      assert.equal(saves[0].bodyHasUserId, false);
      // Unrelated re-renders: language round-trip and focus ticks.
      await page.getByRole("button", { name: "Français" }).click();
      await page.getByRole("button", { name: "English" }).click();
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await sleep(1_500);
      const state = await mockState();
      const posts = progressCalls(state, before).filter(
        (call) => call.method === "POST" && call.path === "/api/progress",
      );
      assert.equal(posts.length, 1, "no write storm from unrelated renders");
      const row = rowFor(state, USER_A);
      assert.equal(row.revision, 2);
      assert.equal(row.payload.geometry.perimeter, "61");
      assert.deepEqual(Object.keys(row.payload), PAYLOAD_KEYS);
      for (const banned of ["userId", "locale", "score", "errors", "totalCost", "footprintPreview"]) {
        assert.equal(JSON.stringify(row.payload).includes(`"${banned}"`), false, banned);
      }
    });

    await scenario("A→B same tab: B never sees or writes A's progress; A's row is untouched", async () => {
      const before = (await mockState()).calls.length;
      await setSession(context, USER_B);
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await waitFor(
        async () => (await page.getByTestId("learner-uuid").textContent())?.trim() === USER_B,
        { label: "identity B" },
      );
      // B has no row and the guest record belongs to A → empty mission, no migrate.
      await waitFor(async () => (await page.locator('input[name="plot-area"]').count()) === 0, {
        label: "A state reset before hydrating B",
      });
      await sleep(1_200);
      let state = await mockState();
      const sinceSwitch = progressCalls(state, before);
      assert.equal(sinceSwitch.some((call) => call.path === "/api/progress/migrate"), false);
      assert.equal(
        sinceSwitch.some((call) => call.method === "POST" && call.path === "/api/progress"),
        false,
      );
      assert.ok(sinceSwitch.some((call) => call.method === "GET" && call.sessionUser === USER_B));
      assert.equal(rowFor(state, USER_B), null);
      assert.equal(rowFor(state, USER_A).revision, 2);
      assert.equal(rowFor(state, USER_A).payload.geometry.area, "216");

      // B starts their own work: saved to B's row, A untouched.
      await inspectPlotAndAnswerGeometry(page, { area: "100", perimeter: "40" });
      await waitForStatus(page, "saved");
      state = await waitFor(
        async () => {
          const current = await mockState();
          return rowFor(current, USER_B) ? current : null;
        },
        { label: "B row" },
      );
      const bPosts = progressCalls(state, before).filter(
        (call) => call.method === "POST" && call.path === "/api/progress",
      );
      assert.ok(bPosts.length >= 1);
      assert.ok(bPosts.every((call) => call.owner === USER_B && call.sessionUser === USER_B));
      assert.equal(bPosts[0].baseRevision, 0);
      assert.equal(rowFor(state, USER_B).payload.geometry.area, "100");
      assert.equal(rowFor(state, USER_A).revision, 2);
      assert.equal(rowFor(state, USER_A).payload.geometry.area, "216");
      assert.equal(state.calls.filter((call) => call.path === "/api/progress/migrate").length, migrateCallCount);
    });

    await scenario("Arabic RTL: mission and identity chrome flip to rtl while the UUID stays LTR and bidi-isolated", async () => {
      await page.getByRole("button", { name: "العربية" }).click();
      await page.waitForSelector('[lang="ar"][dir="rtl"]');
      const bar = page.getByTestId("learner-identity-bar");
      assert.equal(await bar.getAttribute("dir"), "rtl");
      assert.equal(await bar.getAttribute("lang"), "ar");
      const uuid = page.getByTestId("learner-uuid");
      assert.equal(await uuid.getAttribute("dir"), "ltr");
      const bidi = await uuid.evaluate((element) => getComputedStyle(element).unicodeBidi);
      assert.equal(bidi, "isolate");
      assert.equal((await uuid.textContent()).trim(), USER_B);
      assert.match(await bar.textContent(), /تم تسجيل الدخول/);
      await page.getByRole("button", { name: "English" }).click();
    });

    await scenario("no uncaught page errors during the session", async () => {
      assert.deepEqual(consoleErrors, []);
    });
    await context.close();

    // ----------------------------------------------------------------------
    // Completed account row: restore shows the built library; a local edit
    // unbuilds visually but never sends completed:false.
    // ----------------------------------------------------------------------
    await scenario("completion monotonic: completed row restores built state; local unbuild never POSTs completed:false", async () => {
      const completed = completedPayloadFixture();
      await mockSeed(USER_C, 3, completed);
      const contextC = await browser.newContext();
      await setSession(contextC, USER_C);
      const pageC = await contextC.newPage();
      const before = (await mockState()).calls.length;
      await pageC.goto(MISSION_URL);
      await waitForStatus(pageC, "saved");
      await pageC.waitForSelector('[data-account-complete="true"]');
      await pageC.waitForSelector("text=Library completed");
      await pageC.waitForSelector("text=100/100");
      assert.equal(await pageC.inputValue('input[name="plot-area"]'), "216");
      // Editing an answer while still built persists source with completed:true (row stays complete).
      await pageC.fill('input[name="plot-perimeter"]', "61");
      await sleep(1_500);
      let state = await mockState();
      for (const call of progressCalls(state, before).filter((c) => c.method === "POST")) {
        assert.equal(call.owner, USER_C);
      }
      assert.equal(rowFor(state, USER_C).payload.completed, true);
      const revisionAfterEdit = rowFor(state, USER_C).revision;
      // Re-checking a wrong answer unbuilds locally; the incomplete payload must never be sent.
      const beforeUnbuild = state.calls.length;
      await pageC.getByRole("button", { name: "Check my answers" }).click();
      await waitFor(async () => (await pageC.locator("text=Library completed").count()) === 0, {
        label: "local unbuild",
      });
      await sleep(1_500);
      state = await mockState();
      const posts = progressCalls(state, beforeUnbuild).filter((call) => call.method === "POST");
      assert.equal(posts.length, 0, "no POST while completion is locked and payload is incomplete");
      const row = rowFor(state, USER_C);
      assert.equal(row.revision, revisionAfterEdit);
      assert.equal(row.payload.completed, true);
      assert.equal(await pageC.locator('[data-account-complete="true"]').count(), 1);
      await contextC.close();
    });
  } finally {
    await browser?.close();
    next.stop();
    await portal.close();
  }

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} scenarios passed`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
