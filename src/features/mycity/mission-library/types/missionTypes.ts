/** Mission flow step identifiers. */
export type MissionStep =
  | "intro"
  | "inspectPlot"
  | "geometry"
  | "store"
  | "reviewOrder"
  | "build"
  | "report"
  | "summary";

/** Normalized or pixel coordinate on the campus map. */
export interface Point2D {
  x: number;
  y: number;
}

/** Rectangular plot dimensions in meters. */
export interface PlotDimensions {
  lengthM: number;
  widthM: number;
}

/** Corner id on the perspective plot quadrilateral. */
export type PlotCornerId = "A" | "B" | "C" | "D";

/** One plot corner with separate screen (%) and world (m) coordinates. */
export interface PlotCorner {
  id: PlotCornerId;
  label: string;
  screen: Point2D;
  world: Point2D;
  /** Optional label shift in screen percentage points (does not move the polygon). */
  labelOffset?: Point2D;
  /** How the label is anchored at the offset position. */
  labelAnchor?: "center" | "left" | "right";
}

/** Interactive construction plot on the campus map. */
export interface MapPlot {
  id: string;
  label: string;
  /** Perspective polygon on the map image, as screen percentages (0–100). */
  screenPolygon: Point2D[];
  /** Corner metadata linking screen position to world coordinates. */
  corners: PlotCorner[];
  dimensions: PlotDimensions;
}

/** Campus map configuration. */
export interface CampusMapConfig {
  id: string;
  title: string;
  backgroundImage: string;
  builtImage?: string;
  plotHighlightImage?: string;
  referenceImageSize?: { width: number; height: number };
  plot: MapPlot;
}

/** Which mission budget a store item draws from. */
export type BudgetScope = "construction" | "library-items";

/** Required architecture ids for comparison mode. */
export type RequiredArchitectureId =
  | "compact-rectangle"
  | "two-building"
  | "l-shaped";

export type OptionalArchitectureId = "courtyard";

export type ComparedArchitectureId =
  | RequiredArchitectureId
  | OptionalArchitectureId;

/** Store catalog grouping. */
export type StoreCategory =
  | "construction"
  | "floor"
  | "access"
  | "electrical"
  | "reading"
  | "digital"
  | "inclusion"
  | "enrichment";

/** Unit of measure for a store item. */
export type StoreUnit = "m" | "m2" | "each";

/**
 * Requirement groups let validation accept alternatives
 * (e.g. eco wall blocks OR reinforced wall blocks).
 */
export type RequirementGroup =
  | "wall-covering"
  | "floor-covering"
  | "wide-door"
  | "standard-door"
  | "window"
  | "led-light"
  | "ventilation"
  | "accessibility-ramp"
  | "electrical-setup"
  | "reading-resource"
  | "digital-resource"
  | "inclusion-resource";

/** Single purchasable store item. */
export interface StoreItem {
  id: string;
  budgetScope: BudgetScope;
  category: StoreCategory;
  label: string;
  description: string;
  unit: StoreUnit;
  unitPrice: number;
  required: boolean;
  minQuantity: number;
  requirementGroup?: RequirementGroup;
  optionalLabel?: string;
}

/** Learner-selected quantity for a catalog item. */
export interface SelectedStoreItem {
  itemId: string;
  quantity: number;
}

/** Learner geometry answers for the library plot. */
export interface GeometryAnswer {
  area: number;
  perimeter: number;
}

/** Result of geometry validation. */
export interface GeometryValidationResult {
  isValid: boolean;
  areaCorrect: boolean;
  perimeterCorrect: boolean;
  errors: string[];
}

/** Learner-entered library footprint corners in plot coordinates (meters). */
export interface LibraryFootprintInput {
  a: Point2D;
  b: Point2D;
  c: Point2D;
  d: Point2D;
}

/** Bounds for valid library placement inside the plot. */
export interface PlotCoordinateBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export type LibraryPlacementStatus = "recommended" | "valid" | "invalid";

/** Result of library footprint placement validation. */
export interface LibraryPlacementValidationResult {
  status: LibraryPlacementStatus;
  isValid: boolean;
  isRecommended: boolean;
  errors: string[];
  warning?: string;
  lengthM?: number;
  widthM?: number;
}

/** Result of purchase order validation. */
export interface PurchaseValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequirements: MissingRequirement[];
  totalCost: number;
  floorQuantity: number;
  wallQuantity: number;
}

