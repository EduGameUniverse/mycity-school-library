import {
  getPlotProjectionConfig,
  isPointInsidePolygon,
  pointsAreClose,
  projectPlotPointToScreen,
} from "@/features/mycity/mission-library/logic/coordinateProjection";
import { libraryBudgetConfig } from "@/features/mycity/mission-library/data/budgetConfig";
import { elBahdjaCampusMap } from "@/features/mycity/mission-library/data/mapConfig";
import { libraryScoringConfig } from "@/features/mycity/mission-library/data/scoringConfig";
import { emptyGuidedReportAnswers } from "@/features/mycity/mission-library/data/reportConfig";
import {
  canUnlockBonusChallenge,
  validateCompactRectangleDesign,
  validateCourtyardDesign,
  validateLShapedDesign,
  validateTwoBuildingDesign,
} from "@/features/mycity/mission-library/logic/architectureComparison";
import { calculateBudgetScopeCost } from "@/features/mycity/mission-library/logic/budget";
import { getMissionReadiness } from "@/features/mycity/mission-library/logic/missionReadiness";
import { calculateMissionScore } from "@/features/mycity/mission-library/logic/scoring";
import {
  validateConstructionPurchase,
  validateGeometryAnswer,
  validateGuidedReportAnswers,
  validateLibraryItemsPurchase,
} from "@/features/mycity/mission-library/logic/validation";
import type {
  GuidedReportAnswers,
  RequiredArchitectureId,
  SelectedStoreItem,
} from "@/features/mycity/mission-library/types/missionTypes";

function logResult(label: string, passed: boolean, detail: string): void {
  const status = passed ? "PASS" : "FAIL";
  console.log(`[${status}] ${label}`);
  console.log(`       ${detail}`);
}

function fillReportAnswers(): GuidedReportAnswers {
  const fill = (prefix: string) => ({
    architectureChoice: `${prefix} architecture choice explanation long enough`,
    areaComparison: `${prefix} area comparison explanation long enough`,
    wallLengthComparison: `${prefix} wall comparison explanation long enough`,
    constructionCostComparison: `${prefix} construction cost explanation long enough`,
    libraryItemsBudgetUse: `${prefix} library budget explanation long enough`,
    readingSupport: `${prefix} reading support explanation long enough`,
    digitalLearningSupport: `${prefix} digital support explanation long enough`,
    accessibilitySupport: `${prefix} accessibility support explanation long enough`,
  });

  return {
    english: fill("English"),
    french: fill("French"),
    arabic: fill("Arabic"),
  };
}

function buildConstructionOrder(
  wallQuantity: number,
  floorQuantity: number,
): SelectedStoreItem[] {
  return [
    { itemId: "eco-wall-block", quantity: wallQuantity },
    { itemId: "standard-floor", quantity: floorQuantity },
    { itemId: "standard-door", quantity: 1 },
    { itemId: "window", quantity: 4 },
    { itemId: "led-light", quantity: 6 },
    { itemId: "ventilation-unit", quantity: 1 },
    { itemId: "accessibility-ramp", quantity: 1 },
    { itemId: "basic-electrical-setup", quantity: 1 },
  ];
}

function buildLibraryOrder(): SelectedStoreItem[] {
  return [
    { itemId: "book-pack", quantity: 1 },
    { itemId: "laptop", quantity: 1 },
    { itemId: "internet-router", quantity: 1 },
    { itemId: "adapted-reading-desk", quantity: 1 },
  ];
}

console.log("MyCity Mission 1 — learner-driven logic tests\n");

const compactValid = validateCompactRectangleDesign({
  aPrime: { x: 1, y: 1 },
  bPrime: { x: 17, y: 1 },
  cPrime: { x: 17, y: 11 },
  dPrime: { x: 1, y: 11 },
  learnerAreaAnswer: 160,
  learnerWallLengthAnswer: 52,
});
logResult(
  "Valid compact rectangle from coordinates",
  compactValid.isValid &&
    compactValid.computedLength === 16 &&
    compactValid.computedWidth === 10 &&
    compactValid.indoorArea === 160 &&
    compactValid.wallLength === 52,
  `length=${compactValid.computedLength}, width=${compactValid.computedWidth}, area=${compactValid.indoorArea}, wall=${compactValid.wallLength}`,
);

const compactInvalid = validateCompactRectangleDesign({
  aPrime: { x: 1, y: 1 },
  bPrime: { x: 17, y: 2 },
  cPrime: { x: 17, y: 11 },
  dPrime: { x: 1, y: 11 },
  learnerAreaAnswer: 160,
  learnerWallLengthAnswer: 52,
});
logResult(
  "Invalid compact rectangle not aligned",
  !compactInvalid.isValid,
  compactInvalid.errors[0] ?? "no errors",
);

