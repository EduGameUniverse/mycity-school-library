/**
 * Owner-tick rules shared by the library progress hook.
 * Unrelated React re-renders must never look like an owner change.
 */
export function shouldAbortInFlightOnIdentityTick(args: {
  previousUserId: string | null;
  nextUserId: string;
  authenticated: boolean;
}): boolean {
  const ownerOrSessionChanged =
    args.previousUserId !== null && args.previousUserId !== args.nextUserId;
  const firstAuthenticatedSettlement = args.previousUserId === null && args.authenticated;
  return ownerOrSessionChanged || firstAuthenticatedSettlement;
}

/**
 * Central completion is monotonic: once the hydrated record says
 * `completed: true`, an incomplete local replay/unbuild payload is never sent.
 */
export function shouldSkipSaveForMonotonicCompletion(
  completionLocked: boolean,
  payload: { completed: boolean },
): boolean {
  return completionLocked && payload.completed !== true;
}
