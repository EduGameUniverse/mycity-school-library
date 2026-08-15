import type {
  LibraryFootprintInput,
  PlotCoordinateBounds,
  Point2D,
} from "../types/missionTypes";

export const libraryPlacementConfig = {
  sectionTitle: "Place the library inside the plot using coordinates",
  instructions:
    "Enter the coordinates of the library footprint corners A′, B′, C′, and D′ inside the plot A(0,0) → B(18,0) → C(18,12) → D(0,12).",
  plotBounds: {
    minX: 0,
    maxX: 18,
    minY: 0,
    maxY: 12,
  } satisfies PlotCoordinateBounds,
  recommendedFootprint: {
    a: { x: 2, y: 1 },
    b: { x: 16, y: 1 },
    c: { x: 16, y: 10 },
    d: { x: 2, y: 10 },
  } satisfies LibraryFootprintInput,
  coordinateTolerance: 0.5,
  messages: {
    success:
      "Excellent! Your library footprint matches the recommended placement and leaves balanced space around the building.",
    warning:
      "Your library fits inside the plot, but it does not leave the recommended balance of space.",
    invalidIntro: "Your footprint is not valid yet. Review these points:",
  },
  cornerLabels: {
    a: "A′",
    b: "B′",
    c: "C′",
    d: "D′",
  },
};

/** Display helper for a footprint corner label with coordinates. */
export function formatFootprintCorner(id: keyof LibraryFootprintInput, point: Point2D) {
  const prefix = libraryPlacementConfig.cornerLabels[id];
  return `${prefix}(${point.x}, ${point.y})`;
}

/** Recommended footprint formatted for UI hints. */
export function getRecommendedFootprintSummary(): string {
  const { recommendedFootprint } = libraryPlacementConfig;
  return [
    formatFootprintCorner("a", recommendedFootprint.a),
    formatFootprintCorner("b", recommendedFootprint.b),
    formatFootprintCorner("c", recommendedFootprint.c),
    formatFootprintCorner("d", recommendedFootprint.d),
  ].join(" · ");
}
