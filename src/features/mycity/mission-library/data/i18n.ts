export type Locale = "en" | "fr" | "ar";

const en = {
  "language.groupLabel": "Language",
  "language.english": "English",
  "language.french": "Français",
  "language.arabic": "العربية",

  "mission.title": "MyCity Mission 1 — Build the El-Bahdja School Library",
  "mission.objective":
    "El-Bahdja School wants to add a small library so pupils can read, study, use digital resources, and prepare projects. Your job is to inspect the plot, calculate the required area and perimeter, buy construction and interior equipment from the store, and stay within the allowed budget.",
  "mission.inspectPlot": "Inspect the library plot on the campus map.",
  "mission.clickPlotHint": "Click the construction plot to inspect it",
  "mission.selectPlotHint":
    "Select the empty plot on the campus map to reveal the mission details and geometry task.",
  "mission.plotLabel": "Library Plot",
  "mission.plotDimensions": "Plot dimensions",
  "mission.length": "Length",
  "mission.width": "Width",
  "mission.budgetsTitle": "Mission budgets",
  "mission.constructionBudget": "Construction",
  "mission.libraryItemsBudget": "Library items",
  "mission.objectiveTitle": "Mission objective",
  "mission.geometryTitle": "Calculate the area and perimeter of the library plot.",
  "mission.geometryHint":
    "Use the plot dimensions to calculate area and perimeter.",
  "mission.formulaArea": "area = length × width",
  "mission.formulaPerimeter": "perimeter = 2 × (length + width)",
  "mission.area": "Area",
  "mission.perimeter": "Perimeter",
  "mission.checkAnswers": "Check my answers",
  "mission.geometryCorrect": "Correct plot area and perimeter.",
  "mission.libraryCompleted": "Library completed",
  "mission.mapAlt": "El-Bahdja School Campus",
  "mission.lengthUnit": "m",
  "mission.widthUnit": "m",
  "mission.areaUnit": "m²",
  "mission.perimeterUnit": "m",

  "architecture.sectionTitle": "Compare three library architectures",
  "architecture.sectionDescription":
    "Design and check three library proposals inside the 18 m × 12 m construction plot. Calculate area and wall length yourself before clicking Check this design.",
  "architecture.plotConstraints":
    "Construction plot: 18 m × 12 m. Required indoor area: 144–216 m². Calculate before checking — no answers are shown until you click Check this design.",
  "architecture.coordinateExplanation":
    "Use A(0,0) as the origin. The x value moves from A to B. The y value moves from A to D. Your building must stay inside the 18 m × 12 m construction plot.",
  "architecture.coordinateNote":
    "Coordinates are in meters on the construction plot — not screen pixels. The map preview projects your math coordinates onto the perspective plot polygon.",
  "architecture.compactInstruction":
    "Enter the four coordinates of your proposed library. Use A(0,0) as the origin of the construction plot.",
  "architecture.checkButton": "Check this design",
  "architecture.comparisonTableTitle": "Architecture comparison",
  "architecture.col.architecture": "Architecture",
  "architecture.col.indoorArea": "Indoor area",
  "architecture.col.wallLength": "Wall length",
  "architecture.col.floorQty": "Floor qty",
  "architecture.col.estCost": "Est. cost",
  "architecture.col.costEff": "Cost eff.",
  "architecture.col.comfort": "Comfort",
  "architecture.col.creativity": "Creativity",
  "architecture.col.access": "Access.",
  "architecture.col.digital": "Digital",
  "architecture.col.status": "Status",
  "architecture.statusValid": "Valid",
  "architecture.statusInvalid": "Invalid",
  "architecture.compareYourself":
    "Compare the values yourself. The app does not choose the best design for you.",
  "architecture.finalSelectionTitle": "Select your final library design",
  "architecture.finalSelectionHint":
    "Compare the table above, then choose one valid design. No design is recommended — you decide.",
  "architecture.selectDesign": "Select {name}",
  "architecture.bonusTitle": "Bonus Challenge — Courtyard Library",
  "architecture.bonusDescription":
    "Optional rectangular courtyard design. Complete all three required architectures first.",
  "architecture.circularNote":
    "Advanced circular courtyard design can be added later.",
  "architecture.checkBonus": "Check bonus courtyard design",
  "architecture.validDesign": "Valid design",
  "architecture.needsCorrections": "Design needs corrections",
  "architecture.length": "Length",
  "architecture.width": "Width",
  "architecture.indoorArea": "Indoor area",
  "architecture.wallLength": "Wall length",
  "architecture.floorQuantity": "Floor quantity",
  "architecture.estCost": "Est. cost",
  "architecture.tradeOffs": "Trade-offs",
  "architecture.previewUpdated":
    "Map preview updated — your proposed footprint is shown on the campus map.",
  "architecture.aPrimeBottomLeft": "A′ — bottom-left",
  "architecture.bPrimeBottomRight": "B′ — bottom-right",
  "architecture.cPrimeTopRight": "C′ — top-right",
  "architecture.dPrimeTopLeft": "D′ — top-left",
  "architecture.aPrimeX": "A′ x (m)",
  "architecture.aPrimeY": "A′ y (m)",
  "architecture.bPrimeX": "B′ x (m)",
  "architecture.bPrimeY": "B′ y (m)",
  "architecture.cPrimeX": "C′ x (m)",
  "architecture.cPrimeY": "C′ y (m)",
  "architecture.dPrimeX": "D′ x (m)",
  "architecture.dPrimeY": "D′ y (m)",
  "architecture.building1": "Building 1",
  "architecture.building2": "Building 2",
  "architecture.x1": "x1",
  "architecture.y1": "y1",
  "architecture.length1": "Length 1",
  "architecture.width1": "Width 1",
  "architecture.x2": "x2",
  "architecture.y2": "y2",
  "architecture.length2": "Length 2",
  "architecture.width2": "Width 2",
  "architecture.yourAreaAnswer": "Your area answer (m²)",
  "architecture.yourWallLengthAnswer": "Your wall-length answer (m)",
  "architecture.yourTotalAreaAnswer": "Your total area answer (m²)",
  "architecture.yourTotalWallLengthAnswer": "Your total wall-length answer (m)",
  "architecture.xPosition": "x position (m)",
  "architecture.yPosition": "y position (m)",
  "architecture.outerLength": "Outer length (m)",
  "architecture.outerWidth": "Outer width (m)",
  "architecture.cutoutLength": "Cutout length (m)",
  "architecture.cutoutWidth": "Cutout width (m)",
  "architecture.courtyardLength": "Courtyard length (m)",
  "architecture.courtyardWidth": "Courtyard width (m)",
  "architecture.yourIndoorAreaAnswer": "Your indoor area answer (m²)",

  "budget.sectionTitle": "Mission budgets",
  "budget.storeExplanation":
    "Construction budget ({constructionBudget} {currency}) and library-items budget ({libraryItemsBudget} {currency}) are separate. Choose quantities manually for the final architecture: {wallLength} m walls and {floorQuantity} m² floor.",
  "budget.budget": "Budget",
  "budget.selectedTotal": "Selected total",
  "budget.remaining": "Remaining",
  "budget.qty": "Qty",
  "budget.orderValid": "Order valid for this budget.",
  "budget.resourceCounts":
    "Reading resources: {reading} · Digital resources: {digital} · Inclusion resources: {inclusion}",
  "budget.constructionTitle": "Construction Store",
  "budget.constructionDescription":
    "Buy construction materials using the 2500 EduCoin construction budget only.",
  "budget.libraryItemsTitle": "Library Items Store",
  "budget.libraryItemsDescription":
    "Buy books and learning resources using the 500 EduCoin library-items budget only.",
  "budget.constructionSubmit": "Check construction order",
  "budget.libraryItemsSubmit": "Check library-items order",
  "budget.blockedMessage":
    "Select your final architecture before opening the stores.",
  "budget.category.walls": "Walls",
  "budget.category.floor": "Floor",
  "budget.category.access": "Doors, windows & comfort",
  "budget.category.electrical": "Electrical",
  "budget.category.reading": "Reading resources",
  "budget.category.digital": "Digital learning",
  "budget.category.inclusion": "Inclusion & accessibility",
  "budget.category.enrichment": "Optional enrichment",
  "budget.pricePerUnit": "{price} {currency} per {unit}",
  "store.unit.m": "m",
  "store.unit.m2": "m²",
  "store.unit.each": "each",

  "build.button": "Build Library",
  "build.ready": "All mission tasks are complete. You can build the library.",
  "build.blocked": "Complete every task below before building the library.",
  "build.req.geometry": "Correct plot area and perimeter",
  "build.req.architectureComparison":
    "Three architecture proposals checked and valid",
  "build.req.finalArchitecture": "Final architecture selected",
  "build.req.constructionPurchase": "Construction order within 2500 EduCoins",
  "build.req.libraryItemsPurchase": "Library items within 500 EduCoins",
  "build.req.report": "Trilingual justification completed",

  "summary.successTitle": "Library built successfully!",
  "summary.successMessage":
    "El-Bahdja School now has a new library. Pupils can read, study, and use digital resources in a comfortable and inclusive space.",
  "summary.scoreTitle": "Final mission score",
  "summary.architectureComparison": "Architecture comparison",
  "summary.finalArchitecture": "Final architecture",
  "summary.constructionBudget": "Construction budget",
  "summary.libraryItemsBudget": "Library-items budget",
  "summary.digitalLearning": "Digital learning",
  "summary.accessibilityInclusion": "Accessibility / inclusion",
  "summary.trilingualJustification": "Trilingual justification",

  "report.sectionTitle": "Trilingual mission report",
  "report.sectionDescription":
    "Write your own justification in English, French, and Arabic before building. The summary below appears only after a successful build.",
  "report.english": "English",
  "report.french": "French",
  "report.arabic": "Arabic",
  "report.notReady": "Report not ready yet:",
  "report.complete":
    "Trilingual justification complete. You can build when all other tasks are done.",
  "report.finalSummaryTitle": "Final validated summary",
} as const;

