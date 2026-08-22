"use client";

import { missionCompletionConfig } from "@/features/mycity/mission-library/data/completionConfig";
import { t, type I18nKey, type Locale } from "@/features/mycity/mission-library/data/i18n";
import { getMissionReadiness } from "@/features/mycity/mission-library/logic/missionReadiness";
import type {
  ArchitectureDesignResult,
  GeometryValidationResult,
  GuidedReportAnswers,
  RequiredArchitectureId,
  ScopedPurchaseValidationResult,
} from "@/features/mycity/mission-library/types/missionTypes";

const REQUIREMENT_LABEL_KEYS = [
  "geometry",
  "architectureComparison",
  "finalArchitecture",
  "constructionPurchase",
  "libraryItemsPurchase",
  "report",
] as const;

const REQUIREMENT_I18N_KEYS = {
  geometry: "build.req.geometry",
  architectureComparison: "build.req.architectureComparison",
  finalArchitecture: "build.req.finalArchitecture",
  constructionPurchase: "build.req.constructionPurchase",
  libraryItemsPurchase: "build.req.libraryItemsPurchase",
  report: "build.req.report",
} as const satisfies Record<(typeof REQUIREMENT_LABEL_KEYS)[number], I18nKey>;

interface MissionBuildPanelProps {
  locale: Locale;
  geometryResult: GeometryValidationResult | null;
  comparisonResults: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>;
  finalArchitecture: ArchitectureDesignResult | null;
  constructionPurchase: ScopedPurchaseValidationResult | null;
  libraryItemsPurchase: ScopedPurchaseValidationResult | null;
  reportAnswers: GuidedReportAnswers;
  isBuilt: boolean;
  onBuild: () => void;
}

export function MissionBuildPanel({
  locale,
  geometryResult,
  comparisonResults,
  finalArchitecture,
  constructionPurchase,
  libraryItemsPurchase,
  reportAnswers,
  isBuilt,
  onBuild,
}: MissionBuildPanelProps) {
  const readiness = getMissionReadiness({
    geometry: geometryResult,
    comparisonResults,
    finalArchitecture,
    constructionPurchase,
    libraryItemsPurchase,
    reportAnswers,
  });

  if (isBuilt) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        {t(locale, "build.button")}
      </h2>

      {readiness.ready ? (
        <p className="mt-2 text-sm text-emerald-700">{t(locale, "build.ready")}</p>
      ) : (
        <p className="mt-2 text-sm text-slate-600">{t(locale, "build.blocked")}</p>
      )}

      <ul className="mt-4 space-y-2 text-sm">
        {REQUIREMENT_LABEL_KEYS.map((key) => {
          const englishLabel = missionCompletionConfig.requirementLabels[key];
          const done = !readiness.missingSteps.includes(englishLabel);

          return (
            <li
              key={key}
              className={`rounded-lg px-3 py-2 ${
                done
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-slate-50 text-slate-600"
              }`}
            >
              {done ? "✓" : "○"} {t(locale, REQUIREMENT_I18N_KEYS[key])}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        disabled={!readiness.ready}
        onClick={onBuild}
        className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {t(locale, "build.button")}
      </button>
    </section>
  );
}
