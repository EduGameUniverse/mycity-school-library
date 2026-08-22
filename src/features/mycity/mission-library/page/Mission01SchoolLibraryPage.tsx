"use client";

import { useEffect, useMemo, useState } from "react";
import { ArchitectureComparisonPanel } from "@/features/mycity/mission-library/components/ArchitectureComparisonPanel";
import { BudgetPanel } from "@/features/mycity/mission-library/components/BudgetPanel";
import { BuildSummary } from "@/features/mycity/mission-library/components/BuildSummary";
import { FinalReport } from "@/features/mycity/mission-library/components/FinalReport";
import { FootprintPreviewOverlay } from "@/features/mycity/mission-library/components/FootprintPreviewOverlay";
import { LanguageSelector } from "@/features/mycity/mission-library/components/LanguageSelector";
import { MissionBuildPanel } from "@/features/mycity/mission-library/components/MissionBuildPanel";
import { PlotOverlay } from "@/features/mycity/mission-library/components/PlotOverlay";
import { libraryBudgetConfig } from "@/features/mycity/mission-library/data/budgetConfig";
import {
  elBahdjaCampusMap,
  getCampusMapImageSrc,
} from "@/features/mycity/mission-library/data/mapConfig";
import { localeDir, t, type Locale } from "@/features/mycity/mission-library/data/i18n";
import { libraryMissionConfig } from "@/features/mycity/mission-library/data/missionConfig";
import {
  emptyGuidedReportAnswers,
} from "@/features/mycity/mission-library/data/reportConfig";
import {
  buildMissionReportData,
  generateTrilingualReports,
} from "@/features/mycity/mission-library/logic/report";
import { calculateMissionScore } from "@/features/mycity/mission-library/logic/scoring";
import {
  validateGeometryAnswer,
  validateGuidedReportAnswers,
} from "@/features/mycity/mission-library/logic/validation";
import type { FootprintPreviewData } from "@/features/mycity/mission-library/logic/coordinateProjection";
import type {
  ArchitectureDesignResult,
  GeometryValidationResult,
  GuidedReportAnswers,
  MissionScore,
  RequiredArchitectureId,
  ScopedPurchaseValidationResult,
  SelectedStoreItem,
} from "@/features/mycity/mission-library/types/missionTypes";

