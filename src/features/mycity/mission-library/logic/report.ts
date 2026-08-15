import { getStoreItemById } from "../data/storeCatalog";
import { reportTemplateConfig } from "../data/reportConfig";
import type {
  GuidedReportAnswers,
  MissionReportData,
  SelectedStoreItem,
} from "../types/missionTypes";

function getSelectedLabels(
  selections: SelectedStoreItem[],
  itemIds: string[],
  noneLabel: string,
): string {
  const labels: string[] = [];

  for (const itemId of itemIds) {
    const selection = selections.find(
      (entry) => entry.itemId === itemId && entry.quantity > 0,
    );
    if (!selection) {
      continue;
    }

    const item = getStoreItemById(itemId);
    if (item) {
      labels.push(`${item.label} (${selection.quantity})`);
    }
  }

  return labels.length > 0 ? labels.join(", ") : noneLabel;
}

export function buildMissionReportData(input: {
  schoolName: string;
  plotLengthM: number;
  plotWidthM: number;
  plotArea: number;
  plotPerimeter: number;
  architectureName: string;
  architectureIndoorArea: number;
  architectureWallLength: number;
  constructionCost: number;
  remainingConstructionBudget: number;
  constructionBudgetLimit: number;
  libraryItemsCost: number;
  remainingLibraryItemsBudget: number;
  libraryItemsBudgetLimit: number;
  constructionSelections: SelectedStoreItem[];
  librarySelections: SelectedStoreItem[];
  learnerAnswers: GuidedReportAnswers;
  finalScore: number;
  currencyLabel: string;
}): MissionReportData {
  return {
    schoolName: input.schoolName,
    plotLengthM: input.plotLengthM,
    plotWidthM: input.plotWidthM,
    plotArea: input.plotArea,
    plotPerimeter: input.plotPerimeter,
    architectureName: input.architectureName,
    architectureIndoorArea: input.architectureIndoorArea,
    architectureWallLength: input.architectureWallLength,
    constructionCost: input.constructionCost,
    remainingConstructionBudget: input.remainingConstructionBudget,
    constructionBudgetLimit: input.constructionBudgetLimit,
    libraryItemsCost: input.libraryItemsCost,
    remainingLibraryItemsBudget: input.remainingLibraryItemsBudget,
    libraryItemsBudgetLimit: input.libraryItemsBudgetLimit,
    readingResourcesLabel: getSelectedLabels(
      input.librarySelections,
      reportTemplateConfig.readingResourceItemIds,
      reportTemplateConfig.noneSelectedLabel.en,
    ),
    digitalResourcesLabel: getSelectedLabels(
      input.librarySelections,
      reportTemplateConfig.digitalResourceItemIds,
      reportTemplateConfig.noneSelectedLabel.en,
    ),
    inclusionResourcesLabel: getSelectedLabels(
      [...input.constructionSelections, ...input.librarySelections],
      [
        ...reportTemplateConfig.constructionAccessibilityItemIds,
        ...reportTemplateConfig.inclusionResourceItemIds,
      ],
      reportTemplateConfig.noneSelectedLabel.en,
    ),
    learnerAnswers: input.learnerAnswers,
    finalScore: input.finalScore,
    currencyLabel: input.currencyLabel,
  };
}

function formatLanguageSummary(
  languageLabel: string,
  data: MissionReportData,
  answers: GuidedReportAnswers["english"],
): string {
  return [
    `${data.schoolName} — ${languageLabel} mission report`,
    "",
    "Learner justification",
    `- Architecture choice: ${answers.architectureChoice}`,
    `- Area comparison: ${answers.areaComparison}`,
    `- Wall length comparison: ${answers.wallLengthComparison}`,
    `- Construction cost comparison: ${answers.constructionCostComparison}`,
    `- Library-items budget use: ${answers.libraryItemsBudgetUse}`,
    `- Reading support: ${answers.readingSupport}`,
    `- Digital learning support: ${answers.digitalLearningSupport}`,
    `- Accessibility support: ${answers.accessibilitySupport}`,
    "",
    "Validated mission summary",
    `- Selected architecture: ${data.architectureName}`,
    `- Selected indoor area: ${data.architectureIndoorArea} m²`,
    `- Selected wall length: ${data.architectureWallLength} m`,
    `- Construction cost: ${data.constructionCost} ${data.currencyLabel}`,
    `- Remaining construction budget: ${data.remainingConstructionBudget} ${data.currencyLabel}`,
    `- Library-items cost: ${data.libraryItemsCost} ${data.currencyLabel}`,
    `- Remaining library-items budget: ${data.remainingLibraryItemsBudget} ${data.currencyLabel}`,
    `- Reading resources: ${data.readingResourcesLabel}`,
    `- Digital learning resources: ${data.digitalResourcesLabel}`,
    `- Accessibility/inclusion choices: ${data.inclusionResourcesLabel}`,
    `- Final score: ${data.finalScore}/100`,
  ].join("\n");
}

export function generateEnglishReport(data: MissionReportData): string {
  return formatLanguageSummary(
    "English",
    data,
    data.learnerAnswers.english,
  );
}

export function generateFrenchReport(data: MissionReportData): string {
  return formatLanguageSummary(
    "French",
    data,
    data.learnerAnswers.french,
  );
}

export function generateArabicReport(data: MissionReportData): string {
  return formatLanguageSummary(
    "Arabic",
    data,
    data.learnerAnswers.arabic,
  );
}

export function generateTrilingualReports(data: MissionReportData) {
  return {
    english: generateEnglishReport(data),
    french: generateFrenchReport(data),
    arabic: generateArabicReport(data),
  };
}