export type I18nKey = keyof typeof en;

const fr: Record<I18nKey, string> = {
  "language.groupLabel": "Langue",
  "language.english": "English",
  "language.french": "Français",
  "language.arabic": "العربية",

  "mission.title":
    "MyCity Mission 1 — Construire la bibliothèque de l'école El-Bahdja",
  "mission.objective":
    "L'école El-Bahdja souhaite ajouter une petite bibliothèque pour que les élèves puissent lire, étudier, utiliser des ressources numériques et préparer des projets. Votre mission est d'inspecter le terrain, de calculer l'aire et le périmètre requis, d'acheter le matériel de construction et l'équipement intérieur dans le magasin, et de rester dans le budget autorisé.",
  "mission.inspectPlot":
    "Inspectez le terrain de la bibliothèque sur le plan du campus.",
  "mission.clickPlotHint": "Cliquez sur le terrain de construction pour l'inspecter",
  "mission.selectPlotHint":
    "Sélectionnez le terrain vide sur le plan du campus pour afficher les détails de la mission et la tâche de géométrie.",
  "mission.plotLabel": "Terrain de la bibliothèque",
  "mission.plotDimensions": "Dimensions du terrain",
  "mission.length": "Longueur",
  "mission.width": "Largeur",
  "mission.budgetsTitle": "Budgets de la mission",
  "mission.constructionBudget": "Construction",
  "mission.libraryItemsBudget": "Articles de bibliothèque",
  "mission.objectiveTitle": "Objectif de la mission",
  "mission.geometryTitle":
    "Calculez l'aire et le périmètre du terrain de la bibliothèque.",
  "mission.geometryHint":
    "Utilisez les dimensions du terrain pour calculer l'aire et le périmètre.",
  "mission.formulaArea": "aire = longueur × largeur",
  "mission.formulaPerimeter": "périmètre = 2 × (longueur + largeur)",
  "mission.area": "Aire",
  "mission.perimeter": "Périmètre",
  "mission.checkAnswers": "Vérifier mes réponses",
  "mission.geometryCorrect": "Aire et périmètre du terrain corrects.",
  "mission.libraryCompleted": "Bibliothèque construite",
  "mission.mapAlt": "Campus de l'école El-Bahdja",
  "mission.lengthUnit": "m",
  "mission.widthUnit": "m",
  "mission.areaUnit": "m²",
  "mission.perimeterUnit": "m",

  "architecture.sectionTitle": "Comparer trois architectures de bibliothèque",
  "architecture.sectionDescription":
    "Concevez et vérifiez trois propositions de bibliothèque à l'intérieur du terrain de construction de 18 m × 12 m. Calculez vous-même l'aire et la longueur des murs avant de cliquer sur Vérifier ce projet.",
  "architecture.plotConstraints":
    "Terrain de construction : 18 m × 12 m. Aire intérieure requise : 144–216 m². Calculez avant de vérifier — aucune réponse n'est affichée tant que vous n'avez pas cliqué sur Vérifier ce projet.",
  "architecture.coordinateExplanation":
    "Utilisez A(0,0) comme origine. La valeur x va de A vers B. La valeur y va de A vers D. Votre bâtiment doit rester à l'intérieur du terrain de construction de 18 m × 12 m.",
  "architecture.coordinateNote":
    "Les coordonnées sont en mètres sur le terrain de construction — pas en pixels. L'aperçu sur la carte projette vos coordonnées mathématiques sur le polygone en perspective.",
  "architecture.compactInstruction":
    "Saisissez les quatre coordonnées de la bibliothèque proposée. Utilisez A(0,0) comme origine du terrain de construction.",
  "architecture.checkButton": "Vérifier ce projet",
  "architecture.comparisonTableTitle": "Comparaison des architectures",
  "architecture.col.architecture": "Architecture",
  "architecture.col.indoorArea": "Aire intérieure",
  "architecture.col.wallLength": "Longueur des murs",
  "architecture.col.floorQty": "Qté de sol",
  "architecture.col.estCost": "Coût est.",
  "architecture.col.costEff": "Effic. coût",
  "architecture.col.comfort": "Confort",
  "architecture.col.creativity": "Créativité",
  "architecture.col.access": "Access.",
  "architecture.col.digital": "Numérique",
  "architecture.col.status": "Statut",
  "architecture.statusValid": "Valide",
  "architecture.statusInvalid": "Invalide",
  "architecture.compareYourself":
    "Comparez les valeurs vous-même. L'application ne choisit pas le meilleur projet à votre place.",
  "architecture.finalSelectionTitle": "Choisissez votre projet final de bibliothèque",
  "architecture.finalSelectionHint":
    "Comparez le tableau ci-dessus, puis choisissez un projet valide. Aucun projet n'est recommandé — c'est vous qui décidez.",
  "architecture.selectDesign": "Choisir {name}",
  "architecture.bonusTitle": "Défi bonus — Bibliothèque à cour",
  "architecture.bonusDescription":
    "Projet rectangulaire optionnel avec cour. Terminez d'abord les trois architectures obligatoires.",
  "architecture.circularNote":
    "Un projet avancé de cour circulaire pourra être ajouté plus tard.",
  "architecture.checkBonus": "Vérifier le projet bonus à cour",
  "architecture.validDesign": "Projet valide",
  "architecture.needsCorrections": "Le projet doit être corrigé",
  "architecture.length": "Longueur",
  "architecture.width": "Largeur",
  "architecture.indoorArea": "Aire intérieure",
  "architecture.wallLength": "Longueur des murs",
  "architecture.floorQuantity": "Quantité de sol",
  "architecture.estCost": "Coût est.",
  "architecture.tradeOffs": "Compromis",
  "architecture.previewUpdated":
    "Aperçu mis à jour — l'emprise proposée apparaît sur le plan du campus.",
  "architecture.aPrimeBottomLeft": "A′ — bas-gauche",
  "architecture.bPrimeBottomRight": "B′ — bas-droit",
  "architecture.cPrimeTopRight": "C′ — haut-droit",
  "architecture.dPrimeTopLeft": "D′ — haut-gauche",
  "architecture.aPrimeX": "A′ x (m)",
  "architecture.aPrimeY": "A′ y (m)",
  "architecture.bPrimeX": "B′ x (m)",
  "architecture.bPrimeY": "B′ y (m)",
  "architecture.cPrimeX": "C′ x (m)",
  "architecture.cPrimeY": "C′ y (m)",
  "architecture.dPrimeX": "D′ x (m)",
  "architecture.dPrimeY": "D′ y (m)",
  "architecture.building1": "Bâtiment 1",
  "architecture.building2": "Bâtiment 2",
  "architecture.x1": "x1",
  "architecture.y1": "y1",
  "architecture.length1": "Longueur 1",
  "architecture.width1": "Largeur 1",
  "architecture.x2": "x2",
  "architecture.y2": "y2",
  "architecture.length2": "Longueur 2",
  "architecture.width2": "Largeur 2",
  "architecture.yourAreaAnswer": "Votre réponse pour l'aire (m²)",
  "architecture.yourWallLengthAnswer": "Votre réponse pour la longueur des murs (m)",
  "architecture.yourTotalAreaAnswer": "Votre réponse pour l'aire totale (m²)",
  "architecture.yourTotalWallLengthAnswer":
    "Votre réponse pour la longueur totale des murs (m)",
  "architecture.xPosition": "Position x (m)",
  "architecture.yPosition": "Position y (m)",
  "architecture.outerLength": "Longueur extérieure (m)",
  "architecture.outerWidth": "Largeur extérieure (m)",
  "architecture.cutoutLength": "Longueur de l'encoche (m)",
  "architecture.cutoutWidth": "Largeur de l'encoche (m)",
  "architecture.courtyardLength": "Longueur de la cour (m)",
  "architecture.courtyardWidth": "Largeur de la cour (m)",
  "architecture.yourIndoorAreaAnswer": "Votre réponse pour l'aire intérieure (m²)",

  "budget.sectionTitle": "Budgets de la mission",
  "budget.storeExplanation":
    "Le budget de construction ({constructionBudget} {currency}) et le budget des articles de bibliothèque ({libraryItemsBudget} {currency}) sont séparés. Choisissez les quantités manuellement pour l'architecture finale : {wallLength} m de murs et {floorQuantity} m² de sol.",
  "budget.budget": "Budget",
  "budget.selectedTotal": "Total sélectionné",
  "budget.remaining": "Restant",
  "budget.qty": "Qté",
  "budget.orderValid": "Commande valide pour ce budget.",
  "budget.resourceCounts":
    "Ressources de lecture : {reading} · Ressources numériques : {digital} · Ressources d'inclusion : {inclusion}",
  "budget.constructionTitle": "Magasin de construction",
  "budget.constructionDescription":
    "Achetez des matériaux de construction uniquement avec le budget de construction de 2500 EduCoins.",
  "budget.libraryItemsTitle": "Magasin d'articles de bibliothèque",
  "budget.libraryItemsDescription":
    "Achetez des livres et des ressources d'apprentissage uniquement avec le budget de 500 EduCoins pour les articles de bibliothèque.",
  "budget.constructionSubmit": "Vérifier la commande de construction",
  "budget.libraryItemsSubmit": "Vérifier la commande d'articles de bibliothèque",
  "budget.blockedMessage":
    "Choisissez votre architecture finale avant d'ouvrir les magasins.",
  "budget.category.walls": "Murs",
  "budget.category.floor": "Sol",
  "budget.category.access": "Portes, fenêtres et confort",
  "budget.category.electrical": "Électricité",
  "budget.category.reading": "Ressources de lecture",
  "budget.category.digital": "Apprentissage numérique",
  "budget.category.inclusion": "Inclusion et accessibilité",
  "budget.category.enrichment": "Enrichissement optionnel",
  "budget.pricePerUnit": "{price} {currency} par {unit}",
  "store.unit.m": "m",
  "store.unit.m2": "m²",
  "store.unit.each": "pièce",

  "build.button": "Construire la bibliothèque",
  "build.ready":
    "Toutes les tâches de la mission sont terminées. Vous pouvez construire la bibliothèque.",
  "build.blocked":
    "Terminez toutes les tâches ci-dessous avant de construire la bibliothèque.",
  "build.req.geometry": "Aire et périmètre du terrain corrects",
  "build.req.architectureComparison":
    "Trois propositions d'architecture vérifiées et valides",
  "build.req.finalArchitecture": "Architecture finale sélectionnée",
  "build.req.constructionPurchase": "Commande de construction dans les 2500 EduCoins",
  "build.req.libraryItemsPurchase":
    "Articles de bibliothèque dans les 500 EduCoins",
  "build.req.report": "Justification trilingue terminée",

  "summary.successTitle": "Bibliothèque construite avec succès !",
  "summary.successMessage":
    "L'école El-Bahdja a maintenant une nouvelle bibliothèque. Les élèves peuvent lire, étudier et utiliser des ressources numériques dans un espace confortable et inclusif.",
  "summary.scoreTitle": "Score final de la mission",
  "summary.architectureComparison": "Comparaison des architectures",
  "summary.finalArchitecture": "Architecture finale",
  "summary.constructionBudget": "Budget de construction",
  "summary.libraryItemsBudget": "Budget des articles de bibliothèque",
  "summary.digitalLearning": "Apprentissage numérique",
  "summary.accessibilityInclusion": "Accessibilité / inclusion",
  "summary.trilingualJustification": "Justification trilingue",

  "report.sectionTitle": "Rapport de mission trilingue",
  "report.sectionDescription":
    "Rédigez votre justification en anglais, en français et en arabe avant de construire. Le résumé ci-dessous n'apparaît qu'après une construction réussie.",
  "report.english": "Anglais",
  "report.french": "Français",
  "report.arabic": "Arabe",
  "report.notReady": "Rapport pas encore prêt :",
  "report.complete":
    "Justification trilingue terminée. Vous pouvez construire lorsque les autres tâches sont faites.",
  "report.finalSummaryTitle": "Résumé final validé",
};