export function Mission01SchoolLibraryPage() {
  const { plot } = elBahdjaCampusMap;
  const { dimensions } = plot;

  const [locale, setLocale] = useState<Locale>("en");
  const [plotInspected, setPlotInspected] = useState(false);
  const [areaInput, setAreaInput] = useState("");
  const [perimeterInput, setPerimeterInput] = useState("");
  const [geometryResult, setGeometryResult] =
    useState<GeometryValidationResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<
    Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>
  >({});
  const [finalArchitecture, setFinalArchitecture] =
    useState<ArchitectureDesignResult | null>(null);
  const [finalArchitectureId, setFinalArchitectureId] =
    useState<RequiredArchitectureId | null>(null);
  const [bonusResult, setBonusResult] =
    useState<ArchitectureDesignResult | null>(null);
  const [constructionPurchase, setConstructionPurchase] =
    useState<ScopedPurchaseValidationResult | null>(null);
  const [libraryItemsPurchase, setLibraryItemsPurchase] =
    useState<ScopedPurchaseValidationResult | null>(null);
  const [constructionSelections, setConstructionSelections] = useState<
    SelectedStoreItem[]
  >([]);
  const [librarySelections, setLibrarySelections] = useState<SelectedStoreItem[]>(
    [],
  );
  const [reportAnswers, setReportAnswers] = useState<GuidedReportAnswers>(
    emptyGuidedReportAnswers,
  );
  const [isBuilt, setIsBuilt] = useState(false);
  const [missionScore, setMissionScore] = useState<MissionScore | null>(null);
  const [reportSummary, setReportSummary] = useState<{
    english: string;
    french: string;
    arabic: string;
  } | null>(null);
  const [footprintPreview, setFootprintPreview] =
    useState<FootprintPreviewData | null>(null);

  const aspectRatio = elBahdjaCampusMap.referenceImageSize
    ? `${elBahdjaCampusMap.referenceImageSize.width} / ${elBahdjaCampusMap.referenceImageSize.height}`
    : "4 / 3";

  const [mapImageSrc, setMapImageSrc] = useState(getCampusMapImageSrc(false));

  useEffect(() => {
    setMapImageSrc(getCampusMapImageSrc(isBuilt));
  }, [isBuilt]);

  const comparisonChecked = useMemo(
    () => ({
      "compact-rectangle": Boolean(comparisonResults["compact-rectangle"]?.checked),
      "two-building": Boolean(comparisonResults["two-building"]?.checked),
      "l-shaped": Boolean(comparisonResults["l-shaped"]?.checked),
    }),
    [comparisonResults],
  );

  const comparisonValid = useMemo(
    () => ({
      "compact-rectangle":
        comparisonResults["compact-rectangle"]?.isValid === true,
      "two-building": comparisonResults["two-building"]?.isValid === true,
      "l-shaped": comparisonResults["l-shaped"]?.isValid === true,
    }),
    [comparisonResults],
  );

  const reportValidation = useMemo(
    () => validateGuidedReportAnswers(reportAnswers),
    [reportAnswers],
  );

  function handleMapImageError() {
    if (mapImageSrc !== elBahdjaCampusMap.backgroundImage) {
      setMapImageSrc(elBahdjaCampusMap.backgroundImage);
    }
  }

  function resetCompletionState() {
    setIsBuilt(false);
    setMissionScore(null);
    setReportSummary(null);
  }

  function handlePlotClick() {
    setPlotInspected(true);
    setGeometryResult(null);
    resetCompletionState();
  }

  function handleGeometrySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeometryResult(
      validateGeometryAnswer({
        area: Number(areaInput),
        perimeter: Number(perimeterInput),
      }),
    );
    resetCompletionState();
  }

  function handleCheckDesign(
    architectureId: RequiredArchitectureId,
    result: ArchitectureDesignResult,
  ) {
    setComparisonResults((current) => ({
      ...current,
      [architectureId]: result,
    }));
    if (finalArchitectureId === architectureId && !result.isValid) {
      setFinalArchitecture(null);
      setFinalArchitectureId(null);
    }
    resetCompletionState();
  }

  function handleSelectFinal(
    architectureId: RequiredArchitectureId,
    result: ArchitectureDesignResult,
  ) {
    setFinalArchitectureId(architectureId);
    setFinalArchitecture(result);
    setConstructionPurchase(null);
    setLibraryItemsPurchase(null);
    resetCompletionState();
  }

  function handleBuildLibrary() {
    if (
      !geometryResult?.isValid ||
      !finalArchitecture?.isValid ||
      !constructionPurchase?.isValid ||
      !libraryItemsPurchase?.isValid ||
      !reportValidation.isValid
    ) {
      return;
    }

    const score = calculateMissionScore({
      geometry: geometryResult,
      comparisonChecked,
      comparisonValid,
      finalArchitecture,
      constructionPurchase,
      libraryItemsPurchase,
      reportValidation,
    });

    const reportData = buildMissionReportData({
      schoolName: libraryMissionConfig.schoolName,
      plotLengthM: dimensions.lengthM,
      plotWidthM: dimensions.widthM,
      plotArea: 216,
      plotPerimeter: 60,
      architectureName: finalArchitecture.architectureName,
      architectureIndoorArea: finalArchitecture.indoorArea,
      architectureWallLength: finalArchitecture.wallLength,
      constructionCost: constructionPurchase.totalCost,
      remainingConstructionBudget: constructionPurchase.remainingBudget,
      constructionBudgetLimit: libraryBudgetConfig.constructionBudget,
      libraryItemsCost: libraryItemsPurchase.totalCost,
      remainingLibraryItemsBudget: libraryItemsPurchase.remainingBudget,
      libraryItemsBudgetLimit: libraryBudgetConfig.libraryItemsBudget,
      constructionSelections,
      librarySelections,
      learnerAnswers: reportAnswers,
      finalScore: score.cappedTotal,
      currencyLabel: libraryBudgetConfig.currencyLabel,
    });

    setMissionScore(score);
    setReportSummary(generateTrilingualReports(reportData));
    setIsBuilt(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div
        className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8"
        dir={localeDir(locale)}
        lang={locale}
      >
        <header className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-sm font-medium uppercase tracking-wide text-sky-700">
              {libraryMissionConfig.schoolName}
            </p>
            <LanguageSelector locale={locale} onChange={setLocale} />
          </div>
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
            {t(locale, "mission.title")}
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
            {t(locale, "mission.inspectPlot")}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div
              className="relative w-full bg-slate-200"
              style={{ aspectRatio }}
            >
              <img
                src={mapImageSrc}
                alt={t(locale, "mission.mapAlt")}
                className="absolute inset-0 h-full w-full object-contain"
                onError={handleMapImageError}
              />

              {!isBuilt ? (
                <>
                  <PlotOverlay
                    plot={plot}
                    inspected={plotInspected}
                    onPlotClick={handlePlotClick}
                  />
                  {geometryResult?.isValid ? (
                    <FootprintPreviewOverlay
                      plot={plot}
                      preview={footprintPreview}
                    />
                  ) : null}
                </>
              ) : (
                <div className="absolute inset-x-0 bottom-3 flex justify-center px-3">
                  <span className="rounded-lg bg-emerald-700/90 px-4 py-2 text-sm font-semibold text-white">
                    {t(locale, "mission.libraryCompleted")}
                  </span>
                </div>
              )}

              {!plotInspected && !isBuilt ? (
                <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-slate-900/75 px-3 py-2 text-xs text-white sm:text-sm">
                  {t(locale, "mission.clickPlotHint")}
                </div>
              ) : null}
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            {!plotInspected ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                {t(locale, "mission.selectPlotHint")}
              </div>
            ) : (
              <>
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t(locale, "mission.plotLabel")}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {t(locale, "mission.plotDimensions")}
                  </p>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-slate-500">{t(locale, "mission.length")}</dt>
                      <dd className="mt-1 text-lg font-semibold">
                        {dimensions.lengthM} {t(locale, "mission.lengthUnit")}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-slate-500">{t(locale, "mission.width")}</dt>
                      <dd className="mt-1 text-lg font-semibold">
                        {dimensions.widthM} {t(locale, "mission.widthUnit")}
                      </dd>
                    </div>
                    <div className="col-span-2 rounded-lg bg-sky-50 p-3">
                      <dt className="text-sky-800">{t(locale, "mission.budgetsTitle")}</dt>
                      <dd className="mt-1 text-sm font-semibold text-sky-900">
                        {t(locale, "mission.constructionBudget")}:{" "}
                        {libraryBudgetConfig.constructionBudget}{" "}
                        {libraryBudgetConfig.currencyLabel}
                        <br />
                        {t(locale, "mission.libraryItemsBudget")}:{" "}
                        {libraryBudgetConfig.libraryItemsBudget}{" "}
                        {libraryBudgetConfig.currencyLabel}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-800">
                      {t(locale, "mission.objectiveTitle")}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {t(locale, "mission.objective")}
                    </p>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t(locale, "mission.geometryTitle")}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {t(locale, "mission.geometryHint")}
                  </p>
                  <div className="mt-3 space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:text-sm">
                    <p>{t(locale, "mission.formulaArea")}</p>
                    <p>{t(locale, "mission.formulaPerimeter")}</p>
                  </div>

                  <form className="mt-4 space-y-4" onSubmit={handleGeometrySubmit}>
                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">
                        {t(locale, "mission.area")}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={areaInput}
                          onChange={(event) => setAreaInput(event.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          required
                        />
                        <span className="shrink-0 text-slate-500">
                          {t(locale, "mission.areaUnit")}
                        </span>
                      </div>
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">
                        {t(locale, "mission.perimeter")}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={perimeterInput}
                          onChange={(event) =>
                            setPerimeterInput(event.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          required
                        />
                        <span className="shrink-0 text-slate-500">
                          {t(locale, "mission.perimeterUnit")}
                        </span>
                      </div>
                    </label>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
                    >
                      {t(locale, "mission.checkAnswers")}
                    </button>
                  </form>

                  {geometryResult ? (
                    <div
                      className={`mt-4 rounded-lg border p-4 text-sm ${
                        geometryResult.isValid
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-amber-200 bg-amber-50 text-amber-950"
                      }`}
                    >
                      {geometryResult.isValid ? (
                        <p className="font-semibold">
                          {t(locale, "mission.geometryCorrect")}
                        </p>
                      ) : (
                        <ul className="list-disc space-y-1 ps-5">
                          {geometryResult.errors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </section>
              </>
            )}
          </aside>
        </div>

        {plotInspected ? (
          <>
            <ArchitectureComparisonPanel
              locale={locale}
              comparisonResults={comparisonResults}
              finalArchitectureId={finalArchitectureId}
              bonusResult={bonusResult}
              onCheckDesign={handleCheckDesign}
              onSelectFinal={handleSelectFinal}
              onCheckBonus={setBonusResult}
              onFootprintPreviewChange={setFootprintPreview}
            />

            <BudgetPanel
              locale={locale}
              finalArchitecture={finalArchitecture}
              onConstructionChange={(result, selections) => {
                setConstructionPurchase(result);
                setConstructionSelections(selections);
                resetCompletionState();
              }}
              onLibraryItemsChange={(result, selections) => {
                setLibraryItemsPurchase(result);
                setLibrarySelections(selections);
                resetCompletionState();
              }}
            />
          </>
        ) : null}

        {geometryResult?.isValid ? (
          <>
            <FinalReport
              locale={locale}
              answers={reportAnswers}
              onChange={(answers) => {
                setReportAnswers(answers);
                resetCompletionState();
              }}
              summary={reportSummary}
            />

            <MissionBuildPanel
              locale={locale}
              geometryResult={geometryResult}
              comparisonResults={comparisonResults}
              finalArchitecture={finalArchitecture}
              constructionPurchase={constructionPurchase}
              libraryItemsPurchase={libraryItemsPurchase}
              reportAnswers={reportAnswers}
              isBuilt={isBuilt}
              onBuild={handleBuildLibrary}
            />
          </>
        ) : null}

        {isBuilt && missionScore ? (
          <BuildSummary locale={locale} score={missionScore} />
        ) : null}
      </div>
    </div>
  );
}
