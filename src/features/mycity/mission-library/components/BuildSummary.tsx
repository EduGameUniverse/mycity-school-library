"use client";

import { t, type Locale } from "@/features/mycity/mission-library/data/i18n";
import { libraryScoringConfig } from "@/features/mycity/mission-library/data/scoringConfig";
import type { MissionScore } from "@/features/mycity/mission-library/types/missionTypes";

interface BuildSummaryProps {
  locale: Locale;
  score: MissionScore;
}

export function BuildSummary({ locale, score }: BuildSummaryProps) {
  const config = libraryScoringConfig;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-emerald-950">
        {t(locale, "summary.successTitle")}
      </h2>
      <p className="mt-2 text-sm leading-6 text-emerald-900">
        {t(locale, "summary.successMessage")}
      </p>

      <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">
          {t(locale, "summary.scoreTitle")}
        </h3>
        <p className="mt-2 text-3xl font-bold text-emerald-700">
          {score.cappedTotal}/{config.maxScore}
        </p>

        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <dt className="text-slate-500">
              {t(locale, "summary.architectureComparison")}
            </dt>
            <dd className="font-semibold">
              {score.breakdown.architectureComparison}/{config.architectureComparison}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <dt className="text-slate-500">
              {t(locale, "summary.finalArchitecture")}
            </dt>
            <dd className="font-semibold">
              {score.breakdown.finalArchitecture}/{config.finalArchitecture}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <dt className="text-slate-500">
              {t(locale, "summary.constructionBudget")}
            </dt>
            <dd className="font-semibold">
              {score.breakdown.constructionBudget}/{config.constructionBudget}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <dt className="text-slate-500">
              {t(locale, "summary.libraryItemsBudget")}
            </dt>
            <dd className="font-semibold">
              {score.breakdown.libraryItemsBudget}/{config.libraryItemsBudget}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <dt className="text-slate-500">
              {t(locale, "summary.digitalLearning")}
            </dt>
            <dd className="font-semibold">
              {score.breakdown.digitalLearning}/{config.digitalLearning}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <dt className="text-slate-500">
              {t(locale, "summary.accessibilityInclusion")}
            </dt>
            <dd className="font-semibold">
              {score.breakdown.accessibilityInclusion}/
              {config.accessibilityInclusion}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 sm:col-span-2">
            <dt className="text-slate-500">
              {t(locale, "summary.trilingualJustification")}
            </dt>
            <dd className="font-semibold">
              {score.breakdown.trilingualJustification}/
              {config.trilingualJustification}
            </dd>
          </div>
        </dl>

        {score.badges.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {score.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
