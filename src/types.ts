export interface RawProductRow {
  rowNumber: number;
  brand: string;
  name: string;
  cashPrice: number | null;
  cardPriceFormula?: string;
  note: string;
  category: string;
  // Raw style information for debugging
  cellCColorARGB?: string;
  cellCColorTheme?: number;
  cellDColorARGB?: string;
  cellDColorTheme?: number;
  cellFillARGB?: string;
}

export interface CatalogProduct {
  id: string;
  category: string;
  brand: string;
  name: string;
  normalizedKey: string;
  cashPrice: number;
  note?: string;
  needsVerification: boolean; // peach / warning color
  verificationReason?: string;
  originalRowNumber: number;
  debugColorC?: string;
  debugColorD?: string;
}

export interface OmittedProduct {
  id: string;
  category: string;
  brand: string;
  name: string;
  rawPrice: any;
  reason: 'pink_color' | 'no_price' | 'invalid_price';
  reasonText: string;
  detectedColor?: string;
  originalRowNumber: number;
}

export interface DebugRowInfo {
  rowNumber: number;
  category: string;
  brand: string;
  name: string;
  cellCRaw: any;
  cellCArgb?: string;
  cellCTheme?: number;
  cellDArgb?: string;
  cellDTheme?: number;
  cellAFill?: string;
  cellBFill?: string;
  classification: 'disponible' | 'omitido_rosa' | 'omitido_sin_precio' | 'verificar_disponibilidad' | 'categoria';
}

export interface PriceChange {
  id: string;
  category: string;
  brand: string;
  name: string;
  status: 'new' | 'removed' | 'price_up' | 'price_down' | 'unchanged';
  previousPrice?: number;
  newPrice?: number;
  priceDiff?: number;
  percentDiff?: number;
}

export interface CatalogData {
  fileName: string;
  listDate: string; // From IMPORTANTE!D2 or date of load
  parsedAt: string; // ISO date
  products: CatalogProduct[];
  omitted: OmittedProduct[];
  categories: string[];
  brands: string[];
  debugRows: DebugRowInfo[];
}

export type LogisticsMode = 'car' | 'metro' | 'none' | 'custom';

export interface LogisticsConfig {
  mode: LogisticsMode;
  carGasoline: number; // default $150
  carParking: number;  // default $80
  metroCost: number;   // default $24
  customAmount: number; // manual custom amount
}

export type MarginMode = 'tier' | 'manual';

export type CardInstallmentPlan =
  | '1_pago'
  | '3_msi'
  | '6_msi'
  | '9_msi'
  | '12_msi'
  | '18_msi'
  | '24_msi';

export interface CardFeeRate {
  id: CardInstallmentPlan;
  label: string;
  shortLabel: string;
  installments: number;
  ratePercent: number; // Rate with IVA included
}

export interface CalculatedPricing {
  precioProveedorEfectivo: number; // precio efectivo de la lista del proveedor
  costoProveedor: number; // precio con tarjeta del proveedor (base de costo)
  gastosLogistica: number;
  costoTotalIncurrido: number;
  margenPercent: number;
  isAutoTier: boolean;
  
  // Efectivo
  precioVentaEfectivo: number;
  gananciaNetaEfectivo: number;
  
  // Tarjeta (Mercado Pago)
  selectedPlan: CardFeeRate;
  precioVentaTarjeta: number;
  retencionMP: number;
  netoDepositado: number;
  gananciaNetaTarjeta: number;
  cuotaMensual?: number;
}

export interface AppSettings {
  supplierCardSurchargePercent: number; // recargo del proveedor por pago con tarjeta (default 2%)
  logistics: LogisticsConfig;
  marginMode: MarginMode;
  manualMarginPercent: number; // default 8% if manual
  selectedCardPlan: CardInstallmentPlan;
  priceDisplayMode: 'cash' | 'card' | 'both';
  whatsAppFormat: 'compact' | 'detailed';
  showCostBreakdown: boolean;
}

export type ComponentSlot =
  | 'cpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'gpu'
  | 'powerSupply'
  | 'case'
  | 'cooler';

export interface BuildComponentItem {
  slot: ComponentSlot;
  slotLabel: string;
  product: CatalogProduct;
  isOptional?: boolean;
}

export interface AssemblyBuild {
  id: string;
  categoryTag:
    | 'economico'
    | 'estudiante'
    | 'universitario'
    | 'arquitecto'
    | 'gamer_basico'
    | 'gamer_medio'
    | 'gamer_alto'
    | 'creador_pro';
  title: string;
  badge: string;
  description: string;
  targetProfile: string;
  features: string[];
  components: BuildComponentItem[];
  compatibility: {
    socket: string;
    ramType: string;
    hasDedicatedGPU: boolean;
    estimatedWattage: number;
    notes: string[];
  };
}

