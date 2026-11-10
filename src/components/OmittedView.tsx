import React, { useState, useMemo } from 'react';
import { EyeOff, Search, X, AlertOctagon, HelpCircle } from 'lucide-react';
import { OmittedProduct } from '../types';
import { normalizeForSearch } from '../utils/textUtils';

interface OmittedViewProps {
  omitted: OmittedProduct[];
}

export const OmittedView: React.FC<OmittedViewProps> = ({ omitted }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState<'ALL' | 'pink_color' | 'no_price'>('ALL');

  const filteredOmitted = useMemo(() => {
    const query = normalizeForSearch(searchTerm);

    return omitted.filter((item) => {
      if (reasonFilter !== 'ALL' && item.reason !== reasonFilter) {
        return false;
      }

      if (query) {
        const matchName = normalizeForSearch(item.name).includes(query);
        const matchBrand = normalizeForSearch(item.brand).includes(query);
        const matchCat = normalizeForSearch(item.category).includes(query);
        if (!matchName && !matchBrand && !matchCat) return false;
      }

      return true;
    });
  }, [omitted, searchTerm, reasonFilter]);

  const pinkCount = useMemo(() => omitted.filter((o) => o.reason === 'pink_color').length, [omitted]);
  const noPriceCount = useMemo(() => omitted.filter((o) => o.reason === 'no_price').length, [omitted]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header explanation */}
      <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
            <EyeOff className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-950">
              Productos Omitidos del Catálogo ({omitted.length})
            </h2>
            <p className="text-xs text-rose-900 mt-1 leading-relaxed">
              Estos productos estaban en la hoja &ldquo;Productos&rdquo; pero fueron excluidos automáticamente del catálogo activo según las reglas de tu proveedor: <strong>color rosa en precio</strong> (agotado en bodega) o <strong>sin precio numérico</strong> (sin existencia).
            </p>
          </div>
        </div>

        {/* Counter cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-rose-200/80">
          <button
            type="button"
            onClick={() => setReasonFilter(reasonFilter === 'pink_color' ? 'ALL' : 'pink_color')}
            className={`p-3 rounded-lg border text-left transition-all ${
              reasonFilter === 'pink_color'
                ? 'bg-rose-100 border-rose-400 ring-1 ring-rose-400'
                : 'bg-white border-rose-200 hover:bg-rose-50/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-950 flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#f4cccc] border border-rose-400 shrink-0 inline-block" />
                Fuente en Color Rosa
              </span>
              <span className="text-sm font-bold font-mono text-rose-800 tabular-nums">
                {pinkCount}
              </span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1">
              Colores FFF4CCCC, FFE6B8AF y tolerancia RGB (agotados por proveedor)
            </p>
          </button>

          <button
            type="button"
            onClick={() => setReasonFilter(reasonFilter === 'no_price' ? 'ALL' : 'no_price')}
            className={`p-3 rounded-lg border text-left transition-all ${
              reasonFilter === 'no_price'
                ? 'bg-rose-100 border-rose-400 ring-1 ring-rose-400'
                : 'bg-white border-rose-200 hover:bg-rose-50/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-950 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                Sin Precio / No Válido
              </span>
              <span className="text-sm font-bold font-mono text-rose-800 tabular-nums">
                {noPriceCount}
              </span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1">
              Celda C vacía, texto blanco o igual a cero (&ldquo;sin precio = sin existencia&rdquo;)
            </p>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar en omitidos por nombre, marca o categoría..."
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

        {reasonFilter !== 'ALL' && (
          <button
            onClick={() => setReasonFilter('ALL')}
            className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap"
          >
            Mostrar todos los motivos
          </button>
        )}
      </div>

      {/* Omitted Items List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between items-center">
          <span>Lista de productos excluidos ({filteredOmitted.length})</span>
          <span className="text-slate-400 font-normal">Fila original en Excel incluida</span>
        </div>

        {filteredOmitted.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredOmitted.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <span className="text-slate-700">{item.category}</span>
                    {item.brand && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-900 font-semibold">{item.brand}</span>
                      </>
                    )}
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono text-slate-400">Fila {item.originalRowNumber}</span>
                  </div>

                  <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                </div>

                <div className="flex sm:flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                      item.reason === 'pink_color'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {item.reason === 'pink_color' && (
                      <span className="w-2 h-2 rounded-full bg-[#f4cccc] border border-rose-400" />
                    )}
                    {item.reasonText}
                  </span>

                  {item.detectedColor && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      ARGB: {item.detectedColor}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No se encontraron productos omitidos con los filtros actuales.
          </div>
        )}
      </div>
    </div>
  );
};
