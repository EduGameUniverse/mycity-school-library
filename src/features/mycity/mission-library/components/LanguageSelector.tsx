"use client";

import { t, type Locale } from "@/features/mycity/mission-library/data/i18n";

const LANGUAGE_OPTIONS: Array<{ locale: Locale; labelKey: "language.english" | "language.french" | "language.arabic" }> =
  [
    { locale: "en", labelKey: "language.english" },
    { locale: "fr", labelKey: "language.french" },
    { locale: "ar", labelKey: "language.arabic" },
  ];

interface LanguageSelectorProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
}

export function LanguageSelector({ locale, onChange }: LanguageSelectorProps) {
  return (
    <div
      dir="ltr"
      role="group"
      aria-label={t(locale, "language.groupLabel")}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t(locale, "language.groupLabel")}
      </span>
      {LANGUAGE_OPTIONS.map((option) => {
        const selected = locale === option.locale;

        return (
          <button
            key={option.locale}
            type="button"
            onClick={() => onChange(option.locale)}
            aria-pressed={selected}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              selected
                ? "bg-sky-700 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-sky-50"
            }`}
          >
            {t(locale, option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