const compactOutside = validateCompactRectangleDesign({
  aPrime: { x: 1, y: 1 },
  bPrime: { x: 20, y: 1 },
  cPrime: { x: 20, y: 11 },
  dPrime: { x: 1, y: 11 },
  learnerAreaAnswer: 190,
  learnerWallLengthAnswer: 58,
});
logResult(
  "Invalid compact rectangle outside plot",
  !compactOutside.isValid,
  compactOutside.errors[0] ?? "no errors",
);

const twoBuildingValid = validateTwoBuildingDesign({
  building1: { x: 0, y: 0, length: 10, width: 8 },
  building2: { x: 10, y: 0, length: 8, width: 8 },
  learnerTotalAreaAnswer: 144,
  learnerTotalWallLengthAnswer: 68,
});
logResult(
  "Valid two-building design",
  twoBuildingValid.isValid,
  `area=${twoBuildingValid.indoorArea}, wall=${twoBuildingValid.wallLength}`,
);

const twoBuildingOverlap = validateTwoBuildingDesign({
  building1: { x: 0, y: 0, length: 10, width: 8 },
  building2: { x: 5, y: 4, length: 8, width: 8 },
  learnerTotalAreaAnswer: 144,
  learnerTotalWallLengthAnswer: 68,
});
logResult(
  "Overlapping two-building design",
  !twoBuildingOverlap.isValid,
  twoBuildingOverlap.errors.join("; "),
);

const lShapedValid = validateLShapedDesign({
  x: 0,
  y: 0,
  outerLength: 18,
  outerWidth: 12,
  cutoutLength: 6,
  cutoutWidth: 6,
  learnerIndoorAreaAnswer: 180,
  learnerWallLengthAnswer: 60,
});
logResult(
  "Valid L-shaped design",
  lShapedValid.isValid && lShapedValid.indoorArea === 180,
  `area=${lShapedValid.indoorArea}, wall=${lShapedValid.wallLength}`,
);

const lShapedInvalid = validateLShapedDesign({
  x: 0,
  y: 0,
  outerLength: 18,
  outerWidth: 12,
  cutoutLength: 18,
  cutoutWidth: 6,
  learnerIndoorAreaAnswer: 0,
  learnerWallLengthAnswer: 0,
});
logResult(
  "Invalid L-shaped cutout",
  !lShapedInvalid.isValid,
  lShapedInvalid.errors[0] ?? "no errors",
);

const requiredResults = {
  "compact-rectangle": compactValid,
  "two-building": twoBuildingValid,
  "l-shaped": lShapedValid,
} satisfies Partial<Record<RequiredArchitectureId, typeof compactValid>>;

logResult(
  "Three valid designs unlock final selection",
  compactValid.isValid &&
    twoBuildingValid.isValid &&
    lShapedValid.isValid,
  "all required designs valid",
);

logResult(
  "Optional courtyard unlock after three valid designs",
  canUnlockBonusChallenge(requiredResults),
  `unlocked=${canUnlockBonusChallenge(requiredResults)}`,
);

logResult(
  "Construction budget limit = 2500",
  libraryBudgetConfig.constructionBudget === 2500,
  `constructionBudget=${libraryBudgetConfig.constructionBudget}`,
);

logResult(
  "Library-items budget limit = 500",
  libraryBudgetConfig.libraryItemsBudget === 500,
  `libraryItemsBudget=${libraryBudgetConfig.libraryItemsBudget}`,
);

const constructionOrder = buildConstructionOrder(52, 160);
const constructionPurchase = validateConstructionPurchase(
  constructionOrder,
  compactValid.construction,
);
logResult(
  "Valid construction order",
  constructionPurchase.isValid,
  `total=${constructionPurchase.totalCost}, remaining=${constructionPurchase.remainingBudget}`,
);

const overConstruction = buildConstructionOrder(52, 160);
overConstruction[0] = { itemId: "reinforced-wall-block", quantity: 220 };
const overConstructionPurchase = validateConstructionPurchase(
  overConstruction,
  compactValid.construction,
);
logResult(
  "Over-budget construction order",
  !overConstructionPurchase.isValid,
  `total=${overConstructionPurchase.totalCost}`,
);

const libraryOrder = buildLibraryOrder();
const libraryPurchase = validateLibraryItemsPurchase(libraryOrder);
logResult(
  "Valid library-items order",
  libraryPurchase.isValid,
  `total=${libraryPurchase.totalCost}, reading=${libraryPurchase.readingResourcesSelected}`,
);

const overLibrary = [
  ...libraryOrder,
  { itemId: "projector", quantity: 2 },
  { itemId: "tablet-station", quantity: 2 },
];
const overLibraryPurchase = validateLibraryItemsPurchase(overLibrary);
logResult(
  "Over-budget library-items order",
  !overLibraryPurchase.isValid,
  `total=${overLibraryPurchase.totalCost}`,
);

const blockedConstructionReadiness = getMissionReadiness({
  geometry: validateGeometryAnswer({ area: 216, perimeter: 60 }),
  comparisonResults: requiredResults,
  finalArchitecture: compactValid,
  constructionPurchase: overConstructionPurchase,
  libraryItemsPurchase: libraryPurchase,
  reportAnswers: fillReportAnswers(),
});
logResult(
  "Final build blocked if construction budget invalid",
  !blockedConstructionReadiness.ready,
  blockedConstructionReadiness.missingSteps.join(", "),
);

