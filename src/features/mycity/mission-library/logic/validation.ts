import { libraryBudgetConfig } from "../data/budgetConfig";

import { reportTemplateConfig } from "../data/reportConfig";

import {

  getStoreItemById,

  getStoreItemsByBudgetScope,

} from "../data/storeCatalog";

import type {

  ConstructionRequirements,

  GeometryAnswer,

  GeometryValidationResult,

  GuidedReportAnswers,

  MissingRequirement,

  PlotDimensions,

  RequirementGroup,

  ScopedPurchaseValidationResult,

  SelectedStoreItem,

  StoreItem,

} from "../types/missionTypes";

import {

  calculateBudgetScopeCost,

  calculateTotalCost,

  getRemainingBudget,

  isWithinBudget,

} from "./budget";

import {

  getExpectedArea,

  getExpectedPerimeter,

  isCorrectNumberAnswer,

} from "./geometry";

import { elBahdjaCampusMap } from "../data/mapConfig";



interface RequirementSpec {

  group: RequirementGroup;

  label: string;

  required: number;

  unit: StoreItem["unit"];

  itemIds: string[];

}



function getSelectedQuantity(

  selections: SelectedStoreItem[],

  itemId: string,

): number {

  return (

    selections.find((selection) => selection.itemId === itemId)?.quantity ?? 0

  );

}



function getSelectedQuantityForGroup(

  selections: SelectedStoreItem[],

  itemIds: string[],

): number {

  return selections.reduce((sum, selection) => {

    if (!itemIds.includes(selection.itemId) || selection.quantity <= 0) {

      return sum;

    }



    return sum + selection.quantity;

  }, 0);

}



function countSelectedFromIds(

  selections: SelectedStoreItem[],

  itemIds: string[],

): number {

  return itemIds.reduce(

    (count, itemId) =>

      getSelectedQuantity(selections, itemId) > 0 ? count + 1 : count,

    0,

  );

}



function getQuantityByUnit(

  selections: SelectedStoreItem[],

  unit: StoreItem["unit"],

  budgetScope: StoreItem["budgetScope"],

): number {

  return selections.reduce((sum, selection) => {

    const item = getStoreItemById(selection.itemId);

    if (

      !item ||

      item.unit !== unit ||

      item.budgetScope !== budgetScope ||

      selection.quantity <= 0

    ) {

      return sum;

    }



    return sum + selection.quantity;

  }, 0);

}



function getConstructionRequirementSpecs(

  construction?: ConstructionRequirements,

): RequirementSpec[] {

  const groups = new Map<RequirementGroup, RequirementSpec>();



  for (const item of getStoreItemsByBudgetScope("construction")) {

    if (!item.requirementGroup) {

      continue;

    }



    const required =

      item.requirementGroup === "wall-covering"

        ? (construction?.wallQuantity ?? 0)

        : item.requirementGroup === "floor-covering"

          ? (construction?.floorQuantity ?? 0)

          : item.minQuantity;



    if (required <= 0 && item.minQuantity <= 0) {

      continue;

    }



    const existing = groups.get(item.requirementGroup);

    if (existing) {

      existing.itemIds.push(item.id);

      if (

        item.requirementGroup !== "wall-covering" &&

        item.requirementGroup !== "floor-covering"

      ) {

        existing.required = Math.max(existing.required, item.minQuantity);

      }

      continue;

    }



    groups.set(item.requirementGroup, {

      group: item.requirementGroup,

      label: item.label,

      required,

      unit: item.unit,

      itemIds: [item.id],

    });

  }



  return Array.from(groups.values());

}



function getMissingRequirementsForSpecs(

  selections: SelectedStoreItem[],

  specs: RequirementSpec[],

): MissingRequirement[] {

  const missing: MissingRequirement[] = [];



  for (const spec of specs) {

    const selected = getSelectedQuantityForGroup(selections, spec.itemIds);

    if (selected < spec.required) {

      missing.push({

        requirementGroup: spec.group,

        label: spec.label,

        required: spec.required,

        selected,

        unit: spec.unit,

      });

    }

  }



  return missing;

}



/** Validate learner area and perimeter answers against plot dimensions. */

export function validateGeometryAnswer(

  answer: GeometryAnswer,

  dimensions: PlotDimensions = elBahdjaCampusMap.plot.dimensions,

): GeometryValidationResult {

  const expectedArea = getExpectedArea(dimensions);

  const expectedPerimeter = getExpectedPerimeter(dimensions);

  const areaCorrect = isCorrectNumberAnswer(answer.area, expectedArea);

  const perimeterCorrect = isCorrectNumberAnswer(

    answer.perimeter,

    expectedPerimeter,

  );



  const errors: string[] = [];



  if (!areaCorrect) {

    errors.push(

      `Area should be ${expectedArea} m² (length × width = ${dimensions.lengthM} × ${dimensions.widthM}).`,

    );

  }



  if (!perimeterCorrect) {

    errors.push(

      `Perimeter should be ${expectedPerimeter} m (2 × (length + width)).`,

    );

  }



  return {

    isValid: areaCorrect && perimeterCorrect,

    areaCorrect,

    perimeterCorrect,

    errors,

  };

}



/** Validate construction purchase order against architecture and construction budget. */

