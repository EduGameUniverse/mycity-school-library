import {
  architectureComparisonRules,
  architectureConstructionPricing,
  constructionPlotConfig,
  optionalCourtyardProfile,
  qualityLevelToScore,
  requiredArchitectureProfiles,
} from "../data/architectureComparisonConfig";
import type {
  ArchitectureDesignResult,
  BuildingRectangleInput,
  CompactRectangleDesignInput,
  ComparedArchitectureId,
  CourtyardDesignInput,
  LShapedDesignInput,
  RequiredArchitectureId,
  TwoBuildingDesignInput,
} from "../types/missionTypes";
import { isCorrectNumberAnswer } from "./geometry";
import {
  areCornerCoordinatesInsidePlot,
  calculateCompactRectangleFromCorners,
  isAxisAlignedRectangle,
} from "./coordinateProjection";

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function estimateConstructionCost(
  wallLength: number,
  floorQuantity: number,
): number {
  return Math.round(
    wallLength * architectureConstructionPricing.wallUnitPrice +
      floorQuantity * architectureConstructionPricing.floorUnitPrice,
  );
}

function fitsInsidePlot(
  x: number,
  y: number,
  length: number,
  width: number,
): boolean {
  return (
    x >= 0 &&
    y >= 0 &&
    length > 0 &&
    width > 0 &&
    x + length <= constructionPlotConfig.lengthM + 0.01 &&
    y + width <= constructionPlotConfig.widthM + 0.01
  );
}

function isIndoorAreaInRange(area: number): boolean {
  return (
    area >= constructionPlotConfig.minIndoorAreaM2 - 0.01 &&
    area <= constructionPlotConfig.maxIndoorAreaM2 + 0.01
  );
}

function rectanglesOverlap(
  a: BuildingRectangleInput,
  b: BuildingRectangleInput,
): boolean {
  return !(
    a.x + a.length <= b.x ||
    b.x + b.length <= a.x ||
    a.y + a.width <= b.y ||
    b.y + b.width <= a.y
  );
}

function rectangleGap(a: BuildingRectangleInput, b: BuildingRectangleInput): number {
  const dx =
    a.x > b.x + b.length
      ? a.x - (b.x + b.length)
      : b.x > a.x + a.length
        ? b.x - (a.x + a.length)
        : 0;
  const dy =
    a.y > b.y + b.width
      ? a.y - (b.y + b.width)
      : b.y > a.y + a.width
        ? b.y - (a.y + a.width)
        : 0;

  if (dx === 0 && dy === 0) {
    return 0;
  }

  if (dx === 0) {
    return dy;
  }

  if (dy === 0) {
    return dx;
  }

  return Math.sqrt(dx * dx + dy * dy);
}

/** Cutout removed from the top-right corner of the outer rectangle. */
export function calculateLShapeWallLength(
  outerLength: number,
  outerWidth: number,
  cutoutLength: number,
  cutoutWidth: number,
): number {
  return round1(
    (outerLength - cutoutLength) +
      cutoutWidth +
      cutoutLength +
      (outerWidth - cutoutWidth) +
      outerWidth +
      outerLength,
  );
}

function buildDesignResult(
  architectureId: ComparedArchitectureId,
  architectureName: string,
  isValid: boolean,
  indoorArea: number,
  wallLength: number,
  openSpaceArea: number,
  errors: string[],
  warnings: string[],
  tradeOffs: string[],
  profileKey?: RequiredArchitectureId,
): ArchitectureDesignResult {
  const profile =
    profileKey !== undefined
      ? requiredArchitectureProfiles[profileKey]
      : optionalCourtyardProfile;
  const quality = profile.qualityProfile;

  return {
    architectureId,
    architectureName,
    isValid,
    checked: true,
    indoorArea: round1(indoorArea),
    wallLength: round1(wallLength),
    floorQuantity: round1(indoorArea),
    openSpaceArea: round1(openSpaceArea),
    estimatedConstructionCost: estimateConstructionCost(wallLength, indoorArea),
    costEfficiencyScore: qualityLevelToScore(quality.costEfficiency),
    comfortScore: qualityLevelToScore(quality.comfort),
    creativityScore: qualityLevelToScore(quality.creativity),
    accessibilityScore: qualityLevelToScore(quality.accessibility),
    digitalLearningFitScore: qualityLevelToScore(quality.digitalLearningFit),
    errors,
    warnings,
    tradeOffs: profile.tradeOffs,
    construction: {
      floorQuantity: round1(indoorArea),
      wallQuantity: round1(wallLength),
    },
  };
}

