import type { ReportTemplateConfig } from "../types/missionTypes";

export const reportTemplateConfig: ReportTemplateConfig = {
  constructionAccessibilityItemIds: [
    "accessibility-ramp",
    "wide-accessible-door",
  ],
  readingResourceItemIds: [
    "book-pack",
    "science-book-pack",
    "language-book-pack",
    "magazines",
    "reading-corner",
  ],
  digitalResourceItemIds: [
    "laptop",
    "tablet-station",
    "internet-router",
    "projector",
  ],
  inclusionResourceItemIds: [
    "adapted-reading-desk",
    "audio-reading-tool",
    "educational-posters",
  ],
  reportPrompts: {
    architectureChoice: "Why did you select this final architecture?",
    areaComparison: "How did you compare indoor area across the three designs?",
    wallLengthComparison:
      "How did you compare wall length / perimeter across the three designs?",
    constructionCostComparison:
      "How did you compare estimated construction cost across the three designs?",
    libraryItemsBudgetUse:
      "How did you use the 500 EduCoin library-items budget?",
    readingSupport: "How does your order support reading?",
    digitalLearningSupport: "How does your order support digital learning?",
    accessibilitySupport:
      "How does your order support accessibility and inclusion?",
  },
  noneSelectedLabel: {
    en: "None selected",
    fr: "Aucun article sélectionné",
    ar: "لم يتم اختيار أي عنصر",
  },
};

export const emptyGuidedReportAnswers = {
  english: {
    architectureChoice: "",
    areaComparison: "",
    wallLengthComparison: "",
    constructionCostComparison: "",
    libraryItemsBudgetUse: "",
    readingSupport: "",
    digitalLearningSupport: "",
    accessibilitySupport: "",
  },
  french: {
    architectureChoice: "",
    areaComparison: "",
    wallLengthComparison: "",
    constructionCostComparison: "",
    libraryItemsBudgetUse: "",
    readingSupport: "",
    digitalLearningSupport: "",
    accessibilitySupport: "",
  },
  arabic: {
    architectureChoice: "",
    areaComparison: "",
    wallLengthComparison: "",
    constructionCostComparison: "",
    libraryItemsBudgetUse: "",
    readingSupport: "",
    digitalLearningSupport: "",
    accessibilitySupport: "",
  },
};
