import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  PackageX,
  Minus,
  Search,
  X,
  Save,
  RotateCcw,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { PriceChange } from '../types';
import { ComparisonReport } from '../utils/comparisonUtils';
import { formatCurrency, normalizeForSearch } from '../utils/textUtils';

interface ChangesViewProps {
  report: ComparisonReport;
  onSaveAsBaseline: () => void;
  onResetBaseline: () => void;
  hasBaseline: boolean;
}

export const ChangesView: React.FC<ChangesViewProps> = ({
  report,
  onSaveAsBaseline,
  onResetBaseline,
  hasBaseline,
}) => {
  const [filterStatus, setFilterStatus] = useState<
    'ALL' | 'new' | 'removed' | 'price_up' | 'price_down'
  >('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChanges = useMemo(() => {
    const q = normalizeForSearch(searchTerm);

    return report.changes.filter((c) => {
      if (filterStatus !== 'ALL') {
        if (c.status !== filterStatus) return false;
      }

      if (q) {
        const matchName = normalizeForSearch(c.name).includes(q);
        const matchBrand = normalizeForSearch(c.brand).includes(q);
        const matchCat = normalizeForSearch(c.category).includes(q);
        if (!matchName && !matchBrand && !matchCat) return false;
      }

      return true;
    });
  }, [report.changes, filterStatus, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner with Baseline Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Comparativa con Lista Anterior</span>
          </h2>
          {report.previousListMeta ? (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Comparando contra lista previa: <strong>{report.previousListMeta.listDate || report.previousListMeta.fileName}</strong>
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Guardada el {new Date(report.previousListMeta.savedAt).toLocaleDateString('es-MX')}</span>
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Esta es tu primera lista cargada. Ya quedó guardada como base para comparar cuando subas la próxima lista del proveedor.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSaveAsBaseline}
            title="Guardar la lista actual como nueva lista previa de referencia"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Fijar como Lista Base</span>
          </button>

          {hasBaseline && (
            <button
              type="button"
              onClick={onResetBaseline}
              title="Borrar memoria de lista anterior"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar Historial</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards / Status Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Nuevos */}
        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === 'new' ? 'ALL' : 'new')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'new'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Nuevos
            </span>
            <span className="text-base font-bold font-mono text-emerald-700 tabular-nums">
              {report.totalNew}
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            Productos agregados al catálogo
          </span>
        </button>

        {/* Agotados / Descontinuados */}
        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === 'removed' ? 'ALL' : 'removed')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'removed'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
              <PackageX className="w-4 h-4 text-rose-600" />
              Ya no disponibles
            </span>
            <span className="text-base font-bold font-mono text-rose-700 tabular-nums">
              {report.totalRemoved}
            </span>
          </div>
          <span className="text-[11px] text-rose-700 mt-1 block">
            Estaban en la lista previa y ahora faltan o pasaron a rosa
          </span>
        </button>

        {/* Subieron de Precio */}
        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === 'price_up' ? 'ALL' : 'price_up')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'price_up'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              Subieron
            </span>
            <span className="text-base font-bold font-mono text-amber-800 tabular-nums">
              {report.totalPriceUp}
            </span>
          </div>
          <span className="text-[11px] text-amber-700 mt-1 block">
            Aumento de costo respecto al previo
          </span>
        </button>

        {/* Bajaron de Precio */}
        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === 'price_down' ? 'ALL' : 'price_down')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterStatus === 'price_down'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              Bajaron
            </span>
            <span className="text-base font-bold font-mono text-blue-800 tabular-nums">
              {report.totalPriceDown}
            </span>
          </div>
          <span className="text-[11px] text-blue-700 mt-1 block">
            Descuento o rebaja de costo
          </span>
        </button>
      </div>

      {/* Search Bar & Reset */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar producto o marca dentro de los cambios..."
            className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {filterStatus !== 'ALL' && (
          <button
            onClick={() => setFilterStatus('ALL')}
            className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
          >
            Ver todos los cambios
          </button>
        )}
      </div>

      {/* Changes List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between items-center">
          <span>Registros analizados ({filteredChanges.length})</span>
          <span className="text-slate-500 font-normal">Comparado por categoría + nombre</span>
        </div>

        {filteredChanges.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredChanges.map((change) => (
              <div
                key={change.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <span className="text-slate-700">{change.category}</span>
                    {change.brand && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-900 font-semibold">{change.brand}</span>
                      </>
                    )}
                  </div>
                  <p className="font-semibold text-slate-900 text-sm leading-snug">{change.name}</p>
                </div>

                {/* Status and Price Delta Column */}
                <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0">
                  {change.status === 'new' && (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Sparkles className="w-3 h-3" /> Nuevo
                      </span>
                      <div className="font-mono font-bold text-slate-900 mt-1">
                        {formatCurrency(change.newPrice || 0)}
                      </div>
                    </div>
                  )}

                  {change.status === 'removed' && (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                        <PackageX className="w-3 h-3" /> Ya no disponible
                      </span>
                      {change.previousPrice && (
                        <div className="font-mono text-slate-400 line-through mt-1">
                          {formatCurrency(change.previousPrice)}
                        </div>
                      )}
                    </div>
                  )}

                  {change.status === 'price_up' && (
                    <div className="text-right space-y-0.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <TrendingUp className="w-3 h-3 text-amber-700" /> Subió +{formatCurrency(change.priceDiff || 0)} (+{(change.percentDiff || 0).toFixed(1)}%)
                      </span>
                      <div className="flex items-center justify-end gap-1.5 font-mono text-xs text-slate-600 mt-1">
                        <span className="line-through text-slate-400">{formatCurrency(change.previousPrice || 0)}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-bold text-slate-900">{formatCurrency(change.newPrice || 0)}</span>
                      </div>
                    </div>
                  )}

                  {change.status === 'price_down' && (
                    <div className="text-right space-y-0.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                        <TrendingDown className="w-3 h-3 text-blue-700" /> Bajó -{formatCurrency(Math.abs(change.priceDiff || 0))} ({(change.percentDiff || 0).toFixed(1)}%)
                      </span>
                      <div className="flex items-center justify-end gap-1.5 font-mono text-xs text-slate-600 mt-1">
                        <span className="line-through text-slate-400">{formatCurrency(change.previousPrice || 0)}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-bold text-emerald-700">{formatCurrency(change.newPrice || 0)}</span>
                      </div>
                    </div>
                  )}

                  {change.status === 'unchanged' && (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <Minus className="w-3 h-3" /> Sin cambio
                      </span>
                      <div className="font-mono text-slate-700 mt-1">
                        {formatCurrency(change.newPrice || 0)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No se encontraron cambios con los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  );
};
