import { CatalogData, CatalogProduct, PriceChange } from '../types';

const STORAGE_KEY = 'catalogo_excel_last_saved_list';

export interface StoredListSnapshot {
  fileName: string;
  listDate: string;
  savedAt: string;
  products: {
    category: string;
    brand: string;
    name: string;
    normalizedKey: string;
    cashPrice: number;
  }[];
}

export function saveListToLocalStorage(catalog: CatalogData): void {
  try {
    const snapshot: StoredListSnapshot = {
      fileName: catalog.fileName,
      listDate: catalog.listDate,
      savedAt: new Date().toISOString(),
      products: catalog.products.map((p) => ({
        category: p.category,
        brand: p.brand,
        name: p.name,
        normalizedKey: p.normalizedKey,
        cashPrice: p.cashPrice,
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.warn('No se pudo guardar la lista en localStorage (posible límite de cuota):', err);
  }
}

export function getPreviousListFromLocalStorage(): StoredListSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer lista previa de localStorage:', err);
    return null;
  }
}

export function clearPreviousListFromLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export interface ComparisonReport {
  previousListMeta?: {
    fileName: string;
    listDate: string;
    savedAt: string;
  };
  totalNew: number;
  totalRemoved: number;
  totalPriceUp: number;
  totalPriceDown: number;
  totalUnchanged: number;
  changes: PriceChange[];
}

/**
 * Compares current catalog products against previous catalog snapshot
 * by category + normalized name
 */
export function compareCatalogs(
  currentProducts: CatalogProduct[],
  previousSnapshot: StoredListSnapshot | null
): ComparisonReport {
  if (!previousSnapshot || !previousSnapshot.products || previousSnapshot.products.length === 0) {
    return {
      totalNew: currentProducts.length,
      totalRemoved: 0,
      totalPriceUp: 0,
      totalPriceDown: 0,
      totalUnchanged: 0,
      changes: currentProducts.map((p) => ({
        id: `new-${p.id}`,
        category: p.category,
        brand: p.brand,
        name: p.name,
        status: 'new',
        newPrice: p.cashPrice,
      })),
    };
  }

  const prevMap = new Map<string, { category: string; brand: string; name: string; cashPrice: number }>();
  for (const prev of previousSnapshot.products) {
    prevMap.set(prev.normalizedKey, prev);
  }

  const currentMap = new Map<string, CatalogProduct>();
  for (const cur of currentProducts) {
    currentMap.set(cur.normalizedKey, cur);
  }

  const changes: PriceChange[] = [];
  let totalNew = 0;
  let totalRemoved = 0;
  let totalPriceUp = 0;
  let totalPriceDown = 0;
  let totalUnchanged = 0;

  // 1. Check current products vs previous
  for (const cur of currentProducts) {
    const prev = prevMap.get(cur.normalizedKey);

    if (!prev) {
      // Brand new item
      totalNew++;
      changes.push({
        id: `change-new-${cur.id}`,
        category: cur.category,
        brand: cur.brand,
        name: cur.name,
        status: 'new',
        newPrice: cur.cashPrice,
      });
    } else {
      // Present in both, check price difference
      const diff = cur.cashPrice - prev.cashPrice;
      const percent = prev.cashPrice > 0 ? (diff / prev.cashPrice) * 100 : 0;

      // Use a cent threshold to avoid JS floating point noise
      if (Math.abs(diff) < 0.05) {
        totalUnchanged++;
        changes.push({
          id: `change-same-${cur.id}`,
          category: cur.category,
          brand: cur.brand,
          name: cur.name,
          status: 'unchanged',
          previousPrice: prev.cashPrice,
          newPrice: cur.cashPrice,
          priceDiff: 0,
          percentDiff: 0,
        });
      } else if (diff > 0) {
        totalPriceUp++;
        changes.push({
          id: `change-up-${cur.id}`,
          category: cur.category,
          brand: cur.brand,
          name: cur.name,
          status: 'price_up',
          previousPrice: prev.cashPrice,
          newPrice: cur.cashPrice,
          priceDiff: diff,
          percentDiff: percent,
        });
      } else {
        totalPriceDown++;
        changes.push({
          id: `change-down-${cur.id}`,
          category: cur.category,
          brand: cur.brand,
          name: cur.name,
          status: 'price_down',
          previousPrice: prev.cashPrice,
          newPrice: cur.cashPrice,
          priceDiff: diff,
          percentDiff: percent,
        });
      }
    }
  }

  // 2. Check for removed/discontinued products (in previous but not in current)
  for (const [key, prev] of prevMap.entries()) {
    if (!currentMap.has(key)) {
      totalRemoved++;
      changes.push({
        id: `change-removed-${key}`,
        category: prev.category,
        brand: prev.brand,
        name: prev.name,
        status: 'removed',
        previousPrice: prev.cashPrice,
      });
    }
  }

  return {
    previousListMeta: {
      fileName: previousSnapshot.fileName,
      listDate: previousSnapshot.listDate,
      savedAt: previousSnapshot.savedAt,
    },
    totalNew,
    totalRemoved,
    totalPriceUp,
    totalPriceDown,
    totalUnchanged,
    changes,
  };
}
