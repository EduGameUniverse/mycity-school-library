import { elBahdjaCampusMap } from "../data/mapConfig";
import type { MapPlot, Point2D } from "../types/missionTypes";

export interface PlotProjectionConfig {
  plotLength: number;
  plotWidth: number;
  corners: {
    a: Point2D;
    b: Point2D;
    c: Point2D;
    d: Point2D;
  };
}

export interface RectangleFootprintMath {
  corners: {
    aPrime: Point2D;
    bPrime: Point2D;
    cPrime: Point2D;
    dPrime: Point2D;
  };
  polygon: Point2D[];
}

export interface FootprintPreviewData {
  mathPolygons: Point2D[][];
  cornerLabels: Array<{ label: string; mathPoint: Point2D }>;
}

const POINT_TOLERANCE = 0.05;

/** Build projection config from the campus map plot corners (screen percentages). */
export function getPlotProjectionConfig(
  plot: MapPlot = elBahdjaCampusMap.plot,
): PlotProjectionConfig {
  const cornerById = Object.fromEntries(
    plot.corners.map((corner) => [corner.id, corner.screen]),
  ) as Record<"A" | "B" | "C" | "D", Point2D>;

  return {
    plotLength: plot.dimensions.lengthM,
    plotWidth: plot.dimensions.widthM,
    corners: {
      a: cornerById.A,
      b: cornerById.B,
      c: cornerById.C,
      d: cornerById.D,
    },
  };
}

/**
 * Project a construction-plot math point P(x, y) into screen percentages
 * using bilinear interpolation across plot corners A, B, C, D.
 */
export function projectPlotPointToScreen(
  mathPoint: Point2D,
  config: PlotProjectionConfig,
): Point2D {
  const u = mathPoint.x / config.plotLength;
  const v = mathPoint.y / config.plotWidth;
  const { a, b, c, d } = config.corners;

  return {
    x:
      (1 - u) * (1 - v) * a.x +
      u * (1 - v) * b.x +
      u * v * c.x +
      (1 - u) * v * d.x,
    y:
      (1 - u) * (1 - v) * a.y +
      u * (1 - v) * b.y +
      u * v * c.y +
      (1 - u) * v * d.y,
  };
}

export function projectPlotPolygonToScreen(
  mathPolygon: Point2D[],
  config: PlotProjectionConfig,
): Point2D[] {
  return mathPolygon.map((point) => projectPlotPointToScreen(point, config));
}

