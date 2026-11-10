import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  ArrowUpDown,
  Car,
  Train,
  Store,
  CreditCard,
  Percent,
  Check,
  AlertCircle,
  Layers,
  Filter,
} from 'lucide-react';
import { AppSettings, CatalogData, LogisticsMode, CardInstallmentPlan } from '../types';
import { ProductCard } from './ProductCard';
import { normalizeForSearch } from '../utils/textUtils';
import {
  calculateLogisticsCost,
  MERCADO_PAGO_RATES,
  getCardPlan,
} from '../utils/pricingUtils';

interface CatalogViewProps {
  catalog: CatalogData;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  catalog,
  settings,
  onUpdateSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'original' | 'price_asc' | 'price_desc' | 'name_asc'>('original');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCategoryChips, setShowCategoryChips] = useState<boolean>(true);

  const showToast = (text: string) => {
    setToastMessage(`Copiado: "${text}"`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    catalog.products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [catalog.products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeForSearch(searchTerm);

    return catalog.products
      .filter((prod) => {
        // Category filter
        if (selectedCategory !== 'ALL' && prod.category !== selectedCategory) {
          return false;
        }

        // Brand filter
        if (selectedBrand !== 'ALL' && prod.brand !== selectedBrand) {
          return false;
        }

        // Text search (name, brand, category)
        if (normalizedQuery) {
          const matchName = normalizeForSearch(prod.name).includes(normalizedQuery);
          const matchBrand = normalizeForSearch(prod.brand).includes(normalizedQuery);
          const matchCat = normalizeForSearch(prod.category).includes(normalizedQuery);
          const matchNote = prod.note ? normalizeForSearch(prod.note).includes(normalizedQuery) : false;

          if (!matchName && !matchBrand && !matchCat && !matchNote) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.cashPrice - b.cashPrice;
        if (sortBy === 'price_desc') return b.cashPrice - a.cashPrice;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'es');
        return a.originalRowNumber - b.originalRowNumber;
      });
  }, [catalog.products, searchTerm, selectedCategory, selectedBrand, sortBy]);

  const activePlan = getCardPlan(settings.selectedCardPlan);

  const handleSetLogisticsMode = (mode: LogisticsMode) => {
    onUpdateSettings({
      ...settings,
      logistics: {
        ...settings.logistics,
        mode,
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-[#0E1520] text-white px-4 py-2.5 rounded-xl shadow-lg border border-[#1C5270] text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4 text-[#1EB5E5] shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Quick Sales Bar (Logística + Plan MP en tiempo real) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Logistics Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5 shrink-0">
            <Car className="w-4 h-4 text-[#0284C7]" />
            Traslado:
          </span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => handleSetLogisticsMode('car')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                settings.logistics.mode === 'car'
                  ? 'bg-[#0E1520] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Auto</span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  settings.logistics.mode === 'car' ? 'text-[#1EB5E5]' : 'text-[#0284C7]'
                }`}
              >
                (${settings.logistics.carGasoline + settings.logistics.carParking})
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSetLogisticsMode('metro')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                settings.logistics.mode === 'metro'
                  ? 'bg-[#0E1520] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Train className="w-3 h-3 text-amber-500" />
              <span>Metro (${settings.logistics.metroCost})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetLogisticsMode('none')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                settings.logistics.mode === 'none'
                  ? 'bg-[#0E1520] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3 h-3 text-emerald-500" />
              <span>Sin traslado ($0)</span>
            </button>
          </div>
        </div>

        {/* Global Mercado Pago Plan */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5 shrink-0">
            <CreditCard className="w-4 h-4 text-[#0284C7]" />
            Terminal MP:
          </span>
          <select
            value={settings.selectedCardPlan}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                selectedCardPlan: e.target.value as CardInstallmentPlan,
              })
            }
            className="px-2.5 py-1 bg-sky-50 border border-sky-200 rounded-lg text-xs font-bold text-[#0E1520] focus:outline-none focus:ring-2 focus:ring-[#1EB5E5] cursor-pointer"
          >
            {MERCADO_PAGO_RATES.map((rate) => (
              <option key={rate.id} value={rate.id}>
                {rate.label}
              </option>
            ))}
          </select>

          {/* Margin Status Indicator */}
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md text-[11px] font-semibold">
            <Percent className="w-3 h-3 text-emerald-600" />
            {settings.marginMode === 'tier' ? 'Margen Escalonado (7% - 10%)' : `Margen Fijo (${settings.manualMarginPercent}%)`}
          </span>
        </div>
      </div>

      {/* Search & Main Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
        {/* Row 1: Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por producto, marca (Intel, AMD, ASUS...), o categoría..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1EB5E5] focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              title="Borrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row 2: Clean Dropdown Selectors (Category, Brand, Sort, Mode) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown Selector (Replaces the awkward sliding menu) */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus-within:ring-2 focus-within:ring-slate-900 focus-within:bg-white transition-all">
              <Layers className="w-4 h-4 text-slate-500 shrink-0" />
              <label htmlFor="category-select" className="sr-only">
                Categoría
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 focus:outline-none text-xs cursor-pointer max-w-[190px] sm:max-w-[240px] truncate"
              >
                <option value="ALL">Todas las categorías ({catalog.categories.length})</option>
                {catalog.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({categoryCounts[cat] || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Dropdown Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">Todas las marcas ({catalog.brands.length})</option>
              {catalog.brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none text-xs cursor-pointer"
              >
                <option value="original">Orden del proveedor</option>
                <option value="price_asc">Precio: Menor a Mayor</option>
                <option value="price_desc">Precio: Mayor a Menor</option>
                <option value="name_asc">Nombre: A - Z</option>
              </select>
            </div>
          </div>

          {/* Display Price Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs shrink-0">
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, priceDisplayMode: 'both' })}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                settings.priceDisplayMode === 'both'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ambos
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, priceDisplayMode: 'cash' })}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                settings.priceDisplayMode === 'cash'
                  ? 'bg-white text-emerald-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Efectivo
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, priceDisplayMode: 'card' })}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                settings.priceDisplayMode === 'card'
                  ? 'bg-white text-blue-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tarjeta ({activePlan.shortLabel})
            </button>
          </div>
        </div>

        {/* Active Category Banner if a category is selected */}
        {selectedCategory !== 'ALL' && (
          <div className="flex items-center justify-between bg-sky-50/80 border border-sky-200 rounded-lg px-3 py-2 text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="text-[#0E1520] font-medium shrink-0">Filtrando por categoría:</span>
              <span className="font-bold text-[#0E1520] bg-white px-2.5 py-0.5 rounded-md border border-sky-300 truncate">
                {selectedCategory}
              </span>
              <span className="text-[#0284C7] font-mono text-[11px] font-semibold shrink-0">
                ({categoryCounts[selectedCategory] || 0} productos)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className="text-[#0284C7] hover:text-[#0E1520] font-semibold flex items-center gap-1 hover:underline shrink-0 ml-2"
            >
              <X className="w-3.5 h-3.5" />
              <span>Ver todas</span>
            </button>
          </div>
        )}

        {/* Clean, Non-Sliding Category Pills (Wrap naturally without any horizontal scroll) */}
        <div className="pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#0284C7]" />
              Acceso rápido a categorías
            </span>
            <button
              type="button"
              onClick={() => setShowCategoryChips(!showCategoryChips)}
              className="text-[11px] text-slate-500 hover:text-[#0E1520] underline underline-offset-2"
            >
              {showCategoryChips ? 'Ocultar botones' : 'Mostrar botones'}
            </button>
          </div>

          {showCategoryChips && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#0E1520] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Todas</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    selectedCategory === 'ALL'
                      ? 'bg-[#1C5270] text-[#1EB5E5]'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {catalog.products.length}
                </span>
              </button>

              {catalog.categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-[#1EB5E5] text-[#0E1520] shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                      selectedCategory === cat
                        ? 'bg-[#0E1520]/15 text-[#0E1520]'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Catalog Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>
          Mostrando <strong className="text-slate-800">{filteredProducts.length}</strong> de{' '}
          {catalog.products.length} productos disponibles
        </span>

        {(searchTerm || selectedCategory !== 'ALL' || selectedBrand !== 'ALL') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ALL');
              setSelectedBrand('ALL');
            }}
            className="text-[#0284C7] hover:text-[#0E1520] font-semibold underline underline-offset-2"
          >
            Limpiar todos los filtros
          </button>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              settings={settings}
              onCopied={showToast}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900">
            No se encontraron productos
          </h3>
          <p className="text-xs text-slate-500">
            No hay productos que coincidan con &ldquo;{searchTerm}&rdquo; o los filtros seleccionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ALL');
              setSelectedBrand('ALL');
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Restablecer todos los filtros
          </button>
        </div>
      )}
    </div>
  );
};
