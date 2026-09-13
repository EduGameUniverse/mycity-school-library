import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shouldAbortInFlightOnIdentityTick,
  shouldSkipSaveForMonotonicCompletion,
} from "./progressOwner";
import { completedLibraryPayload } from "./testing/fixtures";

describe("owner tick vs unrelated re-render", () => {
  it("does not abort in-flight work on an unrelated same-owner tick", () => {
    assert.equal(
      shouldAbortInFlightOnIdentityTick({
        previousUserId: "learner-a",
        nextUserId: "learner-a",
        authenticated: true,
      }),
      false,
    );
    assert.equal(
      shouldAbortInFlightOnIdentityTick({
        previousUserId: "",
        nextUserId: "",
        authenticated: false,
      }),
      false,
    );
  });

  it("aborts and resets on A→B, A→signed-out and the first authenticated settlement", () => {
    assert.equal(
      shouldAbortInFlightOnIdentityTick({
        previousUserId: "learner-a",
        nextUserId: "learner-b",
        authenticated: true,
      }),
      true,
    );
    assert.equal(
      shouldAbortInFlightOnIdentityTick({
        previousUserId: "learner-a",
        nextUserId: "",
        authenticated: false,
      }),
      true,
    );
    assert.equal(
      shouldAbortInFlightOnIdentityTick({
        previousUserId: null,
        nextUserId: "learner-a",
        authenticated: true,
      }),
      true,
    );
  });
});

describe("completion monotonicity (client)", () => {
  it("never sends completed:false once the hydrated record was complete", () => {
    const completed = completedLibraryPayload();
    const unbuilt = { ...completed, completed: false };
    assert.equal(shouldSkipSaveForMonotonicCompletion(true, unbuilt), true);
    assert.equal(shouldSkipSaveForMonotonicCompletion(true, completed), false);
    assert.equal(shouldSkipSaveForMonotonicCompletion(false, unbuilt), false);
  });
});
