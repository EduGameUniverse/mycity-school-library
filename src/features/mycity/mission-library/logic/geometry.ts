import type { PlotDimensions } from "../types/missionTypes";

/** Default numeric tolerance for learner geometry answers. */
export const DEFAULT_NUMBER_TOLERANCE = 0.5;

/** Area of a rectangular plot: length × width. */
export function calculateArea(length: number, width: number): number {
  return length * width;
}

/** Perimeter of a rectangular plot: 2 × (length + width). */
export function calculatePerimeter(length: number, width: number): number {
  return 2 * (length + width);
}

/** Expected area from plot dimensions in config. */
export function getExpectedArea(dimensions: PlotDimensions): number {
  return calculateArea(dimensions.lengthM, dimensions.widthM);
}

/** Expected perimeter from plot dimensions in config. */
export function getExpectedPerimeter(dimensions: PlotDimensions): number {
  return calculatePerimeter(dimensions.lengthM, dimensions.widthM);
}

/** Compare a learner numeric answer to the expected value within tolerance. */
export function isCorrectNumberAnswer(
  answer: number,
  expected: number,
  tolerance: number = DEFAULT_NUMBER_TOLERANCE,
): boolean {
  if (!Number.isFinite(answer)) {
    return false;
  }

  return Math.abs(answer - expected) <= tolerance;
}
