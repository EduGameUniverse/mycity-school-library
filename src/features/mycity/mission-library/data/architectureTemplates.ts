import type { ArchitectureTemplate } from "../types/missionTypes";

export const architectureUiConfig = {
  sectionTitle: "Choose your library architecture",
  sectionDescription:
    "Select a predefined library design inside your footprint. Each option changes indoor area, wall quantity, floor quantity, cost, and quality trade-offs.",
  futureNote:
    "Advanced circular courtyard library can be added later.",
  selectPrompt: "Select an architecture to update store construction quantities.",
  notSelectedMessage:
    "Select an architecture before submitting the purchase order.",
  disabledPrompt:
    "Complete a valid library footprint before choosing an architecture.",
};

/** Base unit prices used for estimated construction cost (matches eco wall + standard floor). */
export const architectureBasePricing = {
  wallUnitPrice: 8,
  floorUnitPrice: 2,
  currencyLabel: "EduCoins",
};

export const architectureTemplates: ArchitectureTemplate[] = [
  {
    id: "compact-rectangle",
    name: "Compact Rectangle Library",
    description:
      "One rectangular building that uses the full footprint efficiently. Easiest and cheapest option for a first library.",
    geometryType: "compact-rectangle",
    defaultDimensions: {
      usesFullFootprint: 1,
    },
    requiredInputs: ["footprintLength", "footprintWidth"],
    qualityProfile: {
      costEfficiency: "high",
      creativity: "medium-low",
      comfort: "medium",
      accessibility: "good",
      digitalLearningFit: "good",
    },
    featureBonuses: {
      readingZone: 1,
    },
    advantages: [
      "Lowest wall and floor quantities",
      "Simple to plan and build",
      "Good starting design for BEM learners",
    ],
    tradeOffs: [
      "Less creative than multi-zone designs",
      "Limited separation between reading and digital areas",
    ],
    warnings: ["Best when budget is tight."],
    suitableFor: [
      "Small schools with limited budget",
      "First-time library projects",
    ],
  },
  {
    id: "two-building",
    name: "Two-Building Library",
    description:
      "Two rectangular buildings inside the footprint: one for reading and one for digital learning.",
    geometryType: "two-building",
    defaultDimensions: {
      building1LengthRatio: 0.6,
      building2LengthRatio: 0.4,
      building2WidthRatio: 0.85,
    },
    requiredInputs: [
      "footprintLength",
      "footprintWidth",
      "building1LengthRatio",
      "building2LengthRatio",
    ],
    qualityProfile: {
      costEfficiency: "medium",
      creativity: "good",
      comfort: "good",
      accessibility: "good",
      digitalLearningFit: "very-good",
    },
    featureBonuses: {
      readingZone: 1,
      digitalZone: 2,
    },
    advantages: [
      "Separates quiet reading from digital learning",
      "Strong fit for project-based learning",
      "Clear functional zones for pupils",
    ],
    tradeOffs: [
      "Higher wall quantity because each building has its own perimeter",
      "More expensive than one compact rectangle",
    ],
    warnings: ["Watch the wall budget carefully."],
    suitableFor: [
      "Schools that want dedicated digital and reading spaces",
      "Learners ready for functional zoning",
    ],
  },
  {
    id: "courtyard",
    name: "Courtyard Library",
    description:
      "An outer rectangle with an open rectangular courtyard in the middle. Higher comfort and creativity, but more wall cost.",
    geometryType: "courtyard",
    defaultDimensions: {
      courtyardLengthRatio: 0.55,
      courtyardWidthRatio: 0.5,
    },
    requiredInputs: [
      "footprintLength",
      "footprintWidth",
      "courtyardLengthRatio",
      "courtyardWidthRatio",
    ],
    qualityProfile: {
      costEfficiency: "medium-low",
      creativity: "excellent",
      comfort: "excellent",
      accessibility: "good",
      digitalLearningFit: "good",
    },
    featureBonuses: {
      courtyardComfort: 2,
      readingZone: 1,
    },
    advantages: [
      "Excellent comfort with open courtyard space",
      "Highly creative school landmark design",
      "Natural light and ventilation potential",
    ],
    tradeOffs: [
      "Most expensive wall quantity of the four templates",
      "Less indoor area than a solid rectangle",
    ],
    warnings: [
      "Courtyard walls add cost quickly.",
      "Indoor area is smaller than the footprint area.",
    ],
    suitableFor: [
      "Schools prioritizing comfort and creativity",
      "Learners comparing cost versus quality",
    ],
  },
  {
    id: "l-shaped",
    name: "L-Shaped Library",
    description:
      "Two connected rectangles forming an L shape. Balanced creativity with moderate construction cost.",
    geometryType: "l-shaped",
    defaultDimensions: {
      verticalWingLengthRatio: 0.4,
      horizontalWingWidthRatio: 0.55,
      perimeterMultiplier: 1.35,
    },
    requiredInputs: [
      "footprintLength",
      "footprintWidth",
      "verticalWingLengthRatio",
      "horizontalWingWidthRatio",
    ],
    qualityProfile: {
      costEfficiency: "medium",
      creativity: "very-good",
      comfort: "good",
      accessibility: "medium-good",
      digitalLearningFit: "good",
    },
    featureBonuses: {
      readingZone: 1,
      accessibilityPath: 1,
    },
    advantages: [
      "Distinct zones without fully separate buildings",
      "Strong visual identity on the plot",
      "Flexible layout for entrance and reading corner",
    ],
    tradeOffs: [
      "Approximate wall quantity is higher than a compact rectangle",
      "Corner circulation needs careful planning",
    ],
    warnings: ["Accessibility paths should stay wide and clear."],
    suitableFor: [
      "Learners who want a creative but efficient compromise",
      "Plots with a clear entrance side",
    ],
  },
];

export function getArchitectureTemplateById(
  templateId: string,
): ArchitectureTemplate | undefined {
  return architectureTemplates.find((template) => template.id === templateId);
}
