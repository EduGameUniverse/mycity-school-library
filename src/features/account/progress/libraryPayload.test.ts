import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REPORT_ANSWER_MAX_UTF8_BYTES,
  REPORT_ANSWERS_MAX_UTF8_BYTES,
  clampReportAnswer,
  utf8ByteLength,
} from "@/features/mycity/mission-library/logic/reportLimits";
import { emptyTwoBuildingForm } from "@/features/mycity/mission-library/state/architectureForms";
import {
  GUEST_PROGRESS_SCHEMA,
  GUEST_PROGRESS_STORAGE_KEY,
  PROGRESS_ACTIVITY_KEY,
  PROGRESS_MODULE_KEY,
  PROGRESS_STATE_VERSION,
} from "./ids";
import {
  PAYLOAD_KEYS,
  PAYLOAD_MAX_UTF8_BYTES,
  buildLibraryProgressPayload,
  emptyLibraryProgress,
  isMeaningfulProgress,
  normalizeLibraryProgress,
  parseLibraryProgressV1,
  payloadContainsForbiddenFields,
  payloadFingerprint,
  payloadUtf8Bytes,
  payloadWithinPortalLimit,
  payloadsEquivalent,
} from "./libraryPayload";
import { completedLibraryPayload, filledReportAnswers, midMissionPayload } from "./testing/fixtures";

const ARABIC_LETTER = "م"; // two UTF-8 bytes

describe("frozen identifiers", () => {
  it("uses the frozen module/activity/version and guest key", () => {
    assert.equal(PROGRESS_MODULE_KEY, "mycity");
    assert.equal(PROGRESS_ACTIVITY_KEY, "bem-mission-01-school-library");
    assert.equal(PROGRESS_STATE_VERSION, 1);
    assert.equal(
      GUEST_PROGRESS_STORAGE_KEY,
      "edugame.progress.v0.guest.mycity.bem-mission-01-school-library",
    );
    assert.equal(GUEST_PROGRESS_SCHEMA, "edugame.guest-progress.v0");
  });
});

