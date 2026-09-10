import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getMissionReadiness } from "@/features/mycity/mission-library/logic/missionReadiness";
import {
  deriveComparisonResults,
  deriveGeometryResult,
  deriveMissionState,
  quantitiesFromSelections,
} from "@/features/mycity/mission-library/logic/missionRestore";
import { emptyGuidedReportAnswers } from "@/features/mycity/mission-library/data/reportConfig";
import {
  emptyCompactForm,
  emptyLShapedForm,
  emptyTwoBuildingForm,
} from "@/features/mycity/mission-library/state/architectureForms";
import {
  buildLibraryProgressPayload,
  emptyLibraryProgress,
  payloadsEquivalent,
  type LibrarySourceSnapshot,
} from "./libraryPayload";
import { completedLibraryPayload, midMissionPayload } from "./testing/fixtures";

describe("restore derivation from source inputs", () => {
  it("rebuilds a completed mission: validations, readiness, built state, score and trilingual summary", () => {
    const derived = deriveMissionState(completedLibraryPayload());
    assert.equal(derived.geometryResult?.isValid, true);
    assert.equal(derived.comparisonResults["compact-rectangle"]?.isValid, true);
    assert.equal(derived.comparisonResults["two-building"]?.isValid, true);
    assert.equal(derived.comparisonResults["l-shaped"]?.isValid, true);
    assert.equal(derived.finalArchitectureId, "compact-rectangle");
    assert.equal(derived.finalArchitecture?.wallLength, 52);
    assert.equal(derived.constructionPurchase?.isValid, true);
    assert.equal(derived.libraryItemsPurchase?.isValid, true);
    assert.equal(derived.readiness.ready, true);
    assert.equal(derived.isBuilt, true);
    assert.equal(derived.missionScore?.cappedTotal, 100);
    assert.ok(derived.reportSummary);
    assert.match(derived.reportSummary.arabic, /تقرير المهمة بالعربية/);
    assert.match(derived.reportSummary.english, /Compact Rectangle Library/);
  });

  it("derives quantities from selections and leaves untouched items at zero", () => {
    const quantities = quantitiesFromSelections([
      { itemId: "laptop", quantity: 2 },
      { itemId: "not-in-catalog", quantity: 9 },
    ]);
    assert.equal(quantities.laptop, 2);
    assert.equal(quantities["eco-wall-block"], 0);
    assert.equal("not-in-catalog" in quantities, false);
  });

  it("does not re-check geometry until both answers exist, then uses the existing validator", () => {
    assert.equal(deriveGeometryResult({ area: "216", perimeter: "" }), null);
    assert.equal(deriveGeometryResult({ area: "", perimeter: "" }), null);
    const wrong = deriveGeometryResult({ area: "200", perimeter: "60" });
    assert.equal(wrong?.isValid, false);
    assert.equal(wrong?.perimeterCorrect, true);
    assert.equal(deriveGeometryResult({ area: "216", perimeter: "60" })?.isValid, true);
  });

  it("only re-validates architectures the learner actually checked", () => {
    const payload = completedLibraryPayload();
    payload.twoBuilding = { ...payload.twoBuilding, checked: false };
    const results = deriveComparisonResults(payload);
    assert.equal(results["two-building"], undefined);
    assert.equal(results["compact-rectangle"]?.checked, true);
  });

  it("a persisted final choice whose re-validated form is now invalid is cleared, not trusted", () => {
    const payload = completedLibraryPayload();
    payload.compact = {
      ...payload.compact,
      form: { ...payload.compact.form, learnerAreaAnswer: "999" },
    };
    const derived = deriveMissionState(payload);
    assert.equal(derived.comparisonResults["compact-rectangle"]?.isValid, false);
    assert.equal(derived.finalArchitecture, null);
    assert.equal(derived.finalArchitectureId, null);
    assert.equal(derived.constructionPurchase, null);
    assert.equal(derived.readiness.ready, false);
    assert.equal(derived.isBuilt, false, "completed flag alone never shows a built library");
    assert.equal(derived.missionScore, null);
  });

  it("store validations are derived only when there is something to validate", () => {
    const derived = deriveMissionState({ ...completedLibraryPayload(), storeSelections: [] });
    assert.equal(derived.constructionPurchase, null);
    assert.equal(derived.libraryItemsPurchase, null);
    assert.equal(derived.readiness.ready, false);
  });

  it("mid-mission payload restores the plot gate and geometry but nothing downstream", () => {
    const derived = deriveMissionState(midMissionPayload());
    assert.equal(derived.geometryResult?.isValid, true);
    assert.deepEqual(derived.comparisonResults, {});
    assert.equal(derived.finalArchitecture, null);
    assert.equal(derived.isBuilt, false);
  });
});

