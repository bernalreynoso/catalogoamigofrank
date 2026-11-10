import ExcelJS from 'exceljs';
import {
  CatalogData,
  CatalogProduct,
  DebugRowInfo,
  OmittedProduct,
} from '../types';
import {
  formatColorForDisplay,
  hasSolidFill,
  isPinkColor,
  isWarningPeachColor,
  isWhiteColor,
  parseArgb,
} from './colorUtils';
import {
  cleanWhitespace,
  formatCategoryTitle,
  formatListDate,
  normalizeForSearch,
  unifyBrandCasing,
  valueToText,
} from './textUtils';

export interface ParseResult {
  success: boolean;
  data?: CatalogData;
  error?: string;
  sheetNames?: string[];
}

/**
 * Raw cell value as displayable text (null if the cell is empty)
 */
function rawDisplay(v: any): string | null {
  if (v === null || v === undefined) return null;
  return valueToText(v);
}

/**
 * Extracts a numeric value from cell C
 */
function extractNumericPrice(cell: ExcelJS.Cell): number | null {
  if (!cell || cell.value === null || cell.value === undefined) {
    return null;
  }

  // If font color is white, treat as invisible / no price
  if (isWhiteColor(cell.font?.color)) {
    return null;
  }

  let val: any = cell.value;

  // Handle formula results, rich text, hyperlinks (objects in ExcelJS)
  if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
    if ('result' in val) {
      val = val.result;
    }
    if (typeof val === 'object' && val !== null) {
      val = valueToText(val);
    }
  }

  if (typeof val === 'number') {
    return isNaN(val) || val <= 0 ? null : val;
  }

  if (typeof val === 'string') {
    // Check if it's purely empty or just spaces
    const cleanStr = val.trim();
    if (!cleanStr) return null;

    // Remove currency signs, commas, spaces
    const numClean = cleanStr.replace(/[$MXN,\s]/gi, '');
    const num = parseFloat(numClean);
    return isNaN(num) || num <= 0 ? null : num;
  }

  return null;
}

/**
 * Parses an Excel file (.xlsx) using ExcelJS
 */
