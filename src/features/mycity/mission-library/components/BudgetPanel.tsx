"use client";

import { useMemo } from "react";
import { libraryBudgetConfig } from "@/features/mycity/mission-library/data/budgetConfig";
import { t, type I18nKey, type Locale } from "@/features/mycity/mission-library/data/i18n";
import {
  getStoreItemsByBudgetScope,
  storeCatalog,
} from "@/features/mycity/mission-library/data/storeCatalog";
import {
  constructionCategoryDisplay,
  libraryItemsCategoryDisplay,
} from "@/features/mycity/mission-library/data/storeConfig";
import {
  calculateBudgetScopeCost,
  getRemainingBudget,
} from "@/features/mycity/mission-library/logic/budget";
import {
  buildSelectedStoreItems,
  getPurchaseLineItems,
} from "@/features/mycity/mission-library/logic/storeSelection";
import type {
  ArchitectureDesignResult,
  BudgetScope,
  ScopedPurchaseValidationResult,
  StoreCategory,
  StoreUnit,
} from "@/features/mycity/mission-library/types/missionTypes";

const CATEGORY_I18N_KEYS: Record<StoreCategory, I18nKey> = {
  construction: "budget.category.walls",
  floor: "budget.category.floor",
  access: "budget.category.access",
  electrical: "budget.category.electrical",
  reading: "budget.category.reading",
  digital: "budget.category.digital",
  inclusion: "budget.category.inclusion",
  enrichment: "budget.category.enrichment",
};

const UNIT_I18N_KEYS: Record<StoreUnit, I18nKey> = {
  m: "store.unit.m",
  m2: "store.unit.m2",
  each: "store.unit.each",
};

function fillTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] === undefined ? `{${name}}` : String(vars[name]),
  );
}

interface BudgetPanelProps {
  locale: Locale;
  finalArchitecture: ArchitectureDesignResult | null;
  /** Store quantities are owned by the page so they can be persisted and restored. */
  quantities: Record<string, number>;
  constructionValidation: ScopedPurchaseValidationResult | null;
  libraryValidation: ScopedPurchaseValidationResult | null;
  onQuantityChange: (itemId: string, value: string) => void;
  onConstructionSubmit: () => void;
  onLibraryItemsSubmit: () => void;
}

