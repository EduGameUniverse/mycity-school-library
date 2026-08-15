import { libraryScoringConfig } from "../data/scoringConfig";
import type {
  MissionScore,
  MissionScoreInput,
  RequiredArchitectureId,
} from "../types/missionTypes";

/** Compute the Mission 1 completion score. */
export function calculateMissionScore(input: MissionScoreInput): MissionScore {
  const config = libraryScoringConfig;
  const {
    geometry,
    comparisonChecked,
    comparisonValid,
    finalArchitecture,
    constructionPurchase,
    libraryItemsPurchase,
    reportValidation,
  } = input;

  const breakdown = {
    architectureComparison: 0,
    finalArchitecture: 0,
    constructionBudget: 0,
    libraryItemsBudget: 0,
    digitalLearning: 0,
    accessibilityInclusion: 0,
    trilingualJustification: 0,
  };

  const feedback: string[] = [];
  const badges: string[] = [];

  const requiredIds: RequiredArchitectureId[] = [
    "compact-rectangle",
    "two-building",
    "l-shaped",
  ];

  const checkedCount = requiredIds.filter((id) => comparisonChecked[id]).length;
  const validCount = requiredIds.filter((id) => comparisonValid[id]).length;

  if (geometry.isValid) {
    breakdown.architectureComparison += Math.round(
      (checkedCount / 3) * (config.architectureComparison / 2),
    );
    breakdown.architectureComparison += Math.round(
      (validCount / 3) * (config.architectureComparison / 2),
    );
    badges.push("Plot Mathematician");
  } else {
    feedback.push("Plot area and perimeter must be correct first.");
  }

  if (validCount === 3) {
    badges.push("Architecture Analyst");
  }

  if (finalArchitecture?.isValid) {
    breakdown.finalArchitecture = config.finalArchitecture;
    badges.push(finalArchitecture.architectureName);
  } else {
    feedback.push("Select one valid final architecture.");
  }

  if (constructionPurchase.isValid) {
    breakdown.constructionBudget = config.constructionBudget;
    badges.push("Construction Budget Keeper");
  } else {
    feedback.push("Construction order is not valid or exceeds 2500 EduCoins.");
  }

  if (libraryItemsPurchase.isValid) {
    const spendRatio =
      libraryItemsPurchase.totalCost / libraryItemsPurchase.budgetLimit;
    if (spendRatio >= config.libraryItemsWiseUseThreshold) {
      breakdown.libraryItemsBudget = config.libraryItemsBudget;
      badges.push("Library Items Planner");
    } else {
      breakdown.libraryItemsBudget = Math.round(config.libraryItemsBudget * 0.5);
      feedback.push("Use the library-items budget more effectively.");
    }
  } else {
    feedback.push("Library-items order is not valid or exceeds 500 EduCoins.");
  }

  if (libraryItemsPurchase.digitalResourcesSelected >= 1) {
    breakdown.digitalLearning = config.digitalLearning;
    badges.push("Digital Learner");
  } else {
    feedback.push("Select at least one digital learning resource.");
  }

  const inclusionCount =
    libraryItemsPurchase.inclusionResourcesSelected +
    constructionPurchase.inclusionResourcesSelected;
  if (inclusionCount >= 1) {
    breakdown.accessibilityInclusion = config.accessibilityInclusion;
    badges.push("Inclusive Designer");
  } else {
    feedback.push(
      "Add accessibility/inclusion support in construction or library items.",
    );
  }

  if (reportValidation.isValid) {
    breakdown.trilingualJustification = config.trilingualJustification;
    badges.push("Trilingual Reporter");
  } else {
    feedback.push("Complete the trilingual justification form.");
  }

  const rawTotal = Object.values(breakdown).reduce(
    (sum, value) => sum + value,
    0,
  );
  const cappedTotal = Math.min(config.maxScore, rawTotal);

  if (cappedTotal >= 90) {
    badges.push("El-Bahdja Library Champion");
  }

  return {
    total: rawTotal,
    cappedTotal,
    breakdown,
    badges: Array.from(new Set(badges)),
    feedback,
  };
}
