/**
 * Frozen EduGame Account v0 identifiers for the MyCity BEM School Library.
 *
 * `MYCITY_LIBRARY_001` (the mission config id) is a display/config id and is
 * never used as an Account activity identifier.
 */
export const PROGRESS_OWNER_HEADER = "X-EduGame-Progress-Owner";
export const PROGRESS_MODULE_KEY = "mycity" as const;
export const PROGRESS_ACTIVITY_KEY = "bem-mission-01-school-library" as const;
export const PROGRESS_STATE_VERSION = 1;
export const GUEST_PROGRESS_STORAGE_KEY =
  "edugame.progress.v0.guest.mycity.bem-mission-01-school-library";
export const GUEST_PROGRESS_SCHEMA = "edugame.guest-progress.v0" as const;
