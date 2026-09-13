import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { payloadFingerprint, type MyCityLibraryProgressV1 } from "./libraryPayload";
import { shouldSkipSaveForMonotonicCompletion } from "./progressOwner";
import { createProgressSaveScheduler } from "./saveScheduler";
import { completedLibraryPayload, midMissionPayload } from "./testing/fixtures";

const DEBOUNCE_MS = 400;
const RENDER_MS = 16;

type FakeTimer = { id: number; at: number; callback: () => void; cleared: boolean; fired: boolean };

function createFakeClock() {
  let now = 0;
  let nextId = 1;
  const timers: FakeTimer[] = [];
  let setCalls = 0;
  let clearCalls = 0;
  return {
    setTimer(callback: () => void, ms: number): unknown {
      setCalls += 1;
      const timer: FakeTimer = { id: nextId++, at: now + ms, callback, cleared: false, fired: false };
      timers.push(timer);
      return timer.id;
    },
    clearTimer(handle: unknown): void {
      clearCalls += 1;
      const timer = timers.find((candidate) => candidate.id === handle);
      if (timer) {
        timer.cleared = true;
      }
    },
    advance(ms: number): void {
      const target = now + ms;
      for (;;) {
        const due = timers
          .filter((timer) => !timer.cleared && !timer.fired && timer.at <= target)
          .sort((a, b) => a.at - b.at)[0];
        if (!due) {
          break;
        }
        now = due.at;
        due.fired = true;
        due.callback();
      }
      now = target;
    },
    get now() {
      return now;
    },
    get setCalls() {
      return setCalls;
    },
    get clearCalls() {
      return clearCalls;
    },
    liveTimers(): number {
      return timers.filter((timer) => !timer.cleared && !timer.fired).length;
    },
  };
}

/** The page re-renders and hands the hook a brand-new object with identical content. */
function rerender(payload: MyCityLibraryProgressV1): MyCityLibraryProgressV1 {
  return JSON.parse(JSON.stringify(payload)) as MyCityLibraryProgressV1;
}

