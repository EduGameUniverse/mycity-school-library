import { libraryBudgetConfig } from "../data/budgetConfig";
import { elBahdjaCampusMap } from "../data/mapConfig";
import { libraryMissionConfig } from "../data/missionConfig";
import type {
  ArchitectureDesignResult,
  GeometryValidationResult,
  GuidedReportAnswers,
  MissionScore,
  ReportValidationResult,
  RequiredArchitectureId,
  ScopedPurchaseValidationResult,
  SelectedStoreItem,
} from "../types/missionTypes";
import { buildMissionReportData, generateTrilingualReports } from "./report";
import { calculateMissionScore } from "./scoring";

export interface CompletionArtifactsInput {
  geometryResult: GeometryValidationResult;
  comparisonResults: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>;
  finalArchitecture: ArchitectureDesignResult;
  constructionPurchase: ScopedPurchaseValidationResult;
  libraryItemsPurchase: ScopedPurchaseValidationResult;
  reportValidation: ReportValidationResult;
  constructionSelections: SelectedStoreItem[];
  librarySelections: SelectedStoreItem[];
  reportAnswers: GuidedReportAnswers;
}

export interface CompletionArtifacts {
  score: MissionScore;
  summary: { english: string; french: string; arabic: string };
}

export function comparisonCheckedFlags(
  comparisonResults: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>,
): Record<RequiredArchitectureId, boolean> {
  return {
    "compact-rectangle": Boolean(comparisonResults["compact-rectangle"]?.checked),
    "two-building": Boolean(comparisonResults["two-building"]?.checked),
    "l-shaped": Boolean(comparisonResults["l-shaped"]?.checked),
  };
}

export function comparisonValidFlags(
  comparisonResults: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>,
): Record<RequiredArchitectureId, boolean> {
  return {
    "compact-rectangle": comparisonResults["compact-rectangle"]?.isValid === true,
    "two-building": comparisonResults["two-building"]?.isValid === true,
    "l-shaped": comparisonResults["l-shaped"]?.isValid === true,
  };
}

/**
 * Score and trilingual summary produced when the learner builds the library.
 * This is the exact logic formerly inlined in the page's build handler; it is
 * shared with restore so a completed mission derives the same artifacts.
 */
export function buildCompletionArtifacts(input: CompletionArtifactsInput): CompletionArtifacts {
  const { dimensions } = elBahdjaCampusMap.plot;

  const score = calculateMissionScore({
    geometry: input.geometryResult,
    comparisonChecked: comparisonCheckedFlags(input.comparisonResults),
    comparisonValid: comparisonValidFlags(input.comparisonResults),
    finalArchitecture: input.finalArchitecture,
    constructionPurchase: input.constructionPurchase,
    libraryItemsPurchase: input.libraryItemsPurchase,
    reportValidation: input.reportValidation,
  });

  const reportData = buildMissionReportData({
    schoolName: libraryMissionConfig.schoolName,
    plotLengthM: dimensions.lengthM,
    plotWidthM: dimensions.widthM,
    plotArea: 216,
    plotPerimeter: 60,
    architectureName: input.finalArchitecture.architectureName,
    architectureIndoorArea: input.finalArchitecture.indoorArea,
    architectureWallLength: input.finalArchitecture.wallLength,
    constructionCost: input.constructionPurchase.totalCost,
    remainingConstructionBudget: input.constructionPurchase.remainingBudget,
    constructionBudgetLimit: libraryBudgetConfig.constructionBudget,
    libraryItemsCost: input.libraryItemsPurchase.totalCost,
    remainingLibraryItemsBudget: input.libraryItemsPurchase.remainingBudget,
    libraryItemsBudgetLimit: libraryBudgetConfig.libraryItemsBudget,
    constructionSelections: input.constructionSelections,
    librarySelections: input.librarySelections,
    learnerAnswers: input.reportAnswers,
    finalScore: score.cappedTotal,
    currencyLabel: libraryBudgetConfig.currencyLabel,
  });

  return {
    score,
    summary: generateTrilingualReports(reportData),
  };
}