const ar: Record<I18nKey, string> = {
  "language.groupLabel": "اللغة",
  "language.english": "English",
  "language.french": "Français",
  "language.arabic": "العربية",

  "mission.title": "ماي سيتي المهمة 1 — بناء مكتبة مدرسة البهجة",
  "mission.objective":
    "تريد مدرسة البهجة إضافة مكتبة صغيرة ليتمكن التلاميذ من القراءة والدراسة واستخدام الموارد الرقمية وتحضير المشاريع. مهمتك هي فحص القطعة الأرضية، وحساب المساحة والمحيط المطلوبين، وشراء مواد البناء والتجهيزات الداخلية من المتجر، والبقاء ضمن الميزانية المسموح بها.",
  "mission.inspectPlot": "افحص قطعة أرض المكتبة على خريطة الحرم المدرسي.",
  "mission.clickPlotHint": "انقر على قطعة أرض البناء لفحصها",
  "mission.selectPlotHint":
    "اختر القطعة الفارغة على خريطة الحرم لإظهار تفاصيل المهمة ومسألة الهندسة.",
  "mission.plotLabel": "قطعة أرض المكتبة",
  "mission.plotDimensions": "أبعاد القطعة",
  "mission.length": "الطول",
  "mission.width": "العرض",
  "mission.budgetsTitle": "ميزانيات المهمة",
  "mission.constructionBudget": "البناء",
  "mission.libraryItemsBudget": "مواد المكتبة",
  "mission.objectiveTitle": "هدف المهمة",
  "mission.geometryTitle": "احسب مساحة ومحيط قطعة أرض المكتبة.",
  "mission.geometryHint": "استخدم أبعاد القطعة لحساب المساحة والمحيط.",
  "mission.formulaArea": "المساحة = الطول × العرض",
  "mission.formulaPerimeter": "المحيط = 2 × (الطول + العرض)",
  "mission.area": "المساحة",
  "mission.perimeter": "المحيط",
  "mission.checkAnswers": "تحقق من إجاباتي",
  "mission.geometryCorrect": "مساحة القطعة ومحيطها صحيحان.",
  "mission.libraryCompleted": "اكتملت المكتبة",
  "mission.mapAlt": "حرم مدرسة البهجة",
  "mission.lengthUnit": "م",
  "mission.widthUnit": "م",
  "mission.areaUnit": "م²",
  "mission.perimeterUnit": "م",

  "architecture.sectionTitle": "قارن ثلاثة تصاميم معمارية للمكتبة",
  "architecture.sectionDescription":
    "صمّم وتحقق من ثلاثة مقترحات لمكتبة داخل قطعة البناء 18 م × 12 م. احسب المساحة وطول الجدران بنفسك قبل النقر على تحقق من هذا التصميم.",
  "architecture.plotConstraints":
    "قطعة البناء: 18 م × 12 م. المساحة الداخلية المطلوبة: 144–216 م². احسب قبل التحقق — لا تُعرض الإجابات حتى تنقر على تحقق من هذا التصميم.",
  "architecture.coordinateExplanation":
    "استخدم A(0,0) كنقطة أصل. قيمة x تنتقل من A إلى B. قيمة y تنتقل من A إلى D. يجب أن يبقى المبنى داخل قطعة البناء 18 م × 12 م.",
  "architecture.coordinateNote":
    "الإحداثيات بالمتر على قطعة البناء — وليست بوحدات البكسل. معاينة الخريطة تُسقط إحداثياتك الرياضية على مضلع القطعة المنظوري.",
  "architecture.compactInstruction":
    "أدخل الإحداثيات الأربعة للمكتبة المقترحة. استخدم A(0,0) كنقطة أصل لقطعة البناء.",
  "architecture.checkButton": "تحقق من هذا التصميم",
  "architecture.comparisonTableTitle": "مقارنة التصاميم المعمارية",
  "architecture.col.architecture": "التصميم",
  "architecture.col.indoorArea": "المساحة الداخلية",
  "architecture.col.wallLength": "طول الجدران",
  "architecture.col.floorQty": "كمية الأرضية",
  "architecture.col.estCost": "التكلفة التقديرية",
  "architecture.col.costEff": "كفاءة التكلفة",
  "architecture.col.comfort": "الراحة",
  "architecture.col.creativity": "الإبداع",
  "architecture.col.access": "الوصول",
  "architecture.col.digital": "الرقمي",
  "architecture.col.status": "الحالة",
  "architecture.statusValid": "صالح",
  "architecture.statusInvalid": "غير صالح",
  "architecture.compareYourself":
    "قارن القيم بنفسك. التطبيق لا يختار أفضل تصميم نيابةً عنك.",
  "architecture.finalSelectionTitle": "اختر تصميم المكتبة النهائي",
  "architecture.finalSelectionHint":
    "قارن الجدول أعلاه ثم اختر تصميماً صالحاً. لا يوجد تصميم موصى به — القرار لك.",
  "architecture.selectDesign": "اختر {name}",
  "architecture.bonusTitle": "تحدٍ إضافي — مكتبة بفناء",
  "architecture.bonusDescription":
    "تصميم مستطيل اختياري بفناء. أكمل التصاميم الثلاثة المطلوبة أولاً.",
  "architecture.circularNote": "يمكن إضافة تصميم فناء دائري متقدم لاحقاً.",
  "architecture.checkBonus": "تحقق من تصميم الفناء الإضافي",
  "architecture.validDesign": "تصميم صالح",
  "architecture.needsCorrections": "التصميم يحتاج إلى تصحيح",
  "architecture.length": "الطول",
  "architecture.width": "العرض",
  "architecture.indoorArea": "المساحة الداخلية",
  "architecture.wallLength": "طول الجدران",
  "architecture.floorQuantity": "كمية الأرضية",
  "architecture.estCost": "التكلفة التقديرية",
  "architecture.tradeOffs": "المفاضلات",
  "architecture.previewUpdated":
    "تم تحديث المعاينة — يظهر المخطط المقترح على خريطة الحرم.",
  "architecture.aPrimeBottomLeft": "A′ — أسفل اليسار",
  "architecture.bPrimeBottomRight": "B′ — أسفل اليمين",
  "architecture.cPrimeTopRight": "C′ — أعلى اليمين",
  "architecture.dPrimeTopLeft": "D′ — أعلى اليسار",
  "architecture.aPrimeX": "A′ س (م)",
  "architecture.aPrimeY": "A′ ص (م)",
  "architecture.bPrimeX": "B′ س (م)",
  "architecture.bPrimeY": "B′ ص (م)",
  "architecture.cPrimeX": "C′ س (م)",
  "architecture.cPrimeY": "C′ ص (م)",
  "architecture.dPrimeX": "D′ س (م)",
  "architecture.dPrimeY": "D′ ص (م)",
  "architecture.building1": "المبنى 1",
  "architecture.building2": "المبنى 2",
  "architecture.x1": "س1",
  "architecture.y1": "ص1",
  "architecture.length1": "الطول 1",
  "architecture.width1": "العرض 1",
  "architecture.x2": "س2",
  "architecture.y2": "ص2",
  "architecture.length2": "الطول 2",
  "architecture.width2": "العرض 2",
  "architecture.yourAreaAnswer": "إجابتك عن المساحة (م²)",
  "architecture.yourWallLengthAnswer": "إجابتك عن طول الجدران (م)",
  "architecture.yourTotalAreaAnswer": "إجابتك عن المساحة الكلية (م²)",
  "architecture.yourTotalWallLengthAnswer": "إجابتك عن طول الجدران الكلي (م)",
  "architecture.xPosition": "موضع س (م)",
  "architecture.yPosition": "موضع ص (م)",
  "architecture.outerLength": "الطول الخارجي (م)",
  "architecture.outerWidth": "العرض الخارجي (م)",
  "architecture.cutoutLength": "طول الجزء المقطوع (م)",
  "architecture.cutoutWidth": "عرض الجزء المقطوع (م)",
  "architecture.courtyardLength": "طول الفناء (م)",
  "architecture.courtyardWidth": "عرض الفناء (م)",
  "architecture.yourIndoorAreaAnswer": "إجابتك عن المساحة الداخلية (م²)",

  "budget.sectionTitle": "ميزانيات المهمة",
  "budget.storeExplanation":
    "ميزانية البناء ({constructionBudget} {currency}) وميزانية مواد المكتبة ({libraryItemsBudget} {currency}) منفصلتان. اختر الكميات يدوياً للتصميم النهائي: {wallLength} م من الجدران و {floorQuantity} م² من الأرضية.",
  "budget.budget": "الميزانية",
  "budget.selectedTotal": "المجموع المحدد",
  "budget.remaining": "المتبقي",
  "budget.qty": "الكمية",
  "budget.orderValid": "الطلب صالح لهذه الميزانية.",
  "budget.resourceCounts":
    "موارد القراءة: {reading} · الموارد الرقمية: {digital} · موارد الدمج: {inclusion}",
  "budget.constructionTitle": "متجر البناء",
  "budget.constructionDescription":
    "اشترِ مواد البناء باستخدام ميزانية البناء البالغة 2500 EduCoin فقط.",
  "budget.libraryItemsTitle": "متجر مواد المكتبة",
  "budget.libraryItemsDescription":
    "اشترِ الكتب وموارد التعلم باستخدام ميزانية مواد المكتبة البالغة 500 EduCoin فقط.",
  "budget.constructionSubmit": "تحقق من طلب البناء",
  "budget.libraryItemsSubmit": "تحقق من طلب مواد المكتبة",
  "budget.blockedMessage": "اختر التصميم المعماري النهائي قبل فتح المتاجر.",
  "budget.category.walls": "الجدران",
  "budget.category.floor": "الأرضية",
  "budget.category.access": "الأبواب والنوافذ والراحة",
  "budget.category.electrical": "الكهرباء",
  "budget.category.reading": "موارد القراءة",
  "budget.category.digital": "التعلم الرقمي",
  "budget.category.inclusion": "الدمج وإمكانية الوصول",
  "budget.category.enrichment": "إثراء اختياري",
  "budget.pricePerUnit": "{price} {currency} لكل {unit}",
  "store.unit.m": "م",
  "store.unit.m2": "م²",
  "store.unit.each": "قطعة",

  "build.button": "ابنِ المكتبة",
  "build.ready": "اكتملت كل مهام المهمة. يمكنك بناء المكتبة.",
  "build.blocked": "أكمل كل المهام أدناه قبل بناء المكتبة.",
  "build.req.geometry": "مساحة القطعة ومحيطها صحيحان",
  "build.req.architectureComparison": "ثلاثة مقترحات معمارية تم التحقق منها وهي صالحة",
  "build.req.finalArchitecture": "تم اختيار التصميم النهائي",
  "build.req.constructionPurchase": "طلب البناء ضمن 2500 EduCoins",
  "build.req.libraryItemsPurchase": "مواد المكتبة ضمن 500 EduCoins",
  "build.req.report": "اكتملت التبريرات بثلاث لغات",

  "summary.successTitle": "تم بناء المكتبة بنجاح!",
  "summary.successMessage":
    "أصبح لمدرسة البهجة مكتبة جديدة. يمكن للتلاميذ القراءة والدراسة واستخدام الموارد الرقمية في فضاء مريح وشامل.",
  "summary.scoreTitle": "النتيجة النهائية للمهمة",
  "summary.architectureComparison": "مقارنة التصاميم المعمارية",
  "summary.finalArchitecture": "التصميم النهائي",
  "summary.constructionBudget": "ميزانية البناء",
  "summary.libraryItemsBudget": "ميزانية مواد المكتبة",
  "summary.digitalLearning": "التعلم الرقمي",
  "summary.accessibilityInclusion": "إمكانية الوصول / الدمج",
  "summary.trilingualJustification": "التبرير الثلاثي اللغة",

  "report.sectionTitle": "تقرير المهمة بثلاث لغات",
  "report.sectionDescription":
    "اكتب تبريرك بالإنجليزية والفرنسية والعربية قبل البناء. يظهر الملخص أدناه فقط بعد بناء ناجح.",
  "report.english": "الإنجليزية",
  "report.french": "الفرنسية",
  "report.arabic": "العربية",
  "report.notReady": "التقرير غير جاهز بعد:",
  "report.complete":
    "اكتملت التبريرات بثلاث لغات. يمكنك البناء عندما تكتمل المهام الأخرى.",
  "report.finalSummaryTitle": "الملخص النهائي المصادق عليه",
};

const dictionaries: Record<Locale, Record<I18nKey, string>> = {
  en: en as Record<I18nKey, string>,
  fr,
  ar,
};

export function localeDir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function t(locale: Locale, key: I18nKey): string;
export function t(locale: Locale, key: string): string;
export function t(locale: Locale, key: string): string {
  const dict = dictionaries[locale];
  const value = dict?.[key as I18nKey];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing i18n key "${key}" for locale "${locale}"`);
  }

  return value;
}
