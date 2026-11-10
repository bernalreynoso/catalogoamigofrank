import {
  AppSettings,
  CardFeeRate,
  CardInstallmentPlan,
  CalculatedPricing,
  LogisticsConfig,
} from '../types';

/**
 * Tabla Oficial de Tasas Mercado Pago Terminal Point (con IVA incluido)
 */
export const MERCADO_PAGO_RATES: CardFeeRate[] = [
  {
    id: '1_pago',
    label: '1 Exhibición / Débito o Crédito (4.06%)',
    shortLabel: '1 Pago',
    installments: 1,
    ratePercent: 4.06,
  },
  {
    id: '3_msi',
    label: '3 Meses Sin Intereses (5.44%)',
    shortLabel: '3 MSI',
    installments: 3,
    ratePercent: 5.44,
  },
  {
    id: '6_msi',
    label: '6 Meses Sin Intereses (8.92%)',
    shortLabel: '6 MSI',
    installments: 6,
    ratePercent: 8.92,
  },
  {
    id: '9_msi',
    label: '9 Meses Sin Intereses (12.98%)',
    shortLabel: '9 MSI',
    installments: 9,
    ratePercent: 12.98,
  },
  {
    id: '12_msi',
    label: '12 Meses Sin Intereses (14.95%)',
    shortLabel: '12 MSI',
    installments: 12,
    ratePercent: 14.95,
  },
  {
    id: '18_msi',
    label: '18 Meses Sin Intereses (22.49%)',
    shortLabel: '18 MSI',
    installments: 18,
    ratePercent: 22.49,
  },
  {
    id: '24_msi',
    label: '24 Meses Sin Intereses (31.66%)',
    shortLabel: '24 MSI',
    installments: 24,
    ratePercent: 31.66,
  },
];

export function getCardPlan(planId: CardInstallmentPlan): CardFeeRate {
  const found = MERCADO_PAGO_RATES.find((p) => p.id === planId);
  return (
    found || {
      id: '1_pago',
      label: '1 Pago (4.06%)',
      shortLabel: '1 Pago',
      installments: 1,
      ratePercent: 4.06,
    }
  );
}

/**
 * Recargo que el proveedor cobra por pagar con tarjeta (por defecto 2%).
 * El archivo del proveedor calcula su "precio tarjeta" como precio efectivo x 1.02.
 */
export const DEFAULT_SUPPLIER_CARD_SURCHARGE_PERCENT = 2;

export function getSupplierCardMultiplier(settings: AppSettings): number {
  const pct = Number(settings.supplierCardSurchargePercent);
  const safePct = Number.isFinite(pct)
    ? Math.max(0, pct)
    : DEFAULT_SUPPLIER_CARD_SURCHARGE_PERCENT;
  return 1 + safePct / 100;
}

/**
 * Precio que muestra el proveedor para pago con tarjeta (precio efectivo x (1 + recargo)).
 * Es la base de costo para calcular el precio de venta.
 */
export function getSupplierCardPrice(supplierCashPrice: number, settings: AppSettings): number {
  return supplierCashPrice * getSupplierCardMultiplier(settings);
}

/**
 * 1. Calcula los Gastos de Logística / Traslado
 */
export function calculateLogisticsCost(logistics: LogisticsConfig): number {
  switch (logistics.mode) {
    case 'car':
      return (Number(logistics.carGasoline) || 0) + (Number(logistics.carParking) || 0);
    case 'metro':
      return Number(logistics.metroCost) || 24;
    case 'none':
      return 0;
    case 'custom':
      return Number(logistics.customAmount) || 0;
    default:
      return 0;
  }
}

/**
 * 2. Regla de Margen de Ganancia Escalonado
 * - Menor a $2,500 MXN: 7%
 * - De $2,500 a $4,000 MXN: 8%
 * - De $4,001 a $5,000 MXN: 9%
 * - Más de $5,000 MXN: 10%
 */
export function getTieredMarginPercent(costoProveedor: number): number {
  if (costoProveedor < 2500) {
    return 7;
  } else if (costoProveedor <= 4000) {
    return 8;
  } else if (costoProveedor <= 5000) {
    return 9;
  } else {
    return 10;
  }
}

/**
 * 3. Fórmulas de Cálculo del Precio de Venta (Margen Financiero Real)
 * Protege la utilidad neta aplicando la fórmula financiera sobre el precio final.
 */
export function calculateProductPricing(
  supplierCashPrice: number,
  settings: AppSettings,
  planOverride?: CardInstallmentPlan
): CalculatedPricing {
  // El costo del producto es el precio con tarjeta del proveedor (efectivo + recargo),
  // así no pierdes utilidad si el cliente pide algo y tienes que pagarlo con tu tarjeta.
  const costoProveedor = getSupplierCardPrice(supplierCashPrice, settings);
  const gastosLogistica = calculateLogisticsCost(settings.logistics);
  const costoTotalIncurrido = costoProveedor + gastosLogistica;

  const isAutoTier = settings.marginMode === 'tier';
  const margenPercent = isAutoTier
    ? getTieredMarginPercent(costoProveedor)
    : Number(settings.manualMarginPercent) || 8;

  const margenDecimal = margenPercent / 100;

  // A) Pago en Efectivo o Transferencia:
  // Divisor = 1 - Margen
  // Precio Venta Efectivo = Costo Total Incurrido / (1 - Margen)
  const divisorEfectivo = Math.max(0.01, 1 - margenDecimal);
  const rawPrecioEfectivo = costoTotalIncurrido / divisorEfectivo;
  const precioVentaEfectivo = Math.round(rawPrecioEfectivo);
  const gananciaNetaEfectivo = precioVentaEfectivo - costoTotalIncurrido;

  // B) Pago con Tarjeta en Terminal Mercado Pago:
  // Divisor = 1 - Margen - Comision_MP
  // Precio Venta Tarjeta = Costo Total Incurrido / (1 - Margen - Comision_MP)
  const activePlanId = planOverride || settings.selectedCardPlan || '1_pago';
  const selectedPlan = getCardPlan(activePlanId);
  const comisionMPDecimal = selectedPlan.ratePercent / 100;

  const divisorTarjeta = Math.max(0.01, 1 - margenDecimal - comisionMPDecimal);
  const rawPrecioTarjeta = costoTotalIncurrido / divisorTarjeta;
  const precioVentaTarjeta = Math.round(rawPrecioTarjeta);

  // Retención Mercado Pago exacta
  const retencionMP = Math.round(precioVentaTarjeta * comisionMPDecimal);
  const netoDepositado = precioVentaTarjeta - retencionMP;
  const gananciaNetaTarjeta = netoDepositado - costoTotalIncurrido;

  const cuotaMensual =
    selectedPlan.installments > 1
      ? Math.round((precioVentaTarjeta / selectedPlan.installments) * 100) / 100
      : undefined;

  return {
    precioProveedorEfectivo: supplierCashPrice,
    costoProveedor,
    gastosLogistica,
    costoTotalIncurrido,
    margenPercent,
    isAutoTier,
    precioVentaEfectivo,
    gananciaNetaEfectivo,
    selectedPlan,
    precioVentaTarjeta,
    retencionMP,
    netoDepositado,
    gananciaNetaTarjeta,
    cuotaMensual,
  };
}