export function pointsAreClose(
  a: Point2D,
  b: Point2D,
  tolerance: number = POINT_TOLERANCE,
): boolean {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

/** Rectangle footprint in plot math coordinates. */
export function getRectangleFootprintMath(
  x: number,
  y: number,
  length: number,
  width: number,
): RectangleFootprintMath {
  const aPrime = { x, y };
  const bPrime = { x: x + length, y };
  const cPrime = { x: x + length, y: y + width };
  const dPrime = { x, y: y + width };

  return {
    corners: { aPrime, bPrime, cPrime, dPrime },
    polygon: [aPrime, bPrime, cPrime, dPrime],
  };
}

export interface CompactRectangleCornerInput {
  aPrime: Point2D;
  bPrime: Point2D;
  cPrime: Point2D;
  dPrime: Point2D;
}

export interface CompactRectangleComputedMetrics {
  length: number;
  width: number;
  area: number;
  wallLength: number;
}

const AXIS_ALIGNMENT_TOLERANCE = 0.01;

export function areCornerCoordinatesInsidePlot(
  corners: CompactRectangleCornerInput,
  plotLength: number = 18,
  plotWidth: number = 12,
): boolean {
  const points = [
    corners.aPrime,
    corners.bPrime,
    corners.cPrime,
    corners.dPrime,
  ];

  return points.every(
    (point) =>
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      point.x >= 0 &&
      point.y >= 0 &&
      point.x <= plotLength + 0.01 &&
      point.y <= plotWidth + 0.01,
  );
}

export function isAxisAlignedRectangle(
  corners: CompactRectangleCornerInput,
  tolerance: number = AXIS_ALIGNMENT_TOLERANCE,
): boolean {
  const { aPrime, bPrime, cPrime, dPrime } = corners;

  return (
    Math.abs(aPrime.y - bPrime.y) <= tolerance &&
    Math.abs(cPrime.y - dPrime.y) <= tolerance &&
    Math.abs(aPrime.x - dPrime.x) <= tolerance &&
    Math.abs(bPrime.x - cPrime.x) <= tolerance
  );
}

/** Derive length, width, area, and wall length from four corner coordinates. */
export function calculateCompactRectangleFromCorners(
  corners: CompactRectangleCornerInput,
): CompactRectangleComputedMetrics | null {
  if (!isAxisAlignedRectangle(corners)) {
    return null;
  }

  const { aPrime, bPrime, dPrime } = corners;
  const length = bPrime.x - aPrime.x;
  const width = dPrime.y - aPrime.y;

  if (length <= 0 || width <= 0) {
    return null;
  }

  const area = length * width;
  const wallLength = 2 * (length + width);

  return {
    length: round1(length),
    width: round1(width),
    area: round1(area),
    wallLength: round1(wallLength),
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function getCompactRectanglePreviewFromCorners(
  corners: CompactRectangleCornerInput,
): FootprintPreviewData | null {
  const { aPrime, bPrime, cPrime, dPrime } = corners;
  const points = [aPrime, bPrime, cPrime, dPrime];

  if (points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    return null;
  }

  return {
    mathPolygons: [points],
    cornerLabels: [
      { label: "A′", mathPoint: aPrime },
      { label: "B′", mathPoint: bPrime },
      { label: "C′", mathPoint: cPrime },
      { label: "D′", mathPoint: dPrime },
    ],
  };
}

export function getCompactRectanglePreview(
  x: number,
  y: number,
  length: number,
  width: number,
): FootprintPreviewData | null {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(length) ||
    !Number.isFinite(width) ||
    length <= 0 ||
    width <= 0
  ) {
    return null;
  }

  const footprint = getRectangleFootprintMath(x, y, length, width);

  return {
    mathPolygons: [footprint.polygon],
    cornerLabels: [
      { label: "A′", mathPoint: footprint.corners.aPrime },
      { label: "B′", mathPoint: footprint.corners.bPrime },
      { label: "C′", mathPoint: footprint.corners.cPrime },
      { label: "D′", mathPoint: footprint.corners.dPrime },
    ],
  };
}

export function getTwoBuildingPreview(
  building1: { x: number; y: number; length: number; width: number },
  building2: { x: number; y: number; length: number; width: number },
): FootprintPreviewData | null {
  const rects = [building1, building2];
  const polygons: Point2D[][] = [];
  const cornerLabels: Array<{ label: string; mathPoint: Point2D }> = [];

  for (const [index, rect] of rects.entries()) {
    if (
      !Number.isFinite(rect.x) ||
      !Number.isFinite(rect.y) ||
      !Number.isFinite(rect.length) ||
      !Number.isFinite(rect.width) ||
      rect.length <= 0 ||
      rect.width <= 0
    ) {
      return null;
    }

    const footprint = getRectangleFootprintMath(
      rect.x,
      rect.y,
      rect.length,
      rect.width,
    );
    const suffix = index + 1;
    polygons.push(footprint.polygon);
    cornerLabels.push(
      { label: `A′${suffix}`, mathPoint: footprint.corners.aPrime },
      { label: `B′${suffix}`, mathPoint: footprint.corners.bPrime },
      { label: `C′${suffix}`, mathPoint: footprint.corners.cPrime },
      { label: `D′${suffix}`, mathPoint: footprint.corners.dPrime },
    );
  }

  return { mathPolygons: polygons, cornerLabels };
}

/** L-shape with top-right corner cutout (same model as architecture validation). */
export function getLShapedPreview(
  x: number,
  y: number,
  outerLength: number,
  outerWidth: number,
  cutoutLength: number,
  cutoutWidth: number,
): FootprintPreviewData | null {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(outerLength) ||
    !Number.isFinite(outerWidth) ||
    !Number.isFinite(cutoutLength) ||
    !Number.isFinite(cutoutWidth) ||
    outerLength <= 0 ||
    outerWidth <= 0 ||
    cutoutLength <= 0 ||
    cutoutWidth <= 0 ||
    cutoutLength >= outerLength ||
    cutoutWidth >= outerWidth
  ) {
    return null;
  }

  const footprint = getRectangleFootprintMath(x, y, outerLength, outerWidth);
  const polygon = [
    { x, y },
    { x: x + outerLength - cutoutLength, y },
    { x: x + outerLength - cutoutLength, y: y + cutoutWidth },
    { x: x + outerLength, y: y + cutoutWidth },
    { x: x + outerLength, y: y + outerWidth },
    { x, y: y + outerWidth },
  ];

  return {
    mathPolygons: [polygon],
    cornerLabels: [
      { label: "A′", mathPoint: footprint.corners.aPrime },
      { label: "B′", mathPoint: footprint.corners.bPrime },
      { label: "C′", mathPoint: footprint.corners.cPrime },
      { label: "D′", mathPoint: footprint.corners.dPrime },
    ],
  };
}

/** Ray-casting point-in-polygon for screen-space sanity checks. */
export function isPointInsidePolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersects =
      yi > point.y !== yj > point.y &&
      point.x <
        ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function getNormalizedPlotCoordinates(
  mathPoint: Point2D,
  config: PlotProjectionConfig,
): Point2D {
  return {
    x: mathPoint.x / config.plotLength,
    y: mathPoint.y / config.plotWidth,
  };
}