export function validateCompactRectangleDesign(
  input: CompactRectangleDesignInput,
): ArchitectureDesignResult {
  const profile = requiredArchitectureProfiles["compact-rectangle"];
  const errors: string[] = [];
  const warnings: string[] = [];
  const corners = {
    aPrime: input.aPrime,
    bPrime: input.bPrime,
    cPrime: input.cPrime,
    dPrime: input.dPrime,
  };

  if (!areCornerCoordinatesInsidePlot(corners)) {
    errors.push(
      "All four coordinates must be inside the 18 m × 12 m construction plot.",
    );
  }

  if (!isAxisAlignedRectangle(corners)) {
    errors.push(
      "The four points must form an axis-aligned rectangle (A′.y = B′.y, C′.y = D′.y, A′.x = D′.x, B′.x = C′.x).",
    );
  }

  const metrics = calculateCompactRectangleFromCorners(corners);

  if (!metrics) {
    if (isAxisAlignedRectangle(corners)) {
      errors.push("The rectangle must have positive length and width.");
    }

    return {
      ...buildDesignResult(
        "compact-rectangle",
        profile.name,
        false,
        0,
        0,
        0,
        errors,
        warnings,
        profile.tradeOffs,
        "compact-rectangle",
      ),
    };
  }

  const { length, width, area, wallLength } = metrics;

  if (!isIndoorAreaInRange(area)) {
    errors.push(
      `Indoor area must be between ${constructionPlotConfig.minIndoorAreaM2} and ${constructionPlotConfig.maxIndoorAreaM2} m².`,
    );
  }

  if (
    !isCorrectNumberAnswer(
      input.learnerAreaAnswer,
      area,
      architectureComparisonRules.numberTolerance,
    )
  ) {
    errors.push("Your area answer does not match the calculated area.");
  }

  if (
    !isCorrectNumberAnswer(
      input.learnerWallLengthAnswer,
      wallLength,
      architectureComparisonRules.numberTolerance,
    )
  ) {
    errors.push("Your wall-length answer does not match the calculated wall length.");
  }

  return {
    ...buildDesignResult(
      "compact-rectangle",
      profile.name,
      errors.length === 0,
      area,
      wallLength,
      0,
      errors,
      warnings,
      profile.tradeOffs,
      "compact-rectangle",
    ),
    computedLength: length,
    computedWidth: width,
  };
}

export function validateTwoBuildingDesign(
  input: TwoBuildingDesignInput,
): ArchitectureDesignResult {
  const profile = requiredArchitectureProfiles["two-building"];
  const errors: string[] = [];
  const warnings: string[] = [];

  const area1 = input.building1.length * input.building1.width;
  const area2 = input.building2.length * input.building2.width;
  const totalArea = area1 + area2;
  const perimeter1 = 2 * (input.building1.length + input.building1.width);
  const perimeter2 = 2 * (input.building2.length + input.building2.width);
  const totalWallLength = perimeter1 + perimeter2;

  if (!fitsInsidePlot(
    input.building1.x,
    input.building1.y,
    input.building1.length,
    input.building1.width,
  )) {
    errors.push("Building 1 must fit inside the construction plot.");
  }

  if (!fitsInsidePlot(
    input.building2.x,
    input.building2.y,
    input.building2.length,
    input.building2.width,
  )) {
    errors.push("Building 2 must fit inside the construction plot.");
  }

  if (rectanglesOverlap(input.building1, input.building2)) {
    errors.push("The two buildings must not overlap.");
  }

  if (!isIndoorAreaInRange(totalArea)) {
    errors.push(
      `Total indoor area must be between ${constructionPlotConfig.minIndoorAreaM2} and ${constructionPlotConfig.maxIndoorAreaM2} m².`,
    );
  }

  if (
    !isCorrectNumberAnswer(
      input.learnerTotalAreaAnswer,
      totalArea,
      architectureComparisonRules.numberTolerance,
    )
  ) {
    errors.push("Your total area answer does not match area1 + area2.");
  }

  if (
    !isCorrectNumberAnswer(
      input.learnerTotalWallLengthAnswer,
      totalWallLength,
      architectureComparisonRules.numberTolerance,
    )
  ) {
    errors.push(
      "Your total wall-length answer does not match perimeter1 + perimeter2.",
    );
  }

  const gap = rectangleGap(input.building1, input.building2);
  if (gap > architectureComparisonRules.maxBuildingGapM) {
    warnings.push("The buildings are far apart — circulation may be difficult.");
  }

  if (
    gap > 0 &&
    gap < architectureComparisonRules.minCirculationGapM &&
    !rectanglesOverlap(input.building1, input.building2)
  ) {
    warnings.push("Circulation between buildings may be too narrow.");
  }

  return buildDesignResult(
    "two-building",
    profile.name,
    errors.length === 0,
    totalArea,
    totalWallLength,
    Math.max(0, constructionPlotConfig.fullAreaM2 - totalArea),
    errors,
    warnings,
    profile.tradeOffs,
    "two-building",
  );
}

