import { requiredArchitectureIds } from "@/features/mycity/mission-library/data/architectureComparisonConfig";
import { storeCatalog } from "@/features/mycity/mission-library/data/storeCatalog";
import {
  clampReportAnswer,
  REPORT_ANSWER_MAX_UTF8_BYTES,
  REPORT_ANSWERS_MAX_UTF8_BYTES,
  REPORT_FIELD_KEYS,
  REPORT_LANGUAGE_KEYS,
  utf8ByteLength,
} from "@/features/mycity/mission-library/logic/reportLimits";
import { buildSelectedStoreItems } from "@/features/mycity/mission-library/logic/storeSelection";
import {
  COMPACT_FORM_KEYS,
  emptyCompactForm,
  emptyLShapedForm,
  emptyTwoBuildingForm,
  isNumericSource,
  L_SHAPED_FORM_KEYS,
  sanitizeNumericSource,
  TWO_BUILDING_FORM_KEYS,
  type CompactRectangleSourceForm,
  type LShapedSourceForm,
  type TwoBuildingSourceForm,
} from "@/features/mycity/mission-library/state/architectureForms";
import type {
  GuidedReportAnswers,
  GuidedReportLanguageAnswers,
  RequiredArchitectureId,
} from "@/features/mycity/mission-library/types/missionTypes";

/**
 * `MyCityLibraryProgressV1` is the central Account v0 payload for
 * `mycity` / `bem-mission-01-school-library`, state version 1.
 *
 * Only learner *source* inputs are persisted. Every validation result, cost,
 * score, generated report, preview polygon or map asset is derived again from
 * this payload through the existing mission validators.
 *
 * `stateVersion` travels in the envelope (POST body, server record, guest
 * wrapper) exactly like the other EduGame modules; it is not duplicated here.
 */

export const PAYLOAD_KEYS = [
  "plotInspected",
  "geometry",
  "compact",
  "twoBuilding",
  "lShaped",
  "finalArchitectureId",
  "storeSelections",
  "constructionOrderChecked",
  "libraryItemsOrderChecked",
  "reportAnswers",
  "completed",
] as const;

export const GEOMETRY_KEYS = ["area", "perimeter"] as const;
export const ARCHITECTURE_PROGRESS_KEYS = ["checked", "form"] as const;
export const STORE_SELECTION_KEYS = ["itemId", "quantity"] as const;

/** Catalog order is the canonical order for persisted store selections. */
export const STORE_ITEM_IDS: readonly string[] = storeCatalog.map((item) => item.id);
export const STORE_QUANTITY_MAX = 1_000_000;

/** Portal generic payload cap (UTF-8 bytes of the serialized payload). */
export const PAYLOAD_MAX_UTF8_BYTES = 16_384;

/**
 * Keys that must never appear anywhere in a persisted payload: identity,
 * secrets, preferences, derived results and wallet semantics.
 */
export const FORBIDDEN_PAYLOAD_KEYS = [
  "userId",
  "user_id",
  "email",
  "name",
  "displayName",
  "locale",
  "language",
  "theme",
  "token",
  "tokens",
  "access_token",
  "cookie",
  "cookies",
  "score",
  "missionScore",
  "cappedTotal",
  "badges",
  "feedback",
  "reportSummary",
  "summary",
  "footprintPreview",
  "preview",
  "activePreviewId",
  "mapImageSrc",
  "isBuilt",
  "errors",
  "warnings",
  "totalCost",
  "remainingBudget",
  "estimatedConstructionCost",
  "indoorArea",
  "wallLength",
  "geometryResult",
  "comparisonResults",
  "finalArchitecture",
  "constructionPurchase",
  "libraryItemsPurchase",
  "courtyard",
  "bonusResult",
  "wallet",
  "eduCoins",
  "educoin",
  "eduCoin",
  "balance",
  "updatedAt",
  "createdAt",
  "completedAt",
  "timestamp",
] as const;

export type GeometrySource = {
  area: string;
  perimeter: string;
};

export type ArchitectureFormProgress<TForm> = {
  checked: boolean;
  form: TForm;
};

export type StoreSelectionProgress = {
  itemId: string;
  quantity: number;
};

export type MyCityLibraryProgressV1 = {
  plotInspected: boolean;
  geometry: GeometrySource;
  compact: ArchitectureFormProgress<CompactRectangleSourceForm>;
  twoBuilding: ArchitectureFormProgress<TwoBuildingSourceForm>;
  lShaped: ArchitectureFormProgress<LShapedSourceForm>;
  finalArchitectureId: RequiredArchitectureId | null;
  storeSelections: StoreSelectionProgress[];
  /**
   * Learner explicitly pressed "Check construction order" / "Check library-items
   * order" since the last quantity change or final-architecture selection.
   * Evidence of intent only — the validation result itself is always derived.
   */
  constructionOrderChecked: boolean;
  libraryItemsOrderChecked: boolean;
  reportAnswers: GuidedReportAnswers;
  completed: boolean;
};

