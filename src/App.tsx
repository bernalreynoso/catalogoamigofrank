import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUploadZone } from './components/FileUploadZone';
import { CatalogView } from './components/CatalogView';
import { OmittedView } from './components/OmittedView';
import { ChangesView } from './components/ChangesView';
import { SettingsModal } from './components/SettingsModal';
import { DebugModal } from './components/DebugModal';
import { AppSettings, CatalogData } from './types';
import { exportCatalogToExcel } from './utils/excelExporter';
import {
  compareCatalogs,
  ComparisonReport,
  getPreviousListFromLocalStorage,
  saveListToLocalStorage,
  clearPreviousListFromLocalStorage,
} from './utils/comparisonUtils';

const SETTINGS_STORAGE_KEY = 'catalogo_express_settings_v1';
const CURRENT_CATALOG_STORAGE_KEY = 'catalogo_express_current_data_v1';

const defaultSettings: AppSettings = {
  supplierCardSurchargePercent: 2,
  logistics: {
    mode: 'car',
    carGasoline: 150,
    carParking: 80,
    metroCost: 24,
    customAmount: 0,
  },
  marginMode: 'tier',
  manualMarginPercent: 8,
  selectedCardPlan: '1_pago',
  priceDisplayMode: 'both',
  whatsAppFormat: 'compact',
  showCostBreakdown: true,
};

export default function App() {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'changes' | 'omitted'>('catalog');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsed,
          logistics: { ...defaultSettings.logistics, ...(parsed.logistics || {}) },
        };
      }
    } catch (e) {
      console.warn('Error reading settings from localStorage:', e);
    }
    return defaultSettings;
  });

  // Comparison Report against previous list
  const [comparisonReport, setComparisonReport] = useState<ComparisonReport>({
    totalNew: 0,
    totalRemoved: 0,
    totalPriceUp: 0,
    totalPriceDown: 0,
    totalUnchanged: 0,
    changes: [],
  });

  // Load saved catalog from localStorage on mount if present
  useEffect(() => {
    try {
      const savedCatalog = localStorage.getItem(CURRENT_CATALOG_STORAGE_KEY);
      if (savedCatalog) {
        const parsed: CatalogData = JSON.parse(savedCatalog);
        setCatalog(parsed);

        // Compare against previous list
        const prevSnapshot = getPreviousListFromLocalStorage();
        const report = compareCatalogs(parsed.products, prevSnapshot);
        setComparisonReport(report);
      }
    } catch (e) {
      console.warn('Error restoring current catalog:', e);
    }
  }, []);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Error saving settings to localStorage:', e);
    }
  };

  const handleCatalogLoaded = (newCatalog: CatalogData) => {
    // 1. Compare against previous baseline
    const prevSnapshot = getPreviousListFromLocalStorage();
    const report = compareCatalogs(newCatalog.products, prevSnapshot);
    setComparisonReport(report);

    // 2. If no previous snapshot existed, automatically save this new one as baseline
    if (!prevSnapshot || !prevSnapshot.products || prevSnapshot.products.length === 0) {
      saveListToLocalStorage(newCatalog);
    }

    // 3. Save current active catalog for session persistence
    try {
      localStorage.setItem(CURRENT_CATALOG_STORAGE_KEY, JSON.stringify(newCatalog));
    } catch (e) {
      console.warn('Error saving active catalog:', e);
    }

    setCatalog(newCatalog);
    setIsUploadOpen(false);
    setActiveTab('catalog');
  };

  const handleSaveAsBaseline = () => {
    if (!catalog) return;
    saveListToLocalStorage(catalog);
    const prevSnapshot = getPreviousListFromLocalStorage();
    const report = compareCatalogs(catalog.products, prevSnapshot);
    setComparisonReport(report);
  };

  const handleResetBaseline = () => {
    clearPreviousListFromLocalStorage();
    if (catalog) {
      const report = compareCatalogs(catalog.products, null);
      setComparisonReport(report);
    }
  };

  const handleExportExcel = async () => {
    if (!catalog) return;
    setIsExporting(true);
    try {
      await exportCatalogToExcel(catalog, settings);
    } catch (err) {
      console.error('Error exportando Excel:', err);
      alert('Hubo un error al exportar el archivo Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const totalActionableChanges =
    comparisonReport.totalNew +
    comparisonReport.totalRemoved +
    comparisonReport.totalPriceUp +
    comparisonReport.totalPriceDown;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        catalog={catalog}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsUploadOpen(false);
        }}
        changesCount={totalActionableChanges}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUpload={() => setIsUploadOpen(!isUploadOpen)}
        onOpenDebug={() => setIsDebugOpen(true)}
        onExportExcel={handleExportExcel}
        isExporting={isExporting}
        settings={settings}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Upload Zone (Shown when no catalog, or when explicitly opened) */}
        {!catalog || isUploadOpen ? (
          <FileUploadZone
            onCatalogLoaded={handleCatalogLoaded}
            onCancel={catalog ? () => setIsUploadOpen(false) : undefined}
            hasExistingCatalog={!!catalog}
          />
        ) : (
          <>
            {activeTab === 'catalog' && (
              <CatalogView
                catalog={catalog}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            )}

            {activeTab === 'changes' && (
              <ChangesView
                report={comparisonReport}
                onSaveAsBaseline={handleSaveAsBaseline}
                onResetBaseline={handleResetBaseline}
                hasBaseline={!!getPreviousListFromLocalStorage()}
              />
            )}

            {activeTab === 'omitted' && (
              <OmittedView omitted={catalog.omitted} />
            )}
          </>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
      />

      {/* Debug Modal */}
      {catalog && (
        <DebugModal
          isOpen={isDebugOpen}
          onClose={() => setIsDebugOpen(false)}
          debugRows={catalog.debugRows}
        />
      )}
    </div>
  );
}
