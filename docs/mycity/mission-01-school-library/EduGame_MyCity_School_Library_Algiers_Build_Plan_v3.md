# EduGame Prototype — MyCity Mission 1: Build the El-Bahdja School Library

**Prepared for:** EduGame Universe / Younes Fellah  
**Repository:** `C:\Users\Idir Mellal\Documents\EduGame\edugame-platform`  
**Game:** MyCity  
**Mission:** MyCity Mission 1 — Build the El-Bahdja School Library  
**Previous concept replaced:** Build a Classroom  
**Main map asset:** `public/assets/maps/el-bahdja-campus/main-map.png`  
**Recommended build mode:** Cursor Pro monthly subscription for implementation + ChatGPT Pro yearly subscription for planning, architecture review, prompt preparation, and token saving  
**Version:** 3.0 — Repo-ready plan with main Algiers map integration  
**Date:** 2026-07-12

---

## 0. Executive decision

Mission 1 should be implemented as:

```text
MyCity Mission 1 — Build the El-Bahdja School Library
```

The classroom mission is replaced by a school library mission because the library gives the learner a richer STEM challenge: geometry, budgeting, store decisions, interior planning, digital learning resources, accessibility, comfort, and trilingual communication.

The attached Algiers-inspired campus image should become the **canonical base map** for Mission 1. The empty rectangular plot on the right side of the image becomes the interactive construction zone for the library.

The first playable version must stay simple:

```text
single map screen → clickable plot → geometry task → store → budget validation → build result → trilingual report
```

Do not start with backend, authentication, multiplayer, database, complex animation, or external AI API calls.

---

## 1. Confirmed repository state

The local repository has already been initialized successfully:

```powershell
C:\Users\Idir Mellal\Documents\EduGame\edugame-platform
```

The current project is a clean Next.js project with Git tracking.

The following checks were completed:

```powershell
git status --short
```

Result: no output, meaning the working tree is clean.

The ignore rules were also checked:

```powershell
git check-ignore -v node_modules
git check-ignore -v .next
```

Confirmed:

```text
node_modules is ignored by .gitignore
.next is ignored by .gitignore
```

This means the repository is ready for the MyCity mission structure.

---

## 2. Project alignment

This mission is aligned with EduGame Universe because it combines:

- game-based learning;
- school-oriented learning experiences;
- digital creativity;
- inclusive design;
- accessibility features;
- culturally adapted local context;
- measurable learner progress;
- STEM reasoning through a concrete mission.

The library is stronger than a classroom because it represents a symbolic knowledge hub inside the school. It allows the mission to include bookshelves, reading tables, chairs, digital learning tools, lighting, ventilation, wide access, and a ramp.

---

## 3. Confirmed mission concept

### 3.1 Mission title

```text
MyCity Mission 1 — Build the El-Bahdja School Library
```

### 3.2 Short UI title

```text
Build the School Library
```

### 3.3 Mission story

```text
El-Bahdja School wants to add a small library so pupils can read, study, use digital resources, and prepare projects. Your job is to inspect the plot, calculate the required area and perimeter, buy construction and interior equipment from the store, and stay within the allowed budget.
```

### 3.4 Mission loop

```text
inspect plot
→ compute dimensions
→ open store
→ buy materials and furniture
→ submit purchase order
→ build library
→ write trilingual reports
→ receive score and feedback
```

---

## 4. Main map integration

### 4.1 Main map decision

Use the attached Algiers-inspired school image as the official map for Mission 1.

Save it in the repository as:

```text
public/assets/maps/el-bahdja-campus/main-map.png
```

Use it as a static background image in the first playable build.

### 4.2 What the map already provides

The map already contains:

- existing school building;
- visible construction plot;
- road and school access;
- pupils and campus life;
- trees and urban environment;
- sea/coastal background;
- Jamaa El-Djazair-inspired skyline.

This is enough for the first MVP scene.

### 4.3 Important rule about dimensions

Do **not** derive the mathematical dimensions from the image pixels.

The image is a visual map. The game dimensions must be defined in code.

Use a config file for the official mission values:

```ts
lengthM: 18,
widthM: 12,
areaM2: 216,
perimeterM: 60
```

These are prototype values and can be changed later.

### 4.4 Initial clickable plot polygon

The construction plot is perspective-shaped, so use a polygon hit area rather than a simple rectangle.

