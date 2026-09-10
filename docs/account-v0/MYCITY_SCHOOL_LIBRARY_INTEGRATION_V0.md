# MyCity — Account V0-08B School Library identity and progress (client)

Companion to the frozen Portal identity and progress contracts. Client side only:
this document does not change the Portal. BAC Trigonometry is a separate
application and is out of scope.

## Identifiers

| Field | Value |
| --- | --- |
| `moduleKey` | `mycity` |
| `activityKey` | `bem-mission-01-school-library` |
| `stateVersion` | `1` |
| Guest localStorage key | `edugame.progress.v0.guest.mycity.bem-mission-01-school-library` |
| Guest wrapper schema | `edugame.guest-progress.v0` |

`MYCITY_LIBRARY_001` (mission config id) is never an Account identifier.
`stateVersion` travels in the envelope (POST body, server record, guest
wrapper) like every other module; it is not duplicated inside `payload`.

## Identity

Portal owns auth. MyCity reads `GET /api/identity/me` with
`credentials: "include"` through one `IdentityProvider` mounted in the root
layout; `LearnerIdentityBar` (mission header, home page) and the progress hook
observe the same snapshot, so an owner change is visible centrally. Refetch on
window `focus` and `visibilitychange`.

Set `NEXT_PUBLIC_EDUGAME_IDENTITY_ORIGIN` (see `env.identity.example`). Unset →
identity chrome reads "not configured" and progress stays in memory.

Chrome states: loading / signed-out (links to Portal `/login`, `/signup`) /
signed-in (UUID + `/account` + sign out). The UUID is rendered in
`<code dir="ltr" style="unicode-bidi: isolate">` inside a `role="status"`
region that follows the mission locale (`dir="rtl"` for Arabic). No tokens,
cookies or Supabase in the module.

## Persisted payload (`MyCityLibraryProgressV1`)

Source learner inputs only. Exact keys; unknown keys are rejected.

```json
{
  "plotInspected": true,
  "geometry": { "area": "216", "perimeter": "60" },
  "compact": {
    "checked": true,
    "form": {
      "aPrimeX": "1", "aPrimeY": "1", "bPrimeX": "17", "bPrimeY": "1",
      "cPrimeX": "17", "cPrimeY": "11", "dPrimeX": "1", "dPrimeY": "11",
      "learnerAreaAnswer": "160", "learnerWallLengthAnswer": "52"
    }
  },
  "twoBuilding": {
    "checked": true,
    "form": {
      "x1": "0", "y1": "0", "length1": "10", "width1": "8",
      "x2": "10", "y2": "0", "length2": "8", "width2": "8",
      "learnerTotalAreaAnswer": "144", "learnerTotalWallLengthAnswer": "68"
    }
  },
  "lShaped": {
    "checked": true,
    "form": {
      "x": "0", "y": "0", "outerLength": "18", "outerWidth": "12",
      "cutoutLength": "6", "cutoutWidth": "6",
      "learnerIndoorAreaAnswer": "180", "learnerWallLengthAnswer": "60"
    }
  },
  "finalArchitectureId": "compact-rectangle",
  "storeSelections": [
    { "itemId": "eco-wall-block", "quantity": 52 },
    { "itemId": "standard-floor", "quantity": 160 }
  ],
  "reportAnswers": {
    "english": { "architectureChoice": "…", "areaComparison": "…", "wallLengthComparison": "…", "constructionCostComparison": "…", "libraryItemsBudgetUse": "…", "readingSupport": "…", "digitalLearningSupport": "…", "accessibilitySupport": "…" },
    "french": { "…8 fields…": "" },
    "arabic": { "…8 fields…": "" }
  },
  "completed": true
}
```

| Field | Type / range | Why source |
| --- | --- | --- |
| `plotInspected` | boolean | gate that reveals the mission panels |
| `geometry.area`, `geometry.perimeter` | numeric source string: `^[0-9eE.+-]*$`, ≤ 32 chars (exact `<input type="number">` value, `""` allowed) | learner answers; validated only through `validateGeometryAnswer(Number(value))` |
| `compact.form.*` (10), `twoBuilding.form.*` (10), `lShaped.form.*` (8) | numeric source strings as above | learner coordinates and answers exactly as typed; defaults are `""` except `x1`,`y1`,`x`,`y` = `"0"` |
| `compact.checked`, `twoBuilding.checked`, `lShaped.checked` | boolean | whether the learner pressed "Check this design" |
| `finalArchitectureId` | `"compact-rectangle" \| "two-building" \| "l-shaped" \| null` | the learner's final choice |
| `storeSelections[]` | `{ itemId: catalog id, quantity: finite number > 0 and ≤ 1 000 000 }`, catalog order, no duplicates, max 23 entries | store quantities are the source of both budgets |
| `reportAnswers` | 3 languages × 8 prompts, each string ≤ **400 UTF-8 bytes**; total ≤ **9 600 UTF-8 bytes** | 24 learner-written pedagogical answers needed for faithful restore and report regeneration |
| `completed` | boolean, monotonic | learner activated Build Library with `getMissionReadiness().ready` |