function StoreSection({
  locale,
  title,
  description,
  budgetLimit,
  budgetScope,
  categories,
  quantities,
  onQuantityChange,
  onSubmit,
  submitLabel,
  validation,
}: {
  locale: Locale;
  title: string;
  description: string;
  budgetLimit: number;
  budgetScope: BudgetScope;
  categories: Array<{ id: StoreCategory; label: string }>;
  quantities: Record<string, number>;
  onQuantityChange: (itemId: string, value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  validation: ScopedPurchaseValidationResult | null;
}) {
  const selections = useMemo(
    () =>
      buildSelectedStoreItems(quantities).filter((selection) => {
        const item = storeCatalog.find((entry) => entry.id === selection.itemId);
        return item?.budgetScope === budgetScope;
      }),
    [quantities, budgetScope],
  );
  const lineItems = useMemo(
    () => getPurchaseLineItems(selections),
    [selections],
  );
  const totalCost = calculateBudgetScopeCost(selections, budgetScope);
  const remainingBudget = getRemainingBudget(totalCost, budgetLimit);

  const itemsByCategory = useMemo(() => {
    const scopedItems = getStoreItemsByBudgetScope(budgetScope);
    return categories
      .map((category) => ({
        ...category,
        label: t(locale, CATEGORY_I18N_KEYS[category.id]),
        items: scopedItems.filter((item) => item.category === category.id),
      }))
      .filter((category) => category.items.length > 0);
  }, [budgetScope, categories, locale]);

  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-slate-500">{t(locale, "budget.budget")}</dt>
          <dd className="font-semibold">
            {budgetLimit} {libraryBudgetConfig.currencyLabel}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-slate-500">{t(locale, "budget.selectedTotal")}</dt>
          <dd
            className={`font-semibold ${
              totalCost > budgetLimit ? "text-rose-700" : "text-slate-900"
            }`}
          >
            {totalCost} {libraryBudgetConfig.currencyLabel}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-slate-500">{t(locale, "budget.remaining")}</dt>
          <dd
            className={`font-semibold ${
              remainingBudget < 0 ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            {remainingBudget} {libraryBudgetConfig.currencyLabel}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-4">
        {itemsByCategory.map((category) => (
          <div key={category.id}>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-sky-800">
              {category.label}
            </h4>
            <div className="mt-3 space-y-3">
              {category.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h5 className="font-medium text-slate-900">{item.label}</h5>
                      <p className="mt-1 text-xs text-slate-500">
                        {fillTemplate(t(locale, "budget.pricePerUnit"), {
                          price: item.unitPrice,
                          currency: libraryBudgetConfig.currencyLabel,
                          unit: t(locale, UNIT_I18N_KEYS[item.unit]),
                        })}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600">
                        {t(locale, "budget.qty")}
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={item.unit === "each" ? 1 : "any"}
                        value={quantities[item.id] ?? 0}
                        onChange={(event) =>
                          onQuantityChange(item.id, event.target.value)
                        }
                        className="w-24 rounded-lg border border-slate-300 px-3 py-2"
                      />
                      <span className="text-slate-500">
                        {t(locale, UNIT_I18N_KEYS[item.unit])}
                      </span>
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>

      {lineItems.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm">
          {lineItems.map((line) => (
            <li
              key={line.itemId}
              className="flex justify-between gap-3 border-b border-slate-200 pb-2"
            >
              <span>
                {line.label} · {line.quantity}{" "}
                {t(locale, UNIT_I18N_KEYS[line.unit])}
              </span>
              <span className="font-medium">
                {line.lineCost} {libraryBudgetConfig.currencyLabel}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={onSubmit}
        className="mt-4 w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
      >
        {submitLabel}
      </button>

      {validation ? (
        <div
          className={`mt-4 rounded-lg border p-4 text-sm ${
            validation.isValid
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-950"
          }`}
        >
          {validation.isValid ? (
            <p className="font-semibold">{t(locale, "budget.orderValid")}</p>
          ) : (
            <ul className="list-disc space-y-1 ps-5">
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          {validation.warnings.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 ps-5 text-amber-900">
              {validation.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
          {budgetScope === "library-items" ? (
            <p className="mt-3 text-xs">
              {fillTemplate(t(locale, "budget.resourceCounts"), {
                reading: validation.readingResourcesSelected,
                digital: validation.digitalResourcesSelected,
                inclusion: validation.inclusionResourcesSelected,
              })}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function BudgetPanel({
  locale,
  finalArchitecture,
  quantities,
  constructionValidation,
  libraryValidation,
  onQuantityChange,
  onConstructionSubmit,
  onLibraryItemsSubmit,
}: BudgetPanelProps) {
  if (!finalArchitecture?.isValid) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
        {t(locale, "budget.blockedMessage")}
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {t(locale, "budget.sectionTitle")}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {fillTemplate(t(locale, "budget.storeExplanation"), {
            constructionBudget: libraryBudgetConfig.constructionBudget,
            libraryItemsBudget: libraryBudgetConfig.libraryItemsBudget,
            currency: libraryBudgetConfig.currencyLabel,
            wallLength: finalArchitecture.wallLength,
            floorQuantity: finalArchitecture.floorQuantity,
          })}
        </p>
      </div>

      <StoreSection
        locale={locale}
        title={t(locale, "budget.constructionTitle")}
        description={t(locale, "budget.constructionDescription")}
        budgetLimit={libraryBudgetConfig.constructionBudget}
        budgetScope="construction"
        categories={constructionCategoryDisplay}
        quantities={quantities}
        onQuantityChange={onQuantityChange}
        onSubmit={onConstructionSubmit}
        submitLabel={t(locale, "budget.constructionSubmit")}
        validation={constructionValidation}
      />

      <StoreSection
        locale={locale}
        title={t(locale, "budget.libraryItemsTitle")}
        description={t(locale, "budget.libraryItemsDescription")}
        budgetLimit={libraryBudgetConfig.libraryItemsBudget}
        budgetScope="library-items"
        categories={libraryItemsCategoryDisplay}
        quantities={quantities}
        onQuantityChange={onQuantityChange}
        onSubmit={onLibraryItemsSubmit}
        submitLabel={t(locale, "budget.libraryItemsSubmit")}
        validation={libraryValidation}
      />
    </section>
  );
}
