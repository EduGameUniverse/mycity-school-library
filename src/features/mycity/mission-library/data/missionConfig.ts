import type { MissionConfig } from "../types/missionTypes";

export const libraryMissionConfig: MissionConfig = {
  id: "MYCITY_LIBRARY_001",
  title: "MyCity Mission 1 — Build the El-Bahdja School Library",
  shortTitle: "Build the School Library",
  level: "BEM",
  schoolName: "École El-Bahdja",
  story:
    "El-Bahdja School wants to add a small library so pupils can read, study, use digital resources, and prepare projects. Your job is to inspect the plot, calculate the required area and perimeter, buy construction and interior equipment from the store, and stay within the allowed budget.",
  formulas: {
    area: "area = length × width",
    perimeter: "perimeter = 2 × (length + width)",
    floorQuantity: "floor quantity = area",
    wallQuantity: "wall quantity = perimeter",
  },
  constructionRules: {
    floorQuantityEqualsArea: true,
    wallQuantityEqualsPerimeter: true,
  },
  steps: [
    "intro",
    "inspectPlot",
    "geometry",
    "store",
    "reviewOrder",
    "build",
    "report",
    "summary",
  ],
  labels: {
    inspectPlot: "Inspect the library plot on the campus map.",
    geometry: "Calculate the area and perimeter of the library plot.",
    store: "Buy construction materials, furniture, and digital learning tools.",
    reviewOrder: "Review your purchase order before building.",
    build: "Build the school library.",
    report: "Write a short report in Arabic, French, and English.",
    summary: "See your mission score and feedback.",
    plotDimensions: "Plot dimensions",
    areaUnit: "m²",
    perimeterUnit: "m",
    lengthUnit: "m",
    widthUnit: "m",
  },
};