export function validateLShapedDesign(
  input: LShapedDesignInput,
): ArchitectureDesignResult {
  const profile = requiredArchitectureProfiles["l-shaped"];
  const errors: string[] = [];
  const warnings: string[] = [];

  const outerArea = input.outerLength * input.outerWidth;
  const cutoutArea = input.cutoutLength * input.cutoutWidth;
  const indoorArea = outerArea - cutoutArea;
  const wallLength = calculateLShapeWallLength(
    input.outerLength,
    input.outerWidth,
    input.cutoutLength,
    input.cutoutWidth,
  );

  if (!fitsInsidePlot(
    input.x,
    input.y,
    input.outerLength,
    input.outerWidth,
  )) {
    errors.push("The outer rectangle must fit inside the construction plot.");
  }

  if (input.cutoutLength <= 0 || input.cutoutWidth <= 0) {
    errors.push("Cutout length and width must be greater than zero.");
  }

  if (input.cutoutLength >= input.outerLength) {
    errors.push("Cutout length must be smaller than outer length.");
  }

  if (input.cutoutWidth >= input.outerWidth) {
    errors.push("Cutout width must be smaller than outer width.");
  }

  if (!isIndoorAreaInRange(indoorArea)) {
    errors.push(
      `Indoor area must be between ${constructionPlotConfig.minIndoorAreaM2} and ${constructionPlotConfig.maxIndoorAreaM2} m².`,
    );
  }

  if (
    !isCorrectNumberAnswer(
      input.learnerIndoorAreaAnswer,
      indoorArea,
      architectureComparisonRules.numberTolerance,
    )
  ) {
    errors.push(
      "Your indoor area answer does not match outer area − cutout area.",
    );
  }

  if (
    !isCorrectNumberAnswer(
      input.learnerWallLengthAnswer,
      wallLength,
      architectureComparisonRules.numberTolerance,
    )
  ) {
    errors.push("Your wall-length answer does not match the L-shape perimeter.");
  }

  const usableWingWidth = Math.min(
    input.outerWidth - input.cutoutWidth,
    input.outerLength - input.cutoutLength,
  );
  if (usableWingWidth < architectureComparisonRules.minUsableWidthM) {
    warnings.push("The cutout makes some usable zones too narrow.");
  }

  return buildDesignResult(
    "l-shaped",
    profile.name,
    errors.length === 0,
    indoorArea,
    wallLength,
    cutoutArea,
    errors,
    warnings,
    profile.tradeOffs,
    "l-shaped",
  );
}

export function validateCourtyardDesign(
  input: CourtyardDesignInput,
): ArchitectureDesignResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const outerArea = input.outerLength * input.outerWidth;
  const courtyardArea = input.courtyardLength * input.courtyardWidth;
  const indoorArea = outerArea - courtyardArea;
  const outerPerimeter = 2 * (input.outerLength + input.outerWidth);
  const courtyardPerimeter =
    2 * (input.courtyardLength + input.courtyardWidth);
  const wallLength = outerPerimeter + courtyardPerimeter;

  if (!fitsInsidePlot(
    input.x,
    input.y,
    input.outerLength,
    input.outerWidth,
  )) {
    errors.push("The outer rectangle must fit inside the construction plot.");
  }

  if (
    input.courtyardLength <= 0 ||
    input.courtyardWidth <= 0 ||
    input.courtyardLength >= input.outerLength ||
    input.courtyardWidth >= input.outerWidth
  ) {
    errors.push("Courtyard dimensions must fit inside the outer rectangle.");
  }

  if (
    !isCorrectNumberAnswer(
      input.learnerIndoorAreaAnswer,
      indoorArea,
      architectureComparisonRules.numberTolerance,
    )
  ) {
    errors.push(
      "Your indoor area answer does not match outer area − courtyard area.",
    );
  }

  if (
    !isCorrectNumberAnswer(
      input.learnerWallLengthAnswer,
      wallLength,
      architectureComparisonRules.numberTolerance,
    )
  ) {
    errors.push("Your wall-length answer does not match outer + courtyard perimeters.");
  }

  if (indoorArea < constructionPlotConfig.minIndoorAreaM2) {
    warnings.push("Courtyard reduces indoor area below the required minimum.");
  }

  return buildDesignResult(
    "courtyard",
    optionalCourtyardProfile.name,
    errors.length === 0,
    indoorArea,
    wallLength,
    courtyardArea,
    errors,
    warnings,
    optionalCourtyardProfile.tradeOffs,
  );
}

export function allRequiredArchitecturesChecked(
  results: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>,
): boolean {
  return (
    Boolean(results["compact-rectangle"]?.checked) &&
    Boolean(results["two-building"]?.checked) &&
    Boolean(results["l-shaped"]?.checked)
  );
}

export function allRequiredArchitecturesValid(
  results: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>,
): boolean {
  return (
    results["compact-rectangle"]?.isValid === true &&
    results["two-building"]?.isValid === true &&
    results["l-shaped"]?.isValid === true
  );
}

export function canUnlockBonusChallenge(
  results: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>,
): boolean {
  return allRequiredArchitecturesValid(results);
}

export function canSelectFinalArchitecture(
  results: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>,
): boolean {
  return allRequiredArchitecturesValid(results);
}

export function getComparisonRows(
  results: Partial<Record<RequiredArchitectureId, ArchitectureDesignResult>>,
): ArchitectureDesignResult[] {
  return (["compact-rectangle", "two-building", "l-shaped"] as const)
    .map((id) => results[id])
    .filter((result): result is ArchitectureDesignResult => Boolean(result?.checked));
}