export function validateConstructionPurchase(

  selections: SelectedStoreItem[],

  construction?: ConstructionRequirements,

): ScopedPurchaseValidationResult {

  const errors: string[] = [];

  const warnings: string[] = [];

  const budgetLimit = libraryBudgetConfig.constructionBudget;

  const specs = getConstructionRequirementSpecs(construction);

  const missingRequirements = getMissingRequirementsForSpecs(selections, specs);

  const totalCost = calculateBudgetScopeCost(selections, "construction");

  const remainingBudget = getRemainingBudget(totalCost, budgetLimit);

  const wallQuantity = getQuantityByUnit(selections, "m", "construction");

  const floorQuantity = getQuantityByUnit(selections, "m2", "construction");



  if (!construction) {

    errors.push("Select your final architecture before buying construction materials.");

  }



  const doorCount =

    getSelectedQuantity(selections, "standard-door") +

    getSelectedQuantity(selections, "wide-accessible-door");

  if (doorCount < 1) {

    errors.push("Select at least one door (standard or wide accessible).");

  }



  for (const missing of missingRequirements) {

    errors.push(

      `${missing.label}: need ${missing.required} ${missing.unit}, selected ${missing.selected}.`,

    );

  }



  if (!isWithinBudget(totalCost, budgetLimit)) {

    errors.push(

      `Construction total (${totalCost} ${libraryBudgetConfig.currencyLabel}) exceeds the construction budget (${budgetLimit} ${libraryBudgetConfig.currencyLabel}).`,

    );

  }



  const hasComfortExtras =

    getSelectedQuantity(selections, "ventilation-unit") >= 1 &&

    getSelectedQuantity(selections, "led-light") >= 6;

  if (!hasComfortExtras) {

    warnings.push("Add ventilation and lighting for pupil comfort.");

  }



  const constructionAccessibilityCount = countSelectedFromIds(

    selections,

    reportTemplateConfig.constructionAccessibilityItemIds,

  );



  return {

    isValid: errors.length === 0,

    errors,

    warnings,

    missingRequirements,

    totalCost,

    remainingBudget,

    budgetLimit,

    wallQuantity,

    floorQuantity,

    readingResourcesSelected: 0,

    digitalResourcesSelected: 0,

    inclusionResourcesSelected: constructionAccessibilityCount,

  };

}



/** Validate library-items purchase order against library-items budget. */

export function validateLibraryItemsPurchase(

  selections: SelectedStoreItem[],

): ScopedPurchaseValidationResult {

  const errors: string[] = [];

  const warnings: string[] = [];

  const budgetLimit = libraryBudgetConfig.libraryItemsBudget;

  const totalCost = calculateBudgetScopeCost(selections, "library-items");

  const remainingBudget = getRemainingBudget(totalCost, budgetLimit);



  const readingResourcesSelected = countSelectedFromIds(

    selections,

    reportTemplateConfig.readingResourceItemIds,

  );

  const digitalResourcesSelected = countSelectedFromIds(

    selections,

    reportTemplateConfig.digitalResourceItemIds,

  );

  const inclusionResourcesSelected = countSelectedFromIds(

    selections,

    reportTemplateConfig.inclusionResourceItemIds,

  );



  if (readingResourcesSelected < 1) {

    errors.push("Select at least one reading resource.");

  }



  if (digitalResourcesSelected < 1) {

    errors.push("Select at least one digital learning resource.");

  }



  if (inclusionResourcesSelected < 1) {

    errors.push("Select at least one inclusion/accessibility library item.");

  }



  if (!isWithinBudget(totalCost, budgetLimit)) {

    errors.push(

      `Library-items total (${totalCost} ${libraryBudgetConfig.currencyLabel}) exceeds the library-items budget (${budgetLimit} ${libraryBudgetConfig.currencyLabel}).`,

    );

  }



  if (totalCost < budgetLimit * 0.2 && totalCost > 0) {

    warnings.push(

      "You still have library-items budget left — consider adding more learning resources.",

    );

  }



  return {

    isValid: errors.length === 0,

    errors,

    warnings,

    missingRequirements: [],

    totalCost,

    remainingBudget,

    budgetLimit,

    readingResourcesSelected,

    digitalResourcesSelected,

    inclusionResourcesSelected,

  };

}



function languageAnswersComplete(

  answers: GuidedReportAnswers["english"],

): boolean {

  return Object.values(answers).every((value) => value.trim().length >= 10);

}



/** Validate guided trilingual report answers. */

export function validateGuidedReportAnswers(

  answers: GuidedReportAnswers,

): { isValid: boolean; errors: string[] } {

  const errors: string[] = [];



  if (!languageAnswersComplete(answers.english)) {

    errors.push("Complete all English justification fields (at least 10 characters each).");

  }



  if (!languageAnswersComplete(answers.french)) {

    errors.push("Complete all French justification fields (at least 10 characters each).");

  }



  if (!languageAnswersComplete(answers.arabic)) {

    errors.push("Complete all Arabic justification fields (at least 10 characters each).");

  }



  return {

    isValid: errors.length === 0,

    errors,

  };

}



/** @deprecated Legacy combined purchase validation kept for older tests. */

export function validatePurchaseOrder(

  selections: SelectedStoreItem[],

  geometry: GeometryValidationResult,

  budget: number = libraryBudgetConfig.totalMissionBudget,

): {

  isValid: boolean;

  errors: string[];

  warnings: string[];

  missingRequirements: MissingRequirement[];

  totalCost: number;

  floorQuantity: number;

  wallQuantity: number;

} {

  void geometry;

  void budget;

  const totalCost = calculateTotalCost(selections);



  return {

    isValid: false,

    errors: ["Use validateConstructionPurchase and validateLibraryItemsPurchase."],

    warnings: [],

    missingRequirements: [],

    totalCost,

    floorQuantity: 0,

    wallQuantity: 0,

  };

}



/** @deprecated */

export function getMissingRequirements(

  selections: SelectedStoreItem[],

  construction?: ConstructionRequirements,

): MissingRequirement[] {

  return getMissingRequirementsForSpecs(

    selections,

    getConstructionRequirementSpecs(construction),

  );

}



export const getMissingRequiredItems = getMissingRequirements;


