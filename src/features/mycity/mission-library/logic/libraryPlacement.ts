import { libraryPlacementConfig } from "../data/libraryPlacementConfig";
import type {
  LibraryFootprintInput,
  LibraryPlacementValidationResult,
  PlotCoordinateBounds,
  Point2D,
} from "../types/missionTypes";
import { isCorrectNumberAnswer } from "./geometry";

function isFinitePoint(point: Point2D): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function isPointInsidePlot(
  point: Point2D,
  bounds: PlotCoordinateBounds = libraryPlacementConfig.plotBounds,
): boolean {
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  );
}

function pointsMatch(
  input: Point2D,
  target: Point2D,
  tolerance: number = libraryPlacementConfig.coordinateTolerance,
): boolean {
  return (
    isCorrectNumberAnswer(input.x, target.x, tolerance) &&
    isCorrectNumberAnswer(input.y, target.y, tolerance)
  );
}

function isRecommendedFootprint(input: LibraryFootprintInput): boolean {
  const recommended = libraryPlacementConfig.recommendedFootprint;

  return (
    pointsMatch(input.a, recommended.a) &&
    pointsMatch(input.b, recommended.b) &&
    pointsMatch(input.c, recommended.c) &&
    pointsMatch(input.d, recommended.d)
  );
}

function validateAxisAlignedRectangle(
  input: LibraryFootprintInput,
  tolerance: number = libraryPlacementConfig.coordinateTolerance,
): { isRectangle: boolean; errors: string[]; lengthM?: number; widthM?: number } {
  const errors: string[] = [];

  if (!isCorrectNumberAnswer(input.a.y, input.b.y, tolerance)) {
    errors.push("A′ and B′ must share the same y-coordinate (front edge).");
  }

  if (!isCorrectNumberAnswer(input.d.y, input.c.y, tolerance)) {
    errors.push("D′ and C′ must share the same y-coordinate (back edge).");
  }

  if (!isCorrectNumberAnswer(input.a.x, input.d.x, tolerance)) {
    errors.push("A′ and D′ must share the same x-coordinate (left edge).");
  }

  if (!isCorrectNumberAnswer(input.b.x, input.c.x, tolerance)) {
    errors.push("B′ and C′ must share the same x-coordinate (right edge).");
  }

  const lengthM = input.b.x - input.a.x;
  const widthM = input.d.y - input.a.y;

  if (!(lengthM > 0)) {
    errors.push("The library length must be greater than 0 m.");
  }

  if (!(widthM > 0)) {
    errors.push("The library width must be greater than 0 m.");
  }

  return {
    isRectangle: errors.length === 0,
    errors,
    lengthM: lengthM > 0 ? lengthM : undefined,
    widthM: widthM > 0 ? widthM : undefined,
  };
}

/** Validate a learner library footprint inside the plot. */
export function validateLibraryPlacement(
  input: LibraryFootprintInput,
  bounds: PlotCoordinateBounds = libraryPlacementConfig.plotBounds,
): LibraryPlacementValidationResult {
  const errors: string[] = [];
  const cornerEntries: Array<[keyof LibraryFootprintInput, Point2D, string]> = [
    ["a", input.a, "A′"],
    ["b", input.b, "B′"],
    ["c", input.c, "C′"],
    ["d", input.d, "D′"],
  ];

  for (const [, point, label] of cornerEntries) {
    if (!isFinitePoint(point)) {
      errors.push(`${label} must use valid numeric coordinates.`);
      continue;
    }

    if (!isPointInsidePlot(point, bounds)) {
      errors.push(
        `${label}(${point.x}, ${point.y}) must stay inside the plot: x between ${bounds.minX} and ${bounds.maxX}, y between ${bounds.minY} and ${bounds.maxY}.`,
      );
    }
  }

  if (errors.length > 0) {
    return {
      status: "invalid",
      isValid: false,
      isRecommended: false,
      errors,
    };
  }

  const rectangleResult = validateAxisAlignedRectangle(input);

  if (!rectangleResult.isRectangle) {
    return {
      status: "invalid",
      isValid: false,
      isRecommended: false,
      errors: rectangleResult.errors,
    };
  }

  if (isRecommendedFootprint(input)) {
    return {
      status: "recommended",
      isValid: true,
      isRecommended: true,
      errors: [],
      lengthM: rectangleResult.lengthM,
      widthM: rectangleResult.widthM,
    };
  }

  return {
    status: "valid",
    isValid: true,
    isRecommended: false,
    errors: [],
    warning: libraryPlacementConfig.messages.warning,
    lengthM: rectangleResult.lengthM,
    widthM: rectangleResult.widthM,
  };
}