Initial rough polygon for the uploaded image size `1448 × 1086`:

```ts
const libraryPlotPolygon = [
  { x: 790, y: 455 },
  { x: 1285, y: 510 },
  { x: 1250, y: 850 },
  { x: 590, y: 780 },
];
```

These coordinates are only an initial calibration. Cursor must implement the overlay so that the coordinates can be adjusted easily in `mapConfig.ts`.

### 4.5 Responsive rule

Store polygon points as normalized values between `0` and `1`, not only as pixels.

For example:

```ts
plotPolygon: [
  { x: 0.546, y: 0.419 },
  { x: 0.887, y: 0.470 },
  { x: 0.863, y: 0.783 },
  { x: 0.407, y: 0.718 },
]
```

This keeps the clickable zone responsive when the image scales.

---

## 5. Repository structure to create

Create this structure before asking Cursor to code the mission:

```text
edugame-platform/
├── docs/
│   └── mycity/
│       └── mission-01-school-library/
│           ├── build-plan.md
│           ├── cursor-prompts.md
│           └── mission-rules.md
│
├── public/
│   └── assets/
│       └── maps/
│           └── el-bahdja-campus/
│               ├── main-map.png
│               ├── main-map-plot-highlight.png
│               ├── main-map-library-built.png
│               └── plot-mask.json
│
└── src/
    ├── app/
    │   └── mycity/
    │       └── library/
    │           └── page.tsx
    │
    └── features/
        └── mycity/
            └── mission-library/
                ├── components/
                │   ├── CampusMap.tsx
                │   ├── PlotOverlay.tsx
                │   ├── MissionPanel.tsx
                │   ├── GeometryForm.tsx
                │   ├── StorePanel.tsx
                │   ├── BudgetPanel.tsx
                │   ├── ReportPanel.tsx
                │   └── BuildSummary.tsx
                │
                ├── data/
                │   ├── mapConfig.ts
                │   ├── missionConfig.ts
                │   ├── storeCatalog.ts
                │   ├── budgetConfig.ts
                │   └── scoringConfig.ts
                │
                ├── logic/
                │   ├── geometry.ts
                │   ├── budget.ts
                │   ├── scoring.ts
                │   └── validation.ts
                │
                ├── types/
                │   └── missionTypes.ts
                │
                └── page/
                    └── LibraryMissionPage.tsx
```

### 5.1 PowerShell commands

Run from the repository root:

```powershell
New-Item -ItemType Directory -Force docs\mycity\mission-01-school-library

New-Item -ItemType Directory -Force public\assets\maps\el-bahdja-campus

New-Item -ItemType Directory -Force src\app\mycity\library

New-Item -ItemType Directory -Force src\features\mycity\mission-library\components
New-Item -ItemType Directory -Force src\features\mycity\mission-library\data
New-Item -ItemType Directory -Force src\features\mycity\mission-library\logic
New-Item -ItemType Directory -Force src\features\mycity\mission-library\types
New-Item -ItemType Directory -Force src\features\mycity\mission-library\page

New-Item -ItemType File -Force docs\mycity\mission-01-school-library\build-plan.md
New-Item -ItemType File -Force docs\mycity\mission-01-school-library\cursor-prompts.md
New-Item -ItemType File -Force docs\mycity\mission-01-school-library\mission-rules.md
```

---

## 6. MVP technical decisions

### 6.1 Framework

Use the current Next.js project.

Assumed stack:

```text
Next.js
TypeScript
App Router
Tailwind CSS
npm
GitHub
Cursor Pro
```

### 6.2 State management

For MVP, use React local state only.

Do not add Redux, Zustand, database, authentication, or backend API routes yet.

### 6.3 Data model strategy

All mission numbers must be stored in config files:

```text
mapConfig.ts
missionConfig.ts
storeCatalog.ts
budgetConfig.ts
scoringConfig.ts
```

Do not hardcode mission rules inside React components.

### 6.4 First route

The mission should be playable at:

```text
/mycity/library
```

The file should be:

```text
src/app/mycity/library/page.tsx
```

This route imports:

```ts
import { LibraryMissionPage } from "@/features/mycity/mission-library/page/LibraryMissionPage";
```

---

## 7. Game rules

### 7.1 Plot dimensions

Use these prototype values:

```text
length = 18 m
width = 12 m
area = 216 m²
perimeter = 60 m
```

Formulas:

