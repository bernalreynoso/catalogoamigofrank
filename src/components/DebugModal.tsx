import React, { useState } from 'react';
import { X, Bug, Copy, Check, Info } from 'lucide-react';
import { DebugRowInfo } from '../types';

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  debugRows: DebugRowInfo[];
}

export const DebugModal: React.FC<DebugModalProps> = ({
  isOpen,
  onClose,
  debugRows,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyDebugData = () => {
    const jsonStr = JSON.stringify(debugRows, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Diagnóstico de Celdas y Colores de Fuente
              </h2>
              <p className="text-xs text-slate-500">
                Muestra los valores y colores ARGB/Theme de las primeras 30 filas de producto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-amber-50/60 border-b border-amber-200/60 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Estos datos también se imprimen automáticamente en la consola de JavaScript con <code>console.table</code>.
            </span>
          </div>
          <button
            onClick={handleCopyDebugData}
            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 rounded-md text-amber-900 hover:bg-amber-100 font-medium transition-colors text-xs shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado JSON' : 'Copiar JSON'}</span>
          </button>
        </div>

        {/* Table Body */}
        <div className="p-6 overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/80">
                <th className="p-2 font-semibold">Fila</th>
                <th className="p-2 font-semibold">Categoría</th>
                <th className="p-2 font-semibold">Producto (B)</th>
                <th className="p-2 font-semibold">Valor C (Precio)</th>
                <th className="p-2 font-semibold">Fuente C (ARGB/Theme)</th>
                <th className="p-2 font-semibold">Fuente D (ARGB/Theme)</th>
                <th className="p-2 font-semibold">Clasificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {debugRows.map((row) => (
                <tr key={row.rowNumber} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 text-slate-500 font-bold">{row.rowNumber}</td>
                  <td className="p-2 text-slate-700 max-w-[120px] truncate" title={row.category}>
                    {row.category}
                  </td>
                  <td className="p-2 font-sans font-medium text-slate-900 max-w-[200px] truncate" title={row.name}>
                    {row.name}
                  </td>
                  <td className="p-2 text-slate-800">
                    {row.cellCRaw !== null && row.cellCRaw !== undefined ? String(row.cellCRaw) : '(vacío)'}
                  </td>
                  <td className="p-2">
                    {row.cellCArgb ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-xs border border-slate-300 shrink-0 inline-block"
                          style={{
                            backgroundColor: row.cellCArgb.startsWith('FF')
                              ? `#${row.cellCArgb.slice(2)}`
                              : `#${row.cellCArgb}`,
                          }}
                        />
                        <span className="text-slate-800 font-bold">{row.cellCArgb}</span>
                      </span>
                    ) : row.cellCTheme !== undefined ? (
                      <span className="text-slate-600">Theme {row.cellCTheme}</span>
                    ) : (
                      <span className="text-slate-400">Predeterminado</span>
                    )}
                  </td>
                  <td className="p-2">
                    {row.cellDArgb ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-xs border border-slate-300 shrink-0 inline-block"
                          style={{
                            backgroundColor: row.cellDArgb.startsWith('FF')
                              ? `#${row.cellDArgb.slice(2)}`
                              : `#${row.cellDArgb}`,
                          }}
                        />
                        <span className="text-slate-800 font-bold">{row.cellDArgb}</span>
                      </span>
                    ) : row.cellDTheme !== undefined ? (
                      <span className="text-slate-600">Theme {row.cellDTheme}</span>
                    ) : (
                      <span className="text-slate-400">Predeterminado</span>
                    )}
                  </td>
                  <td className="p-2">
                    {row.classification === 'disponible' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        Disponible
                      </span>
                    )}
                    {row.classification === 'omitido_rosa' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
                        Rosa (Agotado)
                      </span>
                    )}
                    {row.classification === 'omitido_sin_precio' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700">
                        Sin Precio
                      </span>
                    )}
                    {row.classification === 'verificar_disponibilidad' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                        ⚠ Verificar (Durazno)
                      </span>
                    )}
                    {row.classification === 'categoria' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
                        Encabezado Cat.
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
          >
            Cerrar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
};
