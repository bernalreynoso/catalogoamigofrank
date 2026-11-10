import React from 'react';
import {
  X,
  CreditCard,
  Percent,
  Car,
  Train,
  Store,
  DollarSign,
  MessageCircle,
  HelpCircle,
  Info,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { AppSettings, LogisticsMode, MarginMode, CardInstallmentPlan } from '../types';
import { MERCADO_PAGO_RATES, calculateLogisticsCost } from '../utils/pricingUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const [localSettings, setLocalSettings] = React.useState<AppSettings>({
    ...settings,
    logistics: { ...settings.logistics },
  });

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const logisticsAmount = calculateLogisticsCost(localSettings.logistics);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1C5270] bg-[#0E1520] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1C5270]/60 border border-[#1C5270] text-[#1EB5E5] flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Ajustes de Precios, Logística y Terminal
              </h2>
              <p className="text-xs text-slate-300">
                AmigoFrank · Fórmulas de margen sobre venta y Mercado Pago
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1C5270]/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* COSTO BASE: PRECIO CON TARJETA DEL PROVEEDOR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Costo base: precio con tarjeta del proveedor
              </label>
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={localSettings.supplierCardSurchargePercent}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      supplierCardSurchargePercent: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-20 px-2 py-1 text-right font-mono text-sm font-bold border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
                <span className="text-sm font-semibold text-slate-600">%</span>
              </div>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Tu costo es lo que el proveedor cobra si le pagas con tarjeta:{' '}
              <code className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                Precio Efectivo × (1 + {localSettings.supplierCardSurchargePercent}%)
              </code>
              . Así tu margen está protegido aunque tengas que pagar la pieza con tu tarjeta.
            </p>
          </div>

          {/* 1. GASTOS DE TRASLADO / LOGÍSTICA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                1. Gastos de Traslado / Logística
              </label>
              <span className="font-mono font-bold text-slate-900 text-xs px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md">
                Total agregado: ${logisticsAmount} MXN
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Se suma al costo del proveedor (precio con tarjeta) para formar el <strong>Costo Total Incurrido</strong> antes de calcular utilidad y comisiones.
            </p>

            {/* Logistics Mode Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {/* Auto */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    logistics: { ...localSettings.logistics, mode: 'car' },
                  })
                }
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  localSettings.logistics.mode === 'car'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Car className="w-3.5 h-3.5 text-blue-600" />
                  Auto
                </div>
                <div className="font-mono font-bold text-slate-800 mt-1">
                  ${Number(localSettings.logistics.carGasoline || 0) + Number(localSettings.logistics.carParking || 0)} MXN
                </div>
              </button>

              {/* Metro */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    logistics: { ...localSettings.logistics, mode: 'metro' },
                  })
                }
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  localSettings.logistics.mode === 'metro'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Train className="w-3.5 h-3.5 text-amber-600" />
                  Metro
                </div>
                <div className="font-mono font-bold text-slate-800 mt-1">
                  ${localSettings.logistics.metroCost || 24} MXN
                </div>
              </button>

              {/* Sin traslado */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    logistics: { ...localSettings.logistics, mode: 'none' },
                  })
                }
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  localSettings.logistics.mode === 'none'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  Sin traslado
                </div>
                <div className="font-mono font-bold text-slate-800 mt-1">$0 MXN</div>
              </button>

              {/* Personalizado */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    logistics: { ...localSettings.logistics, mode: 'custom' },
                  })
                }
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  localSettings.logistics.mode === 'custom'
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                  Manual
                </div>
                <div className="font-mono font-bold text-slate-800 mt-1">
                  ${localSettings.logistics.customAmount || 0} MXN
                </div>
              </button>
            </div>

            {/* Sub-inputs if Auto is selected */}
            {localSettings.logistics.mode === 'car' && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Gasolina (MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={localSettings.logistics.carGasoline}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        logistics: {
                          ...localSettings.logistics,
                          carGasoline: Math.max(0, parseFloat(e.target.value) || 0),
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Estacionamiento (MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={localSettings.logistics.carParking}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        logistics: {
                          ...localSettings.logistics,
                          carParking: Math.max(0, parseFloat(e.target.value) || 0),
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Sub-input if Custom is selected */}
            {localSettings.logistics.mode === 'custom' && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Monto manual de logística / entrega (MXN)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={localSettings.logistics.customAmount}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      logistics: {
                        ...localSettings.logistics,
                        customAmount: Math.max(0, parseFloat(e.target.value) || 0),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            )}
          </div>

          {/* 2. REGLA DE MARGEN DE GANANCIA ESCALONADO */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                2. Margen de Ganancia (Sobre Precio de Venta)
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, marginMode: 'tier' })}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    localSettings.marginMode === 'tier'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Escalonado Automático
                </button>
                <button
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, marginMode: 'manual' })}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    localSettings.marginMode === 'manual'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Manual Fijo
                </button>
              </div>
            </div>

            {localSettings.marginMode === 'tier' ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-emerald-950 font-semibold">
                  <span>Regla Escalonada según Costo Proveedor (precio tarjeta):</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-mono">
                    Protege tu utilidad
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block text-[10px]">Menor a $2,500</span>
                    <strong className="text-sm font-bold text-emerald-800 font-mono">7%</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block text-[10px]">$2,500 a $4,000</span>
                    <strong className="text-sm font-bold text-emerald-800 font-mono">8%</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block text-[10px]">$4,001 a $5,000</span>
                    <strong className="text-sm font-bold text-emerald-800 font-mono">9%</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block text-[10px]">Más de $5,000</span>
                    <strong className="text-sm font-bold text-emerald-800 font-mono">10%</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Porcentaje de margen manual fijo
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Se aplicará el mismo margen a todos los productos sin importar el costo
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    value={localSettings.manualMarginPercent}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        manualMarginPercent: Math.max(1, parseFloat(e.target.value) || 8),
                      })
                    }
                    className="w-16 px-2 py-1 text-right font-mono font-bold text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <span className="font-bold text-slate-700">%</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. TERMINAL MERCADO PAGO - COMISIONES Y MSI */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                3. Terminal Mercado Pago (Tasa Predeterminada)
              </label>
              <span className="text-slate-500 text-[11px]">Tasas con IVA incluido</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Elige el plan por defecto para cotizar con tarjeta en el catálogo. La calculadora aplica la fórmula:{' '}
              <code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                Costo / (1 - Margen - Comisión_MP)
              </code>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MERCADO_PAGO_RATES.map((rate) => (
                <button
                  key={rate.id}
                  type="button"
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      selectedCardPlan: rate.id,
                    })
                  }
                  className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                    localSettings.selectedCardPlan === rate.id
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-semibold text-slate-900">
                    {rate.label}
                  </span>
                  <span className="font-mono font-bold text-blue-700">
                    {rate.ratePercent}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. VISUALIZACIÓN Y WHATSAPP */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              4. Opciones de Vista y Cotización WhatsApp
            </label>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-semibold text-slate-900 block">
                  Mostrar desglose de costo y ganancia en tarjetas
                </span>
                <span className="text-slate-500 text-[11px]">
                  Muestra tu costo incurrido y ganancia neta estimada (ocúltalo si muestras la pantalla a un cliente)
                </span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.showCostBreakdown}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    showCostBreakdown: e.target.checked,
                  })
                }
                className="w-4 h-4 text-slate-900 rounded focus:ring-slate-900 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-[#0E1520] bg-[#1EB5E5] hover:bg-[#38C3EE] rounded-lg shadow-xs transition-colors"
          >
            Guardar y Aplicar Fórmulas
          </button>
        </div>
      </div>
    </div>
  );
};
