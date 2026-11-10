import React, { useState } from 'react';
import {
  Copy,
  Check,
  AlertTriangle,
  MessageSquare,
  CreditCard,
  Banknote,
  Car,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { AppSettings, CatalogProduct, CardInstallmentPlan } from '../types';
import { formatCurrency } from '../utils/textUtils';
import {
  calculateProductPricing,
  MERCADO_PAGO_RATES,
} from '../utils/pricingUtils';

interface ProductCardProps {
  product: CatalogProduct;
  settings: AppSettings;
  onCopied: (text: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  settings,
  onCopied,
}) => {
  const [copied, setCopied] = useState(false);
  const [activePlan, setActivePlan] = useState<CardInstallmentPlan>(
    settings.selectedCardPlan || '1_pago'
  );

  const pricing = calculateProductPricing(product.cashPrice, settings, activePlan);

  const getWhatsAppMessage = (): string => {
    const cashStr = formatCurrency(pricing.precioVentaEfectivo);
    const cardStr = formatCurrency(pricing.precioVentaTarjeta);

    let planDesc = pricing.selectedPlan.shortLabel;
    if (pricing.cuotaMensual && pricing.selectedPlan.installments > 1) {
      planDesc += ` (${pricing.selectedPlan.installments} pagos de ${formatCurrency(pricing.cuotaMensual)})`;
    }

    if (settings.whatsAppFormat === 'detailed') {
      let msg = `*${product.name}*\n💵 Efectivo / Transferencia: ${cashStr}\n💳 Tarjeta (${planDesc}): ${cardStr}`;
      if (pricing.cuotaMensual && pricing.selectedPlan.installments > 1) {
        msg += `\n   ➔ Mensualidad: ${pricing.selectedPlan.installments} cuotas de ${formatCurrency(pricing.cuotaMensual)}`;
      }
      if (product.note) {
        msg += `\n📌 Nota: ${product.note}`;
      }
      if (product.needsVerification) {
        msg += `\n⚠️ Sujeto a verificación de disponibilidad`;
      }
      return msg;
    }

    // Default compact line
    let line = `${product.name} — ${cashStr} efvo / ${cardStr} tarjeta`;
    if (pricing.selectedPlan.installments > 1 && pricing.cuotaMensual) {
      line += ` (${pricing.selectedPlan.shortLabel} de ${formatCurrency(pricing.cuotaMensual)}/mes)`;
    } else {
      line += ` (1 pago)`;
    }

    if (product.note) {
      line += ` (${product.note})`;
    }
    return line;
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = getWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopied(text);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = getWhatsAppMessage();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div
      className={`relative bg-white rounded-xl border transition-all p-4 flex flex-col justify-between hover:shadow-md ${
        product.needsVerification
          ? 'border-amber-300 bg-amber-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div>
        {/* Unboxed Metadata (Category · Brand) - Zero-Pill Rule */}
        <div className="flex items-center justify-between gap-1 text-xs text-slate-500 mb-1.5 font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-slate-700">{product.category}</span>
            {product.brand && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-slate-900 font-semibold">{product.brand}</span>
              </>
            )}
          </div>

          <span
            className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0"
            title="Margen sobre venta aplicado"
          >
            +{pricing.margenPercent}% {pricing.isAutoTier ? 'auto' : 'fijo'}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug mb-2">
          {product.name}
        </h3>

        {/* Note if present */}
        {product.note && (
          <p className="text-xs text-blue-700 bg-blue-50/80 rounded-md px-2 py-1 mb-2.5 inline-block font-medium">
            📌 {product.note}
          </p>
        )}

        {/* Verification warning tag if peach color */}
        {product.needsVerification && (
          <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100/80 rounded-md px-2 py-1 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-medium">⚠ Verificar disponibilidad con proveedor</span>
          </div>
        )}

        {/* Optional Internal Cost Breakdown for the salesperson */}
        {settings.showCostBreakdown && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 mb-3 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Precio proveedor (efectivo):</span>
              <span className="font-mono">{formatCurrency(pricing.precioProveedorEfectivo)}</span>
            </div>
            <div className="flex justify-between">
              <span>Costo proveedor (tarjeta +{settings.supplierCardSurchargePercent}%):</span>
              <span className="font-mono">{formatCurrency(pricing.costoProveedor)}</span>
            </div>
            {pricing.gastosLogistica > 0 && (
              <div className="flex justify-between text-blue-700">
                <span className="flex items-center gap-1">
                  <Car className="w-3 h-3" /> Gastos logística:
                </span>
                <span className="font-mono">+{formatCurrency(pricing.gastosLogistica)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-0.5">
              <span>Costo total incurrido:</span>
              <span className="font-mono">{formatCurrency(pricing.costoTotalIncurrido)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 pt-0.5">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Ganancia neta ({pricing.margenPercent}%):
              </span>
              <span className="font-mono font-bold">
                +{formatCurrency(pricing.gananciaNetaEfectivo)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Module & WhatsApp Action */}
      <div className="pt-3 border-t border-slate-100 mt-2 space-y-3">
        {/* Prices Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Cash / Transfer Price */}
          {(settings.priceDisplayMode === 'cash' || settings.priceDisplayMode === 'both') && (
            <div className="bg-emerald-50/70 rounded-lg p-2.5 border border-emerald-200 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-emerald-900 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                Efectivo / Transf.
              </span>
              <div className="text-base sm:text-lg font-bold text-emerald-950 font-mono tabular-nums mt-1">
                {formatCurrency(pricing.precioVentaEfectivo)}
              </div>
              <span className="text-[10px] text-emerald-700 font-medium mt-0.5">
                Sin comisiones bancarias
              </span>
            </div>
          )}

          {/* Card Price (Mercado Pago Terminal) */}
          {(settings.priceDisplayMode === 'card' || settings.priceDisplayMode === 'both') && (
            <div className="bg-sky-50/60 rounded-lg p-2.5 border border-sky-200 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-[#0E1520] flex items-center gap-1 truncate">
                  <CreditCard className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                  Tarjeta (MP)
                </span>

                {/* Quick Plan Switcher */}
                <select
                  value={activePlan}
                  onChange={(e) => setActivePlan(e.target.value as CardInstallmentPlan)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] bg-white border border-sky-200 rounded px-1 py-0.5 font-semibold text-[#0E1520] focus:outline-none cursor-pointer"
                >
                  {MERCADO_PAGO_RATES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.shortLabel} ({r.ratePercent}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-base sm:text-lg font-bold text-[#0E1520] font-mono tabular-nums mt-1">
                {formatCurrency(pricing.precioVentaTarjeta)}
              </div>

              {pricing.cuotaMensual && pricing.selectedPlan.installments > 1 ? (
                <span className="text-[10px] font-bold text-[#0284C7] font-mono mt-0.5">
                  {pricing.selectedPlan.installments}× {formatCurrency(pricing.cuotaMensual)}/mes
                </span>
              ) : (
                <span className="text-[10px] text-[#0284C7] font-medium mt-0.5">
                  1 pago de contado ({pricing.selectedPlan.ratePercent}%)
                </span>
              )}
            </div>
          )}
        </div>

        {/* WhatsApp Fast Copy & Share Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-[#0E1520] text-white hover:bg-[#162233] border border-[#1C5270] active:scale-[0.98]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>¡Copiado para WhatsApp!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#1EB5E5]" />
                <span>Copiar para WhatsApp</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            title="Abrir chat en WhatsApp"
            className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
