import { missionCompletionConfig } from "../data/completionConfig";
import {
  allRequiredArchitecturesChecked,
  allRequiredArchitecturesValid,
} from "./architectureComparison";
import { validateGuidedReportAnswers } from "./validation";
import type {
  ArchitectureDesignResult,
  GeometryValidationResult,
  GuidedReportAnswers,
  RequiredArchitectureId,
  ScopedPurchaseValidationResult,
} from "../types/missionTypes";

export interface MissionReadinessInput {
  geometry: GeometryValidationResult | null;
  comparisonResults: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>;
  finalArchitecture: ArchitectureDesignResult | null;
  constructionPurchase: ScopedPurchaseValidationResult | null;
  libraryItemsPurchase: ScopedPurchaseValidationResult | null;
  reportAnswers: GuidedReportAnswers;
}

export interface MissionReadinessResult {
  ready: boolean;
  missingSteps: string[];
}

/** Whether the learner can trigger the final build action. */
export function getMissionReadiness(
  input: MissionReadinessInput,
): MissionReadinessResult {
  const missingSteps: string[] = [];
  const labels = missionCompletionConfig.requirementLabels;
  const reportValidation = validateGuidedReportAnswers(input.reportAnswers);

  if (!input.geometry?.isValid) {
    missingSteps.push(labels.geometry);
  }

  if (!allRequiredArchitecturesChecked(input.comparisonResults)) {
    missingSteps.push(labels.architectureComparison);
  } else if (!allRequiredArchitecturesValid(input.comparisonResults)) {
    missingSteps.push(labels.architectureComparison);
  }

  if (!input.finalArchitecture?.isValid) {
    missingSteps.push(labels.finalArchitecture);
  }

  if (!input.constructionPurchase?.isValid) {
    missingSteps.push(labels.constructionPurchase);
  }

  if (!input.libraryItemsPurchase?.isValid) {
    missingSteps.push(labels.libraryItemsPurchase);
  }

  if (!reportValidation.isValid) {
    missingSteps.push(labels.report);
  }

  return {
    ready: missingSteps.length === 0,
    missingSteps,
  };
}
