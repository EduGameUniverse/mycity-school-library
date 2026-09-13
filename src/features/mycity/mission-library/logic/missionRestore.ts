import type { MyCityLibraryProgressV1 } from "@/features/account/progress/libraryPayload";
import {
  compactDesignInputFromForm,
  lShapedDesignInputFromForm,
  parseNumericSource,
  twoBuildingDesignInputFromForm,
} from "../state/architectureForms";
import type {
  ArchitectureDesignResult,
  GeometryValidationResult,
  MissionScore,
  RequiredArchitectureId,
  ScopedPurchaseValidationResult,
  SelectedStoreItem,
} from "../types/missionTypes";
import {
  validateCompactRectangleDesign,
  validateLShapedDesign,
  validateTwoBuildingDesign,
} from "./architectureComparison";
import { buildCompletionArtifacts } from "./missionCompletion";
import { getMissionReadiness, type MissionReadinessResult } from "./missionReadiness";
import {
  buildSelectedStoreItems,
  createEmptyQuantityMap,
  filterSelectionsByBudgetScope,
} from "./storeSelection";
import {
  validateConstructionPurchase,
  validateGeometryAnswer,
  validateGuidedReportAnswers,
  validateLibraryItemsPurchase,
} from "./validation";

export interface DerivedMissionState {
  geometryResult: GeometryValidationResult | null;
  comparisonResults: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>;
  finalArchitectureId: RequiredArchitectureId | null;
  finalArchitecture: ArchitectureDesignResult | null;
  quantities: Record<string, number>;
  selections: SelectedStoreItem[];
  constructionPurchase: ScopedPurchaseValidationResult | null;
  libraryItemsPurchase: ScopedPurchaseValidationResult | null;
  readiness: MissionReadinessResult;
  isBuilt: boolean;
  missionScore: MissionScore | null;
  reportSummary: { english: string; french: string; arabic: string } | null;
}

/** Geometry is only re-checked once both answers exist, mirroring the submit flow. */
export function deriveGeometryResult(
  geometry: MyCityLibraryProgressV1["geometry"],
): GeometryValidationResult | null {
  if (geometry.area === "" || geometry.perimeter === "") {
    return null;
  }
  return validateGeometryAnswer({
    area: parseNumericSource(geometry.area),
    perimeter: parseNumericSource(geometry.perimeter),
  });
}

export function deriveComparisonResults(
  payload: MyCityLibraryProgressV1,
): Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>> {
  const results: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>> = {};
  if (payload.compact.checked) {
    results["compact-rectangle"] = validateCompactRectangleDesign(
      compactDesignInputFromForm(payload.compact.form),
    );
  }
  if (payload.twoBuilding.checked) {
    results["two-building"] = validateTwoBuildingDesign(
      twoBuildingDesignInputFromForm(payload.twoBuilding.form),
    );
  }
  if (payload.lShaped.checked) {
    results["l-shaped"] = validateLShapedDesign(
      lShapedDesignInputFromForm(payload.lShaped.form),
    );
  }
  return results;
}

export function quantitiesFromSelections(
  selections: readonly { itemId: string; quantity: number }[],
): Record<string, number> {
  const quantities = createEmptyQuantityMap();
  for (const selection of selections) {
    if (selection.itemId in quantities) {
      quantities[selection.itemId] = selection.quantity;
    }
  }
  return quantities;
}

/**
 * Rebuild every derived value from persisted source inputs using the existing
 * validators. Nothing here invents new calculation rules.
 */
export function deriveMissionState(payload: MyCityLibraryProgressV1): DerivedMissionState {
  const geometryResult = deriveGeometryResult(payload.geometry);
  const comparisonResults = deriveComparisonResults(payload);

  const candidateFinal =
    payload.finalArchitectureId !== null
      ? comparisonResults[payload.finalArchitectureId]
      : undefined;
  const finalArchitecture = candidateFinal?.isValid ? candidateFinal : null;
  const finalArchitectureId = finalArchitecture ? payload.finalArchitectureId : null;

  const quantities = quantitiesFromSelections(payload.storeSelections);
  const selections = buildSelectedStoreItems(quantities);
  const constructionSelections = filterSelectionsByBudgetScope(selections, "construction");
  const librarySelections = filterSelectionsByBudgetScope(selections, "library-items");

  /* A purchase result exists only if the learner explicitly pressed the matching
   * "Check … order" action (and nothing invalidated it since). Restore therefore
   * recomputes a result only when that intent was persisted; otherwise the order
   * stays not-yet-validated exactly as before the refresh. Quantities alone never
   * promote readiness.
   */
  const constructionPurchase =
    finalArchitecture && payload.constructionOrderChecked
      ? validateConstructionPurchase(selections, finalArchitecture.construction)
      : null;
  const libraryItemsPurchase =
    finalArchitecture && payload.libraryItemsOrderChecked
      ? validateLibraryItemsPurchase(selections)
      : null;

  const readiness = getMissionReadiness({
    geometry: geometryResult,
    comparisonResults,
    finalArchitecture,
    constructionPurchase,
    libraryItemsPurchase,
    reportAnswers: payload.reportAnswers,
  });

  const isBuilt = payload.completed && readiness.ready;

  let missionScore: MissionScore | null = null;
  let reportSummary: DerivedMissionState["reportSummary"] = null;
  if (
    isBuilt &&
    geometryResult &&
    finalArchitecture &&
    constructionPurchase &&
    libraryItemsPurchase
  ) {
    const artifacts = buildCompletionArtifacts({
      geometryResult,
      comparisonResults,
      finalArchitecture,
      constructionPurchase,
      libraryItemsPurchase,
      reportValidation: validateGuidedReportAnswers(payload.reportAnswers),
      constructionSelections,
      librarySelections,
      reportAnswers: payload.reportAnswers,
    });
    missionScore = artifacts.score;
    reportSummary = artifacts.summary;
  }

  return {
    geometryResult,
    comparisonResults,
    finalArchitectureId,
    finalArchitecture,
    quantities,
    selections,
    constructionPurchase,
    libraryItemsPurchase,
    readiness,
    isBuilt,
    missionScore,
    reportSummary,
  };
}