/** Scoped purchase validation for construction or library items. */
export interface ScopedPurchaseValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequirements: MissingRequirement[];
  totalCost: number;
  remainingBudget: number;
  budgetLimit: number;
  wallQuantity?: number;
  floorQuantity?: number;
  readingResourcesSelected: number;
  digitalResourcesSelected: number;
  inclusionResourcesSelected: number;
}

/** A single unmet purchase requirement. */
export interface MissingRequirement {
  requirementGroup: RequirementGroup | "budget";
  label: string;
  required: number;
  selected: number;
  unit: StoreUnit | "EduCoins";
}

/** Trilingual learner report sentences. */
export interface ReportAnswers {
  arabic: string;
  french: string;
  english: string;
  learnerExplanation?: string;
}

/** Guided trilingual justification fields filled by the learner. */
export interface GuidedReportAnswers {
  english: GuidedReportLanguageAnswers;
  french: GuidedReportLanguageAnswers;
  arabic: GuidedReportLanguageAnswers;
}

export interface GuidedReportLanguageAnswers {
  architectureChoice: string;
  areaComparison: string;
  wallLengthComparison: string;
  constructionCostComparison: string;
  libraryItemsBudgetUse: string;
  readingSupport: string;
  digitalLearningSupport: string;
  accessibilitySupport: string;
}

/** Result of report validation. */
export interface ReportValidationResult {
  isValid: boolean;
  errors: string[];
}

/** Per-category score breakdown for Mission 1 completion. */
export interface ScoreBreakdown {
  architectureComparison: number;
  finalArchitecture: number;
  constructionBudget: number;
  libraryItemsBudget: number;
  digitalLearning: number;
  accessibilityInclusion: number;
  trilingualJustification: number;
}

/** Final mission score returned to the UI. */
export interface MissionScore {
  total: number;
  cappedTotal: number;
  breakdown: ScoreBreakdown;
  badges: string[];
  feedback: string[];
}

/** Inputs required to compute the mission completion score. */
export interface MissionScoreInput {
  geometry: GeometryValidationResult;
  comparisonChecked: Record<RequiredArchitectureId, boolean>;
  comparisonValid: Record<RequiredArchitectureId, boolean>;
  finalArchitecture: ArchitectureDesignResult | null;
  constructionPurchase: ScopedPurchaseValidationResult;
  libraryItemsPurchase: ScopedPurchaseValidationResult;
  reportValidation: ReportValidationResult;
}

export type ArchitectureGeometryType =
  | "compact-rectangle"
  | "two-building"
  | "courtyard"
  | "l-shaped";

export type ArchitectureQualityLevel =
  | "medium-low"
  | "medium"
  | "medium-good"
  | "good"
  | "high"
  | "very-good"
  | "excellent";

export interface ArchitectureQualityProfile {
  costEfficiency: ArchitectureQualityLevel;
  creativity: ArchitectureQualityLevel;
  comfort: ArchitectureQualityLevel;
  accessibility: ArchitectureQualityLevel;
  digitalLearningFit: ArchitectureQualityLevel;
}

export interface ArchitectureFeatureBonuses {
  readingZone?: number;
  digitalZone?: number;
  courtyardComfort?: number;
  accessibilityPath?: number;
}

export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  geometryType: ArchitectureGeometryType;
  defaultDimensions: Record<string, number>;
  requiredInputs: string[];
  qualityProfile: ArchitectureQualityProfile;
  featureBonuses: ArchitectureFeatureBonuses;
  advantages: string[];
  tradeOffs: string[];
  warnings: string[];
  suitableFor: string[];
}

export interface ArchitectureFootprintZone {
  lengthM: number;
  widthM: number;
  areaM2: number;
  perimeterM: number;
}

export interface ConstructionRequirements {
  floorQuantity: number;
  wallQuantity: number;
}

export interface CompactRectangleDesignInput {
  aPrime: Point2D;
  bPrime: Point2D;
  cPrime: Point2D;
  dPrime: Point2D;
  learnerAreaAnswer: number;
  learnerWallLengthAnswer: number;
}

export interface BuildingRectangleInput {
  x: number;
  y: number;
  length: number;
  width: number;
}

export interface TwoBuildingDesignInput {
  building1: BuildingRectangleInput;
  building2: BuildingRectangleInput;
  learnerTotalAreaAnswer: number;
  learnerTotalWallLengthAnswer: number;
}

