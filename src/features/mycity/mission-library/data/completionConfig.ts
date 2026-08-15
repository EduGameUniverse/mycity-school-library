import type { MissionCompletionConfig } from "../types/missionTypes";

export const missionCompletionConfig: MissionCompletionConfig = {
  buildButtonLabel: "Build Library",
  buildReadyMessage:
    "All mission tasks are complete. You can build the library.",
  buildBlockedMessage:
    "Complete every task below before building the library.",
  buildSuccessTitle: "Library built successfully!",
  buildSuccessMessage:
    "El-Bahdja School now has a new library. Pupils can read, study, and use digital resources in a comfortable and inclusive space.",
  summaryTitle: "Mission summary",
  scoreTitle: "Final mission score",
  reportTitle: "Trilingual mission report",
  libraryCompletedBadge: "Library completed",
  requirementLabels: {
    geometry: "Correct plot area and perimeter",
    architectureComparison: "Three architecture proposals checked and valid",
    finalArchitecture: "Final architecture selected",
    constructionPurchase: "Construction order within 2500 EduCoins",
    libraryItemsPurchase: "Library items within 500 EduCoins",
    report: "Trilingual justification completed",
  },
};