```text
area = length × width
perimeter = 2 × (length + width)
```

### 7.2 Construction quantities

Use:

```text
floor quantity = area
wall quantity = perimeter
```

### 7.3 Library requirements

The learner must buy enough items for a functional library.

Minimum requirements:

```text
floor covering: 216 m²
wall blocks: 60 m
wide accessible door: 1
windows: 4
bookshelves: 4
reading tables: 3
chairs: 12
LED lights: 6
ventilation unit: 1
accessibility ramp: 1
computer corner: 1
internet router: 1
```

Optional enrichment items:

```text
tablet station
quiet reading corner
extra shelves
extra chairs
plant corner
solar panel information display
```

### 7.4 Budget

Use prototype currency:

```text
Currency: EduCoins
Budget: 2150 EduCoins
```

These are gameplay values, not real construction prices.

### 7.5 Store catalog draft

```text
Construction
- Eco wall block: 8 EduCoins per meter
- Reinforced wall block: 11 EduCoins per meter

Floor
- Standard floor: 2 EduCoins per m²
- Anti-slip floor: 3 EduCoins per m²

Access and comfort
- Wide accessible door: 90 EduCoins each
- Window: 40 EduCoins each
- LED light: 15 EduCoins each
- Ventilation unit: 60 EduCoins each

Library furniture
- Bookshelf: 55 EduCoins each
- Reading table: 45 EduCoins each
- Chair: 8 EduCoins each

Digital learning
- Computer corner: 120 EduCoins each
- Tablet station: 100 EduCoins each
- Internet router: 40 EduCoins each

Inclusion
- Accessibility ramp: 85 EduCoins each
- Quiet reading corner: 80 EduCoins each
```

### 7.6 Validation rules

A purchase order is valid if:

```text
area answer is correct
perimeter answer is correct
floor quantity covers the area
wall quantity covers the perimeter
minimum furniture requirements are satisfied
minimum digital learning requirements are satisfied
minimum accessibility requirements are satisfied
total cost is less than or equal to budget
```

---

## 8. Scoring model

Total score: 100 points.

```text
Geometry accuracy: 35 points
- correct area: 15
- correct perimeter: 15
- correct construction quantities: 5

Budget and purchase order: 25 points
- required items selected: 10
- quantity logic: 5
- stays within budget: 5
- avoids useless overspending: 5

Library quality: 15 points
- enough shelves/tables/chairs: 5
- comfort features: 5
- digital learning features: 5

Inclusion: 10 points
- accessibility ramp: 4
- wide door: 3
- quiet reading corner or equivalent: 3

Trilingual report: 15 points
- Arabic sentence: 5
- French sentence: 5
- English sentence: 5
```

Optional bonus:

```text
+5 bonus points for a good learner explanation of why the library helps pupils.
```

Maximum display score should be capped at 100 unless the UI explicitly shows bonus separately.

---

## 9. UI flow

### 9.1 Screen layout

Use one main screen:

```text
left / center: main map image
right side: mission panel
bottom or modal: store panel
```

### 9.2 Step states

Use these step states:

```ts
type MissionStep =
  | "intro"
  | "inspectPlot"
  | "geometry"
  | "store"
  | "reviewOrder"
  | "build"
  | "report"
  | "summary";
```

### 9.3 User experience

The learner should see:

1. mission intro;
2. map with clickable plot;
3. plot highlight on hover;
4. plot details after click;
5. geometry form;
6. store catalog;
7. budget panel;
8. validation feedback;
9. build success state;
10. trilingual report inputs;
11. final score.

---

## 10. Component responsibilities

### 10.1 `LibraryMissionPage.tsx`

Main mission container.

Responsibilities:

- holds current step;
- stores learner answers;
- stores selected store items;
- calls validation and scoring logic;
- renders map, mission panel, store, report, and summary.

### 10.2 `CampusMap.tsx`

Displays `main-map.png`.

Responsibilities:

- render responsive background image;
- render interactive plot overlay;
- show built state when mission is completed;
- call `onPlotClick`.

### 10.3 `PlotOverlay.tsx`

Interactive overlay over the construction plot.

Responsibilities:

- draw SVG polygon;
- handle hover;
- handle click;
- display label: `Library Plot`.

### 10.4 `MissionPanel.tsx`

Displays story and current instructions.

Responsibilities:

- show mission step;
- show plot dimensions after inspection;
- show next action button.

