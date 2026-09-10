/**
 * EduGame Account v0 identity consumer.
 *
 * The Portal owns authentication. MyCity only reads `GET /api/identity/me`
 * with `credentials: "include"`; it never stores tokens or cookies itself and
 * never talks to Supabase.
 */
export type IdentitySnapshot =
  | { authenticated: false }
  | {
      authenticated: true;
      userId: string;
      educationTier: string;
      preferredLanguage: string;
    };

export type IdentityUiStatus = "loading" | "ready";

export type IdentityBarChrome =
  | "unconfigured"
  | "loading"
  | "authenticated"
  | "unauthenticated";

export function identityBarChrome(
  configured: boolean,
  status: IdentityUiStatus,
  identity: IdentitySnapshot,
): IdentityBarChrome {
  if (!configured) {
    return "unconfigured";
  }
  if (status === "loading") {
    return "loading";
  }
  return identity.authenticated ? "authenticated" : "unauthenticated";
}

export function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function trimOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

/** Public Portal origin, configured per environment. Undefined disables Account v0. */
export function identityOrigin(): string | undefined {
  const value = process.env.NEXT_PUBLIC_EDUGAME_IDENTITY_ORIGIN;
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = trimOrigin(value);
  return trimmed ? trimmed : undefined;
}

export function parseIdentitySnapshot(value: unknown): IdentitySnapshot {
  if (!value || typeof value !== "object") {
    return { authenticated: false };
  }
  const record = value as Record<string, unknown>;
  if (record.authenticated !== true) {
    return { authenticated: false };
  }
  const nested =
    record.profile && typeof record.profile === "object"
      ? (record.profile as Record<string, unknown>)
      : record;
  if (typeof nested.userId !== "string" || nested.userId.length === 0) {
    return { authenticated: false };
  }
  return {
    authenticated: true,
    userId: nested.userId,
    educationTier: String(nested.educationTier ?? ""),
    preferredLanguage: String(nested.preferredLanguage ?? ""),
  };
}

export async function fetchIdentity(
  origin = identityOrigin(),
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<IdentitySnapshot> {
  if (!origin) {
    return { authenticated: false };
  }
  const response = await fetchImpl(`${trimOrigin(origin)}/api/identity/me`, {
    method: "GET",
    credentials: "include",
    signal,
  });
  if (!response.ok) {
    return { authenticated: false };
  }
  return parseIdentitySnapshot(await response.json());
}

export async function logoutIdentity(
  origin = identityOrigin(),
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (!origin) {
    return;
  }
  await fetchImpl(`${trimOrigin(origin)}/api/identity/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

export function identityLoginUrl(origin = identityOrigin()): string {
  return origin ? `${trimOrigin(origin)}/login` : "/login";
}

export function identitySignupUrl(origin = identityOrigin()): string {
  return origin ? `${trimOrigin(origin)}/signup` : "/signup";
}

export function identityAccountUrl(origin = identityOrigin()): string {
  return origin ? `${trimOrigin(origin)}/account` : "/account";
}
