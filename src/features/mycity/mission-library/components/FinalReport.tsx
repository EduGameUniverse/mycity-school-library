"use client";

import { reportTemplateConfig } from "@/features/mycity/mission-library/data/reportConfig";
import { validateGuidedReportAnswers } from "@/features/mycity/mission-library/logic/validation";
import type {
  GuidedReportAnswers,
  GuidedReportLanguageAnswers,
} from "@/features/mycity/mission-library/types/missionTypes";

interface FinalReportProps {
  answers: GuidedReportAnswers;
  onChange: (answers: GuidedReportAnswers) => void;
  summary?: {
    english: string;
    french: string;
    arabic: string;
  } | null;
}

function LanguageReportForm({
  languageLabel,
  dir,
  prompts,
  values,
  onFieldChange,
}: {
  languageLabel: string;
  dir?: "rtl";
  prompts: typeof reportTemplateConfig.reportPrompts;
  values: GuidedReportLanguageAnswers;
  onFieldChange: (
    field: keyof GuidedReportLanguageAnswers,
    value: string,
  ) => void;
}) {
  const fields: Array<{
    key: keyof GuidedReportLanguageAnswers;
    label: string;
  }> = [
    { key: "architectureChoice", label: prompts.architectureChoice },
    { key: "areaComparison", label: prompts.areaComparison },
    { key: "wallLengthComparison", label: prompts.wallLengthComparison },
    {
      key: "constructionCostComparison",
      label: prompts.constructionCostComparison,
    },
    { key: "libraryItemsBudgetUse", label: prompts.libraryItemsBudgetUse },
    { key: "readingSupport", label: prompts.readingSupport },
    {
      key: "digitalLearningSupport",
      label: prompts.digitalLearningSupport,
    },
    { key: "accessibilitySupport", label: prompts.accessibilitySupport },
  ];

  return (
    <article dir={dir} className={dir === "rtl" ? "text-right" : undefined}>
      <h3 className="text-sm font-semibold text-slate-800">{languageLabel}</h3>
      <div className="mt-3 space-y-3">
        {fields.map((field) => (
          <label key={field.key} className="block text-sm">
            <span className="font-medium text-slate-700">{field.label}</span>
            <textarea
              value={values[field.key]}
              onChange={(event) => onFieldChange(field.key, event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-sky-500 focus:border-sky-500 focus:ring-2"
            />
          </label>
        ))}
      </div>
    </article>
  );
}

export function FinalReport({ answers, onChange, summary }: FinalReportProps) {
  const validation = validateGuidedReportAnswers(answers);

  function updateLanguage(
    language: keyof GuidedReportAnswers,
    field: keyof GuidedReportLanguageAnswers,
    value: string,
  ) {
    onChange({
      ...answers,
      [language]: {
        ...answers[language],
        [field]: value,
      },
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Trilingual mission report
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Write your own justification in English, French, and Arabic before
        building. The summary below appears only after a successful build.
      </p>

      <div className="mt-4 space-y-6">
        <LanguageReportForm
          languageLabel="English"
          prompts={reportTemplateConfig.reportPrompts}
          values={answers.english}
          onFieldChange={(field, value) =>
            updateLanguage("english", field, value)
          }
        />
        <LanguageReportForm
          languageLabel="French"
          prompts={reportTemplateConfig.reportPrompts}
          values={answers.french}
          onFieldChange={(field, value) => updateLanguage("french", field, value)}
        />
        <LanguageReportForm
          languageLabel="Arabic"
          dir="rtl"
          prompts={reportTemplateConfig.reportPrompts}
          values={answers.arabic}
          onFieldChange={(field, value) => updateLanguage("arabic", field, value)}
        />
      </div>

      {!validation.isValid ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Report not ready yet:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {validation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Trilingual justification complete. You can build when all other tasks are
          done.
        </p>
      )}

      {summary ? (
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">
            Final validated summary
          </h3>
          <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            {summary.english}
          </pre>
          <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            {summary.french}
          </pre>
          <pre
            dir="rtl"
            className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-right"
          >
            {summary.arabic}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
