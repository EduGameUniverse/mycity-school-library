import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { localeDir, t } from "@/features/mycity/mission-library/data/i18n";
import {
  fetchIdentity,
  identityAccountUrl,
  identityBarChrome,
  identityLoginUrl,
  identitySignupUrl,
  isAbortError,
  parseIdentitySnapshot,
} from "./identityClient";

const here = dirname(fileURLToPath(import.meta.url));

describe("identity consumer", () => {
  it("parses a Portal UUID snapshot (flat or nested profile)", () => {
    const flat = parseIdentitySnapshot({
      authenticated: true,
      userId: "11111111-2222-3333-4444-555555555555",
      educationTier: "BEM",
      preferredLanguage: "ar",
    });
    assert.equal(flat.authenticated, true);
    if (flat.authenticated) {
      assert.equal(flat.userId, "11111111-2222-3333-4444-555555555555");
    }
    const nested = parseIdentitySnapshot({
      authenticated: true,
      profile: { userId: "abc", educationTier: "BEM", preferredLanguage: "fr" },
    });
    assert.equal(nested.authenticated, true);
    if (nested.authenticated) {
      assert.equal(nested.userId, "abc");
      assert.equal(nested.preferredLanguage, "fr");
    }
  });

  it("does not leak profile fields from an unauthenticated payload", () => {
    assert.deepEqual(
      parseIdentitySnapshot({ authenticated: false, userId: "should-not-leak", email: "x@y.z" }),
      { authenticated: false },
    );
    assert.deepEqual(parseIdentitySnapshot({ authenticated: true, userId: "" }), {
      authenticated: false,
    });
    assert.deepEqual(parseIdentitySnapshot(null), { authenticated: false });
  });

  it("calls /api/identity/me with credentials and treats non-OK as signed out", async () => {
    const seen: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      seen.push({ url, init });
      return new Response(
        JSON.stringify({ authenticated: true, profile: { userId: "learner-a" } }),
        { headers: { "content-type": "application/json" } },
      );
    }) as unknown as typeof fetch;
    const snapshot = await fetchIdentity("http://portal.test/", undefined, fetchImpl);
    assert.equal(seen[0].url, "http://portal.test/api/identity/me");
    assert.equal(seen[0].init?.credentials, "include");
    assert.equal(snapshot.authenticated, true);

    const denied = (async () => new Response("{}", { status: 401 })) as unknown as typeof fetch;
    assert.deepEqual(await fetchIdentity("http://portal.test", undefined, denied), {
      authenticated: false,
    });
    assert.deepEqual(await fetchIdentity(undefined, undefined, denied), { authenticated: false });
  });

  it("links to the Portal login, signup and account pages", () => {
    assert.equal(identityLoginUrl("http://portal.test/"), "http://portal.test/login");
    assert.equal(identitySignupUrl("http://portal.test"), "http://portal.test/signup");
    assert.equal(identityAccountUrl("http://portal.test"), "http://portal.test/account");
  });

  it("does not treat AbortError as a signed-out signal", () => {
    const abort = new Error("Aborted");
    abort.name = "AbortError";
    assert.equal(isAbortError(abort), true);
    assert.equal(isAbortError(new Error("network")), false);
  });
});

describe("identity bar chrome", () => {
  it("does not show signed-out while loading and shows unconfigured without an origin", () => {
    assert.equal(identityBarChrome(true, "loading", { authenticated: false }), "loading");
    assert.equal(identityBarChrome(true, "ready", { authenticated: false }), "unauthenticated");
    assert.equal(identityBarChrome(false, "loading", { authenticated: false }), "unconfigured");
    assert.equal(
      identityBarChrome(true, "ready", {
        authenticated: true,
        userId: "abc",
        educationTier: "BEM",
        preferredLanguage: "ar",
      }),
      "authenticated",
    );
  });

  it("has EN/FR/AR copy for every identity and progress state", () => {
    for (const key of [
      "identity.loading",
      "identity.signedIn",
      "identity.signedOut",
      "identity.learnerId",
      "identity.signIn",
      "identity.signUp",
      "identity.account",
      "identity.signOut",
      "identity.unconfigured",
      "progress.restoring",
      "progress.saving",
      "progress.saved",
      "progress.saveFailed",
      "progress.migrating",
      "progress.migrated",
      "progress.migrationFailed",
      "progress.conflictKeptLocal",
      "progress.guestRetained",
      "progress.ownerChanged",
      "progress.retry",
      "report.answerLimitReached",
    ] as const) {
      const en = t("en", key);
      const fr = t("fr", key);
      const ar = t("ar", key);
      assert.ok(en.length > 0 && fr.length > 0 && ar.length > 0, key);
      assert.match(ar, /[\u0600-\u06FF]/, `${key} Arabic copy must be Arabic`);
    }
    assert.equal(localeDir("ar"), "rtl");
    assert.equal(localeDir("fr"), "ltr");
  });

  it("renders the UUID LTR and bidi-isolated inside an RTL-capable status region", () => {
    const bar = readFileSync(join(here, "LearnerIdentityBar.tsx"), "utf8");
    assert.match(bar, /role="status"/);
    assert.match(bar, /dir=\{localeDir\(locale\)\}/);
    assert.match(bar, /<code[\s\S]*?dir="ltr"[\s\S]*?unicodeBidi: "isolate"[\s\S]*?\{identity\.userId\}/);
    assert.match(bar, /identityLoginUrl|identitySignupUrl|identityAccountUrl/);
    assert.equal(/localStorage|sessionStorage|document\.cookie/.test(bar), false);
  });

  it("refreshes identity on focus/visibility and never touches Supabase or tokens", () => {
    const provider = readFileSync(join(here, "IdentityProvider.tsx"), "utf8");
    const client = readFileSync(join(here, "identityClient.ts"), "utf8");
    const bar = readFileSync(join(here, "LearnerIdentityBar.tsx"), "utf8");
    assert.match(provider, /visibilitychange/);
    assert.match(provider, /addEventListener\("focus"/);
    for (const source of [provider, client, bar]) {
      assert.equal(/@supabase|createBrowserClient|createClient\(/.test(source), false);
      assert.equal(/localStorage|sessionStorage|document\.cookie/.test(source), false);
    }
    assert.match(client, /credentials: "include"/);
  });
});