/** Source snapshot handed over by the mission page each render. */
export type LibrarySourceSnapshot = {
  plotInspected: boolean;
  areaInput: string;
  perimeterInput: string;
  compactForm: CompactRectangleSourceForm;
  compactChecked: boolean;
  twoBuildingForm: TwoBuildingSourceForm;
  twoBuildingChecked: boolean;
  lShapedForm: LShapedSourceForm;
  lShapedChecked: boolean;
  finalArchitectureId: RequiredArchitectureId | null;
  quantities: Record<string, number>;
  constructionOrderChecked: boolean;
  libraryItemsOrderChecked: boolean;
  reportAnswers: GuidedReportAnswers;
  completed: boolean;
};

const FORBIDDEN_KEY_SET = new Set<string>(FORBIDDEN_PAYLOAD_KEYS);
const STORE_ITEM_ID_SET = new Set(STORE_ITEM_IDS);
const STORE_ITEM_ORDER = new Map(STORE_ITEM_IDS.map((id, index) => [id, index]));

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIn<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function hasExactKeys(record: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(record);
  if (keys.length !== allowed.length) {
    return false;
  }
  const allowedSet = new Set(allowed);
  return keys.every((key) => allowedSet.has(key) && !FORBIDDEN_KEY_SET.has(key));
}

function isStoreItemId(value: unknown): value is string {
  return typeof value === "string" && STORE_ITEM_ID_SET.has(value);
}

function isStoreQuantity(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= STORE_QUANTITY_MAX
  );
}

function sanitizeForm<TKey extends string>(
  keys: readonly TKey[],
  form: Record<TKey, string>,
): Record<TKey, string> {
  const output = {} as Record<TKey, string>;
  for (const key of keys) {
    output[key] = sanitizeNumericSource(typeof form[key] === "string" ? form[key] : "");
  }
  return output;
}

function parseForm<TKey extends string>(
  keys: readonly TKey[],
  value: unknown,
): Record<TKey, string> | null {
  if (!isRecord(value) || !hasExactKeys(value, keys)) {
    return null;
  }
  const output = {} as Record<TKey, string>;
  for (const key of keys) {
    const field = value[key];
    if (!isNumericSource(field)) {
      return null;
    }
    output[key] = field;
  }
  return output;
}

function parseArchitectureProgress<TKey extends string>(
  keys: readonly TKey[],
  value: unknown,
): ArchitectureFormProgress<Record<TKey, string>> | null {
  if (!isRecord(value) || !hasExactKeys(value, ARCHITECTURE_PROGRESS_KEYS)) {
    return null;
  }
  if (typeof value.checked !== "boolean") {
    return null;
  }
  const form = parseForm(keys, value.form);
  if (!form) {
    return null;
  }
  return { checked: value.checked, form };
}

function sanitizeLanguageAnswers(
  answers: GuidedReportLanguageAnswers | undefined,
): GuidedReportLanguageAnswers {
  const output = {} as GuidedReportLanguageAnswers;
  for (const field of REPORT_FIELD_KEYS) {
    const raw = answers?.[field];
    output[field] = clampReportAnswer(typeof raw === "string" ? raw : "");
  }
  return output;
}

function parseLanguageAnswers(value: unknown): GuidedReportLanguageAnswers | null {
  if (!isRecord(value) || !hasExactKeys(value, REPORT_FIELD_KEYS)) {
    return null;
  }
  const output = {} as GuidedReportLanguageAnswers;
  for (const field of REPORT_FIELD_KEYS) {
    const answer = value[field];
    if (typeof answer !== "string" || utf8ByteLength(answer) > REPORT_ANSWER_MAX_UTF8_BYTES) {
      return null;
    }
    output[field] = answer;
  }
  return output;
}

function parseReportAnswers(value: unknown): GuidedReportAnswers | null {
  if (!isRecord(value) || !hasExactKeys(value, REPORT_LANGUAGE_KEYS)) {
    return null;
  }
  const english = parseLanguageAnswers(value.english);
  const french = parseLanguageAnswers(value.french);
  const arabic = parseLanguageAnswers(value.arabic);
  if (!english || !french || !arabic) {
    return null;
  }
  const answers = { english, french, arabic };
  let total = 0;
  for (const language of REPORT_LANGUAGE_KEYS) {
    for (const field of REPORT_FIELD_KEYS) {
      total += utf8ByteLength(answers[language][field]);
    }
  }
  if (total > REPORT_ANSWERS_MAX_UTF8_BYTES) {
    return null;
  }
  return answers;
}