describe("page source → payload", () => {
  function snapshot(overrides: Partial<LibrarySourceSnapshot> = {}): LibrarySourceSnapshot {
    return {
      plotInspected: false,
      areaInput: "",
      perimeterInput: "",
      compactForm: emptyCompactForm(),
      compactChecked: false,
      twoBuildingForm: emptyTwoBuildingForm(),
      twoBuildingChecked: false,
      lShapedForm: emptyLShapedForm(),
      lShapedChecked: false,
      finalArchitectureId: null,
      quantities: {},
      reportAnswers: emptyGuidedReportAnswers,
      completed: false,
      ...overrides,
    };
  }

  it("the initial page state equals the empty payload (no guest data for untouched state)", () => {
    assert.equal(payloadsEquivalent(buildLibraryProgressPayload(snapshot()), emptyLibraryProgress()), true);
  });

  it("round-trips: payload → derived page state → payload is stable", () => {
    const payload = completedLibraryPayload();
    const derived = deriveMissionState(payload);
    const rebuilt = buildLibraryProgressPayload({
      plotInspected: payload.plotInspected,
      areaInput: payload.geometry.area,
      perimeterInput: payload.geometry.perimeter,
      compactForm: payload.compact.form,
      compactChecked: Boolean(derived.comparisonResults["compact-rectangle"]?.checked),
      twoBuildingForm: payload.twoBuilding.form,
      twoBuildingChecked: Boolean(derived.comparisonResults["two-building"]?.checked),
      lShapedForm: payload.lShaped.form,
      lShapedChecked: Boolean(derived.comparisonResults["l-shaped"]?.checked),
      finalArchitectureId: derived.finalArchitectureId,
      quantities: derived.quantities,
      reportAnswers: payload.reportAnswers,
      completed: derived.isBuilt && derived.readiness.ready,
    });
    assert.equal(payloadsEquivalent(rebuilt, payload), true);
  });

  it("completed is only true when readiness holds and the learner built", () => {
    const payload = completedLibraryPayload();
    const derived = deriveMissionState(payload);
    const readiness = getMissionReadiness({
      geometry: derived.geometryResult,
      comparisonResults: derived.comparisonResults,
      finalArchitecture: derived.finalArchitecture,
      constructionPurchase: derived.constructionPurchase,
      libraryItemsPurchase: derived.libraryItemsPurchase,
      reportAnswers: payload.reportAnswers,
    });
    assert.equal(readiness.ready, true);
    const notBuilt = buildLibraryProgressPayload({
      ...snapshot(),
      plotInspected: true,
      areaInput: "216",
      perimeterInput: "60",
      completed: false && readiness.ready,
    });
    assert.equal(notBuilt.completed, false);
  });

  it("zero and invalid quantities never enter storeSelections", () => {
    const payload = buildLibraryProgressPayload(
      snapshot({ quantities: { laptop: 0, "book-pack": Number.NaN, window: 4, "eco-wall-block": -3 } }),
    );
    assert.deepEqual(payload.storeSelections, [{ itemId: "window", quantity: 4 }]);
  });
});