### 10.5 `GeometryForm.tsx`

Geometry calculation form.

Responsibilities:

- input area;
- input perimeter;
- validate against config;
- show simple educational feedback.

### 10.6 `StorePanel.tsx`

Store catalog and item selection.

Responsibilities:

- group items by category;
- allow quantity changes;
- display item cost;
- show required/optional status.

### 10.7 `BudgetPanel.tsx`

Budget tracker.

Responsibilities:

- show current total;
- show budget limit;
- warn if over budget;
- show missing required items.

### 10.8 `ReportPanel.tsx`

Trilingual report step.

Responsibilities:

- Arabic input;
- French input;
- English input;
- simple validation for non-empty responses.

### 10.9 `BuildSummary.tsx`

Final score screen.

Responsibilities:

- show final score;
- show badges;
- show geometry answers;
- show total cost;
- show improvement feedback.

---

## 11. File responsibilities

### 11.1 `mapConfig.ts`

Contains:

```ts
export const elBahdjaCampusMap = {
  id: "el-bahdja-campus",
  title: "El-Bahdja School Campus",
  backgroundImage: "/assets/maps/el-bahdja-campus/main-map.png",
  plot: {
    id: "library-plot-01",
    label: "Library Plot",
    polygon: [
      { x: 0.546, y: 0.419 },
      { x: 0.887, y: 0.470 },
      { x: 0.863, y: 0.783 },
      { x: 0.407, y: 0.718 },
    ],
    dimensions: {
      lengthM: 18,
      widthM: 12,
    },
  },
};
```

### 11.2 `missionConfig.ts`

Contains story text, mission steps, formulas, and labels.

### 11.3 `storeCatalog.ts`

Contains all store items, categories, units, unit prices, required flags, and minimum quantities.

### 11.4 `budgetConfig.ts`

Contains budget and currency label.

### 11.5 `scoringConfig.ts`

Contains point weights.

### 11.6 `geometry.ts`

Pure functions:

```ts
calculateArea(length: number, width: number): number
calculatePerimeter(length: number, width: number): number
```

### 11.7 `budget.ts`

Pure functions:

```ts
calculateLineCost(unitPrice: number, quantity: number): number
calculateTotalCost(items: SelectedStoreItem[]): number
isWithinBudget(total: number, budget: number): boolean
```

### 11.8 `validation.ts`

Pure functions:

```ts
validateGeometryAnswer(...)
validatePurchaseOrder(...)
getMissingRequirements(...)
```

### 11.9 `scoring.ts`

Pure function:

```ts
calculateMissionScore(...): MissionScore
```

---

## 12. Single-action build plan for Cursor

Use Cursor one action at a time. Do not ask it to build the whole game in one prompt.

### Action 1 — Create branch

```powershell
git checkout -b feature/mycity-school-library
```

Expected result:

```text
new branch created for Mission 1
```

### Action 2 — Create folder structure

Run the PowerShell commands in Section 5.1.

Expected result:

```text
docs, assets, route, and mission folders exist
```

### Action 3 — Save the map

Save the attached image as:

```text
public/assets/maps/el-bahdja-campus/main-map.png
```

Verify:

```powershell
Test-Path public\assets\maps\el-bahdja-campus\main-map.png
```

Expected result:

```text
True
```

### Action 4 — Update `AGENTS.md`

Add rules:

```md
# EduGame Platform Agent Rules

- Use Next.js, TypeScript, Tailwind CSS, and App Router.
- Keep MyCity game features inside `src/features/mycity`.
- Keep route files inside `src/app` only as thin page wrappers.
- Keep static assets inside `public/assets`.
- Use configuration files for mission data, map data, dimensions, budget, scoring, and store items.
- Do not hardcode mission rules inside React components.
- Use pure functions for geometry, budget, validation, and scoring.
- Build the MVP first: one mission, one map, local state, no backend.
- Prioritize readable code and small components.
```

### Action 5 — Create route wrapper

File:

```text
src/app/mycity/library/page.tsx
```

Purpose:

```text
render LibraryMissionPage
```

### Action 6 — Create mission types

File:

```text
src/features/mycity/mission-library/types/missionTypes.ts
```

Include types for:

```text
MissionStep
Point2D
MapPlot
StoreCategory
StoreItem
SelectedStoreItem
GeometryAnswer
PurchaseValidationResult
MissionScore
ReportAnswers
```