/** Canonical selections: known items only, positive bounded quantities, catalog order, no duplicates. */
export function canonicalizeStoreSelections(
  selections: readonly StoreSelectionProgress[],
): StoreSelectionProgress[] {
  const byId = new Map<string, number>();
  for (const selection of selections) {
    if (!isStoreItemId(selection.itemId) || !isStoreQuantity(selection.quantity)) {
      continue;
    }
    if (!byId.has(selection.itemId)) {
      byId.set(selection.itemId, selection.quantity);
    }
  }
  return [...byId.entries()]
    .sort(
      ([left], [right]) =>
        (STORE_ITEM_ORDER.get(left) ?? 0) - (STORE_ITEM_ORDER.get(right) ?? 0),
    )
    .map(([itemId, quantity]) => ({ itemId, quantity }));
}

function parseStoreSelections(value: unknown): StoreSelectionProgress[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  if (value.length > STORE_ITEM_IDS.length) {
    return null;
  }
  const seen = new Set<string>();
  const selections: StoreSelectionProgress[] = [];
  for (const item of value) {
    if (!isRecord(item) || !hasExactKeys(item, STORE_SELECTION_KEYS)) {
      return null;
    }
    if (!isStoreItemId(item.itemId) || !isStoreQuantity(item.quantity)) {
      return null;
    }
    if (seen.has(item.itemId)) {
      return null;
    }
    seen.add(item.itemId);
    selections.push({ itemId: item.itemId, quantity: item.quantity });
  }
  return canonicalizeStoreSelections(selections);
}

export function emptyGuidedReportAnswersV1(): GuidedReportAnswers {
  return {
    english: sanitizeLanguageAnswers(undefined),
    french: sanitizeLanguageAnswers(undefined),
    arabic: sanitizeLanguageAnswers(undefined),
  };
}

export function emptyLibraryProgress(): MyCityLibraryProgressV1 {
  return {
    plotInspected: false,
    geometry: { area: "", perimeter: "" },
    compact: { checked: false, form: emptyCompactForm() },
    twoBuilding: { checked: false, form: emptyTwoBuildingForm() },
    lShaped: { checked: false, form: emptyLShapedForm() },
    finalArchitectureId: null,
    storeSelections: [],
    constructionOrderChecked: false,
    libraryItemsOrderChecked: false,
    reportAnswers: emptyGuidedReportAnswersV1(),
    completed: false,
  };
}

/** Canonical form of an already-typed payload (fixed key order, sanitized sources, clamped text). */
export function normalizeLibraryProgress(
  payload: MyCityLibraryProgressV1,
): MyCityLibraryProgressV1 {
  return {
    plotInspected: payload.plotInspected === true,
    geometry: {
      area: sanitizeNumericSource(payload.geometry?.area ?? ""),
      perimeter: sanitizeNumericSource(payload.geometry?.perimeter ?? ""),
    },
    compact: {
      checked: payload.compact?.checked === true,
      form: sanitizeForm(COMPACT_FORM_KEYS, payload.compact?.form ?? emptyCompactForm()),
    },
    twoBuilding: {
      checked: payload.twoBuilding?.checked === true,
      form: sanitizeForm(
        TWO_BUILDING_FORM_KEYS,
        payload.twoBuilding?.form ?? emptyTwoBuildingForm(),
      ),
    },
    lShaped: {
      checked: payload.lShaped?.checked === true,
      form: sanitizeForm(L_SHAPED_FORM_KEYS, payload.lShaped?.form ?? emptyLShapedForm()),
    },
    finalArchitectureId: isIn(payload.finalArchitectureId, requiredArchitectureIds)
      ? payload.finalArchitectureId
      : null,
    storeSelections: canonicalizeStoreSelections(payload.storeSelections ?? []),
    constructionOrderChecked: payload.constructionOrderChecked === true,
    libraryItemsOrderChecked: payload.libraryItemsOrderChecked === true,
    reportAnswers: {
      english: sanitizeLanguageAnswers(payload.reportAnswers?.english),
      french: sanitizeLanguageAnswers(payload.reportAnswers?.french),
      arabic: sanitizeLanguageAnswers(payload.reportAnswers?.arabic),
    },
    completed: payload.completed === true,
  };
}