Not persisted (derived again on restore): geometry/design/purchase validation
objects, error/warning strings, indoor area / wall length / floor quantity,
estimated and actual costs, remaining budgets, readiness, score, badges,
feedback, generated trilingual report, footprint preview polygons, map asset,
active preview, courtyard bonus form/result (v1 exclusion), locale/theme/a11y,
UUID/body `userId`, cookies/tokens, timestamps, wallet/EduCoin balance.
EduCoins in this mission are budgets (2500 + 500), not a wallet.

### Size bounds (proposal for V0-08C)

Measured with `payloadUtf8Bytes` (UTF-8 bytes of the canonical JSON):

- complete reference mission: **3 171 bytes**
- worst case (all 24 answers at 400 bytes of Arabic, all 23 catalog items with
  long quantities, every numeric field 32 chars): **13 145 bytes** — under the
  Portal generic cap of 16 384 bytes with ~3 KiB headroom for JSON escaping.

Per-answer clamp: 400 UTF-8 bytes ≈ 400 Latin or 200 Arabic characters
(`clampReportAnswer` truncates on code-point boundaries; the textarea shows
"Maximum answer length reached." in EN/FR/AR). Sizes are never measured with
JS `.length`.

## Restore

`deriveMissionState(payload)` rebuilds everything from source through the
existing validators:

- geometry re-checked only when both answers are non-empty
- each architecture re-validated only if `checked`
- `finalArchitectureId` kept only if its re-validated design is valid; else
  cleared with its result (matches the live UX, which never shows an invalid
  final)
- store quantities rebuilt from `storeSelections`; purchase validations derived
  when that budget scope has selections and a valid final architecture exists
- `isBuilt = completed && readiness.ready`; score and trilingual summary
  recomputed with `buildCompletionArtifacts` (the same code the Build button
  uses)

Intentionally reset: transient errors, hover/focus, active map preview,
courtyard bonus, footprint overlay.

## Completion

`completed` is sent only when the learner pressed Build Library and
`getMissionReadiness()` is ready (geometry valid, three architectures checked
and valid, valid final, valid construction and library-items orders, all 24
answers ≥ 10 characters). Once the hydrated record (guest or account) is
complete, an incomplete local payload (unbuild/replay) is never persisted;
edits that keep the mission built persist with `completed: true`.

## Guest persistence and migration

Signed-out: meaningful progress (anything other than the untouched initial
state) is written to the guest key only; no Portal progress calls. Malformed,
foreign or oversized guest records are ignored, never hydrated.

Authenticated: GET first; existing server row wins. Eligible unmigrated guest +
no row → one insert-only `POST /api/progress/migrate` with
`X-EduGame-Progress-Owner`. Equivalent payloads → marked migrated without a
call; different payloads → `conflictKeptLocal`, server restored. A guest already
migrated to learner A is never attached to learner B.

## Save scheduling and owner binding

Authenticated saves coalesce for 400 ms keyed on the canonical payload
fingerprint (`payloadFingerprint`), never on React render identity: typing in
an unrelated field, hovering, or switching language re-renders the page but
must not re-arm, cancel or duplicate a pending save. Writes are serialized;
`baseRevision` is the last seen `revision`; `409 revision_conflict` hydrates
the server record; `409 owner_changed` discards queued work. On A→B (or
A→signed-out) the queue generation is bumped, in-flight GET/migrate is aborted,
the page state is reset (`resetHost`) and then B is hydrated.

## Tests

- `npm run test:account` — 79 node tests: payload normalization/validation,
  guest persistence/refresh/malformed rejection, fingerprint equality, no
  duplicate saves from unrelated renders, client-level guest→account migration
  (owner header, no body `userId`, existing row wins, duplicate migrate,
  A→B isolation), CAS/revision, `owner_changed`, completion monotonicity,
  derived-state exclusion, report bounds including Arabic UTF-8, identity chrome
  EN/FR/AR with UUID LTR isolation.
- `npm run test:account:e2e` — Playwright Chromium against
  `scripts/e2e/mock-portal.mjs`: guest refresh, migration, CAS save without
  write storm, A→B same tab, RTL chrome, completed-row monotonicity.
- `npm run test:mission-logic`, `npm run typecheck`, `npm run lint`,
  `npm run build`.

## Required for V0-08C (Portal, not done here)

1. Allowlist `mycity` / `bem-mission-01-school-library`, `stateVersion` 1.
2. Structural validator: exact keys above, numeric-source regex and 32-char
   limit, catalog `itemId` set, quantity range, report answers ≤ 400 bytes each
   and ≤ 9 600 total, forbidden keys, generic 16 384-byte cap.
3. Monotonic `completed` through the existing `progress_regression` rule.
   Do **not** re-derive mission readiness from source inputs on the Portal:
   after completion the learner may edit inputs while the row stays
   `completed: true`, and the geometry/budget validators live in this module.
4. Allow the MyCity origin for identity and progress CORS.