const blockedLibraryReadiness = getMissionReadiness({
  geometry: validateGeometryAnswer({ area: 216, perimeter: 60 }),
  comparisonResults: requiredResults,
  finalArchitecture: compactValid,
  constructionPurchase,
  libraryItemsPurchase: overLibraryPurchase,
  reportAnswers: fillReportAnswers(),
});
logResult(
  "Final build blocked if library-items budget invalid",
  !blockedLibraryReadiness.ready,
  blockedLibraryReadiness.missingSteps.join(", "),
);

const compactConstructionCost = calculateBudgetScopeCost(
  buildConstructionOrder(compactValid.wallLength, compactValid.floorQuantity),
  "construction",
);
const courtyardPreview = validateCourtyardDesign({
  x: 0,
  y: 0,
  outerLength: 18,
  outerWidth: 12,
  courtyardLength: 6,
  courtyardWidth: 6,
  learnerIndoorAreaAnswer: 180,
  learnerWallLengthAnswer: 96,
});
logResult(
  "Final selected architecture updates store wall/floor quantities",
  compactValid.construction.wallQuantity === 52 &&
    compactValid.construction.floorQuantity === 160 &&
    compactConstructionCost > 0 &&
    courtyardPreview.wallLength > compactValid.wallLength,
  `compact wall=${compactValid.construction.wallQuantity}, courtyard wall=${courtyardPreview.wallLength}`,
);

const geometry = validateGeometryAnswer({ area: 216, perimeter: 60 });
const score = calculateMissionScore({
  geometry,
  comparisonChecked: {
    "compact-rectangle": true,
    "two-building": true,
    "l-shaped": true,
  },
  comparisonValid: {
    "compact-rectangle": true,
    "two-building": true,
    "l-shaped": true,
  },
  finalArchitecture: compactValid,
  constructionPurchase,
  libraryItemsPurchase: libraryPurchase,
  reportValidation: validateGuidedReportAnswers(fillReportAnswers()),
});
logResult(
  "Final score totals 100 maximum",
  score.cappedTotal <= libraryScoringConfig.maxScore &&
    score.cappedTotal === libraryScoringConfig.maxScore,
  `score=${score.cappedTotal}/${libraryScoringConfig.maxScore}`,
);

const emptyReport = validateGuidedReportAnswers(emptyGuidedReportAnswers);
const blockedReportReadiness = getMissionReadiness({
  geometry,
  comparisonResults: requiredResults,
  finalArchitecture: compactValid,
  constructionPurchase,
  libraryItemsPurchase: libraryPurchase,
  reportAnswers: emptyGuidedReportAnswers,
});
logResult(
  "Report blocked if required trilingual fields are empty",
  !emptyReport.isValid && !blockedReportReadiness.ready,
  `reportValid=${emptyReport.isValid}, ready=${blockedReportReadiness.ready}`,
);

const projectionConfig = getPlotProjectionConfig(elBahdjaCampusMap.plot);
const screenPlotPolygon = [
  projectionConfig.corners.a,
  projectionConfig.corners.b,
  projectionConfig.corners.c,
  projectionConfig.corners.d,
];

logResult(
  "Math A(0,0) projects to screen A",
  pointsAreClose(
    projectPlotPointToScreen({ x: 0, y: 0 }, projectionConfig),
    projectionConfig.corners.a,
  ),
  `screen=${JSON.stringify(projectPlotPointToScreen({ x: 0, y: 0 }, projectionConfig))}`,
);

logResult(
  "Math B(18,0) projects to screen B",
  pointsAreClose(
    projectPlotPointToScreen({ x: 18, y: 0 }, projectionConfig),
    projectionConfig.corners.b,
  ),
  `screen=${JSON.stringify(projectPlotPointToScreen({ x: 18, y: 0 }, projectionConfig))}`,
);

logResult(
  "Math C(18,12) projects to screen C",
  pointsAreClose(
    projectPlotPointToScreen({ x: 18, y: 12 }, projectionConfig),
    projectionConfig.corners.c,
  ),
  `screen=${JSON.stringify(projectPlotPointToScreen({ x: 18, y: 12 }, projectionConfig))}`,
);

logResult(
  "Math D(0,12) projects to screen D",
  pointsAreClose(
    projectPlotPointToScreen({ x: 0, y: 12 }, projectionConfig),
    projectionConfig.corners.d,
  ),
  `screen=${JSON.stringify(projectPlotPointToScreen({ x: 0, y: 12 }, projectionConfig))}`,
);

const projectedCenter = projectPlotPointToScreen({ x: 9, y: 6 }, projectionConfig);
logResult(
  "Math center (9,6) projects inside plot polygon",
  isPointInsidePolygon(projectedCenter, screenPlotPolygon),
  `center=${JSON.stringify(projectedCenter)}`,
);

console.log("\nDone.");
