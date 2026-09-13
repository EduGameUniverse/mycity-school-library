"use client";

import { localeDir, t, type Locale } from "@/features/mycity/mission-library/data/i18n";
import {
  identityAccountUrl,
  identityBarChrome,
  identityLoginUrl,
  identityOrigin,
  identitySignupUrl,
} from "./identityClient";
import { useIdentity } from "./IdentityProvider";

interface LearnerIdentityBarProps {
  locale?: Locale;
}

/**
 * Portal identity chrome: loading / signed-out / signed-in with the learner
 * UUID. The UUID is always rendered LTR and bidi-isolated, even under Arabic.
 */
export function LearnerIdentityBar({ locale = "en" }: LearnerIdentityBarProps) {
  const { snapshot: identity, status, logout, origin } = useIdentity();
  const resolvedOrigin = origin ?? identityOrigin();
  const configured = Boolean(resolvedOrigin);
  const chrome = identityBarChrome(configured, status, identity);

  return (
    <div
      role="status"
      lang={locale}
      dir={localeDir(locale)}
      data-testid="learner-identity-bar"
      data-identity-state={chrome}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm sm:text-sm"
    >
      {chrome === "unconfigured" ? (
        <span>{t(locale, "identity.unconfigured")}</span>
      ) : chrome === "loading" ? (
        <span>{t(locale, "identity.loading")}</span>
      ) : chrome === "authenticated" && identity.authenticated ? (
        <>
          <span className="font-semibold text-emerald-800">{t(locale, "identity.signedIn")}</span>
          <span>
            {t(locale, "identity.learnerId")}:{" "}
            <code
              dir="ltr"
              data-testid="learner-uuid"
              className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.7rem] text-slate-900 sm:text-xs"
              style={{ unicodeBidi: "isolate" }}
            >
              {identity.userId}
            </code>
          </span>
          <a
            href={identityAccountUrl(resolvedOrigin)}
            className="font-medium text-sky-700 underline-offset-2 hover:underline"
          >
            {t(locale, "identity.account")}
          </a>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 hover:bg-slate-200"
          >
            {t(locale, "identity.signOut")}
          </button>
        </>
      ) : (
        <>
          <span className="font-semibold text-slate-600">{t(locale, "identity.signedOut")}</span>
          <a
            href={identityLoginUrl(resolvedOrigin)}
            className="font-medium text-sky-700 underline-offset-2 hover:underline"
          >
            {t(locale, "identity.signIn")}
          </a>
          <a
            href={identitySignupUrl(resolvedOrigin)}
            className="font-medium text-sky-700 underline-offset-2 hover:underline"
          >
            {t(locale, "identity.signUp")}
          </a>
        </>
      )}
    </div>
  );
}
