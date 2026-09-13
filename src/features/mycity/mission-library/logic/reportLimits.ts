import type {
  GuidedReportAnswers,
  GuidedReportLanguageAnswers,
} from "../types/missionTypes";

/**
 * Bounds for learner-written trilingual justification answers.
 *
 * Sizes are UTF-8 bytes, never JS string length: Arabic letters are two bytes
 * each, so 400 bytes is roughly 400 Latin or 200 Arabic characters.
 */
export const REPORT_ANSWER_MAX_UTF8_BYTES = 400;
export const REPORT_LANGUAGE_KEYS = ["english", "french", "arabic"] as const;
export const REPORT_FIELD_KEYS = [
  "architectureChoice",
  "areaComparison",
  "wallLengthComparison",
  "constructionCostComparison",
  "libraryItemsBudgetUse",
  "readingSupport",
  "digitalLearningSupport",
  "accessibilitySupport",
] as const satisfies readonly (keyof GuidedReportLanguageAnswers)[];
export const REPORT_ANSWER_FIELD_COUNT = REPORT_LANGUAGE_KEYS.length * REPORT_FIELD_KEYS.length;
export const REPORT_ANSWERS_MAX_UTF8_BYTES =
  REPORT_ANSWER_FIELD_COUNT * REPORT_ANSWER_MAX_UTF8_BYTES;

const encoder = new TextEncoder();

export function utf8ByteLength(value: string): number {
  return encoder.encode(value).length;
}

/** Truncate on code-point boundaries so the result never exceeds `maxBytes`. */
export function clampUtf8Bytes(value: string, maxBytes: number): string {
  if (utf8ByteLength(value) <= maxBytes) {
    return value;
  }
  let bytes = 0;
  let output = "";
  for (const codePoint of value) {
    const size = utf8ByteLength(codePoint);
    if (bytes + size > maxBytes) {
      break;
    }
    bytes += size;
    output += codePoint;
  }
  return output;
}

export function clampReportAnswer(value: string): string {
  return clampUtf8Bytes(value, REPORT_ANSWER_MAX_UTF8_BYTES);
}

export function isReportAnswerAtLimit(value: string): boolean {
  return utf8ByteLength(value) >= REPORT_ANSWER_MAX_UTF8_BYTES;
}

/** Sum of raw UTF-8 bytes across all 24 answers. */
export function guidedReportAnswersUtf8Bytes(answers: GuidedReportAnswers): number {
  let total = 0;
  for (const language of REPORT_LANGUAGE_KEYS) {
    for (const field of REPORT_FIELD_KEYS) {
      total += utf8ByteLength(answers[language][field]);
    }
  }
  return total;
}
