import React from 'react';
import {
  Download,
  Upload,
  Settings,
  Bug,
  Calendar,
  Layers,
  ArrowRightLeft,
  EyeOff,
} from 'lucide-react';
import { AppSettings, CatalogData } from '../types';
import { calculateLogisticsCost } from '../utils/pricingUtils';
import { AmigoFrankCpuIcon } from './BrandLogo';

interface HeaderProps {
  catalog: CatalogData | null;
  activeTab: 'catalog' | 'changes' | 'omitted';
  setActiveTab: (tab: 'catalog' | 'changes' | 'omitted') => void;
  changesCount: number;
  onOpenSettings: () => void;
  onOpenUpload: () => void;
  onOpenDebug: () => void;
  onExportExcel: () => void;
  isExporting: boolean;
  settings: AppSettings;
}

export const Header: React.FC<HeaderProps> = ({
  catalog,
  activeTab,
  setActiveTab,
  changesCount,
  onOpenSettings,
  onOpenUpload,
  onOpenDebug,
  onExportExcel,
  isExporting,
  settings,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0E1520] text-white border-b border-[#1C5270]/60 shadow-sm">
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav Tabs) — Zone 3 (Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Zone 1: AmigoFrank Brand Logo & System Title */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('catalog')}
              className="flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1EB5E5] rounded-xl p-1"
            >
              <AmigoFrankCpuIcon className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight leading-none">
                    <span className="text-white">Amigo</span>
                    <span className="text-[#1EB5E5]">Frank</span>
                  </span>
                  <span className="hidden md:inline-block text-[11px] font-semibold uppercase tracking-wider text-[#1EB5E5] bg-[#1C5270]/40 border border-[#1C5270] px-2 py-0.5 rounded-md">
                    Visor de Precios
                  </span>
                </div>
                <span className="text-[11px] sm:text-xs text-slate-300 font-medium leading-tight mt-0.5">
                  Catálogo de Productos Express
                  <span className="md:hidden text-[#1EB5E5]"> · Visor de Precios</span>
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links / Primary Tabs */}
          {catalog && (
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'catalog'
                    ? 'bg-[#1EB5E5] text-[#0E1520] shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-[#1C5270]/40'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Catálogo</span>
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-md font-mono font-bold ${
                    activeTab === 'catalog'
                      ? 'bg-[#0E1520]/20 text-[#0E1520]'
                      : 'bg-[#1C5270]/60 text-slate-200'
                  }`}
                >
                  {catalog.products.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('changes')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'changes'
                    ? 'bg-[#1EB5E5] text-[#0E1520] shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-[#1C5270]/40'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Cambios</span>
                {changesCount > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.2 rounded-md font-mono font-bold ${
                      activeTab === 'changes'
                        ? 'bg-[#0E1520] text-[#1EB5E5]'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {changesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('omitted')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'omitted'
                    ? 'bg-[#1EB5E5] text-[#0E1520] shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-[#1C5270]/40'
                }`}
              >
                <EyeOff className="w-4 h-4" />
                <span>Omitidos</span>
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-md font-mono font-bold ${
                    activeTab === 'omitted'
                      ? 'bg-[#0E1520]/20 text-[#0E1520]'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                  }`}
                >
                  {catalog.omitted.length}
                </span>
              </button>
            </nav>
          )}

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {catalog && (
              <>
                <button
                  onClick={onOpenDebug}
                  title="Verificar colores y celdas de las primeras 30 filas"
                  className="p-2 text-slate-400 hover:text-[#1EB5E5] hover:bg-[#1C5270]/40 rounded-lg transition-colors"
                  aria-label="Diagnóstico de colores"
                >
                  <Bug className="w-4 h-4" />
                </button>

                <button
                  onClick={onOpenSettings}
                  title="Configurar gastos de traslado, margen y tasas de Mercado Pago"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white bg-[#162233] hover:bg-[#1C5270]/60 rounded-lg border border-[#1C5270] transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#1EB5E5]" />
                  <span className="hidden md:inline">
                    {settings.logistics.mode === 'none'
                      ? 'Sin traslado'
                      : `Logística +$${calculateLogisticsCost(settings.logistics)}`}
                  </span>
                  <span className="hidden lg:inline text-[#1EB5E5] font-semibold">
                    · {settings.marginMode === 'tier' ? 'Margen Auto' : `${settings.manualMarginPercent}%`}
                  </span>
                </button>

                <button
                  onClick={onExportExcel}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-[#0E1520] bg-[#1EB5E5] hover:bg-[#38C3EE] disabled:opacity-50 rounded-lg shadow-xs transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar Excel</span>
                  <span className="sm:hidden">Excel</span>
                </button>
              </>
            )}

            <button
              onClick={onOpenUpload}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                catalog
                  ? 'text-slate-200 hover:text-white bg-[#162233] hover:bg-[#1C5270]/60 border border-[#1C5270]'
                  : 'text-[#0E1520] bg-[#1EB5E5] hover:bg-[#38C3EE] font-bold shadow-xs'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{catalog ? 'Nueva Lista' : 'Subir Excel'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-strip with Metadata when Catalog is active */}
      {catalog && (
        <div className="bg-[#131D2B] border-t border-[#1C5270]/50 px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-y-1 gap-x-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-medium text-white">
              <Calendar className="w-3.5 h-3.5 text-[#1EB5E5]" />
              Fecha de la lista: {catalog.listDate}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="truncate max-w-[200px] sm:max-w-xs text-slate-400" title={catalog.fileName}>
              {catalog.fileName}
            </span>
          </div>

          <div className="flex items-center gap-3 tabular-nums">
            <span className="text-[#1EB5E5] font-semibold">
              {catalog.products.length} disponibles
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-rose-400 font-medium">
              {catalog.omitted.length} omitidos
            </span>
            {catalog.products.filter((p) => p.needsVerification).length > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-amber-400 font-medium">
                  {catalog.products.filter((p) => p.needsVerification).length} por verificar
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