export interface LShapedDesignInput {
  x: number;
  y: number;
  outerLength: number;
  outerWidth: number;
  cutoutLength: number;
  cutoutWidth: number;
  learnerIndoorAreaAnswer: number;
  learnerWallLengthAnswer: number;
}

export interface CourtyardDesignInput {
  x: number;
  y: number;
  outerLength: number;
  outerWidth: number;
  courtyardLength: number;
  courtyardWidth: number;
  learnerIndoorAreaAnswer: number;
  learnerWallLengthAnswer: number;
}

export interface ArchitectureDesignResult {
  architectureId: ComparedArchitectureId;
  architectureName: string;
  isValid: boolean;
  checked: boolean;
  indoorArea: number;
  wallLength: number;
  floorQuantity: number;
  openSpaceArea: number;
  estimatedConstructionCost: number;
  costEfficiencyScore: number;
  comfortScore: number;
  creativityScore: number;
  accessibilityScore: number;
  digitalLearningFitScore: number;
  errors: string[];
  warnings: string[];
  tradeOffs: string[];
  construction: ConstructionRequirements;
  computedLength?: number;
  computedWidth?: number;
}

export interface ArchitectureCalculationResult {
  templateId: string;
  templateName: string;
  indoorArea: number;
  openSpaceArea: number;
  wallQuantity: number;
  floorQuantity: number;
  estimatedBaseCost: number;
  qualityScore: number;
  warnings: string[];
  fitsInsideFootprint: boolean;
  /** Whether the footprint zone fits inside the 18 m × 12 m construction plot. */
  fitsInsideConstructionPlot: boolean;
  footprintZone: ArchitectureFootprintZone;
  construction: ConstructionRequirements;
}

/** Scoring weight configuration for Mission 1 completion. */
export interface ScoringConfig {
  maxScore: number;
  architectureComparison: number;
  finalArchitecture: number;
  constructionBudget: number;
  libraryItemsBudget: number;
  digitalLearning: number;
  accessibilityInclusion: number;
  trilingualJustification: number;
  libraryItemsWiseUseThreshold: number;
}

/** Data used to generate deterministic trilingual reports. */
export interface MissionReportData {
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
  readingResourcesLabel: string;
  digitalResourcesLabel: string;
  inclusionResourcesLabel: string;
  learnerAnswers: GuidedReportAnswers;
  finalScore: number;
  currencyLabel: string;
}

export interface ReportTemplateConfig {
  constructionAccessibilityItemIds: string[];
  readingResourceItemIds: string[];
  digitalResourceItemIds: string[];
  inclusionResourceItemIds: string[];
  reportPrompts: {
    architectureChoice: string;
    areaComparison: string;
    wallLengthComparison: string;
    constructionCostComparison: string;
    libraryItemsBudgetUse: string;
    readingSupport: string;
    digitalLearningSupport: string;
    accessibilitySupport: string;
  };
  noneSelectedLabel: {
    en: string;
    fr: string;
    ar: string;
  };
}

export interface MissionCompletionConfig {
  buildButtonLabel: string;
  buildReadyMessage: string;
  buildBlockedMessage: string;
  buildSuccessTitle: string;
  buildSuccessMessage: string;
  summaryTitle: string;
  scoreTitle: string;
  reportTitle: string;
  libraryCompletedBadge: string;
  requirementLabels: {
    geometry: string;
    architectureComparison: string;
    finalArchitecture: string;
    constructionPurchase: string;
    libraryItemsPurchase: string;
    report: string;
  };
}

/** @deprecated Legacy input kept for compatibility with older scoring drafts. */
export interface LegacyMissionScoreInput {
  geometry: GeometryValidationResult;
  purchase: PurchaseValidationResult;
  report: ReportValidationResult;
  selectedItems: SelectedStoreItem[];
  reportAnswers: ReportAnswers;
}

/** Budget configuration. */
export interface BudgetConfig {
  currency: string;
  currencyLabel: string;
  constructionBudget: number;
  libraryItemsBudget: number;
  totalMissionBudget: number;
}

/** Mission metadata and instructional copy. */
export interface MissionConfig {
  id: string;
  title: string;
  shortTitle: string;
  level: string;
  story: string;
  schoolName: string;
  formulas: {
    area: string;
    perimeter: string;
    floorQuantity: string;
    wallQuantity: string;
  };
  constructionRules: {
    floorQuantityEqualsArea: boolean;
    wallQuantityEqualsPerimeter: boolean;
  };
  steps: MissionStep[];
  labels: Record<string, string>;
}
