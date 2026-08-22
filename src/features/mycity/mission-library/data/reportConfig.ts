import type { Locale } from "./i18n";
import type { ReportTemplateConfig } from "../types/missionTypes";

const englishReportPrompts: ReportTemplateConfig["reportPrompts"] = {
  architectureChoice: "Why did you select this final architecture?",
  areaComparison: "How did you compare indoor area across the three designs?",
  wallLengthComparison:
    "How did you compare wall length / perimeter across the three designs?",
  constructionCostComparison:
    "How did you compare estimated construction cost across the three designs?",
  libraryItemsBudgetUse:
    "How did you use the 500 EduCoin library-items budget?",
  readingSupport: "How does your order support reading?",
  digitalLearningSupport: "How does your order support digital learning?",
  accessibilitySupport:
    "How does your order support accessibility and inclusion?",
};

export const localizedReportPrompts: Record<
  Locale,
  ReportTemplateConfig["reportPrompts"]
> = {
  en: englishReportPrompts,
  fr: {
    architectureChoice: "Pourquoi avez-vous choisi cette architecture finale ?",
    areaComparison:
      "Comment avez-vous comparé l'aire intérieure des trois projets ?",
    wallLengthComparison:
      "Comment avez-vous comparé la longueur des murs / le périmètre des trois projets ?",
    constructionCostComparison:
      "Comment avez-vous comparé le coût de construction estimé des trois projets ?",
    libraryItemsBudgetUse:
      "Comment avez-vous utilisé le budget de 500 EduCoins pour les articles de bibliothèque ?",
    readingSupport: "Comment votre commande soutient-elle la lecture ?",
    digitalLearningSupport:
      "Comment votre commande soutient-elle l'apprentissage numérique ?",
    accessibilitySupport:
      "Comment votre commande soutient-elle l'accessibilité et l'inclusion ?",
  },
  ar: {
    architectureChoice: "لماذا اخترت هذا التصميم المعماري النهائي؟",
    areaComparison: "كيف قارنت المساحة الداخلية عبر التصاميم الثلاثة؟",
    wallLengthComparison:
      "كيف قارنت طول الجدران / المحيط عبر التصاميم الثلاثة؟",
    constructionCostComparison:
      "كيف قارنت تكلفة البناء التقديرية عبر التصاميم الثلاثة؟",
    libraryItemsBudgetUse:
      "كيف استخدمت ميزانية مواد المكتبة البالغة 500 EduCoin؟",
    readingSupport: "كيف يدعم طلبك القراءة؟",
    digitalLearningSupport: "كيف يدعم طلبك التعلم الرقمي؟",
    accessibilitySupport: "كيف يدعم طلبك إمكانية الوصول والدمج؟",
  },
};

export const localizedReportSummaryLabels: Record<
  Locale,
  {
    languageName: string;
    missionReport: string;
    learnerJustification: string;
    architectureChoice: string;
    areaComparison: string;
    wallLengthComparison: string;
    constructionCostComparison: string;
    libraryItemsBudgetUse: string;
    readingSupport: string;
    digitalLearningSupport: string;
    accessibilitySupport: string;
    validatedMissionSummary: string;
    selectedArchitecture: string;
    selectedIndoorArea: string;
    selectedWallLength: string;
    constructionCost: string;
    remainingConstructionBudget: string;
    libraryItemsCost: string;
    remainingLibraryItemsBudget: string;
    readingResources: string;
    digitalLearningResources: string;
    accessibilityInclusionChoices: string;
    finalScore: string;
  }
