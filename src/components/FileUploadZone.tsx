import React, { useState, useRef } from 'react';
import { Upload, Sparkles, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { createSampleWorkbookBuffer } from '../utils/sampleData';
import { parsePriceListExcel, ParseResult } from '../utils/excelParser';
import { CatalogData } from '../types';

interface FileUploadZoneProps {
  onCatalogLoaded: (data: CatalogData) => void;
  onCancel?: () => void;
  hasExistingCatalog: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onCatalogLoaded,
  onCancel,
  hasExistingCatalog,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      setErrorMessage('Por favor sube un archivo con extensión .xlsx (Excel).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Leyendo archivo Excel...');

    try {
      setLoadingStep('Analizando colores de fuente y categorías con ExcelJS...');
      const res: ParseResult = await parsePriceListExcel(file, file.name);

      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'No se pudo procesar el archivo Excel.');
        setIsLoading(false);
        return;
      }

      setLoadingStep('¡Catálogo listo!');
      setTimeout(() => {
        onCatalogLoaded(res.data!);
        setIsLoading(false);
      }, 250);
    } catch (err: any) {
      setErrorMessage(`Error: ${err?.message || 'Fallo desconocido'}`);
      setIsLoading(false);
    }
  };

  const handleSampleData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Generando catálogo realista de prueba...');

    try {
      const buffer = await createSampleWorkbookBuffer();
      setLoadingStep('Procesando hoja Productos y reglas de color rosa/durazno...');
      const res = await parsePriceListExcel(buffer, 'Lista_Mayorista_Ejemplo.xlsx');

      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'Error al procesar datos de ejemplo');
        setIsLoading(false);
        return;
      }

      setTimeout(() => {
        onCatalogLoaded(res.data!);
        setIsLoading(false);
      }, 300);
    } catch (err: any) {
      setErrorMessage(`Error cargando ejemplo: ${err?.message}`);
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* AmigoFrank Brand Hero Banner */}
      <div className="bg-[#0E1520] border border-[#1C5270] rounded-2xl p-6 sm:p-8 mb-8 text-center shadow-md relative overflow-hidden">
        <div className="flex flex-col items-center justify-center">
          <img
            src="/assets/aistudio/Gemini_Generated_Image_8inkdo8inkdo8ink__1__af48fa3d.jpeg"
            alt="AmigoFrank Logotipo"
            className="h-24 sm:h-32 w-auto object-contain rounded-xl mb-3"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1C5270]/40 border border-[#1C5270] text-[#1EB5E5] text-xs font-bold uppercase tracking-widest mb-2">
            Visor de Precios
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Catálogo de Productos Express
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-2 leading-relaxed">
            Carga el archivo Excel de tu proveedor. Filtramos automáticamente productos sin existencia, calculamos recargos con tarjeta y generamos cotizaciones listas para WhatsApp.
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all bg-white ${
          isDragging
            ? 'border-[#1EB5E5] bg-[#1EB5E5]/5 scale-[1.01]'
            : 'border-[#1C5270]/40 hover:border-[#1EB5E5] hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          }}
        />

        {isLoading ? (
          <div className="py-8 space-y-4">
            <div className="w-12 h-12 border-3 border-[#1EB5E5] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-[#0E1520]">{loadingStep}</p>
              <p className="text-xs text-slate-500">Esto toma solo un instante...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-[#0E1520] text-[#1EB5E5] border border-[#1C5270] rounded-2xl mx-auto flex items-center justify-center shadow-xs">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <p className="text-base font-semibold text-[#0E1520]">
                Arrastra y suelta tu archivo <span className="font-mono text-[#0284C7] font-bold">.xlsx</span> aquí
              </p>
              <p className="text-xs text-slate-500 mt-1">
                o selecciona el archivo desde tu computadora o teléfono
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 text-sm font-bold text-[#0E1520] bg-[#1EB5E5] hover:bg-[#38C3EE] rounded-lg shadow-xs transition-colors"
              >
                Seleccionar Archivo .xlsx
              </button>

              <button
                type="button"
                onClick={handleSampleData}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#0E1520] hover:bg-[#162233] border border-[#1C5270] rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#1EB5E5]" />
                <span>Probar con datos de ejemplo</span>
              </button>
            </div>

            {hasExistingCatalog && onCancel && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs font-medium text-slate-500 hover:text-[#0E1520] underline underline-offset-2"
                >
                  Volver al catálogo actual
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">No se pudo procesar el archivo</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Rules & Specifications Card */}
      <div className="mt-8 bg-white border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-[#0E1520] font-bold">
          <Info className="w-4 h-4 text-[#0284C7]" />
          <span>Reglas de lectura aplicadas automáticamente</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600 leading-relaxed">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0 mt-0.5" />
            <span>
              <strong>Hojas leídas:</strong> Lee solo la hoja <span className="font-semibold text-slate-800">"Productos"</span> e ignora ensambles o remates. Fecha tomada de <span className="font-semibold text-slate-800">IMPORTANTE!D2</span>.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0 mt-0.5" />
            <span>
              <strong>Detección de Categorías:</strong> Fila con relleno de color en A/B y celda C sin precio numérico. Conserva siglas técnicas (RAM, SSD, DDR5, M.2).
            </span>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0 mt-0.5" />
            <span>
              <strong>Filtro de Existencias (Rosa):</strong> Excluye celdas con fuente rosa (FFF4CCCC, FFE6B8AF y tolerancia RGB) o celdas sin precio numérico.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0 mt-0.5" />
            <span>
              <strong>Aviso Durazno:</strong> Colores como durazno (FFFCE5CD) se incluyen con advertencia &ldquo;⚠ verificar disponibilidad&rdquo;.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
