import type { GuidedReportAnswers } from "@/features/mycity/mission-library/types/missionTypes";
import {
  canonicalizeStoreSelections,
  emptyLibraryProgress,
  normalizeLibraryProgress,
  type MyCityLibraryProgressV1,
} from "../libraryPayload";
import type { ProgressRecord } from "../progressClient";

/** Test-only fixtures. Values mirror the known-valid inputs in scripts/test-mission-logic.ts. */

export function filledReportAnswers(prefix = "Learner"): GuidedReportAnswers {
  const fill = (language: string) => ({
    architectureChoice: `${prefix} ${language} architecture choice explanation`,
    areaComparison: `${prefix} ${language} area comparison explanation`,
    wallLengthComparison: `${prefix} ${language} wall comparison explanation`,
    constructionCostComparison: `${prefix} ${language} construction cost explanation`,
    libraryItemsBudgetUse: `${prefix} ${language} library budget explanation`,
    readingSupport: `${prefix} ${language} reading support explanation`,
    digitalLearningSupport: `${prefix} ${language} digital support explanation`,
    accessibilitySupport: `${prefix} ${language} accessibility support explanation`,
  });
  return {
    english: fill("English"),
    french: fill("French"),
    arabic: {
      architectureChoice: "اخترت التصميم المستطيل لأنه الأوفر تكلفة",
      areaComparison: "قارنت المساحة الداخلية بين التصاميم الثلاثة",
      wallLengthComparison: "قارنت طول الجدران بين التصاميم الثلاثة",
      constructionCostComparison: "قارنت تكلفة البناء التقديرية للتصاميم",
      libraryItemsBudgetUse: "استخدمت الميزانية لشراء الكتب والحاسوب",
      readingSupport: "حزمة الكتب تدعم القراءة اليومية للتلاميذ",
      digitalLearningSupport: "الحاسوب والموجه يدعمان التعلم الرقمي",
      accessibilitySupport: "المكتب المكيف والمنحدر يدعمان الدمج",
    },
  };
}

export function completedLibraryPayload(): MyCityLibraryProgressV1 {
  return normalizeLibraryProgress({
    plotInspected: true,
    geometry: { area: "216", perimeter: "60" },
    compact: {
      checked: true,
      form: {
        aPrimeX: "1",
        aPrimeY: "1",
        bPrimeX: "17",
        bPrimeY: "1",
        cPrimeX: "17",
        cPrimeY: "11",
        dPrimeX: "1",
        dPrimeY: "11",
        learnerAreaAnswer: "160",
        learnerWallLengthAnswer: "52",
      },
    },
    twoBuilding: {
      checked: true,
      form: {
        x1: "0",
        y1: "0",
        length1: "10",
        width1: "8",
        x2: "10",
        y2: "0",
        length2: "8",
        width2: "8",
        learnerTotalAreaAnswer: "144",
        learnerTotalWallLengthAnswer: "68",
      },
    },
    lShaped: {
      checked: true,
      form: {
        x: "0",
        y: "0",
        outerLength: "18",
        outerWidth: "12",
        cutoutLength: "6",
        cutoutWidth: "6",
        learnerIndoorAreaAnswer: "180",
        learnerWallLengthAnswer: "60",
      },
    },
    finalArchitectureId: "compact-rectangle",
    storeSelections: canonicalizeStoreSelections([
      { itemId: "eco-wall-block", quantity: 52 },
      { itemId: "standard-floor", quantity: 160 },
      { itemId: "standard-door", quantity: 1 },
      { itemId: "window", quantity: 4 },
      { itemId: "led-light", quantity: 6 },
      { itemId: "ventilation-unit", quantity: 1 },
      { itemId: "accessibility-ramp", quantity: 1 },
      { itemId: "basic-electrical-setup", quantity: 1 },
      { itemId: "book-pack", quantity: 1 },
      { itemId: "laptop", quantity: 1 },
      { itemId: "internet-router", quantity: 1 },
      { itemId: "adapted-reading-desk", quantity: 1 },
    ]),
    constructionOrderChecked: true,
    libraryItemsOrderChecked: true,
    reportAnswers: filledReportAnswers(),
    completed: true,
  });
}

/** Plot inspected and geometry answered — meaningful but far from complete. */
export function midMissionPayload(): MyCityLibraryProgressV1 {
  return normalizeLibraryProgress({
    ...emptyLibraryProgress(),
    plotInspected: true,
    geometry: { area: "216", perimeter: "60" },
  });
}

export function recordFor(
  userId: string,
  revision: number,
  payload: MyCityLibraryProgressV1,
): ProgressRecord {
  return {
    userId,
    moduleKey: "mycity",
    activityKey: "bem-mission-01-school-library",
    stateVersion: 1,
    revision,
    payload,
    updatedAt: "2026-09-10T00:00:00.000Z",
  };
}

export function memoryStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  return {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
    dump() {
      return store;
    },
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
