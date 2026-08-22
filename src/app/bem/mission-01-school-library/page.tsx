import type { Metadata } from "next";
import { libraryMissionConfig } from "@/features/mycity/mission-library/data/missionConfig";
import { Mission01SchoolLibraryPage } from "@/features/mycity/mission-library/page/Mission01SchoolLibraryPage";

export const metadata: Metadata = {
  title: libraryMissionConfig.title,
  description: libraryMissionConfig.story,
};

export default function Page() {
  return <Mission01SchoolLibraryPage />;
}
