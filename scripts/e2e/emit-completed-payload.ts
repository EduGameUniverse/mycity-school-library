import { completedLibraryPayload } from "@/features/account/progress/testing/fixtures";

/** Prints the known-complete fixture as JSON for the browser e2e seed. */
process.stdout.write(JSON.stringify(completedLibraryPayload()));
