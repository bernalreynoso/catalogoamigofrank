import ExcelJS from 'exceljs';
import { AppSettings, CatalogData } from '../types';
import { valueToText } from './textUtils';
import {
  calculateLogisticsCost,
  calculateProductPricing,
  getCardPlan,
  getSupplierCardMultiplier,
  MERCADO_PAGO_RATES,
} from './pricingUtils';

export async function exportCatalogToExcel(
  data: CatalogData,
  settings: AppSettings
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Catálogo Express';
  workbook.lastModifiedBy = 'Catálogo Express';
  workbook.created = new Date();
  workbook.modified = new Date();

  const darkBlueFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1B365D' }, // Dark Navy Blue
  };

  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Arial',
    size: 10,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  const bodyFont: Partial<ExcelJS.Font> = {
    name: 'Arial',
    size: 10,
  };

  const currencyFormat = '"$"#,##0.00';
  const percentFormat = '0.0%';

  // Líneas (bordes): fina en todas las celdas y gruesa al cambiar de categoría
  const lineThin: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFBFBFBF' } };
  const lineThick: Partial<ExcelJS.Border> = { style: 'medium', color: { argb: 'FF1B365D' } };
  const applyBorders = (row: ExcelJS.Row, columnCount: number, newCategory: boolean) => {
    for (let c = 1; c <= columnCount; c++) {
      row.getCell(c).border = {
        top: newCategory ? lineThick : lineThin,
        bottom: lineThin,
        left: lineThin,
        right: lineThin,
      };
    }
  };

  const activePlan = getCardPlan(settings.selectedCardPlan);
  const logisticsCost = calculateLogisticsCost(settings.logistics);
  const supplierMult = getSupplierCardMultiplier(settings);
  const supplierMultStr = supplierMult.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');

  // ==========================================
  // SHEET 1: "Catálogo"
  // ==========================================
  const catalogSheet = workbook.addWorksheet('Catálogo', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  catalogSheet.columns = [
    { header: 'Categoría', key: 'category', width: 20 },
    { header: 'Marca / Plataforma', key: 'brand', width: 16 },
    { header: 'Producto', key: 'name', width: 42 },
    { header: 'Precio Proveedor Efvo', key: 'precioProvEfvo', width: 18 },
    { header: 'Costo Proveedor (Tarjeta)', key: 'costoProveedor', width: 20 },
    { header: 'Logística', key: 'logistica', width: 14 },
    { header: 'Costo Total', key: 'costoTotal', width: 18 },
    { header: 'Margen %', key: 'margen', width: 12 },
    { header: 'Precio Venta Efvo', key: 'precioEfvo', width: 20 },
    { header: `Precio Tarjeta (${activePlan.shortLabel})`, key: 'precioTarjeta', width: 22 },
    { header: 'Ganancia Neta Efvo', key: 'ganancia', width: 18 },
    { header: 'Nota', key: 'note', width: 26 },
  ];

  // Style Header Row
  const headerRow1 = catalogSheet.getRow(1);
  headerRow1.height = 28;
  headerRow1.eachCell((cell) => {
    cell.fill = darkBlueFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: lineThin, bottom: lineThin, left: lineThin, right: lineThin };
  });

  let prevCategory: string | null = null;
  data.products.forEach((prod, index) => {
    const rowIdx = index + 2;
    const pricing = calculateProductPricing(prod.cashPrice, settings);

    const row = catalogSheet.addRow({
      category: prod.category,
      brand: prod.brand || '-',
      name: prod.name,
      // D: precio efectivo de la lista del proveedor
      precioProvEfvo: prod.cashPrice,
      // E: costo proveedor = precio con tarjeta del proveedor = D x (1 + recargo)
      costoProveedor: { formula: `D${rowIdx}*${supplierMultStr}`, result: pricing.costoProveedor },
      logistica: logisticsCost,
      // G: Costo Total = E + F
      costoTotal: { formula: `E${rowIdx}+F${rowIdx}`, result: pricing.costoTotalIncurrido },
      margen: pricing.margenPercent / 100,
      // I: =ROUND(G/(1-H), 0)
      precioEfvo: { formula: `ROUND(G${rowIdx}/(1-H${rowIdx}), 0)`, result: pricing.precioVentaEfectivo },
      // J: =ROUND(G/(1-H-comisionMP), 0)
      precioTarjeta: {
        formula: `ROUND(G${rowIdx}/(1-H${rowIdx}-${(activePlan.ratePercent / 100).toFixed(4)}), 0)`,
        result: pricing.precioVentaTarjeta,
      },
      // K: Ganancia neta = I - G
      ganancia: { formula: `I${rowIdx}-G${rowIdx}`, result: pricing.gananciaNetaEfectivo },
      note: prod.note || (prod.needsVerification ? '⚠ Verificar disponibilidad' : ''),
    });

    row.font = bodyFont;

    // Formato de moneda y porcentaje
    [4, 5, 6, 7, 9, 10, 11].forEach((c) => {
      row.getCell(c).numFmt = currencyFormat;
      row.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' };
    });
    row.getCell(8).numFmt = percentFormat;
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

    // Negritas en los precios de venta
    row.getCell(9).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF065F46' } };
    row.getCell(10).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };

    if (prod.needsVerification) {
      row.getCell(12).font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFB45309' } };
    }

    // Categoría en negritas, texto largo con salto de línea y bordes
    row.getCell(1).font = { name: 'Arial', size: 10, bold: true };
    row.getCell(3).alignment = { vertical: 'middle', wrapText: true };
    row.getCell(12).alignment = { vertical: 'middle', wrapText: true };
    row.getCell(1).alignment = { vertical: 'middle' };
    row.getCell(2).alignment = { vertical: 'middle' };

    applyBorders(row, 12, prod.category !== prevCategory);
    prevCategory = prod.category;
  });

  // Enable AutoFilter for Sheet 1
  if (data.products.length > 0) {
    catalogSheet.autoFilter = {
      from: 'A1',
      to: `L${data.products.length + 1}`,
    };
  }

  // ==========================================
  // SHEET 2: "Notas"
  // ==========================================
  const notesSheet = workbook.addWorksheet('Notas');

  notesSheet.columns = [
    { header: 'Parámetro / Métrica', key: 'param', width: 38 },
    { header: 'Configuración / Fórmula', key: 'value', width: 48 },
  ];

  const headerRow2 = notesSheet.getRow(1);
  headerRow2.height = 26;
  headerRow2.eachCell((cell) => {
    cell.fill = darkBlueFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = { top: lineThin, bottom: lineThin, left: lineThin, right: lineThin };
  });

  const verifiedCount = data.products.filter((p) => p.needsVerification).length;

  const notesData = [
    { param: 'Fecha de la lista (Proveedor)', value: data.listDate || 'No especificada' },
    {
      param: 'Costo base del producto',
      value: `Precio con tarjeta del proveedor = precio efectivo × ${supplierMultStr} (recargo ${settings.supplierCardSurchargePercent}%)`,
    },
    {
      param: 'Gastos de Traslado / Logística',
      value: `${settings.logistics.mode === 'car' ? 'Auto ($150 gas + $80 est)' : settings.logistics.mode === 'metro' ? 'Metro ($24)' : settings.logistics.mode === 'none' ? 'Sin traslado ($0)' : 'Personalizado'}: $${logisticsCost} MXN`,
    },
    {
      param: 'Regla de Margen de Ganancia',
      value:
        settings.marginMode === 'tier'
          ? 'Escalonado Automático: <$2500 (7%), $2500-$4000 (8%), $4001-$5000 (9%), >$5000 (10%)'
          : `Margen Manual Fijo: ${settings.manualMarginPercent}%`,
    },
    {
      param: 'Terminal Mercado Pago seleccionada',
      value: `${activePlan.label} (Tasa: ${activePlan.ratePercent}% con IVA)`,
    },
    {
      param: 'Fórmula Precio Venta Efectivo',
      value: 'Costo Total Incurrido / (1 - Margen), con Costo Total = Costo Proveedor (Tarjeta) + Logística',
    },
    {
      param: 'Fórmula Precio Venta Tarjeta',
      value: 'Costo Total Incurrido / (1 - Margen - Comisión_MP)',
    },
    { param: 'Total de productos disponibles', value: String(data.products.length) },
    { param: 'Productos con aviso "verificar disponibilidad"', value: String(verifiedCount) },
    { param: 'Total de productos omitidos (sin existencia/precio)', value: String(data.omitted.length) },
    { param: 'Nombre de archivo origen', value: data.fileName },
    { param: 'Fecha y hora de exportación', value: new Date().toLocaleString('es-MX') },
  ];

  notesData.forEach((item) => {
    const row = notesSheet.addRow(item);
    row.font = bodyFont;
    row.getCell(1).font = { name: 'Arial', size: 10, bold: true };
    row.getCell(2).alignment = { horizontal: 'left', wrapText: true };
    applyBorders(row, 2, false);
  });

  // Add Mercado Pago Full Rate Reference in Sheet 2
  notesSheet.addRow({ param: '', value: '' });
  const tableHeaderRow = notesSheet.addRow({
    param: 'Plan de Terminal Mercado Pago Point',
    value: 'Tasa con IVA Incluido (%)',
  });
  tableHeaderRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  tableHeaderRow.eachCell((cell) => {
    cell.fill = darkBlueFill;
    cell.border = { top: lineThin, bottom: lineThin, left: lineThin, right: lineThin };
  });

  MERCADO_PAGO_RATES.forEach((rate) => {
    const r = notesSheet.addRow({
      param: rate.label,
      value: `${rate.ratePercent}%`,
    });
    r.font = bodyFont;
    r.getCell(2).alignment = { horizontal: 'center' };
    applyBorders(r, 2, false);
  });

  // ==========================================
  // SHEET 3: "Omitidos"
  // ==========================================
  const omittedSheet = workbook.addWorksheet('Omitidos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  omittedSheet.columns = [
    { header: 'Categoría', key: 'category', width: 22 },
    { header: 'Marca', key: 'brand', width: 18 },
    { header: 'Producto', key: 'name', width: 44 },
    { header: 'Precio Crudo en Excel', key: 'rawPrice', width: 22 },
    { header: 'Motivo de Exclusión', key: 'reason', width: 38 },
    { header: 'Color / Detalle', key: 'color', width: 26 },
    { header: 'Fila Original', key: 'row', width: 14 },
  ];

  const headerRow3 = omittedSheet.getRow(1);
  headerRow3.height = 26;
  headerRow3.eachCell((cell) => {
    cell.fill = darkBlueFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: lineThin, bottom: lineThin, left: lineThin, right: lineThin };
  });

  let prevOmittedCategory: string | null = null;
  data.omitted.forEach((om) => {
    const row = omittedSheet.addRow({
      category: om.category,
      brand: om.brand || '-',
      name: om.name,
      rawPrice: valueToText(om.rawPrice) || '(vacío)',
      reason: om.reasonText,
      color: om.detectedColor || (om.reason === 'pink_color' ? 'Rosa detectado' : 'Sin precio'),
      row: om.originalRowNumber,
    });
    row.font = bodyFont;
    row.getCell(3).alignment = { vertical: 'middle', wrapText: true };
    applyBorders(row, 7, om.category !== prevOmittedCategory);
    prevOmittedCategory = om.category;
  });

  if (data.omitted.length > 0) {
    omittedSheet.autoFilter = {
      from: 'A1',
      to: `G${data.omitted.length + 1}`,
    };
  }

  // ==========================================
  // Download file in browser
  // ==========================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const sanitizedDate = (data.listDate || 'Catalogo')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 25);
  const downloadName = `Catalogo_Precios_${sanitizedDate}.xlsx`;

  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = downloadName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}
