import type { BudgetScope, SelectedStoreItem } from "../types/missionTypes";

import { getStoreItemById } from "../data/storeCatalog";



/** Line cost for a single catalog item selection. */

export function calculateLineCost(

  unitPrice: number,

  quantity: number,

): number {

  if (!Number.isFinite(unitPrice) || !Number.isFinite(quantity)) {

    return 0;

  }



  return Math.max(0, unitPrice * quantity);

}



/** Total cost across all selected store items. */

export function calculateTotalCost(items: SelectedStoreItem[]): number {

  return items.reduce((total, selection) => {

    const catalogItem = getStoreItemById(selection.itemId);

    if (!catalogItem || selection.quantity <= 0) {

      return total;

    }



    return total + calculateLineCost(catalogItem.unitPrice, selection.quantity);

  }, 0);

}



/** Total cost for one budget scope only. */

export function calculateBudgetScopeCost(

  items: SelectedStoreItem[],

  budgetScope: BudgetScope,

): number {

  return items.reduce((total, selection) => {

    const catalogItem = getStoreItemById(selection.itemId);

    if (

      !catalogItem ||

      catalogItem.budgetScope !== budgetScope ||

      selection.quantity <= 0

    ) {

      return total;

    }



    return total + calculateLineCost(catalogItem.unitPrice, selection.quantity);

  }, 0);

}



/** Whether total spending is within the configured budget. */

export function isWithinBudget(total: number, budget: number): boolean {

  return Number.isFinite(total) && Number.isFinite(budget) && total <= budget;

}



/** Remaining budget after selections (may be negative if over budget). */

export function getRemainingBudget(total: number, budget: number): number {

  return budget - total;

}