describe("payload normalization and validation", () => {
  it("round-trips a complete mission payload through the strict parser", () => {
    const payload = completedLibraryPayload();
    const parsed = parseLibraryProgressV1(JSON.parse(JSON.stringify(payload)));
    assert.ok(parsed);
    assert.equal(payloadFingerprint(parsed), payloadFingerprint(payload));
    assert.deepEqual(Object.keys(parsed).sort(), [...PAYLOAD_KEYS].sort());
  });

  it("keeps numeric sources as the learner typed them (strings), never numbers", () => {
    const payload = buildLibraryProgressPayload({
      plotInspected: true,
      areaInput: "216.0",
      perimeterInput: "60",
      compactForm: {
        aPrimeX: "1.5",
        aPrimeY: "",
        bPrimeX: "17",
        bPrimeY: "",
        cPrimeX: "",
        cPrimeY: "",
        dPrimeX: "",
        dPrimeY: "",
        learnerAreaAnswer: "",
        learnerWallLengthAnswer: "",
      },
      compactChecked: false,
      twoBuildingForm: emptyTwoBuildingForm(),
      twoBuildingChecked: false,
      lShapedForm: {
        x: "0",
        y: "0",
        outerLength: "1e1",
        outerWidth: "",
        cutoutLength: "",
        cutoutWidth: "",
        learnerIndoorAreaAnswer: "",
        learnerWallLengthAnswer: "",
      },
      lShapedChecked: false,
      finalArchitectureId: null,
      quantities: {},
      constructionOrderChecked: false,
      libraryItemsOrderChecked: false,
      reportAnswers: emptyLibraryProgress().reportAnswers,
      completed: false,
    });
    assert.equal(payload.geometry.area, "216.0");
    assert.equal(payload.compact.form.aPrimeX, "1.5");
    assert.equal(payload.lShaped.form.outerLength, "1e1");
    assert.equal(payload.twoBuilding.form.x1, "0");
  });

  it("rejects unknown keys, wrong types and non-numeric source strings", () => {
    const base = JSON.parse(JSON.stringify(midMissionPayload())) as Record<string, unknown>;
    assert.equal(parseLibraryProgressV1(null), null);
    assert.equal(parseLibraryProgressV1([]), null);
    assert.equal(parseLibraryProgressV1({ ...base, extra: 1 }), null);
    assert.equal(parseLibraryProgressV1({ ...base, plotInspected: "yes" }), null);
    assert.equal(parseLibraryProgressV1({ ...base, geometry: { area: 216, perimeter: "60" } }), null);
    assert.equal(
      parseLibraryProgressV1({ ...base, geometry: { area: "216 m²", perimeter: "60" } }),
      null,
    );
    assert.equal(
      parseLibraryProgressV1({ ...base, geometry: { area: "1".repeat(33), perimeter: "60" } }),
      null,
    );
    assert.equal(parseLibraryProgressV1({ ...base, finalArchitectureId: "courtyard" }), null);
    assert.equal(parseLibraryProgressV1({ ...base, completed: 1 }), null);
    const { completed: _completed, ...missingCompleted } = base;
    void _completed;
    assert.equal(parseLibraryProgressV1(missingCompleted), null);
  });

  it("requires both Store validation-intent flags as booleans (pre-B2 shapes are rejected)", () => {
    const base = JSON.parse(JSON.stringify(midMissionPayload())) as Record<string, unknown>;
    assert.equal(base.constructionOrderChecked, false);
    assert.equal(base.libraryItemsOrderChecked, false);
    assert.ok(parseLibraryProgressV1(base));
    assert.equal(parseLibraryProgressV1({ ...base, constructionOrderChecked: "true" }), null);
    assert.equal(parseLibraryProgressV1({ ...base, libraryItemsOrderChecked: 1 }), null);
    assert.equal(parseLibraryProgressV1({ ...base, constructionOrderChecked: null }), null);
    const { constructionOrderChecked: _c, ...missingConstruction } = base;
    void _c;
    assert.equal(parseLibraryProgressV1(missingConstruction), null);
    const { libraryItemsOrderChecked: _l, ...missingLibrary } = base;
    void _l;
    assert.equal(parseLibraryProgressV1(missingLibrary), null);
    // Flags are not derived from selections: valid quantities with checked:false stay unchecked.
    const parsed = parseLibraryProgressV1({
      ...JSON.parse(JSON.stringify(completedLibraryPayload())),
      constructionOrderChecked: false,
      libraryItemsOrderChecked: false,
      completed: false,
    });
    assert.ok(parsed);
    assert.equal(parsed.storeSelections.length, 12);
    assert.equal(parsed.constructionOrderChecked, false);
    assert.equal(parsed.libraryItemsOrderChecked, false);
  });

  it("rejects malformed architecture progress and store selections", () => {
    const base = JSON.parse(JSON.stringify(completedLibraryPayload())) as Record<string, unknown>;
    const compact = base.compact as { checked: boolean; form: Record<string, string> };
    assert.equal(
      parseLibraryProgressV1({ ...base, compact: { checked: "true", form: compact.form } }),
      null,
    );
    assert.equal(
      parseLibraryProgressV1({
        ...base,
        compact: { checked: true, form: { ...compact.form, extra: "1" } },
      }),
      null,
    );
    assert.equal(
      parseLibraryProgressV1({ ...base, storeSelections: [{ itemId: "gold-bar", quantity: 1 }] }),
      null,
    );
    assert.equal(
      parseLibraryProgressV1({ ...base, storeSelections: [{ itemId: "laptop", quantity: 0 }] }),
      null,
    );
    assert.equal(
      parseLibraryProgressV1({ ...base, storeSelections: [{ itemId: "laptop", quantity: -1 }] }),
      null,
    );
    assert.equal(
      parseLibraryProgressV1({
        ...base,
        storeSelections: [
          { itemId: "laptop", quantity: 1 },
          { itemId: "laptop", quantity: 2 },
        ],
      }),
      null,
    );
    assert.equal(
      parseLibraryProgressV1({
        ...base,
        storeSelections: [{ itemId: "laptop", quantity: 1, price: 150 }],
      }),
      null,
    );
  });

  it("normalizes store selections into catalog order without duplicates", () => {
    const normalized = normalizeLibraryProgress({
      ...emptyLibraryProgress(),
      storeSelections: [
        { itemId: "laptop", quantity: 1 },
        { itemId: "eco-wall-block", quantity: 52 },
        { itemId: "laptop", quantity: 9 },
        { itemId: "unknown-item", quantity: 3 },
        { itemId: "window", quantity: 0 },
      ],
    });
    assert.deepEqual(normalized.storeSelections, [
      { itemId: "eco-wall-block", quantity: 52 },
      { itemId: "laptop", quantity: 1 },
    ]);
  });

  it("canonical fingerprint ignores object identity and key order but not content", () => {
    const left = completedLibraryPayload();
    const rightJson = JSON.parse(JSON.stringify(left)) as typeof left;
    const reordered = {
      completed: rightJson.completed,
      reportAnswers: rightJson.reportAnswers,
      libraryItemsOrderChecked: rightJson.libraryItemsOrderChecked,
      constructionOrderChecked: rightJson.constructionOrderChecked,
      storeSelections: [...rightJson.storeSelections].reverse(),
      finalArchitectureId: rightJson.finalArchitectureId,
      lShaped: rightJson.lShaped,
      twoBuilding: rightJson.twoBuilding,
      compact: rightJson.compact,
      geometry: rightJson.geometry,
      plotInspected: rightJson.plotInspected,
    };
    assert.equal(payloadsEquivalent(left, reordered), true);
    assert.equal(
      payloadsEquivalent(left, { ...left, geometry: { area: "215", perimeter: "60" } }),
      false,
    );
    assert.equal(payloadsEquivalent(left, { ...left, completed: false }), false);
    assert.equal(payloadsEquivalent(left, { ...left, constructionOrderChecked: false }), false);
    assert.equal(payloadsEquivalent(left, { ...left, libraryItemsOrderChecked: false }), false);
  });

  it("treats only the untouched initial state as not meaningful", () => {
    assert.equal(isMeaningfulProgress(emptyLibraryProgress()), false);
    assert.equal(
      isMeaningfulProgress({ ...emptyLibraryProgress(), plotInspected: true }),
      true,
    );
    assert.equal(
      isMeaningfulProgress({
        ...emptyLibraryProgress(),
        geometry: { area: "2", perimeter: "" },
      }),
      true,
    );
    assert.equal(
      isMeaningfulProgress({
        ...emptyLibraryProgress(),
        reportAnswers: {
          ...emptyLibraryProgress().reportAnswers,
          arabic: { ...emptyLibraryProgress().reportAnswers.arabic, readingSupport: "ك" },
        },
      }),
      true,
    );
    assert.equal(isMeaningfulProgress(completedLibraryPayload()), true);
  });
});