> = {
  en: {
    languageName: "English",
    missionReport: "English mission report",
    learnerJustification: "Learner justification",
    architectureChoice: "Architecture choice",
    areaComparison: "Area comparison",
    wallLengthComparison: "Wall length comparison",
    constructionCostComparison: "Construction cost comparison",
    libraryItemsBudgetUse: "Library-items budget use",
    readingSupport: "Reading support",
    digitalLearningSupport: "Digital learning support",
    accessibilitySupport: "Accessibility support",
    validatedMissionSummary: "Validated mission summary",
    selectedArchitecture: "Selected architecture",
    selectedIndoorArea: "Selected indoor area",
    selectedWallLength: "Selected wall length",
    constructionCost: "Construction cost",
    remainingConstructionBudget: "Remaining construction budget",
    libraryItemsCost: "Library-items cost",
    remainingLibraryItemsBudget: "Remaining library-items budget",
    readingResources: "Reading resources",
    digitalLearningResources: "Digital learning resources",
    accessibilityInclusionChoices: "Accessibility/inclusion choices",
    finalScore: "Final score",
  },
  fr: {
    languageName: "Français",
    missionReport: "Rapport de mission en français",
    learnerJustification: "Justification de l'élève",
    architectureChoice: "Choix de l'architecture",
    areaComparison: "Comparaison des aires",
    wallLengthComparison: "Comparaison de la longueur des murs",
    constructionCostComparison: "Comparaison du coût de construction",
    libraryItemsBudgetUse: "Utilisation du budget des articles de bibliothèque",
    readingSupport: "Soutien à la lecture",
    digitalLearningSupport: "Soutien à l'apprentissage numérique",
    accessibilitySupport: "Soutien à l'accessibilité",
    validatedMissionSummary: "Résumé validé de la mission",
    selectedArchitecture: "Architecture sélectionnée",
    selectedIndoorArea: "Aire intérieure sélectionnée",
    selectedWallLength: "Longueur des murs sélectionnée",
    constructionCost: "Coût de construction",
    remainingConstructionBudget: "Budget de construction restant",
    libraryItemsCost: "Coût des articles de bibliothèque",
    remainingLibraryItemsBudget: "Budget restant des articles de bibliothèque",
    readingResources: "Ressources de lecture",
    digitalLearningResources: "Ressources d'apprentissage numérique",
    accessibilityInclusionChoices: "Choix d'accessibilité/inclusion",
    finalScore: "Score final",
  },
  ar: {
    languageName: "العربية",
    missionReport: "تقرير المهمة بالعربية",
    learnerJustification: "تبرير المتعلم",
    architectureChoice: "اختيار التصميم المعماري",
    areaComparison: "مقارنة المساحات",
    wallLengthComparison: "مقارنة طول الجدران",
    constructionCostComparison: "مقارنة تكلفة البناء",
    libraryItemsBudgetUse: "استخدام ميزانية مواد المكتبة",
    readingSupport: "دعم القراءة",
    digitalLearningSupport: "دعم التعلم الرقمي",
    accessibilitySupport: "دعم إمكانية الوصول",
    validatedMissionSummary: "ملخص المهمة المصادق عليه",
    selectedArchitecture: "التصميم المعماري المختار",
    selectedIndoorArea: "المساحة الداخلية المختارة",
    selectedWallLength: "طول الجدران المختار",
    constructionCost: "تكلفة البناء",
    remainingConstructionBudget: "ميزانية البناء المتبقية",
    libraryItemsCost: "تكلفة مواد المكتبة",
    remainingLibraryItemsBudget: "ميزانية مواد المكتبة المتبقية",
    readingResources: "موارد القراءة",
    digitalLearningResources: "موارد التعلم الرقمي",
    accessibilityInclusionChoices: "اختيارات إمكانية الوصول/الدمج",
    finalScore: "النتيجة النهائية",
  },
};

export const reportTemplateConfig: ReportTemplateConfig = {
  constructionAccessibilityItemIds: [
    "accessibility-ramp",
    "wide-accessible-door",
  ],
  readingResourceItemIds: [
    "book-pack",
    "science-book-pack",
    "language-book-pack",
    "magazines",
    "reading-corner",
  ],
  digitalResourceItemIds: [
    "laptop",
    "tablet-station",
    "internet-router",
    "projector",
  ],
  inclusionResourceItemIds: [
    "adapted-reading-desk",
    "audio-reading-tool",
    "educational-posters",
  ],
  reportPrompts: englishReportPrompts,
  noneSelectedLabel: {
    en: "None selected",
    fr: "Aucun article sélectionné",
    ar: "لم يتم اختيار أي عنصر",
  },
};

export const emptyGuidedReportAnswers = {
  english: {
    architectureChoice: "",
    areaComparison: "",
    wallLengthComparison: "",
    constructionCostComparison: "",
    libraryItemsBudgetUse: "",
    readingSupport: "",
    digitalLearningSupport: "",
    accessibilitySupport: "",
  },
  french: {
    architectureChoice: "",
    areaComparison: "",
    wallLengthComparison: "",
    constructionCostComparison: "",
    libraryItemsBudgetUse: "",
    readingSupport: "",
    digitalLearningSupport: "",
    accessibilitySupport: "",
  },
  arabic: {
    architectureChoice: "",
    areaComparison: "",
    wallLengthComparison: "",
    constructionCostComparison: "",
    libraryItemsBudgetUse: "",
    readingSupport: "",
    digitalLearningSupport: "",
    accessibilitySupport: "",
  },
};