export async function parsePriceListExcel(
  fileOrBuffer: File | ArrayBuffer,
  fileName: string = 'lista_proveedor.xlsx'
): Promise<ParseResult> {
  try {
    const workbook = new ExcelJS.Workbook();

    let buffer: ArrayBuffer;
    if (fileOrBuffer instanceof File) {
      buffer = await fileOrBuffer.arrayBuffer();
    } else {
      buffer = fileOrBuffer;
    }

    await workbook.xlsx.load(buffer);

    const sheetNames = workbook.worksheets.map((ws) => ws.name);

    // 1. Find sheet "Productos" (case-insensitive)
    const productSheet = workbook.worksheets.find(
      (ws) => ws.name.trim().toLowerCase() === 'productos'
    );

    if (!productSheet) {
      return {
        success: false,
        error: `No se encontró la hoja "Productos". Las hojas encontradas en el archivo son: ${sheetNames.join(', ')}`,
        sheetNames,
      };
    }

    // 2. Find sheet "IMPORTANTE" (case-insensitive) to extract list date from D2
    let listDate = '';
    const importanteSheet = workbook.worksheets.find(
      (ws) => ws.name.trim().toLowerCase() === 'importante'
    );

    if (importanteSheet) {
      const cellD2 = importanteSheet.getCell('D2');
      listDate = formatListDate(cellD2.value);
    }

    if (!listDate) {
      // Fallback: Check if cell B1/B2 or D2 on current sheet has a date, or default to current date
      listDate = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    // 3. Process sheet rows
    let currentCategory = 'General';
    const rawBrandOccurrences: string[] = [];

    interface IntermediateProduct {
      rowNumber: number;
      rawBrand: string;
      name: string;
      price: number;
      note?: string;
      needsVerification: boolean;
      verificationReason?: string;
      debugColorC?: string;
      debugColorD?: string;
      category: string;
    }

    const intermediateProducts: IntermediateProduct[] = [];
    const omittedList: OmittedProduct[] = [];
    const debugRows: DebugRowInfo[] = [];

    const totalRows = productSheet.rowCount;

    for (let r = 1; r <= totalRows; r++) {
      const row = productSheet.getRow(r);
      if (!row) continue;

      const cellA = row.getCell(1);
      const cellB = row.getCell(2);
      const cellC = row.getCell(3);
      const cellD = row.getCell(4);
      const cellE = row.getCell(5);

      const valA = cleanWhitespace(valueToText(cellA.value));
      const valB = cleanWhitespace(valueToText(cellB.value));
      const numC = extractNumericPrice(cellC);
      const valE = cleanWhitespace(valueToText(cellE.value));

      // Check category condition:
      // "Una fila es encabezado de categoría si la celda de A o B tiene relleno sólido de color
      // (distinto de blanco/sin relleno) y la celda C no tiene precio numérico."
      const isFillA = hasSolidFill(cellA);
      const isFillB = hasSolidFill(cellB);
      const hasSolidColor = isFillA || isFillB;
      const hasNoPrice = numC === null;

      if (hasSolidColor && hasNoPrice && (valA || valB)) {
        const rawCatName = valB || valA;
        currentCategory = formatCategoryTitle(rawCatName);

        if (debugRows.length < 30) {
          debugRows.push({
            rowNumber: r,
            category: currentCategory,
            brand: valA,
            name: valB,
            cellCRaw: rawDisplay(cellC.value),
            cellAFill: formatColorForDisplay((cellA.fill as any)?.fgColor),
            cellBFill: formatColorForDisplay((cellB.fill as any)?.fgColor),
            classification: 'categoria',
          });
        }
        continue;
      }

      // Ignore rows with empty name in B
      if (!valB) {
        continue;
      }

      // Check font colors for cell C and cell D
      const fontC = cellC.font?.color;
      const fontD = cellD.font?.color;

      const isCPink = isPinkColor(fontC);
      const isDPink = isPinkColor(fontD);
      const isPink = isCPink || isDPink;

      const isCWarning = isWarningPeachColor(fontC);
      const isDWarning = isWarningPeachColor(fontD);
      const isWarning = isCWarning || isDWarning;

      const cArgb = parseArgb(fontC);
      const dArgb = parseArgb(fontD);

      // Collect debug information for the first 30 product rows
      if (debugRows.length < 30) {
        let cls: DebugRowInfo['classification'] = 'disponible';
        if (isPink) cls = 'omitido_rosa';
        else if (numC === null) cls = 'omitido_sin_precio';
        else if (isWarning) cls = 'verificar_disponibilidad';

        debugRows.push({
          rowNumber: r,
          category: currentCategory,
          brand: valA,
          name: valB,
          cellCRaw: rawDisplay(cellC.value),
          cellCArgb: cArgb.argb,
          cellCTheme: cArgb.theme,
          cellDArgb: dArgb.argb,
          cellDTheme: dArgb.theme,
          classification: cls,
        });
      }

      // AVAILABILITY EVALUATION
      // NO DISPONIBLE (omitir del catálogo) si:
      // a) Color de fuente de C o D es rosa (conocidos o tolerancia)
      if (isPink) {
        const detectedColor = cArgb.argb || dArgb.argb || 'Rosa detectado';
        omittedList.push({
          id: `omitted-${r}-${Date.now()}`,
          category: currentCategory,
          brand: valA,
          name: valB,
          rawPrice: rawDisplay(cellC.value),
          reason: 'pink_color',
          reasonText: 'Fuente en rosa (sin existencia de proveedor)',
          detectedColor,
          originalRowNumber: r,
        });
        continue;
      }

      // b) Celda C está vacía, texto blanco o no es número válido
      if (numC === null) {
        omittedList.push({
          id: `omitted-${r}-${Date.now()}`,
          category: currentCategory,
          brand: valA,
          name: valB,
          rawPrice: rawDisplay(cellC.value),
          reason: 'no_price',
          reasonText: 'Sin precio numérico / sin existencia',
          originalRowNumber: r,
        });
        continue;
      }

      // PRODUCT IS AVAILABLE
      if (valA) {
        rawBrandOccurrences.push(valA);
      }

      intermediateProducts.push({
        rowNumber: r,
        rawBrand: valA,
        name: valB,
        price: numC,
        note: valE || undefined,
        needsVerification: isWarning,
        verificationReason: isWarning ? 'Color de fuente especial en precio (posible disponibilidad limitada)' : undefined,
        debugColorC: cArgb.argb,
        debugColorD: dArgb.argb,
        category: currentCategory,
      });
    }

    // 4. Unify brand casing
    const brandMapping = unifyBrandCasing(rawBrandOccurrences);

    const categoriesSet = new Set<string>();
    const brandsSet = new Set<string>();

    const products: CatalogProduct[] = intermediateProducts.map((item, index) => {
      const unifiedBrand = item.rawBrand
        ? brandMapping[item.rawBrand.toLowerCase()] || item.rawBrand
        : '';

      categoriesSet.add(item.category);
      if (unifiedBrand) {
        brandsSet.add(unifiedBrand);
      }

      const normalizedKey = `${normalizeForSearch(item.category)}::${normalizeForSearch(item.name)}`;

      return {
        id: `prod-${item.rowNumber}-${index}`,
        category: item.category,
        brand: unifiedBrand,
        name: item.name,
        normalizedKey,
        cashPrice: item.price,
        note: item.note,
        needsVerification: item.needsVerification,
        verificationReason: item.verificationReason,
        originalRowNumber: item.rowNumber,
        debugColorC: item.debugColorC,
        debugColorD: item.debugColorD,
      };
    });

    // Update brands in omitted list as well
    for (const om of omittedList) {
      if (om.brand) {
        om.brand = brandMapping[om.brand.toLowerCase()] || om.brand;
      }
    }

    // Output debug table in console as explicitly requested
    if (typeof console !== 'undefined' && console.table) {
      console.log('--- DEBUG: Primeras filas de productos analizadas en Excel ---');
      console.table(
        debugRows.map((d) => ({
          Fila: d.rowNumber,
          Categoría: d.category,
          Producto: d.name.slice(0, 30),
          'Valor C': d.cellCRaw,
          'Color C (ARGB)': d.cellCArgb || '-',
          'Theme C': d.cellCTheme ?? '-',
          'Color D (ARGB)': d.cellDArgb || '-',
          Clasificación: d.classification,
        }))
      );
    }

    const data: CatalogData = {
      fileName,
      listDate,
      parsedAt: new Date().toISOString(),
      products,
      omitted: omittedList,
      categories: Array.from(categoriesSet),
      brands: Array.from(brandsSet).sort((a, b) => a.localeCompare(b, 'es')),
      debugRows,
    };

    return {
      success: true,
      data,
      sheetNames,
    };
  } catch (err: any) {
    console.error('Error procesando archivo Excel:', err);
    return {
      success: false,
      error: `Error al leer el archivo Excel: ${err?.message || 'Formato no válido o archivo corrupto'}`,
    };
  }
}
