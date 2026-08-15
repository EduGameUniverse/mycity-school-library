"use client";

import { useMemo, useState } from "react";
import { libraryBudgetConfig } from "@/features/mycity/mission-library/data/budgetConfig";
import {
  getStoreItemsByBudgetScope,
  storeCatalog,
} from "@/features/mycity/mission-library/data/storeCatalog";
import {
  budgetUiConfig,
  constructionCategoryDisplay,
  libraryItemsCategoryDisplay,
  storeUnitLabels,
} from "@/features/mycity/mission-library/data/storeConfig";
import {
  calculateBudgetScopeCost,
  getRemainingBudget,
} from "@/features/mycity/mission-library/logic/budget";
import {
  buildSelectedStoreItems,
  createEmptyQuantityMap,
  filterSelectionsByBudgetScope,
  getPurchaseLineItems,
} from "@/features/mycity/mission-library/logic/storeSelection";
import {
  validateConstructionPurchase,
  validateLibraryItemsPurchase,
} from "@/features/mycity/mission-library/logic/validation";
import type {
  ArchitectureDesignResult,
  BudgetScope,
  ScopedPurchaseValidationResult,
  SelectedStoreItem,
  StoreCategory,
} from "@/features/mycity/mission-library/types/missionTypes";

interface BudgetPanelProps {
  finalArchitecture: ArchitectureDesignResult | null;
  onConstructionChange: (
    result: ScopedPurchaseValidationResult | null,
    selections: SelectedStoreItem[],
  ) => void;
  onLibraryItemsChange: (
    result: ScopedPurchaseValidationResult | null,
    selections: SelectedStoreItem[],
  ) => void;
}

function StoreSection({
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
        items: scopedItems.filter((item) => item.category === category.id),
      }))
      .filter((category) => category.items.length > 0);
  }, [budgetScope, categories]);

  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-slate-500">Budget</dt>
          <dd className="font-semibold">
            {budgetLimit} {libraryBudgetConfig.currencyLabel}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-slate-500">Selected total</dt>
          <dd
            className={`font-semibold ${
              totalCost > budgetLimit ? "text-rose-700" : "text-slate-900"
            }`}
          >
            {totalCost} {libraryBudgetConfig.currencyLabel}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-slate-500">Remaining</dt>
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
                        {item.unitPrice} {libraryBudgetConfig.currencyLabel} per{" "}
                        {storeUnitLabels[item.unit]}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600">Qty</span>
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
                        {storeUnitLabels[item.unit]}
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
                {line.label} · {line.quantity} {storeUnitLabels[line.unit]}
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
            <p className="font-semibold">Order valid for this budget.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          {validation.warnings.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-amber-900">
              {validation.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
          {budgetScope === "library-items" ? (
            <p className="mt-3 text-xs">
              Reading resources: {validation.readingResourcesSelected} · Digital
              resources: {validation.digitalResourcesSelected} · Inclusion
              resources: {validation.inclusionResourcesSelected}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function BudgetPanel({
  finalArchitecture,
  onConstructionChange,
  onLibraryItemsChange,
}: BudgetPanelProps) {
  const [quantities, setQuantities] = useState(createEmptyQuantityMap);
  const [constructionValidation, setConstructionValidation] =
    useState<ScopedPurchaseValidationResult | null>(null);
  const [libraryValidation, setLibraryValidation] =
    useState<ScopedPurchaseValidationResult | null>(null);

  function updateQuantity(itemId: string, value: string) {
    const parsed = Number(value);
    const nextQuantities = {
      ...quantities,
      [itemId]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
    };
    setQuantities(nextQuantities);
    setConstructionValidation(null);
    setLibraryValidation(null);
    onConstructionChange(null, buildSelectedStoreItems(nextQuantities));
    onLibraryItemsChange(null, buildSelectedStoreItems(nextQuantities));
  }

  function handleConstructionSubmit() {
    const selections = buildSelectedStoreItems(quantities);
    const result = validateConstructionPurchase(
      selections,
      finalArchitecture?.construction,
    );
    setConstructionValidation(result);
    onConstructionChange(
      result,
      filterSelectionsByBudgetScope(selections, "construction"),
    );
  }

  function handleLibraryItemsSubmit() {
    const selections = buildSelectedStoreItems(quantities);
    const result = validateLibraryItemsPurchase(selections);
    setLibraryValidation(result);
    onLibraryItemsChange(
      result,
      filterSelectionsByBudgetScope(selections, "library-items"),
    );
  }

  if (!finalArchitecture?.isValid) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
        {budgetUiConfig.blockedMessage}
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Mission budgets</h2>
        <p className="mt-2 text-sm text-slate-600">
          Construction budget ({libraryBudgetConfig.constructionBudget}{" "}
          {libraryBudgetConfig.currencyLabel}) and library-items budget (
          {libraryBudgetConfig.libraryItemsBudget}{" "}
          {libraryBudgetConfig.currencyLabel}) are separate. Choose quantities
          manually for the final architecture: {finalArchitecture.wallLength} m
          walls and {finalArchitecture.floorQuantity} m² floor.
        </p>
      </div>

      <StoreSection
        title={budgetUiConfig.constructionTitle}
        description={budgetUiConfig.constructionDescription}
        budgetLimit={libraryBudgetConfig.constructionBudget}
        budgetScope="construction"
        categories={constructionCategoryDisplay}
        quantities={quantities}
        onQuantityChange={updateQuantity}
        onSubmit={handleConstructionSubmit}
        submitLabel={budgetUiConfig.constructionSubmitLabel}
        validation={constructionValidation}
      />

      <StoreSection
        title={budgetUiConfig.libraryItemsTitle}
        description={budgetUiConfig.libraryItemsDescription}
        budgetLimit={libraryBudgetConfig.libraryItemsBudget}
        budgetScope="library-items"
        categories={libraryItemsCategoryDisplay}
        quantities={quantities}
        onQuantityChange={updateQuantity}
        onSubmit={handleLibraryItemsSubmit}
        submitLabel={budgetUiConfig.libraryItemsSubmitLabel}
        validation={libraryValidation}
      />
    </section>
  );
}
