"use client";

import { missionCompletionConfig } from "@/features/mycity/mission-library/data/completionConfig";
import { getMissionReadiness } from "@/features/mycity/mission-library/logic/missionReadiness";
import type {
  ArchitectureDesignResult,
  GeometryValidationResult,
  GuidedReportAnswers,
  RequiredArchitectureId,
  ScopedPurchaseValidationResult,
} from "@/features/mycity/mission-library/types/missionTypes";

interface MissionBuildPanelProps {
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
        {missionCompletionConfig.buildButtonLabel}
      </h2>

      {readiness.ready ? (
        <p className="mt-2 text-sm text-emerald-700">
          {missionCompletionConfig.buildReadyMessage}
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-600">
          {missionCompletionConfig.buildBlockedMessage}
        </p>
      )}

      <ul className="mt-4 space-y-2 text-sm">
        {Object.values(missionCompletionConfig.requirementLabels).map((label) => {
          const done = !readiness.missingSteps.includes(label);

          return (
            <li
              key={label}
              className={`rounded-lg px-3 py-2 ${
                done
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-slate-50 text-slate-600"
              }`}
            >
              {done ? "✓" : "○"} {label}
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
        {missionCompletionConfig.buildButtonLabel}
      </button>
    </section>
  );
}
