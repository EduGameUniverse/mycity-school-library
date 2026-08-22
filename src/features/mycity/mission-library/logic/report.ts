import { getStoreItemById } from "../data/storeCatalog";
import {
  localizedReportSummaryLabels,
  reportTemplateConfig,
} from "../data/reportConfig";
import type { Locale } from "../data/i18n";
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

function localizeNoneSelected(label: string, locale: Locale): string {
  if (label === reportTemplateConfig.noneSelectedLabel.en) {
    return reportTemplateConfig.noneSelectedLabel[locale];
  }

  return label;
}

function formatLanguageSummary(
  locale: Locale,
  data: MissionReportData,
  answers: GuidedReportAnswers["english"],
): string {
  const labels = localizedReportSummaryLabels[locale];

  return [
    `${data.schoolName} — ${labels.missionReport}`,
    "",
    labels.learnerJustification,
    `- ${labels.architectureChoice}: ${answers.architectureChoice}`,
    `- ${labels.areaComparison}: ${answers.areaComparison}`,
    `- ${labels.wallLengthComparison}: ${answers.wallLengthComparison}`,
    `- ${labels.constructionCostComparison}: ${answers.constructionCostComparison}`,
    `- ${labels.libraryItemsBudgetUse}: ${answers.libraryItemsBudgetUse}`,
    `- ${labels.readingSupport}: ${answers.readingSupport}`,
    `- ${labels.digitalLearningSupport}: ${answers.digitalLearningSupport}`,
    `- ${labels.accessibilitySupport}: ${answers.accessibilitySupport}`,
    "",
    labels.validatedMissionSummary,
    `- ${labels.selectedArchitecture}: ${data.architectureName}`,
    `- ${labels.selectedIndoorArea}: ${data.architectureIndoorArea} m²`,
    `- ${labels.selectedWallLength}: ${data.architectureWallLength} m`,
    `- ${labels.constructionCost}: ${data.constructionCost} ${data.currencyLabel}`,
    `- ${labels.remainingConstructionBudget}: ${data.remainingConstructionBudget} ${data.currencyLabel}`,
    `- ${labels.libraryItemsCost}: ${data.libraryItemsCost} ${data.currencyLabel}`,
    `- ${labels.remainingLibraryItemsBudget}: ${data.remainingLibraryItemsBudget} ${data.currencyLabel}`,
    `- ${labels.readingResources}: ${localizeNoneSelected(data.readingResourcesLabel, locale)}`,
    `- ${labels.digitalLearningResources}: ${localizeNoneSelected(data.digitalResourcesLabel, locale)}`,
    `- ${labels.accessibilityInclusionChoices}: ${localizeNoneSelected(data.inclusionResourcesLabel, locale)}`,
    `- ${labels.finalScore}: ${data.finalScore}/100`,
  ].join("\n");
}

export function generateEnglishReport(data: MissionReportData): string {
  return formatLanguageSummary("en", data, data.learnerAnswers.english);
}

export function generateFrenchReport(data: MissionReportData): string {
  return formatLanguageSummary("fr", data, data.learnerAnswers.french);
}

export function generateArabicReport(data: MissionReportData): string {
  return formatLanguageSummary("ar", data, data.learnerAnswers.arabic);
}

export function generateTrilingualReports(data: MissionReportData) {
  return {
    english: generateEnglishReport(data),
    french: generateFrenchReport(data),
    arabic: generateArabicReport(data),
  };
}
