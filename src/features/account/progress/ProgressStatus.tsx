"use client";

import { t, type I18nKey, type Locale } from "@/features/mycity/mission-library/data/i18n";
import type { ProgressUiStatus } from "./restoreSync";

const STATUS_KEYS: Record<Exclude<ProgressUiStatus, "idle">, I18nKey> = {
  restoring: "progress.restoring",
  saving: "progress.saving",
  saved: "progress.saved",
  save_failed: "progress.saveFailed",
  migrating: "progress.migrating",
  migrated: "progress.migrated",
  migration_failed: "progress.migrationFailed",
  conflict_kept_local: "progress.conflictKeptLocal",
  guest_retained: "progress.guestRetained",
  owner_changed: "progress.ownerChanged",
};

const RETRYABLE: ReadonlySet<ProgressUiStatus> = new Set([
  "save_failed",
  "migration_failed",
  "owner_changed",
]);

/** EN/FR/AR persistence status region; hidden while idle. */
export function ProgressStatus({
  locale,
  status,
  onRetry,
}: {
  locale: Locale;
  status: ProgressUiStatus;
  onRetry: () => void;
}) {
  if (status === "idle") {
    return null;
  }

  return (
    <div
      data-testid="progress-status"
      data-status={status}
      className="flex flex-wrap items-center gap-2 text-xs text-slate-600 sm:text-sm"
    >
      <p role="status">{t(locale, STATUS_KEYS[status])}</p>
      {RETRYABLE.has(status) ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 hover:bg-slate-200"
        >
          {t(locale, "progress.retry")}
        </button>
      ) : null}
    </div>
  );
}
