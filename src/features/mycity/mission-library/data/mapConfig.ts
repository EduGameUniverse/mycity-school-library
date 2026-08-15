import type { CampusMapConfig, PlotCorner, Point2D } from "../types/missionTypes";

/**
 * Perspective plot corners — screen % positions are tuned to main-map.png.
 * World coordinates (meters) stay separate from screen overlay geometry.
 *
 * Order: A → B → C → D (front-left, front-right, back-right, back-left).
 */
export const libraryPlotCorners: PlotCorner[] = [
  {
    id: "A",
    label: "A(0,0)",
    screen: { x: 40.0, y: 68.0 },
    world: { x: 0, y: 0 },
    labelOffset: { x: 0, y: 0 },
    labelAnchor: "center",
  },
  {
    id: "B",
    label: "B(18,0)",
    screen: { x: 68.5, y: 90.0 },
    world: { x: 18, y: 0 },
    labelOffset: { x: 0, y: 1.5 },
    labelAnchor: "center",
  },
  {
    id: "C",
    label: "C(18,12)",
    screen: { x: 99.5, y: 63.5 },
    world: { x: 18, y: 12 },
    labelOffset: { x: -5.5, y: -1.5 },
    labelAnchor: "right",
  },
  {
    id: "D",
    label: "D(0,12)",
    screen: { x: 70.5, y: 48.5 },
    world: { x: 0, y: 12 },
    labelOffset: { x: -1.5, y: -1.5 },
    labelAnchor: "center",
  },
];

/** Screen polygon derived from corner order A → B → C → D. */
export const libraryPlotScreenPolygon: Point2D[] = libraryPlotCorners.map(
  (corner) => corner.screen,
);

/** Static asset paths for the El-Bahdja campus map images. */
export const campusMapAssets = {
  background: "/assets/maps/el-bahdja-campus/main-map.png",
  built: "/assets/maps/el-bahdja-campus/main-map-library-built.png",
  plotHighlight: "/assets/maps/el-bahdja-campus/main-map-plot-highlight.png",
} as const;

/**
 * El-Bahdja campus map configuration.
 * Screen polygon uses percentage coordinates for responsive clip-path overlays.
 */
export const elBahdjaCampusMap: CampusMapConfig = {
  id: "el-bahdja-campus",
  title: "El-Bahdja School Campus",
  backgroundImage: campusMapAssets.background,
  builtImage: campusMapAssets.built,
  plotHighlightImage: campusMapAssets.plotHighlight,
  referenceImageSize: { width: 1448, height: 1086 },
  plot: {
    id: "library-plot-01",
    label: "Library Plot",
    screenPolygon: libraryPlotScreenPolygon,
    corners: libraryPlotCorners,
    dimensions: {
      lengthM: 18,
      widthM: 12,
    },
  },
};

/**
 * Resolve the campus map image for the current mission phase.
 * Falls back to the background map when the built image is unavailable.
 */
export function getCampusMapImageSrc(
  isBuilt: boolean,
  map: CampusMapConfig = elBahdjaCampusMap,
): string {
  if (isBuilt && map.builtImage) {
    return map.builtImage;
  }

  return map.backgroundImage;
}

/** Build a CSS clip-path polygon string from screen percentage points. */
export function buildPlotClipPath(screenPolygon: Point2D[]): string {
  const points = screenPolygon
    .map((point) => `${point.x}% ${point.y}%`)
    .join(", ");

  return `polygon(${points})`;
}

/** Build SVG polygon points for a 0–100 viewBox matching screen percentages. */
export function buildSvgPolygonPoints(screenPolygon: Point2D[]): string {
  return screenPolygon.map((point) => `${point.x},${point.y}`).join(" ");
}

/** Convert screen percentage polygon to pixel coordinates for a given image size. */
export function screenPolygonToPixels(
  screenPolygon: Point2D[],
  width: number,
  height: number,
) {
  return screenPolygon.map((point) => ({
    x: (point.x / 100) * width,
    y: (point.y / 100) * height,
  }));
}