/** Build the canonical payload from the page's source state. */
export function buildLibraryProgressPayload(
  source: LibrarySourceSnapshot,
): MyCityLibraryProgressV1 {
  return normalizeLibraryProgress({
    plotInspected: source.plotInspected,
    geometry: { area: source.areaInput, perimeter: source.perimeterInput },
    compact: { checked: source.compactChecked, form: source.compactForm },
    twoBuilding: { checked: source.twoBuildingChecked, form: source.twoBuildingForm },
    lShaped: { checked: source.lShapedChecked, form: source.lShapedForm },
    finalArchitectureId: source.finalArchitectureId,
    storeSelections: buildSelectedStoreItems(source.quantities),
    constructionOrderChecked: source.constructionOrderChecked,
    libraryItemsOrderChecked: source.libraryItemsOrderChecked,
    reportAnswers: source.reportAnswers,
    completed: source.completed,
  });
}

/**
 * Strict parser for untrusted input (guest storage, server records).
 * Returns the normalized payload or `null`; never throws.
 */
export function parseLibraryProgressV1(value: unknown): MyCityLibraryProgressV1 | null {
  if (!isRecord(value) || !hasExactKeys(value, PAYLOAD_KEYS)) {
    return null;
  }
  if (payloadContainsForbiddenFields(value)) {
    return null;
  }
  if (typeof value.plotInspected !== "boolean" || typeof value.completed !== "boolean") {
    return null;
  }
  if (
    typeof value.constructionOrderChecked !== "boolean" ||
    typeof value.libraryItemsOrderChecked !== "boolean"
  ) {
    return null;
  }
  const geometry = parseForm(GEOMETRY_KEYS, value.geometry);
  const compact = parseArchitectureProgress(COMPACT_FORM_KEYS, value.compact);
  const twoBuilding = parseArchitectureProgress(TWO_BUILDING_FORM_KEYS, value.twoBuilding);
  const lShaped = parseArchitectureProgress(L_SHAPED_FORM_KEYS, value.lShaped);
  if (!geometry || !compact || !twoBuilding || !lShaped) {
    return null;
  }
  if (
    value.finalArchitectureId !== null &&
    !isIn(value.finalArchitectureId, requiredArchitectureIds)
  ) {
    return null;
  }
  const storeSelections = parseStoreSelections(value.storeSelections);
  if (!storeSelections) {
    return null;
  }
  const reportAnswers = parseReportAnswers(value.reportAnswers);
  if (!reportAnswers) {
    return null;
  }
  const normalized = normalizeLibraryProgress({
    plotInspected: value.plotInspected,
    geometry,
    compact,
    twoBuilding,
    lShaped,
    finalArchitectureId: value.finalArchitectureId as RequiredArchitectureId | null,
    storeSelections,
    constructionOrderChecked: value.constructionOrderChecked,
    libraryItemsOrderChecked: value.libraryItemsOrderChecked,
    reportAnswers,
    completed: value.completed,
  });
  if (!payloadWithinPortalLimit(normalized)) {
    return null;
  }
  return normalized;
}

/**
 * Canonical fingerprint. Two payloads with the same fingerprint persist
 * identically regardless of object identity; scheduling keys off this value.
 */
export function payloadFingerprint(payload: MyCityLibraryProgressV1): string {
  return JSON.stringify(normalizeLibraryProgress(payload));
}

export function payloadsEquivalent(
  left: MyCityLibraryProgressV1,
  right: MyCityLibraryProgressV1,
): boolean {
  return payloadFingerprint(left) === payloadFingerprint(right);
}

const EMPTY_FINGERPRINT = payloadFingerprint(emptyLibraryProgress());

/** Anything other than the untouched initial mission state is meaningful. */
export function isMeaningfulProgress(payload: MyCityLibraryProgressV1): boolean {
  return payloadFingerprint(payload) !== EMPTY_FINGERPRINT;
}

export function payloadUtf8Bytes(payload: MyCityLibraryProgressV1): number {
  return utf8ByteLength(payloadFingerprint(payload));
}

export function payloadWithinPortalLimit(payload: MyCityLibraryProgressV1): boolean {
  return payloadUtf8Bytes(payload) <= PAYLOAD_MAX_UTF8_BYTES;
}

export function payloadContainsForbiddenFields(payload: unknown): boolean {
  const stack: unknown[] = [payload];
  while (stack.length > 0) {
    const current = stack.pop();
    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }
    if (!isRecord(current)) {
      continue;
    }
    for (const key of Object.keys(current)) {
      if (FORBIDDEN_KEY_SET.has(key)) {
        return true;
      }
      stack.push(current[key]);
    }
  }
  return false;
}
