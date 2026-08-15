"use client";

import {
  architectureBasePricing,
  architectureTemplates,
  architectureUiConfig,
} from "@/features/mycity/mission-library/data/architectureTemplates";
import { libraryPlacementConfig } from "@/features/mycity/mission-library/data/libraryPlacementConfig";
import { calculateArchitecture } from "@/features/mycity/mission-library/logic/architecture";
import type {
  ArchitectureCalculationResult,
  LibraryFootprintInput,
  LibraryPlacementValidationResult,
} from "@/features/mycity/mission-library/types/missionTypes";

interface ArchitectureChoicePanelProps {
  footprint: LibraryFootprintInput | null;
  placementResult: LibraryPlacementValidationResult | null;
  selectedTemplateId: string | null;
  onSelect: (
    templateId: string,
    result: ArchitectureCalculationResult,
  ) => void;
}

function formatQualityLabel(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ArchitectureChoicePanel({
  footprint,
  placementResult,
  selectedTemplateId,
  onSelect,
}: ArchitectureChoicePanelProps) {
  const hasValidFootprint = Boolean(footprint && placementResult?.isValid);
  const calculationFootprint =
    hasValidFootprint && footprint
      ? footprint
      : libraryPlacementConfig.recommendedFootprint;

  return (
    <section
      id="architecture-choice"
      className="rounded-2xl border-2 border-sky-200 bg-white p-5 shadow-sm"
      aria-labelledby="architecture-choice-heading"
    >
      <h2
        id="architecture-choice-heading"
        className="text-lg font-semibold text-slate-900"
      >
        {architectureUiConfig.sectionTitle}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {architectureUiConfig.sectionDescription}
      </p>
      <p className="mt-2 text-xs italic text-slate-500">
        {architectureUiConfig.futureNote}
      </p>

      {!hasValidFootprint ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {architectureUiConfig.disabledPrompt} Preview values below use the
          recommended footprint ({libraryPlacementConfig.recommendedFootprint.a.x}
          ,{libraryPlacementConfig.recommendedFootprint.a.y}) to (
          {libraryPlacementConfig.recommendedFootprint.c.x},
          {libraryPlacementConfig.recommendedFootprint.c.y}).
        </p>
      ) : (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Footprint confirmed. Select one architecture — quantities update the
          store purchase order below.
        </p>
      )}

      <div className="mt-4 grid gap-4">
        {architectureTemplates.map((template) => {
          const result = calculateArchitecture(
            template.id,
            calculationFootprint,
          );
          if (!result) {
            return null;
          }

          const isSelected = selectedTemplateId === template.id;
          const canSelect = hasValidFootprint;

          return (
            <article
              key={template.id}
              className={`rounded-xl border-2 p-4 transition-all ${
                isSelected
                  ? "border-sky-600 bg-sky-50 ring-2 ring-sky-200"
                  : "border-slate-300 bg-white hover:border-sky-300"
              } ${!canSelect ? "opacity-90" : ""}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {template.description}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canSelect}
                  onClick={() => onSelect(template.id, result)}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    !canSelect
                      ? "cursor-not-allowed bg-slate-300 text-slate-600"
                      : isSelected
                        ? "bg-sky-800 text-white"
                        : "bg-sky-600 text-white hover:bg-sky-700"
                  }`}
                >
                  {isSelected ? "Selected" : "Select"}
                </button>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-slate-500">Indoor area</dt>
                  <dd className="font-semibold text-slate-900">
                    {result.indoorArea} m²
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-slate-500">Wall quantity</dt>
                  <dd className="font-semibold text-slate-900">
                    {result.wallQuantity} m
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-slate-500">Floor quantity</dt>
                  <dd className="font-semibold text-slate-900">
                    {result.floorQuantity} m²
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-slate-500">Est. construction cost</dt>
                  <dd className="font-semibold text-slate-900">
                    {result.estimatedBaseCost}{" "}
                    {architectureBasePricing.currencyLabel}
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-slate-500">Open space</dt>
                  <dd className="font-semibold text-slate-900">
                    {result.openSpaceArea} m²
                  </dd>
                </div>
              </dl>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Quality indicators
                  </h4>
                  <ul className="mt-2 space-y-1 text-xs text-slate-700">
                    {Object.entries(template.qualityProfile).map(
                      ([key, value]) => (
                        <li key={key}>
                          {formatQualityLabel(key)}: {formatQualityLabel(value)}
                        </li>
                      ),
                    )}
                    <li>Quality score: {result.qualityScore}/100</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Advantages
                  </h4>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                    {template.advantages.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Trade-offs
                </h4>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-900">
                  {template.tradeOffs.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              {result.warnings.length > 0 ? (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                    Warnings
                  </h4>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-rose-800">
                    {result.warnings.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {hasValidFootprint && !result.fitsInsideFootprint ? (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  This architecture does not fit comfortably inside the current
                  footprint.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
