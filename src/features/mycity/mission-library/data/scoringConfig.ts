import type { ScoringConfig } from "../types/missionTypes";

export const libraryScoringConfig: ScoringConfig = {
  maxScore: 100,
  architectureComparison: 20,
  finalArchitecture: 20,
  constructionBudget: 20,
  libraryItemsBudget: 15,
  digitalLearning: 10,
  accessibilityInclusion: 10,
  trilingualJustification: 5,
  /** Library-items spend between 35% and 95% of budget counts as wise use. */
  libraryItemsWiseUseThreshold: 0.35,
};