describe("derived state is excluded from the payload", () => {
  it("contains only source keys and no forbidden identity/derived/wallet fields", () => {
    const payload = completedLibraryPayload();
    assert.deepEqual(Object.keys(payload), [...PAYLOAD_KEYS]);
    assert.equal(payloadContainsForbiddenFields(payload), false);
    const serialized = JSON.stringify(payload);
    for (const banned of [
      "userId",
      "email",
      "locale",
      "score",
      "badges",
      "totalCost",
      "remainingBudget",
      "estimatedConstructionCost",
      "indoorArea",
      "wallLength",
      "errors",
      "warnings",
      "footprintPreview",
      "mapImageSrc",
      "reportSummary",
      "wallet",
      "eduCoins",
      "courtyard",
      "updatedAt",
      "token",
      "cookie",
    ]) {
      assert.equal(serialized.includes(`"${banned}"`), false, `${banned} must not be persisted`);
    }
  });

  it("rejects payloads that smuggle derived or identity fields anywhere", () => {
    const payload = JSON.parse(JSON.stringify(completedLibraryPayload())) as Record<string, unknown>;
    assert.equal(payloadContainsForbiddenFields({ ...payload, userId: "abc" }), true);
    assert.equal(payloadContainsForbiddenFields({ ...payload, score: 100 }), true);
    assert.equal(
      payloadContainsForbiddenFields({
        ...payload,
        compact: { checked: true, form: {}, errors: [] },
      }),
      true,
    );
    assert.equal(parseLibraryProgressV1({ ...payload, wallet: 3000 }), null);
  });
});

