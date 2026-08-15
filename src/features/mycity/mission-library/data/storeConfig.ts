import type { StoreCategory, StoreUnit } from "../types/missionTypes";

export const constructionCategoryDisplay: Array<{
  id: StoreCategory;
  label: string;
}> = [
  { id: "construction", label: "Walls" },
  { id: "floor", label: "Floor" },
  { id: "access", label: "Doors, windows & comfort" },
  { id: "electrical", label: "Electrical" },
];

export const libraryItemsCategoryDisplay: Array<{
  id: StoreCategory;
  label: string;
}> = [
  { id: "reading", label: "Reading resources" },
  { id: "digital", label: "Digital learning" },
  { id: "inclusion", label: "Inclusion & accessibility" },
  { id: "enrichment", label: "Optional enrichment" },
];

export const budgetUiConfig = {
  constructionTitle: "Construction Store",
  constructionDescription:
    "Buy construction materials using the 2500 EduCoin construction budget only.",
  libraryItemsTitle: "Library Items Store",
  libraryItemsDescription:
    "Buy books and learning resources using the 500 EduCoin library-items budget only.",
  constructionSubmitLabel: "Check construction order",
  libraryItemsSubmitLabel: "Check library-items order",
  constructionSuccessMessage:
    "Construction order is valid and within the construction budget.",
  libraryItemsSuccessMessage:
    "Library-items order is valid and within the library-items budget.",
  blockedMessage:
    "Select your final architecture before opening the stores.",
};

export const storeUnitLabels: Record<StoreUnit, string> = {
  m: "m",
  m2: "m²",
  each: "each",
};
