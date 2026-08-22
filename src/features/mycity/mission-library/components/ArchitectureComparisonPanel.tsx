"use client";

import { useEffect, useMemo, useState } from "react";
import { requiredArchitectureIds, requiredArchitectureProfiles } from "@/features/mycity/mission-library/data/architectureComparisonConfig";
import { t, type Locale } from "@/features/mycity/mission-library/data/i18n";
import {
  canSelectFinalArchitecture,
  canUnlockBonusChallenge,
  getComparisonRows,
  validateCompactRectangleDesign,
  validateCourtyardDesign,
  validateLShapedDesign,
  validateTwoBuildingDesign,
} from "@/features/mycity/mission-library/logic/architectureComparison";
import {
  getCompactRectanglePreviewFromCorners,
  getLShapedPreview,
  getTwoBuildingPreview,
  type FootprintPreviewData,
} from "@/features/mycity/mission-library/logic/coordinateProjection";
import type {
  ArchitectureDesignResult,
  CompactRectangleDesignInput,
  CourtyardDesignInput,
  LShapedDesignInput,
  RequiredArchitectureId,
  TwoBuildingDesignInput,
} from "@/features/mycity/mission-library/types/missionTypes";

interface ArchitectureComparisonPanelProps {
  locale: Locale;
  comparisonResults: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>;
  finalArchitectureId: RequiredArchitectureId | null;
  bonusResult: ArchitectureDesignResult | null;
  onCheckDesign: (
    architectureId: RequiredArchitectureId,
    result: ArchitectureDesignResult,
  ) => void;
  onSelectFinal: (
    architectureId: RequiredArchitectureId,
    result: ArchitectureDesignResult,
  ) => void;
  onCheckBonus: (result: ArchitectureDesignResult) => void;
  onFootprintPreviewChange?: (preview: FootprintPreviewData | null) => void;
}

function CoordinateExplanation({ locale }: { locale: Locale }) {
  return (
    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-950">
      <p>{t(locale, "architecture.coordinateExplanation")}</p>
      <p className="mt-2 text-xs text-sky-900">
        {t(locale, "architecture.coordinateNote")}
      </p>
    </div>
  );
}