describe("report answer bounds (UTF-8 bytes)", () => {
  it("accepts exactly 400 bytes of Arabic (200 letters) and rejects 402", () => {
    const arabic200 = ARABIC_LETTER.repeat(200);
    assert.equal(utf8ByteLength(arabic200), REPORT_ANSWER_MAX_UTF8_BYTES);
    assert.equal(arabic200.length, 200, "JS length is not the byte size");
    const ok = JSON.parse(JSON.stringify(completedLibraryPayload())) as ReturnType<
      typeof completedLibraryPayload
    >;
    ok.reportAnswers.arabic.readingSupport = arabic200;
    assert.ok(parseLibraryProgressV1(ok));

    const tooLong = JSON.parse(JSON.stringify(completedLibraryPayload())) as ReturnType<
      typeof completedLibraryPayload
    >;
    tooLong.reportAnswers.arabic.readingSupport = ARABIC_LETTER.repeat(201);
    assert.equal(utf8ByteLength(tooLong.reportAnswers.arabic.readingSupport), 402);
    assert.equal(parseLibraryProgressV1(tooLong), null);
  });

  it("clamps on code-point boundaries so Arabic and emoji never split", () => {
    const arabic = ARABIC_LETTER.repeat(250);
    const clamped = clampReportAnswer(arabic);
    assert.equal(utf8ByteLength(clamped), 400);
    assert.equal(clamped.length, 200);

    const emoji = "😀".repeat(101); // 4 bytes each
    const clampedEmoji = clampReportAnswer(emoji);
    assert.equal(utf8ByteLength(clampedEmoji), 400);
    assert.equal([...clampedEmoji].length, 100);
    assert.equal(clampedEmoji.includes("\uFFFD"), false);

    const latin = "a".repeat(400);
    assert.equal(clampReportAnswer(latin), latin);
    assert.equal(clampReportAnswer(`${latin}b`), latin);
  });

  it("normalization clamps oversized answers so the page never emits an invalid payload", () => {
    const answers = filledReportAnswers();
    answers.french.readingSupport = "é".repeat(500); // 1000 bytes
    const normalized = normalizeLibraryProgress({
      ...completedLibraryPayload(),
      reportAnswers: answers,
    });
    assert.equal(utf8ByteLength(normalized.reportAnswers.french.readingSupport), 400);
    assert.ok(parseLibraryProgressV1(JSON.parse(JSON.stringify(normalized))));
  });

  it("bounds the whole payload safely under the Portal 16 KiB cap even at maximum size", () => {
    assert.equal(REPORT_ANSWERS_MAX_UTF8_BYTES, 24 * 400);
    const maximal = completedLibraryPayload();
    const arabic200 = ARABIC_LETTER.repeat(200);
    for (const language of ["english", "french", "arabic"] as const) {
      for (const field of Object.keys(maximal.reportAnswers[language]) as Array<
        keyof typeof maximal.reportAnswers.english
      >) {
        maximal.reportAnswers[language][field] = arabic200;
      }
    }
    maximal.storeSelections = [
      "eco-wall-block",
      "reinforced-wall-block",
      "standard-floor",
      "anti-slip-floor",
      "standard-door",
      "wide-accessible-door",
      "window",
      "led-light",
      "ventilation-unit",
      "accessibility-ramp",
      "basic-electrical-setup",
      "book-pack",
      "science-book-pack",
      "language-book-pack",
      "magazines",
      "laptop",
      "tablet-station",
      "internet-router",
      "projector",
      "reading-corner",
      "educational-posters",
      "audio-reading-tool",
      "adapted-reading-desk",
    ].map((itemId) => ({ itemId, quantity: 999999.123456 }));
    const digits = "1234567890.1234567890e+000000001";
    assert.equal(digits.length, 32);
    maximal.geometry = { area: digits, perimeter: digits };
    for (const key of Object.keys(maximal.compact.form) as Array<
      keyof typeof maximal.compact.form
    >) {
      maximal.compact.form[key] = digits;
    }
    for (const key of Object.keys(maximal.twoBuilding.form) as Array<
      keyof typeof maximal.twoBuilding.form
    >) {
      maximal.twoBuilding.form[key] = digits;
    }
    for (const key of Object.keys(maximal.lShaped.form) as Array<
      keyof typeof maximal.lShaped.form
    >) {
      maximal.lShaped.form[key] = digits;
    }
    const bytes = payloadUtf8Bytes(maximal);
    assert.ok(bytes <= PAYLOAD_MAX_UTF8_BYTES, `maximal payload is ${bytes} bytes`);
    assert.ok(bytes <= 13_500, `worst case must stay near the documented 13.2 KB (${bytes})`);
    assert.ok(bytes > 9600, "maximal payload includes the full report budget");
    assert.equal(payloadWithinPortalLimit(maximal), true);
    assert.ok(parseLibraryProgressV1(JSON.parse(JSON.stringify(maximal))));
  });
});