### Action 7 — Create config files

Files:

```text
mapConfig.ts
missionConfig.ts
storeCatalog.ts
budgetConfig.ts
scoringConfig.ts
```

Expected result:

```text
all mission values are defined outside components
```

### Action 8 — Create geometry logic

File:

```text
logic/geometry.ts
```

Functions:

```text
calculateArea
calculatePerimeter
isCorrectNumberAnswer
```

### Action 9 — Create budget logic

File:

```text
logic/budget.ts
```

Functions:

```text
calculateLineCost
calculateTotalCost
isWithinBudget
```

### Action 10 — Create validation logic

File:

```text
logic/validation.ts
```

Functions:

```text
validateGeometryAnswer
getMissingRequiredItems
validatePurchaseOrder
validateReportAnswers
```

### Action 11 — Create scoring logic

File:

```text
logic/scoring.ts
```

Function:

```text
calculateMissionScore
```

### Action 12 — Build `CampusMap`

File:

```text
components/CampusMap.tsx
```

Requirements:

```text
render image
keep aspect ratio
render PlotOverlay
show built state label after success
```

### Action 13 — Build `PlotOverlay`

File:

```text
components/PlotOverlay.tsx
```

Requirements:

```text
SVG polygon overlay
hover highlight
click handler
responsive normalized coordinates
```

### Action 14 — Build `MissionPanel`

File:

```text
components/MissionPanel.tsx
```

Requirements:

```text
show current instruction
show story
show plot dimensions after inspection
show next-step button
```

### Action 15 — Build `GeometryForm`

File:

```text
components/GeometryForm.tsx
```

Requirements:

```text
area input
perimeter input
submit button
feedback message
```

### Action 16 — Build `StorePanel`

File:

```text
components/StorePanel.tsx
```

Requirements:

```text
group items by category
quantity controls
required labels
optional labels
line cost display
```

### Action 17 — Build `BudgetPanel`

File:

```text
components/BudgetPanel.tsx
```

Requirements:

```text
budget limit
total selected cost
remaining budget
over-budget warning
missing requirement summary
```

### Action 18 — Build `ReportPanel`

File:

```text
components/ReportPanel.tsx
```

Requirements:

```text
Arabic sentence input
French sentence input
English sentence input
submit button
simple validation
```

### Action 19 — Build `BuildSummary`

File:

```text
components/BuildSummary.tsx
```

Requirements:

```text
final score
badges
geometry result
budget result
trilingual report result
restart button
```

### Action 20 — Build `LibraryMissionPage`

File:

```text
page/LibraryMissionPage.tsx
```

Responsibilities:

```text
compose all components
manage mission step
manage learner answers
manage selected items
call validation functions
call scoring function
```

### Action 21 — Add home page link

If there is a landing page, add a link:

```text
/mycity/library
```

Label:

```text
Start Mission 1 — Build the School Library
```

### Action 22 — Run development server

```powershell
npm run dev
```

Open:

```text
http://localhost:3000/mycity/library
```

### Action 23 — Run lint

```powershell
npm run lint
```

Fix TypeScript and lint errors before committing.

### Action 24 — Manual MVP test

Test these scenarios:

```text
click plot
enter wrong area
enter correct area
enter wrong perimeter
enter correct perimeter
open store
buy insufficient items
buy over budget
buy valid order
submit trilingual report
see final score
restart mission
```

### Action 25 — Commit MVP

```powershell
git status --short
git add .
git commit -m "Build MyCity school library mission MVP"
```

---

## 13. Cursor prompt sequence

### Prompt 1 — Context only

```text
You are helping build the EduGame Platform prototype in a Next.js TypeScript App Router project. We are implementing MyCity Mission 1: Build the El-Bahdja School Library. Use the existing repository structure. Keep route files thin inside src/app. Keep game logic inside src/features/mycity/mission-library. Use config files for all mission values. Do not add backend, database, authentication, or external AI calls. Build only the MVP.
```

### Prompt 2 — Types and config

```text
Create the TypeScript types and configuration files for MyCity Mission 1: Build the El-Bahdja School Library. Add missionTypes.ts, mapConfig.ts, missionConfig.ts, storeCatalog.ts, budgetConfig.ts, and scoringConfig.ts. Use the map path /assets/maps/el-bahdja-campus/main-map.png. Use length 18m, width 12m, area 216m², perimeter 60m, and budget 2150 EduCoins. Keep all values configurable.
```