function CheckedDesignSummary({
  locale,
  result,
}: {
  locale: Locale;
  result: ArchitectureDesignResult;
}) {
  const showDimensions =
    result.computedLength !== undefined && result.computedWidth !== undefined;

  return (
    <div
      className={`mt-4 rounded-lg border p-4 text-sm ${
        result.isValid
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-rose-200 bg-rose-50 text-rose-950"
      }`}
    >
      <p className="font-semibold">
        {result.isValid
          ? t(locale, "architecture.validDesign")
          : t(locale, "architecture.needsCorrections")}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {showDimensions ? (
          <>
            <div>
              <dt className="text-xs uppercase text-slate-500">
                {t(locale, "architecture.length")}
              </dt>
              <dd className="font-semibold">{result.computedLength} m</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">
                {t(locale, "architecture.width")}
              </dt>
              <dd className="font-semibold">{result.computedWidth} m</dd>
            </div>
          </>
        ) : null}
        <div>
          <dt className="text-xs uppercase text-slate-500">
            {t(locale, "architecture.indoorArea")}
          </dt>
          <dd className="font-semibold">{result.indoorArea} m²</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">
            {t(locale, "architecture.wallLength")}
          </dt>
          <dd className="font-semibold">{result.wallLength} m</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">
            {t(locale, "architecture.floorQuantity")}
          </dt>
          <dd className="font-semibold">{result.floorQuantity} m²</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-slate-500">
            {t(locale, "architecture.estCost")}
          </dt>
          <dd className="font-semibold">
            {result.estimatedConstructionCost} EduCoins
          </dd>
        </div>
      </dl>
      {result.errors.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 ps-5">
          {result.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      {result.warnings.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 ps-5 text-amber-900">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3">
        <p className="text-xs font-semibold uppercase text-slate-500">
          {t(locale, "architecture.tradeOffs")}
        </p>
        <ul className="mt-1 list-disc space-y-1 ps-5">
          {result.tradeOffs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-sky-500 focus:border-sky-500 focus:ring-2"
      />
    </label>
  );
}

export function ArchitectureComparisonPanel({
  locale,
  comparisonResults,
  finalArchitectureId,
  bonusResult,
  onCheckDesign,
  onSelectFinal,
  onCheckBonus,
  onFootprintPreviewChange,
}: ArchitectureComparisonPanelProps) {
  const [activePreviewId, setActivePreviewId] =
    useState<RequiredArchitectureId>("compact-rectangle");
  const [compactForm, setCompactForm] = useState({
    aPrimeX: "",
    aPrimeY: "",
    bPrimeX: "",
    bPrimeY: "",
    cPrimeX: "",
    cPrimeY: "",
    dPrimeX: "",
    dPrimeY: "",
    learnerAreaAnswer: "",
    learnerWallLengthAnswer: "",
  });
  const [twoBuildingForm, setTwoBuildingForm] = useState({
    x1: "0",
    y1: "0",
    length1: "",
    width1: "",
    x2: "",
    y2: "",
    length2: "",
    width2: "",
    learnerTotalAreaAnswer: "",
    learnerTotalWallLengthAnswer: "",
  });
  const [lShapedForm, setLShapedForm] = useState({
    x: "0",
    y: "0",
    outerLength: "",
    outerWidth: "",
    cutoutLength: "",
    cutoutWidth: "",
    learnerIndoorAreaAnswer: "",
    learnerWallLengthAnswer: "",
  });
  const [courtyardForm, setCourtyardForm] = useState({
    x: "0",
    y: "0",
    outerLength: "",
    outerWidth: "",
    courtyardLength: "",
    courtyardWidth: "",
    learnerIndoorAreaAnswer: "",
    learnerWallLengthAnswer: "",
  });

  const comparisonRows = getComparisonRows(comparisonResults);
  const canSelectFinal = canSelectFinalArchitecture(comparisonResults);
  const bonusUnlocked = canUnlockBonusChallenge(comparisonResults);

  function parseForm(values: Record<string, string>): Record<string, number> {
    return Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, Number(value)]),
    );
  }

  function parseCompactCorners(
    values: Record<string, string>,
  ): CompactRectangleDesignInput {
    const parsed = parseForm(values);

    return {
      aPrime: { x: parsed.aPrimeX, y: parsed.aPrimeY },
      bPrime: { x: parsed.bPrimeX, y: parsed.bPrimeY },
      cPrime: { x: parsed.cPrimeX, y: parsed.cPrimeY },
      dPrime: { x: parsed.dPrimeX, y: parsed.dPrimeY },
      learnerAreaAnswer: parsed.learnerAreaAnswer,
      learnerWallLengthAnswer: parsed.learnerWallLengthAnswer,
    };
  }

  function getCompactPreview(
    values: Record<string, string>,
  ): FootprintPreviewData | null {
    const corners = parseCompactCorners(values);
    return getCompactRectanglePreviewFromCorners(corners);
  }

  const compactPreviewValues = useMemo(
    () => getCompactPreview(compactForm),
    [compactForm],
  );

  useEffect(() => {
    if (!onFootprintPreviewChange) {
      return;
    }

    const parsedTwoBuilding = parseForm(twoBuildingForm);
    const parsedLShaped = parseForm(lShapedForm);

    let preview: FootprintPreviewData | null = null;

    if (activePreviewId === "compact-rectangle") {
      preview = getCompactPreview(compactForm);
    } else if (activePreviewId === "two-building") {
      preview = getTwoBuildingPreview(
        {
          x: parsedTwoBuilding.x1,
          y: parsedTwoBuilding.y1,
          length: parsedTwoBuilding.length1,
          width: parsedTwoBuilding.width1,
        },
        {
          x: parsedTwoBuilding.x2,
          y: parsedTwoBuilding.y2,
          length: parsedTwoBuilding.length2,
          width: parsedTwoBuilding.width2,
        },
      );
    } else if (activePreviewId === "l-shaped") {
      preview = getLShapedPreview(
        parsedLShaped.x,
        parsedLShaped.y,
        parsedLShaped.outerLength,
        parsedLShaped.outerWidth,
        parsedLShaped.cutoutLength,
        parsedLShaped.cutoutWidth,
      );
    }

    onFootprintPreviewChange(preview);
  }, [
    activePreviewId,
    compactForm,
    twoBuildingForm,
    lShapedForm,
    onFootprintPreviewChange,
  ]);

  function handleCheckCompact() {
    onCheckDesign(
      "compact-rectangle",
      validateCompactRectangleDesign(parseCompactCorners(compactForm)),
    );
  }

  function handleCheckTwoBuilding() {
    const parsed = parseForm(twoBuildingForm);
    const input: TwoBuildingDesignInput = {
      building1: {
        x: parsed.x1,
        y: parsed.y1,
        length: parsed.length1,
        width: parsed.width1,
      },
      building2: {
        x: parsed.x2,
        y: parsed.y2,
        length: parsed.length2,
        width: parsed.width2,
      },
      learnerTotalAreaAnswer: parsed.learnerTotalAreaAnswer,
      learnerTotalWallLengthAnswer: parsed.learnerTotalWallLengthAnswer,
    };
    onCheckDesign("two-building", validateTwoBuildingDesign(input));
  }

  function handleCheckLShaped() {
    const parsed = parseForm(lShapedForm);
    const values: LShapedDesignInput = {
      x: parsed.x,
      y: parsed.y,
      outerLength: parsed.outerLength,
      outerWidth: parsed.outerWidth,
      cutoutLength: parsed.cutoutLength,
      cutoutWidth: parsed.cutoutWidth,
      learnerIndoorAreaAnswer: parsed.learnerIndoorAreaAnswer,
      learnerWallLengthAnswer: parsed.learnerWallLengthAnswer,
    };
    onCheckDesign("l-shaped", validateLShapedDesign(values));
  }

  function handleCheckCourtyard() {
    const parsed = parseForm(courtyardForm);
    const values: CourtyardDesignInput = {
      x: parsed.x,
      y: parsed.y,
      outerLength: parsed.outerLength,
      outerWidth: parsed.outerWidth,
      courtyardLength: parsed.courtyardLength,
      courtyardWidth: parsed.courtyardWidth,
      learnerIndoorAreaAnswer: parsed.learnerIndoorAreaAnswer,
      learnerWallLengthAnswer: parsed.learnerWallLengthAnswer,
    };
    onCheckBonus(validateCourtyardDesign(values));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        {t(locale, "architecture.sectionTitle")}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {t(locale, "architecture.sectionDescription")}
      </p>
      <p className="mt-2 text-xs italic text-slate-500">
        {t(locale, "architecture.plotConstraints")}
      </p>
      <CoordinateExplanation locale={locale} />

      {requiredArchitectureIds.map((architectureId) => {
        const profile = requiredArchitectureProfiles[architectureId];
        const result = comparisonResults[architectureId];

        return (
          <article
            key={architectureId}
            className="mt-6 rounded-xl border border-slate-200 p-4"
            onFocusCapture={() => setActivePreviewId(architectureId)}
          >
            <h3 className="text-base font-semibold text-slate-900">
              {profile.name}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{profile.description}</p>

            {architectureId === "compact-rectangle" ? (
              <>
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                  {t(locale, "architecture.compactInstruction")}
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-800">
                      {t(locale, "architecture.aPrimeBottomLeft")}
                    </p>
                    <NumberField label={t(locale, "architecture.aPrimeX")} value={compactForm.aPrimeX} onChange={(value) => { setActivePreviewId("compact-rectangle"); setCompactForm((current) => ({ ...current, aPrimeX: value })); }} />
                    <NumberField label={t(locale, "architecture.aPrimeY")} value={compactForm.aPrimeY} onChange={(value) => { setActivePreviewId("compact-rectangle"); setCompactForm((current) => ({ ...current, aPrimeY: value })); }} />
                  </div>
                  <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-800">
                      {t(locale, "architecture.bPrimeBottomRight")}
                    </p>
                    <NumberField label={t(locale, "architecture.bPrimeX")} value={compactForm.bPrimeX} onChange={(value) => { setActivePreviewId("compact-rectangle"); setCompactForm((current) => ({ ...current, bPrimeX: value })); }} />
                    <NumberField label={t(locale, "architecture.bPrimeY")} value={compactForm.bPrimeY} onChange={(value) => { setActivePreviewId("compact-rectangle"); setCompactForm((current) => ({ ...current, bPrimeY: value })); }} />
                  </div>
                  <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-800">
                      {t(locale, "architecture.cPrimeTopRight")}
                    </p>
                    <NumberField label={t(locale, "architecture.cPrimeX")} value={compactForm.cPrimeX} onChange={(value) => { setActivePreviewId("compact-rectangle"); setCompactForm((current) => ({ ...current, cPrimeX: value })); }} />
                    <NumberField label={t(locale, "architecture.cPrimeY")} value={compactForm.cPrimeY} onChange={(value) => { setActivePreviewId("compact-rectangle"); setCompactForm((current) => ({ ...current, cPrimeY: value })); }} />
                  </div>
                  <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-800">
                      {t(locale, "architecture.dPrimeTopLeft")}
                    </p>
                    <NumberField label={t(locale, "architecture.dPrimeX")} value={compactForm.dPrimeX} onChange={(value) => { setActivePreviewId("compact-rectangle"); setCompactForm((current) => ({ ...current, dPrimeX: value })); }} />
                    <NumberField label={t(locale, "architecture.dPrimeY")} value={compactForm.dPrimeY} onChange={(value) => { setActivePreviewId("compact-rectangle"); setCompactForm((current) => ({ ...current, dPrimeY: value })); }} />
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <NumberField label={t(locale, "architecture.yourAreaAnswer")} value={compactForm.learnerAreaAnswer} onChange={(value) => setCompactForm((current) => ({ ...current, learnerAreaAnswer: value }))} />
                  <NumberField label={t(locale, "architecture.yourWallLengthAnswer")} value={compactForm.learnerWallLengthAnswer} onChange={(value) => setCompactForm((current) => ({ ...current, learnerWallLengthAnswer: value }))} />
                </div>
              </>
            ) : null}

            {architectureId === "compact-rectangle" && compactPreviewValues ? (
              <p className="mt-2 text-xs text-slate-600">
                {t(locale, "architecture.previewUpdated")}
              </p>
            ) : null}

            {architectureId === "two-building" ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {t(locale, "architecture.building1")}
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <NumberField label={t(locale, "architecture.x1")} value={twoBuildingForm.x1} onChange={(value) => setTwoBuildingForm((current) => ({ ...current, x1: value }))} />
                    <NumberField label={t(locale, "architecture.y1")} value={twoBuildingForm.y1} onChange={(value) => setTwoBuildingForm((current) => ({ ...current, y1: value }))} />
                    <NumberField label={t(locale, "architecture.length1")} value={twoBuildingForm.length1} onChange={(value) => setTwoBuildingForm((current) => ({ ...current, length1: value }))} />
                    <NumberField label={t(locale, "architecture.width1")} value={twoBuildingForm.width1} onChange={(value) => setTwoBuildingForm((current) => ({ ...current, width1: value }))} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {t(locale, "architecture.building2")}
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <NumberField label={t(locale, "architecture.x2")} value={twoBuildingForm.x2} onChange={(value) => setTwoBuildingForm((current) => ({ ...current, x2: value }))} />
                    <NumberField label={t(locale, "architecture.y2")} value={twoBuildingForm.y2} onChange={(value) => setTwoBuildingForm((current) => ({ ...current, y2: value }))} />
                    <NumberField label={t(locale, "architecture.length2")} value={twoBuildingForm.length2} onChange={(value) => setTwoBuildingForm((current) => ({ ...current, length2: value }))} />
                    <NumberField label={t(locale, "architecture.width2")} value={twoBuildingForm.width2} onChange={(value) => setTwoBuildingForm((current) => ({ ...current, width2: value }))} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField label={t(locale, "architecture.yourTotalAreaAnswer")} value={twoBuildingForm.learnerTotalAreaAnswer} onChange={(value) => setTwoBuildingForm((current) => ({ ...current, learnerTotalAreaAnswer: value }))} />
                  <NumberField label={t(locale, "architecture.yourTotalWallLengthAnswer")} value={twoBuildingForm.learnerTotalWallLengthAnswer} onChange={(value) => setTwoBuildingForm((current) => ({ ...current, learnerTotalWallLengthAnswer: value }))} />
                </div>
              </div>
            ) : null}

            {architectureId === "l-shaped" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <NumberField label={t(locale, "architecture.xPosition")} value={lShapedForm.x} onChange={(value) => setLShapedForm((current) => ({ ...current, x: value }))} />
                <NumberField label={t(locale, "architecture.yPosition")} value={lShapedForm.y} onChange={(value) => setLShapedForm((current) => ({ ...current, y: value }))} />
                <NumberField label={t(locale, "architecture.outerLength")} value={lShapedForm.outerLength} onChange={(value) => setLShapedForm((current) => ({ ...current, outerLength: value }))} />
                <NumberField label={t(locale, "architecture.outerWidth")} value={lShapedForm.outerWidth} onChange={(value) => setLShapedForm((current) => ({ ...current, outerWidth: value }))} />
                <NumberField label={t(locale, "architecture.cutoutLength")} value={lShapedForm.cutoutLength} onChange={(value) => setLShapedForm((current) => ({ ...current, cutoutLength: value }))} />
                <NumberField label={t(locale, "architecture.cutoutWidth")} value={lShapedForm.cutoutWidth} onChange={(value) => setLShapedForm((current) => ({ ...current, cutoutWidth: value }))} />
                <NumberField label={t(locale, "architecture.yourIndoorAreaAnswer")} value={lShapedForm.learnerIndoorAreaAnswer} onChange={(value) => setLShapedForm((current) => ({ ...current, learnerIndoorAreaAnswer: value }))} />
                <NumberField label={t(locale, "architecture.yourWallLengthAnswer")} value={lShapedForm.learnerWallLengthAnswer} onChange={(value) => setLShapedForm((current) => ({ ...current, learnerWallLengthAnswer: value }))} />
              </div>
            ) : null}

            <button
              type="button"
              onClick={
                architectureId === "compact-rectangle"
                  ? handleCheckCompact
                  : architectureId === "two-building"
                    ? handleCheckTwoBuilding
                    : handleCheckLShaped
              }
              className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              {t(locale, "architecture.checkButton")}
            </button>

            {result?.checked ? (
              <CheckedDesignSummary locale={locale} result={result} />
            ) : null}
          </article>
        );
      })}

      {comparisonRows.length === 3 ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
          <h3 className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900">
            {t(locale, "architecture.comparisonTableTitle")}
          </h3>
          <table className="min-w-full text-start text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">{t(locale, "architecture.col.architecture")}</th>
                <th className="px-4 py-3">{t(locale, "architecture.col.indoorArea")}</th>
                <th className="px-4 py-3">{t(locale, "architecture.col.wallLength")}</th>
                <th className="px-4 py-3">{t(locale, "architecture.col.floorQty")}</th>
                <th className="px-4 py-3">{t(locale, "architecture.col.estCost")}</th>
                <th className="px-4 py-3">{t(locale, "architecture.col.costEff")}</th>
                <th className="px-4 py-3">{t(locale, "architecture.col.comfort")}</th>
                <th className="px-4 py-3">{t(locale, "architecture.col.creativity")}</th>
                <th className="px-4 py-3">{t(locale, "architecture.col.access")}</th>
                <th className="px-4 py-3">{t(locale, "architecture.col.digital")}</th>
                <th className="px-4 py-3">{t(locale, "architecture.col.status")}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.architectureId} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium">{row.architectureName}</td>
                  <td className="px-4 py-3">{row.indoorArea} m²</td>
                  <td className="px-4 py-3">{row.wallLength} m</td>
                  <td className="px-4 py-3">{row.floorQuantity} m²</td>
                  <td className="px-4 py-3">{row.estimatedConstructionCost}</td>
                  <td className="px-4 py-3">{row.costEfficiencyScore}</td>
                  <td className="px-4 py-3">{row.comfortScore}</td>
                  <td className="px-4 py-3">{row.creativityScore}</td>
                  <td className="px-4 py-3">{row.accessibilityScore}</td>
                  <td className="px-4 py-3">{row.digitalLearningFitScore}</td>
                  <td className="px-4 py-3">
                    {row.isValid
                      ? t(locale, "architecture.statusValid")
                      : t(locale, "architecture.statusInvalid")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {comparisonRows.some((row) => row.warnings.length > 0) ? (
            <div className="border-t border-slate-200 px-4 py-3 text-xs text-amber-900">
              {comparisonRows.map((row) =>
                row.warnings.length > 0 ? (
                  <p key={row.architectureId}>
                    <strong>{row.architectureName}:</strong>{" "}
                    {row.warnings.join(" ")}
                  </p>
                ) : null,
              )}
            </div>
          ) : null}
          <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
            {t(locale, "architecture.compareYourself")}
          </p>
        </div>
      ) : null}

      {canSelectFinal ? (
        <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4">
          <h3 className="text-sm font-semibold text-sky-950">
            {t(locale, "architecture.finalSelectionTitle")}
          </h3>
          <p className="mt-1 text-sm text-sky-900">
            {t(locale, "architecture.finalSelectionHint")}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {comparisonRows
              .filter((row) => row.isValid)
              .map((row) => (
                <button
                  key={row.architectureId}
                  type="button"
                  onClick={() =>
                    onSelectFinal(
                      row.architectureId as RequiredArchitectureId,
                      row,
                    )
                  }
                  className={`rounded-lg px-4 py-2 text-left text-sm font-semibold ${
                    finalArchitectureId === row.architectureId
                      ? "bg-sky-800 text-white"
                      : "bg-white text-sky-900 ring-1 ring-sky-300 hover:bg-sky-100"
                  }`}
                >
                  {t(locale, "architecture.selectDesign").replace(
                    "{name}",
                    row.architectureName,
                  )}
                </button>
              ))}
          </div>
        </div>
      ) : null}

      {bonusUnlocked ? (
        <article className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-base font-semibold text-amber-950">
            {t(locale, "architecture.bonusTitle")}
          </h3>
          <p className="mt-1 text-sm text-amber-900">
            {t(locale, "architecture.bonusDescription")}
          </p>
          <p className="mt-2 text-xs italic text-amber-800">
            {t(locale, "architecture.circularNote")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <NumberField label={t(locale, "architecture.xPosition")} value={courtyardForm.x} onChange={(value) => setCourtyardForm((current) => ({ ...current, x: value }))} />
            <NumberField label={t(locale, "architecture.yPosition")} value={courtyardForm.y} onChange={(value) => setCourtyardForm((current) => ({ ...current, y: value }))} />
            <NumberField label={t(locale, "architecture.outerLength")} value={courtyardForm.outerLength} onChange={(value) => setCourtyardForm((current) => ({ ...current, outerLength: value }))} />
            <NumberField label={t(locale, "architecture.outerWidth")} value={courtyardForm.outerWidth} onChange={(value) => setCourtyardForm((current) => ({ ...current, outerWidth: value }))} />
            <NumberField label={t(locale, "architecture.courtyardLength")} value={courtyardForm.courtyardLength} onChange={(value) => setCourtyardForm((current) => ({ ...current, courtyardLength: value }))} />
            <NumberField label={t(locale, "architecture.courtyardWidth")} value={courtyardForm.courtyardWidth} onChange={(value) => setCourtyardForm((current) => ({ ...current, courtyardWidth: value }))} />
            <NumberField label={t(locale, "architecture.yourIndoorAreaAnswer")} value={courtyardForm.learnerIndoorAreaAnswer} onChange={(value) => setCourtyardForm((current) => ({ ...current, learnerIndoorAreaAnswer: value }))} />
            <NumberField label={t(locale, "architecture.yourWallLengthAnswer")} value={courtyardForm.learnerWallLengthAnswer} onChange={(value) => setCourtyardForm((current) => ({ ...current, learnerWallLengthAnswer: value }))} />
          </div>
          <button
            type="button"
            onClick={handleCheckCourtyard}
            className="mt-4 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            {t(locale, "architecture.checkBonus")}
          </button>
          {bonusResult?.checked ? (
            <CheckedDesignSummary locale={locale} result={bonusResult} />
          ) : null}
        </article>
      ) : null}
    </section>
  );
}
