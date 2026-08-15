import type {
  ArchitectureQualityLevel,
  ArchitectureQualityProfile,
  RequiredArchitectureId,
} from "../types/missionTypes";

export const architectureComparisonUiConfig = {
  sectionTitle: "Compare three library architectures",
  sectionDescription:
    "Design and check three library proposals inside the 18 m × 12 m construction plot. Calculate area and wall length yourself before clicking Check this design.",
  coordinateExplanation:
    "Use A(0,0) as the origin. The x value moves from A to B. The y value moves from A to D. Your building must stay inside the 18 m × 12 m construction plot.",
  compactCoordinateInstruction:
    "Enter the four coordinates of your proposed library. Use A(0,0) as the origin of the construction plot.",
  checkButtonLabel: "Check this design",
  comparisonTableTitle: "Architecture comparison",
  finalSelectionTitle: "Select your final library design",
  finalSelectionHint:
    "Compare the table above, then choose one valid design. No design is recommended — you decide.",
  bonusSectionTitle: "Bonus Challenge — Courtyard Library",
  bonusSectionDescription:
    "Optional rectangular courtyard design. Complete all three required architectures first.",
  circularNote: "Advanced circular courtyard design can be added later.",
};

export const constructionPlotConfig = {
  lengthM: 18,
  widthM: 12,
  fullAreaM2: 216,
  minIndoorAreaM2: 144,
  maxIndoorAreaM2: 216,
};

/** Base unit prices for estimated construction cost display (eco wall + standard floor). */
export const architectureConstructionPricing = {
  wallUnitPrice: 8,
  floorUnitPrice: 2,
};

export const architectureComparisonRules = {
  numberTolerance: 0.5,
  maxBuildingGapM: 4,
  minCirculationGapM: 1.5,
  minUsableWidthM: 3,
};

const qualityLevelScores: Record<ArchitectureQualityLevel, number> = {
  "medium-low": 52,
  medium: 62,
  "medium-good": 70,
  good: 76,
  high: 84,
  "very-good": 86,
  excellent: 94,
};

export function qualityLevelToScore(level: ArchitectureQualityLevel): number {
  return qualityLevelScores[level];
}

export const requiredArchitectureProfiles: Record<
  RequiredArchitectureId,
  {
    name: string;
    description: string;
    qualityProfile: ArchitectureQualityProfile;
    tradeOffs: string[];
  }
> = {
  "compact-rectangle": {
    name: "Compact Rectangle Library",
    description: "One rectangular building inside the plot.",
    qualityProfile: {
      costEfficiency: "high",
      creativity: "medium-low",
      comfort: "medium",
      accessibility: "good",
      digitalLearningFit: "good",
    },
    tradeOffs: [
      "Less creative than multi-zone designs",
      "Limited separation between reading and digital areas",
    ],
  },
  "two-building": {
    name: "Two-Building Library",
    description: "Two rectangular buildings: reading and digital learning.",
    qualityProfile: {
      costEfficiency: "medium",
      creativity: "good",
      comfort: "good",
      accessibility: "good",
      digitalLearningFit: "very-good",
    },
    tradeOffs: [
      "Higher wall quantity because each building has its own perimeter",
      "Circulation between buildings must be planned carefully",
    ],
  },
  "l-shaped": {
    name: "L-Shaped Library",
    description: "Outer rectangle with one rectangular corner cutout.",
    qualityProfile: {
      costEfficiency: "medium",
      creativity: "very-good",
      comfort: "good",
      accessibility: "medium-good",
      digitalLearningFit: "good",
    },
    tradeOffs: [
      "Corner circulation needs careful planning",
      "Cutout can reduce usable width in some zones",
    ],
  },
};

export const optionalCourtyardProfile = {
  name: "Courtyard Library (Bonus)",
  description: "Optional rectangular outer building with open courtyard.",
  qualityProfile: {
    costEfficiency: "medium-low",
    creativity: "excellent",
    comfort: "excellent",
    accessibility: "good",
    digitalLearningFit: "good",
  } satisfies ArchitectureQualityProfile,
  tradeOffs: [
    "Higher wall cost than a compact rectangle",
    "Less indoor area than a solid rectangle",
  ],
};

export const requiredArchitectureIds: RequiredArchitectureId[] = [
  "compact-rectangle",
  "two-building",
  "l-shaped",
];
