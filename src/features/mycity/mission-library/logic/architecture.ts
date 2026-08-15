import {
  architectureBasePricing,
  getArchitectureTemplateById,
} from "../data/architectureTemplates";
import { elBahdjaCampusMap } from "../data/mapConfig";
import type {
  ArchitectureCalculationResult,
  ArchitectureFeatureBonuses,
  ArchitectureFootprintZone,
  ArchitectureQualityLevel,
  ArchitectureQualityProfile,
  ArchitectureTemplate,
  ConstructionRequirements,
  LibraryFootprintInput,
  PlotDimensions,
  SelectedStoreItem,
} from "../types/missionTypes";

const qualityLevelScores: Record<ArchitectureQualityLevel, number> = {
  "medium-low": 52,
  medium: 62,
  "medium-good": 70,
  good: 76,
  high: 84,
  "very-good": 86,
  excellent: 94,
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Derive the learner footprint zone from axis-aligned corner coordinates. */
export function getFootprintZone(
  footprint: LibraryFootprintInput,
): ArchitectureFootprintZone {
  const lengthM = footprint.b.x - footprint.a.x;
  const widthM = footprint.d.y - footprint.a.y;

  return {
    lengthM: round1(lengthM),
    widthM: round1(widthM),
    areaM2: round1(lengthM * widthM),
    perimeterM: round1(2 * (lengthM + widthM)),
  };
}

function calculateQualityScore(profile: ArchitectureQualityProfile): number {
  const categories: (keyof ArchitectureQualityProfile)[] = [
    "costEfficiency",
    "creativity",
    "comfort",
    "accessibility",
    "digitalLearningFit",
  ];

  const values = categories.map((category) => {
    const level = profile[category];
    return qualityLevelScores[level];
  });

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

function estimateBaseCost(wallQuantity: number, floorQuantity: number): number {
  return Math.round(
    wallQuantity * architectureBasePricing.wallUnitPrice +
      floorQuantity * architectureBasePricing.floorUnitPrice,
  );
}

/** Whether the footprint zone fits inside the construction plot dimensions. */
export function fitsInsideConstructionPlot(
  zone: ArchitectureFootprintZone,
  plotDimensions: PlotDimensions = elBahdjaCampusMap.plot.dimensions,
): boolean {
  return (
    zone.lengthM > 0 &&
    zone.widthM > 0 &&
    zone.lengthM <= plotDimensions.lengthM + 0.01 &&
    zone.widthM <= plotDimensions.widthM + 0.01
  );
}

const featureStoreMap: Record<keyof ArchitectureFeatureBonuses, string[]> = {
  readingZone: ["bookshelf", "reading-table", "quiet-reading-corner"],
  digitalZone: ["computer-corner", "tablet-station", "internet-router"],
  courtyardComfort: ["ventilation-unit", "window"],
  accessibilityPath: ["accessibility-ramp", "wide-accessible-door"],
};

function getSelectedQuantity(
  selections: SelectedStoreItem[],
  itemId: string,
): number {
  return (
    selections.find((selection) => selection.itemId === itemId)?.quantity ?? 0
  );
}

/** Bonus when architecture feature zones align with matching store selections. */
export function getArchitectureFeatureBonus(
  templateId: string,
  selectedItems: SelectedStoreItem[],
  maxBonus: number,
): number {
  const template = getArchitectureTemplateById(templateId);
  if (!template) {
    return 0;
  }

  let points = 0;

  for (const [featureKey, bonus] of Object.entries(template.featureBonuses)) {
    if (!bonus) {
      continue;
    }

    const itemIds =
      featureStoreMap[featureKey as keyof ArchitectureFeatureBonuses];
    if (!itemIds) {
      continue;
    }

    const hasMatch = itemIds.some(
      (itemId) => getSelectedQuantity(selectedItems, itemId) > 0,
    );
    if (hasMatch) {
      points += bonus;
    }
  }

  return Math.min(maxBonus, points);
}

function buildResult(
  template: ArchitectureTemplate,
  zone: ArchitectureFootprintZone,
  indoorArea: number,
  openSpaceArea: number,
  wallQuantity: number,
  warnings: string[],
  fitsInsideFootprint: boolean,
  plotDimensions: PlotDimensions = elBahdjaCampusMap.plot.dimensions,
): ArchitectureCalculationResult {
  const floorQuantity = round1(indoorArea);
  const roundedWallQuantity = round1(wallQuantity);
  const mergedWarnings = [...template.warnings, ...warnings];
  const fitsPlot = fitsInsideConstructionPlot(zone, plotDimensions);

  if (!fitsPlot) {
    mergedWarnings.push(
      "Footprint exceeds the 18 m × 12 m construction plot limits.",
    );
  }

  return {
    templateId: template.id,
    templateName: template.name,
    indoorArea: round1(indoorArea),
    openSpaceArea: round1(openSpaceArea),
    wallQuantity: roundedWallQuantity,
    floorQuantity,
    estimatedBaseCost: estimateBaseCost(roundedWallQuantity, floorQuantity),
    qualityScore: calculateQualityScore(template.qualityProfile),
    warnings: mergedWarnings,
    fitsInsideFootprint,
    fitsInsideConstructionPlot: fitsPlot,
    footprintZone: zone,
    construction: {
      floorQuantity,
      wallQuantity: roundedWallQuantity,
    },
  };
}

function calculateCompactRectangle(
  template: ArchitectureTemplate,
  zone: ArchitectureFootprintZone,
): ArchitectureCalculationResult {
  const indoorArea = zone.areaM2;
  const wallQuantity = zone.perimeterM;

  return buildResult(template, zone, indoorArea, 0, wallQuantity, [], true);
}

function calculateTwoBuilding(
  template: ArchitectureTemplate,
  zone: ArchitectureFootprintZone,
): ArchitectureCalculationResult {
  const b1Length = zone.lengthM * template.defaultDimensions.building1LengthRatio;
  const b2Length = zone.lengthM * template.defaultDimensions.building2LengthRatio;
  const b1Width = zone.widthM;
  const b2Width = zone.widthM * template.defaultDimensions.building2WidthRatio;

  const area1 = b1Length * b1Width;
  const area2 = b2Length * b2Width;
  const perim1 = 2 * (b1Length + b1Width);
  const perim2 = 2 * (b2Length + b2Width);
  const indoorArea = area1 + area2;
  const wallQuantity = perim1 + perim2;
  const fits =
    b1Length + b2Length <= zone.lengthM + 0.5 &&
    b1Width <= zone.widthM + 0.5 &&
    b2Width <= zone.widthM + 0.5;

  const warnings = fits
    ? []
    : ["The two-building layout does not fit comfortably inside this footprint."];

  return buildResult(
    template,
    zone,
    indoorArea,
    Math.max(0, zone.areaM2 - indoorArea),
    wallQuantity,
    warnings,
    fits,
  );
}

function calculateCourtyard(
  template: ArchitectureTemplate,
  zone: ArchitectureFootprintZone,
): ArchitectureCalculationResult {
  const courtyardLength =
    zone.lengthM * template.defaultDimensions.courtyardLengthRatio;
  const courtyardWidth =
    zone.widthM * template.defaultDimensions.courtyardWidthRatio;
  const courtyardArea = courtyardLength * courtyardWidth;
  const indoorArea = zone.areaM2 - courtyardArea;
  const outerPerimeter = zone.perimeterM;
  const courtyardPerimeter = 2 * (courtyardLength + courtyardWidth);
  const wallQuantity = outerPerimeter + courtyardPerimeter;
  const fits =
    courtyardLength < zone.lengthM &&
    courtyardWidth < zone.widthM &&
    indoorArea > zone.areaM2 * 0.35;

  const warnings = fits
    ? []
    : ["The courtyard is too large for the selected footprint."];

  return buildResult(
    template,
    zone,
    indoorArea,
    courtyardArea,
    wallQuantity,
    warnings,
    fits,
  );
}

function calculateLShaped(
  template: ArchitectureTemplate,
  zone: ArchitectureFootprintZone,
): ArchitectureCalculationResult {
  const verticalLength =
    zone.lengthM * template.defaultDimensions.verticalWingLengthRatio;
  const horizontalWidth =
    zone.widthM * template.defaultDimensions.horizontalWingWidthRatio;

  const verticalWingArea = verticalLength * zone.widthM;
  const horizontalWingArea = zone.lengthM * horizontalWidth;
  const overlapArea = verticalLength * horizontalWidth;
  const indoorArea = verticalWingArea + horizontalWingArea - overlapArea;
  const wallQuantity =
    zone.perimeterM * template.defaultDimensions.perimeterMultiplier;
  const openSpaceArea = Math.max(0, zone.areaM2 - indoorArea);
  const fits = indoorArea > 0 && indoorArea <= zone.areaM2;

  return buildResult(
    template,
    zone,
    indoorArea,
    openSpaceArea,
    wallQuantity,
    [],
    fits,
  );
}

/** Calculate architecture metrics inside the learner footprint zone. */
export function calculateArchitecture(
  templateId: string,
  footprint: LibraryFootprintInput,
): ArchitectureCalculationResult | null {
  const template = getArchitectureTemplateById(templateId);
  if (!template) {
    return null;
  }

  const zone = getFootprintZone(footprint);

  if (zone.lengthM <= 0 || zone.widthM <= 0) {
    return null;
  }

  switch (template.geometryType) {
    case "compact-rectangle":
      return calculateCompactRectangle(template, zone);
    case "two-building":
      return calculateTwoBuilding(template, zone);
    case "courtyard":
      return calculateCourtyard(template, zone);
    case "l-shaped":
      return calculateLShaped(template, zone);
    default:
      return null;
  }
}

export function getArchitectureQualityBonus(
  qualityScore: number,
  maxBonus: number,
): number {
  return Math.round((qualityScore / 100) * maxBonus);
}

export function getConstructionRequirements(
  architecture: ArchitectureCalculationResult | null,
  plotDimensions?: { lengthM: number; widthM: number },
): ConstructionRequirements {
  if (architecture) {
    return architecture.construction;
  }

  const lengthM = plotDimensions?.lengthM ?? 18;
  const widthM = plotDimensions?.widthM ?? 12;

  return {
    floorQuantity: lengthM * widthM,
    wallQuantity: 2 * (lengthM + widthM),
  };
}