### Prompt 3 — Pure logic

```text
Create the pure logic files geometry.ts, budget.ts, validation.ts, and scoring.ts for the library mission. Do not use React in these files. Implement geometry validation, total cost calculation, purchase requirement validation, report validation, and mission score calculation. Keep functions small and readable.
```

### Prompt 4 — Map components

```text
Create CampusMap.tsx and PlotOverlay.tsx. The map must display the image /assets/maps/el-bahdja-campus/main-map.png responsively. Overlay the library plot using the normalized polygon points from mapConfig.ts. The plot should highlight on hover and call onPlotClick when clicked.
```

### Prompt 5 — Mission UI components

```text
Create MissionPanel.tsx, GeometryForm.tsx, StorePanel.tsx, BudgetPanel.tsx, ReportPanel.tsx, and BuildSummary.tsx. Use the existing config and logic files. Keep the components simple, accessible, and readable. Use Tailwind classes only. Do not add new UI libraries.
```

### Prompt 6 — Compose mission page

```text
Create LibraryMissionPage.tsx and the route src/app/mycity/library/page.tsx. Compose the mission flow: intro, inspectPlot, geometry, store, reviewOrder, build, report, summary. Use local React state. The mission should be playable from start to final score.
```

### Prompt 7 — Debug and polish

```text
Review the MyCity library mission implementation. Fix TypeScript errors, missing imports, unused variables, and broken UI flow. Do not change the architecture. Do not add backend or external dependencies. Ensure npm run lint passes.
```

---

## 14. Minimal acceptance criteria

The MVP is acceptable only if:

```text
The route /mycity/library opens successfully.
The main Algiers map is visible.
The construction plot is clickable.
The learner can inspect plot dimensions.
The learner can enter area and perimeter.
The game validates area and perimeter.
The store shows construction, floor, furniture, digital learning, comfort, and inclusion items.
The learner can select quantities.
The budget updates automatically.
The game detects missing required items.
The game detects over-budget orders.
The learner can submit a valid order.
The game shows a build success state.
The learner can write Arabic, French, and English report sentences.
The game displays a final score.
The code is split into components, config, types, and pure logic.
npm run lint passes.
```

---

## 15. What not to build in this iteration

Do not build:

```text
login
user accounts
backend API
real payment system
database
multiplayer
full city map
asset editor
teacher dashboard
AI tutor API
voice input
advanced animation
real construction price database
real GIS map
```

These can be added after the first playable mission works.

---

## 16. Git workflow

Recommended workflow:

```powershell
git status --short
git checkout -b feature/mycity-school-library
```

After each meaningful step:

```powershell
git add .
git commit -m "Meaningful message here"
```

Suggested commits:

```text
Add MyCity school library mission structure
Add library mission config and types
Add library mission logic
Add campus map and plot overlay
Add geometry and store panels
Add library mission page flow
Polish MVP and pass lint
```

---

## 17. Recommended copy targets

Copy this file to:

```text
docs/mycity/mission-01-school-library/build-plan.md
```

Create a shorter prompt-only file at:

```text
docs/mycity/mission-01-school-library/cursor-prompts.md
```

Create a rules-only file at:

```text
docs/mycity/mission-01-school-library/mission-rules.md
```

---

## 18. Final build order

Use this exact order:

```text
1. Create branch
2. Create folders
3. Save main map
4. Update AGENTS.md
5. Add route wrapper
6. Add types
7. Add config files
8. Add pure logic files
9. Add map components
10. Add mission UI components
11. Compose mission page
12. Run dev server
13. Test full flow manually
14. Run lint
15. Commit MVP
```

This order minimizes Cursor token waste because each step has a small scope and clear target files.

---

## 19. Open decisions to confirm later

These are intentionally not fixed yet:

```text
official Algerian curriculum wording
final grade level label
final library dimensions
final store prices
final budget
final Arabic/French/English feedback wording
whether to add AI tutor feedback
whether to save scores locally
whether to add teacher dashboard later
whether to create a second library-built overlay image
```

For MVP, keep all of them configurable.

---

## 20. Final verdict

The project is ready for implementation.

Use the current Next.js repository, keep the map as the canonical Mission 1 background, define the plot as an interactive build zone, store all math and budget rules in config files, and build the first playable mission locally before adding advanced features.