function harness(lastPersisted: MyCityLibraryProgressV1 | null) {
  const clock = createFakeClock();
  const flushed: MyCityLibraryProgressV1[] = [];
  let last = lastPersisted;
  const scheduler = createProgressSaveScheduler({
    debounceMs: DEBOUNCE_MS,
    flush: (payload) => {
      flushed.push(payload);
      last = payload;
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
  });
  const observe = (payload: MyCityLibraryProgressV1) => scheduler.observe(payload, last);
  const renderTick = (payload: MyCityLibraryProgressV1) => {
    clock.advance(RENDER_MS);
    return observe(rerender(payload));
  };
  return { clock, flushed, scheduler, observe, renderTick, lastPersisted: () => last };
}

describe("save scheduler — fingerprint keyed debounce", () => {
  it("unrelated re-renders inside the window never reset, cancel or duplicate the pending save", () => {
    const h = harness(midMissionPayload());
    const next = { ...midMissionPayload(), geometry: { area: "216", perimeter: "61" } };
    assert.equal(h.observe(next), "scheduled");
    assert.equal(h.clock.setCalls, 1);
    for (let i = 0; i < 20; i += 1) {
      assert.equal(h.renderTick(next), "pending");
    }
    assert.equal(h.flushed.length, 0);
    assert.equal(h.clock.setCalls, 1, "renders must not recreate the debounce");
    assert.equal(h.clock.clearCalls, 0, "renders must not cancel the scheduled save");
    for (let i = 0; i < 6; i += 1) {
      h.renderTick(next);
    }
    assert.equal(h.flushed.length, 1);
    assert.equal(h.flushed[0].geometry.perimeter, "61");
    assert.equal(h.clock.liveTimers(), 0);
    assert.equal(h.renderTick(next), "unchanged");
  });

  it("a stream of unrelated renders after a save enqueues nothing", () => {
    const h = harness(completedLibraryPayload());
    for (let i = 0; i < 200; i += 1) {
      assert.equal(h.renderTick(completedLibraryPayload()), "unchanged");
    }
    assert.equal(h.clock.setCalls, 0);
    assert.equal(h.flushed.length, 0);
  });

  it("typing quickly coalesces into one write with the latest content", () => {
    const h = harness(midMissionPayload());
    const typed = ["2", "21", "216"].map((area) => ({
      ...midMissionPayload(),
      geometry: { area, perimeter: "" },
    }));
    assert.equal(h.observe(typed[0]), "scheduled");
    h.clock.advance(100);
    assert.equal(h.observe(typed[1]), "scheduled");
    h.clock.advance(100);
    assert.equal(h.observe(typed[2]), "scheduled");
    h.clock.advance(399);
    assert.equal(h.flushed.length, 0);
    h.clock.advance(1);
    assert.equal(h.flushed.length, 1);
    assert.equal(h.flushed[0].geometry.area, "216");
    assert.equal(h.clock.liveTimers(), 0);
  });

  it("reverting to the persisted state cancels a moot pending write", () => {
    const persisted = midMissionPayload();
    const h = harness(persisted);
    assert.equal(h.observe({ ...persisted, plotInspected: false }), "scheduled");
    assert.equal(h.observe(rerender(persisted)), "unchanged");
    assert.equal(h.scheduler.hasPending(), false);
    h.clock.advance(5_000);
    assert.equal(h.flushed.length, 0);
  });

  it("an owner change cancels pending work so no stale write is flushed", () => {
    const h = harness(null);
    h.observe(midMissionPayload());
    assert.equal(h.scheduler.hasPending(), true);
    h.scheduler.cancel();
    h.clock.advance(5_000);
    assert.equal(h.flushed.length, 0);
  });

  it("every persisted field change schedules; the flushed fingerprint matches", () => {
    const base = completedLibraryPayload();
    const changes: Array<[string, MyCityLibraryProgressV1]> = [
      ["plotInspected", { ...base, plotInspected: false }],
      ["geometry", { ...base, geometry: { ...base.geometry, area: "215" } }],
      ["compact.form", { ...base, compact: { ...base.compact, form: { ...base.compact.form, aPrimeX: "2" } } }],
      ["compact.checked", { ...base, compact: { ...base.compact, checked: false } }],
      ["twoBuilding", { ...base, twoBuilding: { ...base.twoBuilding, form: { ...base.twoBuilding.form, x2: "9" } } }],
      ["lShaped", { ...base, lShaped: { ...base.lShaped, checked: false } }],
      ["finalArchitectureId", { ...base, finalArchitectureId: "l-shaped" }],
      ["storeSelections", { ...base, storeSelections: base.storeSelections.slice(1) }],
      [
        "reportAnswers",
        {
          ...base,
          reportAnswers: {
            ...base.reportAnswers,
            arabic: { ...base.reportAnswers.arabic, readingSupport: "نص عربي مختلف تماماً" },
          },
        },
      ],
      ["completed", { ...base, completed: false }],
    ];
    for (const [label, next] of changes) {
      const h = harness(base);
      assert.equal(h.observe(next), "scheduled", `${label} change must schedule`);
      h.clock.advance(DEBOUNCE_MS);
      assert.equal(h.flushed.length, 1, `${label} change must persist`);
      assert.equal(payloadFingerprint(h.flushed[0]), payloadFingerprint(next));
    }
  });

  it("completed account rows cannot regress: unbuilt edits under the lock never reach the scheduler", () => {
    const completed = completedLibraryPayload();
    const h = harness(completed);
    const unbuilt = { ...completed, completed: false, geometry: { area: "215", perimeter: "60" } };
    for (let i = 0; i < 20; i += 1) {
      if (!shouldSkipSaveForMonotonicCompletion(true, unbuilt)) {
        h.renderTick(unbuilt);
      } else {
        h.clock.advance(RENDER_MS);
      }
    }
    assert.equal(h.scheduler.hasPending(), false);
    assert.equal(h.flushed.length, 0);
    assert.equal(shouldSkipSaveForMonotonicCompletion(true, completed), false);
  });
});
