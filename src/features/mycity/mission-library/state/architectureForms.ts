import type {
  CompactRectangleDesignInput,
  LShapedDesignInput,
  TwoBuildingDesignInput,
} from "../types/missionTypes";

/**
 * Learner-editable architecture form source state.
 *
 * These are the exact string values held by the `<input type="number">` fields
 * (previously private to `ArchitectureComparisonPanel`). They are the source of
 * truth for Account v0 persistence; numbers are only ever derived from them
 * through the existing `Number(value)` conversion used by the validators.
 */

export const COMPACT_FORM_KEYS = [
  "aPrimeX",
  "aPrimeY",
  "bPrimeX",
  "bPrimeY",
  "cPrimeX",
  "cPrimeY",
  "dPrimeX",
  "dPrimeY",
  "learnerAreaAnswer",
  "learnerWallLengthAnswer",
] as const;

export const TWO_BUILDING_FORM_KEYS = [
  "x1",
  "y1",
  "length1",
  "width1",
  "x2",
  "y2",
  "length2",
  "width2",
  "learnerTotalAreaAnswer",
  "learnerTotalWallLengthAnswer",
] as const;

export const L_SHAPED_FORM_KEYS = [
  "x",
  "y",
  "outerLength",
  "outerWidth",
  "cutoutLength",
  "cutoutWidth",
  "learnerIndoorAreaAnswer",
  "learnerWallLengthAnswer",
] as const;

export type CompactFormKey = (typeof COMPACT_FORM_KEYS)[number];
export type TwoBuildingFormKey = (typeof TWO_BUILDING_FORM_KEYS)[number];
export type LShapedFormKey = (typeof L_SHAPED_FORM_KEYS)[number];

export type CompactRectangleSourceForm = Record<CompactFormKey, string>;
export type TwoBuildingSourceForm = Record<TwoBuildingFormKey, string>;
export type LShapedSourceForm = Record<LShapedFormKey, string>;

/** Maximum characters kept for one numeric source field (number inputs are ASCII). */
export const NUMERIC_SOURCE_MAX_CHARS = 32;

const NUMERIC_SOURCE_PATTERN = /^[0-9eE.+-]*$/;

/** Whether a string is an acceptable persisted numeric source value. */
export function isNumericSource(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= NUMERIC_SOURCE_MAX_CHARS &&
    NUMERIC_SOURCE_PATTERN.test(value)
  );
}

/** Keep only characters a number input can produce, bounded in length. */
export function sanitizeNumericSource(value: string): string {
  return value.replace(/[^0-9eE.+-]/g, "").slice(0, NUMERIC_SOURCE_MAX_CHARS);
}

/** The existing UI conversion: `Number("")` is 0, unparsable text is NaN. */
export function parseNumericSource(value: string): number {
  return Number(value);
}

export function emptyCompactForm(): CompactRectangleSourceForm {
  return {
    aPrimeX: "",
    aPrimeY: "",
    bPrimeX: "",
    bPrimeY: "",
    cPrimeX: "",
    cPrimeY: "",
    dPrimeX: "",
    dPrimeY: "",
    learnerAreaAnswer: "",
    learnerWallLengthAnswer: "",
  };
}

export function emptyTwoBuildingForm(): TwoBuildingSourceForm {
  return {
    x1: "0",
    y1: "0",
    length1: "",
    width1: "",
    x2: "",
    y2: "",
    length2: "",
    width2: "",
    learnerTotalAreaAnswer: "",
    learnerTotalWallLengthAnswer: "",
  };
}

export function emptyLShapedForm(): LShapedSourceForm {
  return {
    x: "0",
    y: "0",
    outerLength: "",
    outerWidth: "",
    cutoutLength: "",
    cutoutWidth: "",
    learnerIndoorAreaAnswer: "",
    learnerWallLengthAnswer: "",
  };
}

export function compactDesignInputFromForm(
  form: CompactRectangleSourceForm,
): CompactRectangleDesignInput {
  return {
    aPrime: { x: parseNumericSource(form.aPrimeX), y: parseNumericSource(form.aPrimeY) },
    bPrime: { x: parseNumericSource(form.bPrimeX), y: parseNumericSource(form.bPrimeY) },
    cPrime: { x: parseNumericSource(form.cPrimeX), y: parseNumericSource(form.cPrimeY) },
    dPrime: { x: parseNumericSource(form.dPrimeX), y: parseNumericSource(form.dPrimeY) },
    learnerAreaAnswer: parseNumericSource(form.learnerAreaAnswer),
    learnerWallLengthAnswer: parseNumericSource(form.learnerWallLengthAnswer),
  };
}

export function twoBuildingDesignInputFromForm(
  form: TwoBuildingSourceForm,
): TwoBuildingDesignInput {
  return {
    building1: {
      x: parseNumericSource(form.x1),
      y: parseNumericSource(form.y1),
      length: parseNumericSource(form.length1),
      width: parseNumericSource(form.width1),
    },
    building2: {
      x: parseNumericSource(form.x2),
      y: parseNumericSource(form.y2),
      length: parseNumericSource(form.length2),
      width: parseNumericSource(form.width2),
    },
    learnerTotalAreaAnswer: parseNumericSource(form.learnerTotalAreaAnswer),
    learnerTotalWallLengthAnswer: parseNumericSource(form.learnerTotalWallLengthAnswer),
  };
}

export function lShapedDesignInputFromForm(form: LShapedSourceForm): LShapedDesignInput {
  return {
    x: parseNumericSource(form.x),
    y: parseNumericSource(form.y),
    outerLength: parseNumericSource(form.outerLength),
    outerWidth: parseNumericSource(form.outerWidth),
    cutoutLength: parseNumericSource(form.cutoutLength),
    cutoutWidth: parseNumericSource(form.cutoutWidth),
    learnerIndoorAreaAnswer: parseNumericSource(form.learnerIndoorAreaAnswer),
    learnerWallLengthAnswer: parseNumericSource(form.learnerWallLengthAnswer),
  };
}
