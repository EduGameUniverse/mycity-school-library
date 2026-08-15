import { getStoreItemById, storeCatalog } from "../data/storeCatalog";
import type { SelectedStoreItem, StoreItem } from "../types/missionTypes";
import { calculateLineCost } from "./budget";

/** Build selected store items from a quantity map (zero quantities omitted). */
export function buildSelectedStoreItems(
  quantities: Record<string, number>,
): SelectedStoreItem[] {
  return storeCatalog
    .map((item) => ({
      itemId: item.id,
      quantity: Math.max(0, quantities[item.id] ?? 0),
    }))
    .filter((selection) => selection.quantity > 0);
}

/** Line items with subtotals for the purchase summary UI. */
export function getPurchaseLineItems(selections: SelectedStoreItem[]) {
  return selections
    .map((selection) => {
      const item = getStoreItemById(selection.itemId);
      if (!item) {
        return null;
      }

      return {
        itemId: item.id,
        label: item.label,
        category: item.category,
        quantity: selection.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        lineCost: calculateLineCost(item.unitPrice, selection.quantity),
      };
    })
    .filter((line): line is NonNullable<typeof line> => line !== null);
}

/** Initialize an empty quantity map for every catalog item. */
export function createEmptyQuantityMap(): Record<string, number> {
  return storeCatalog.reduce<Record<string, number>>((map, item) => {
    map[item.id] = 0;
    return map;
  }, {});
}

/** Keep only selections that belong to one budget scope. */
export function filterSelectionsByBudgetScope(
  selections: SelectedStoreItem[],
  budgetScope: StoreItem["budgetScope"],
): SelectedStoreItem[] {
  return selections.filter((selection) => {
    const item = getStoreItemById(selection.itemId);
    return item?.budgetScope === budgetScope;
  });
}
