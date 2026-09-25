import React, { useState, useEffect, useMemo } from 'react';
import {
  FurnitureConfig,
  CompanySettings,
  MaterialItem,
  FinishItem,
  EdgeFinishItem,
  HardwareItem,
  LabourItem,
  EstimateRecord,
  CalculationBreakdown
} from './types/furniture';
import {
  INITIAL_MATERIALS,
  INITIAL_FINISHES,
  INITIAL_EDGE_FINISHES,
  INITIAL_HARDWARE,
  INITIAL_LABOUR,
  DEFAULT_COMPANY_SETTINGS
} from './data/defaultData';
import { createDefaultBookshelf, generatePanelsForConfig, normalizeToFeet, createDefaultWardrobeSections } from './data/furnitureTemplates';
import { calculateFurnitureCost } from './engine/calculationEngine';

import { FurnitureCanvas } from './components/three/FurnitureCanvas';
import { FurnitureInput } from './components/furniture/FurnitureInput';
import { PanelConfiguration } from './components/panels/PanelConfiguration';
import { CostSummary } from './components/calculator/CostSummary';
import { InvoiceModal } from './components/invoice/InvoiceModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { WardrobeSectionManager } from './components/wardrobe/WardrobeSectionManager';

import {
  Box,
  Layers,
  Receipt,
  Settings,
  Plus,
  Save,
  FileText,
  Eye,
  RotateCcw,
  Sparkles,
  CheckCircle,
  FolderOpen,
  Calculator,
  X,
  Ruler,
  ChevronDown,
  Maximize2,
  Camera
} from 'lucide-react';


export function App() {
  // Master settings state initialized from localStorage
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('interio-v1-company');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_SETTINGS;
  });

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    const saved = localStorage.getItem('interio-v1-materials');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [finishes, setFinishes] = useState<FinishItem[]>(() => {
    const saved = localStorage.getItem('interio-v1-finishes');
    return saved ? JSON.parse(saved) : INITIAL_FINISHES;
  });

  const [edges, setEdges] = useState<EdgeFinishItem[]>(() => {
    const saved = localStorage.getItem('interio-v1-edges');
    return saved ? JSON.parse(saved) : INITIAL_EDGE_FINISHES;
  });

  const [hardware, setHardware] = useState<HardwareItem[]>(() => {
    const saved = localStorage.getItem('interio-v1-hardware');
    return saved ? JSON.parse(saved) : INITIAL_HARDWARE;
  });

  const [labour, setLabour] = useState<LabourItem[]>(() => {
    const saved = localStorage.getItem('interio-v1-labour');
    return saved ? JSON.parse(saved) : INITIAL_LABOUR;
  });

  // Current Estimate multi-furniture items
  const [furnitureConfigs, setFurnitureConfigs] = useState<FurnitureConfig[]>(() => {
    const saved = localStorage.getItem('interio-v1-current-estimate');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [createDefaultBookshelf()];
  });

  const [activeFurnitureIndex, setActiveFurnitureIndex] = useState<number>(0);
  const activeConfig = furnitureConfigs[activeFurnitureIndex] || furnitureConfigs[0];

  // Global cost variables
  const [wastagePercent, setWastagePercent] = useState<number>(0);
  const [marginPercent, setMarginPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(18);

  // 3D Canvas View Controls
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'3D' | 'Front' | 'Back' | 'Left' | 'Right' | 'Top'>('3D');

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState(false);

  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isCostSummaryOpen, setIsCostSummaryOpen] = useState(false);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string | null>(null);

  const handleOpenInvoice = () => {
    try {
      const canvasEl = document.querySelector('canvas');
      if (canvasEl) {
        setCanvasDataUrl(canvasEl.toDataURL('image/png'));
      }
    } catch (e) {
      console.error(e);
    }
    setIsInvoiceOpen(true);
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto persist state to localStorage
  useEffect(() => {
    localStorage.setItem('interio-v1-company', JSON.stringify(companySettings));
    localStorage.setItem('interio-v1-materials', JSON.stringify(materials));
    localStorage.setItem('interio-v1-finishes', JSON.stringify(finishes));
    localStorage.setItem('interio-v1-edges', JSON.stringify(edges));
    localStorage.setItem('interio-v1-hardware', JSON.stringify(hardware));
    localStorage.setItem('interio-v1-labour', JSON.stringify(labour));
    localStorage.setItem('interio-v1-current-estimate', JSON.stringify(furnitureConfigs));
  }, [companySettings, materials, finishes, edges, hardware, labour, furnitureConfigs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Recalculate panels when structural parameters change
  const handleUpdateActiveConfig = (updated: FurnitureConfig) => {
    // Regenerate panels if dimensions/type/shelves change
    const isStructureChanged =
      updated.dimensions.width !== activeConfig.dimensions.width ||
      updated.dimensions.height !== activeConfig.dimensions.height ||
      updated.dimensions.depth !== activeConfig.dimensions.depth ||
      updated.dimensions.unit !== activeConfig.dimensions.unit ||
      updated.shelvesCount !== activeConfig.shelvesCount ||
      updated.sectionsCount !== activeConfig.sectionsCount ||
      updated.separateShelves !== activeConfig.separateShelves ||
      updated.hasBackPanel !== activeConfig.hasBackPanel ||
      updated.type !== activeConfig.type;

    let finalConfig = updated;
    if (isStructureChanged) {
      const regeneratedPanels = generatePanelsForConfig(updated);
      // Preserve existing lighting customizations on matching panel IDs
      const mergedPanels = regeneratedPanels.map((newP) => {
        const existingP = updated.panels.find((p) => p.id === newP.id);
        return existingP?.lighting ? { ...newP, lighting: existingP.lighting } : newP;
      });

      const wFt = normalizeToFeet(updated.dimensions.width, updated.dimensions.unit);
      const hFt = normalizeToFeet(updated.dimensions.height, updated.dimensions.unit);
      const secCount = updated.sectionsCount || 2;
      const wardrobeSections =
        updated.type === 'wardrobe'
          ? (!updated.wardrobeSections || updated.wardrobeSections.length !== secCount
            ? createDefaultWardrobeSections(secCount, hFt, wFt)
            : updated.wardrobeSections)
          : updated.wardrobeSections;

      finalConfig = {
        ...updated,
        sectionsCount: updated.type === 'wardrobe' ? secCount : updated.sectionsCount,
        wardrobeSections,
        panels: mergedPanels,
      };
    }

    const updatedList = [...furnitureConfigs];
    updatedList[activeFurnitureIndex] = finalConfig;
    setFurnitureConfigs(updatedList);
  };

  // Compute live breakdown for each furniture item
  const breakdowns = useMemo(() => {
    return furnitureConfigs.map((cfg) =>
      calculateFurnitureCost(
        cfg,
        materials,
        finishes,
        edges,
        hardware,
        labour,
        wastagePercent,
        taxPercent,
        marginPercent
      )
    );
  }, [furnitureConfigs, materials, finishes, edges, hardware, labour, wastagePercent, taxPercent, marginPercent]);

  const activeBreakdown = breakdowns[activeFurnitureIndex] || breakdowns[0];

  const handleAddFurnitureItem = () => {
    const newItem = createDefaultBookshelf();
    newItem.id = `est-item-${Date.now()}`;
    newItem.title = `Furniture Item #${furnitureConfigs.length + 1}`;
    setFurnitureConfigs([...furnitureConfigs, newItem]);
    setActiveFurnitureIndex(furnitureConfigs.length);
    showToast('New furniture item added');
  };

  const handleNewEstimate = () => {
    if (window.confirm('Start a new estimate? Unsaved changes will be cleared.')) {
      setFurnitureConfigs([createDefaultBookshelf()]);
      setActiveFurnitureIndex(0);
      showToast('Started new estimate');
    }
  };

  const handleSaveLocally = () => {
    localStorage.setItem('interio-v1-saved-estimate-snapshot', JSON.stringify(furnitureConfigs));
    showToast('Estimate successfully saved to localStorage!');
  };

  const handleTypeChange = (type: FurnitureType) => {
    let title = 'Furniture Unit';
    if (type === 'bookshelf') title = 'Carcass Unit';
    else if (type === 'wardrobe') title = 'Modular Wardrobe';
    else if (type === 'tv-unit') title = 'TV Console Unit';
    else if (type === 'study-table') title = 'Study Table Desk';
    else if (type === 'base-cabinet') title = 'Kitchen Base Cabinet';
    else if (type === 'wall-cabinet') title = 'Wall Overhead Cabinet';
    else if (type === 'shoe-rack') title = 'Shoe Storage Rack';
    else title = 'Custom Furniture';

    handleUpdateActiveConfig({
      ...activeConfig,
      type,
      title,
    });
  };


  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5]">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Main Full-Height App Grid Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 w-full max-w-[1920px] mx-auto">
        {/* Middle Main Section: Interactive 3D Canvas View & Designing Viewport */}
        <div className={`transition-all duration-300 ${isCostSummaryOpen ? 'lg:col-span-9' : 'lg:col-span-12'} flex flex-col gap-4`} style={{ height: 'calc(100vh - 24px)' }}>
          <div className="flex-1 relative bg-slate-950 overflow-hidden shadow-md border border-slate-800">
            {/* Unified 3D Canvas Floating Header Overlay Bar */}
            <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none select-none">
              {/* Left Group: Brand, Furniture Type Selector, 3D Camera Presets */}
              <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 px-3 rounded-2xl border border-slate-700/80 shadow-xl pointer-events-auto">
                <span className="text-xs font-black text-white tracking-tight">FurnitureCost</span>

                {/* Custom Furniture Type Dropdown */}
                <div className="relative">
                  {(() => {
                    const typeOptions: { id: FurnitureType; label: string }[] = [
                      { id: 'bookshelf', label: 'Carcass Unit' },
                      { id: 'wardrobe', label: 'Modular Wardrobe' },
                      { id: 'tv-unit', label: 'TV Console Unit' },
                      { id: 'study-table', label: 'Study Table' },
                      { id: 'base-cabinet', label: 'Base Cabinet' },
                      { id: 'wall-cabinet', label: 'Wall Cabinet' },
                      { id: 'shoe-rack', label: 'Shoe Rack' },
                      { id: 'custom', label: 'Custom Furniture' },
                    ];
                    const currentTypeLabel = typeOptions.find((t) => t.id === activeConfig.type)?.label || 'Carcass Unit';

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsTypeDropdownOpen(!isTypeDropdownOpen);
                            setIsCameraDropdownOpen(false);
                          }}
                          className="text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition-all focus:outline-none shadow-sm"
                        >
                          <span>{currentTypeLabel}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isTypeDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen(false)} />
                            <div className="absolute top-full mt-1.5 left-0 z-50 w-44 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl py-1 backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                              {typeOptions.map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    handleTypeChange(opt.id);
                                    setIsTypeDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center justify-between transition-colors ${activeConfig.type === opt.id
                                    ? 'bg-blue-600/20 text-blue-400 font-semibold'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                  <span>{opt.label}</span>
                                  {activeConfig.type === opt.id && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="h-4 w-px bg-slate-700/80 my-auto mx-0.5" />

                {/* Custom 3D Camera View Angle Dropdown Selector */}
                <div className="relative">
                  {(() => {
                    const cameraOptions: { id: typeof cameraPreset; label: string }[] = [
                      { id: '3D', label: '3D View' },
                      { id: 'Front', label: 'Front View' },
                      { id: 'Back', label: 'Back View' },
                      { id: 'Left', label: 'Left Side' },
                      { id: 'Right', label: 'Right Side' },
                      { id: 'Top', label: 'Top View' },
                    ];
                    const currentCamLabel = cameraOptions.find((c) => c.id === cameraPreset)?.label || '3D View';

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCameraDropdownOpen(!isCameraDropdownOpen);
                            setIsTypeDropdownOpen(false);
                          }}
                          className="text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition-all focus:outline-none shadow-sm"
                        >
                          <span>{currentCamLabel}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCameraDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isCameraDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsCameraDropdownOpen(false)} />
                            <div className="absolute top-full mt-1.5 left-0 z-50 w-36 bg-slate-900/95 border border-slate-700/90 rounded-xl shadow-2xl py-1 backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                              {cameraOptions.map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setCameraPreset(opt.id);
                                    setIsCameraDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center justify-between transition-colors ${cameraPreset === opt.id
                                    ? 'bg-blue-600/20 text-blue-400 font-semibold'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                  <span>{opt.label}</span>
                                  {cameraPreset === opt.id && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>


              {/* Right Group: 5 Action Buttons & Dimensions Toggle */}
              <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 px-3 rounded-2xl border border-slate-700/80 shadow-xl pointer-events-auto">
                {/* 5 Action Buttons */}
                <div className="flex items-center gap-1">
                  <div className="relative group">
                    <button
                      onClick={handleNewEstimate}
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                      aria-label="New Estimate"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-2xl whitespace-nowrap pointer-events-none border border-slate-700/80">
                      New Estimate
                    </div>
                  </div>

                  <div className="relative group">
                    <button
                      onClick={handleSaveLocally}
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                      aria-label="Save Locally"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-2xl whitespace-nowrap pointer-events-none border border-slate-700/80">
                      Save Locally
                    </div>
                  </div>

                  <div className="relative group">
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                      aria-label="Master Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-2xl whitespace-nowrap pointer-events-none border border-slate-700/80">
                      Master Settings
                    </div>
                  </div>

                  <div className="relative group">
                    <button
                      onClick={() => setIsCostSummaryOpen(!isCostSummaryOpen)}
                      className={`p-1.5 rounded-lg transition-all ${isCostSummaryOpen ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                      aria-label="Cost Calculation Summary"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-2xl whitespace-nowrap pointer-events-none border border-slate-700/80">
                      Cost Summary ({isCostSummaryOpen ? 'Hide' : 'Show'})
                    </div>
                  </div>

                  <div className="relative group">
                    <button
                      onClick={handleOpenInvoice}
                      className="p-1.5 text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-xs"
                      aria-label="Generate Invoice"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                    <div className="absolute top-full mt-2 right-0 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-2xl whitespace-nowrap pointer-events-none border border-slate-700/80">
                      Generate Invoice & Job Sheet
                    </div>
                  </div>
                </div>


                <div className="h-4 w-px bg-slate-700/80 my-auto mx-0.5" />

                {/* Toggle Dimensions Icon Button */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => setShowDimensions(!showDimensions)}
                    className={`p-1.5 rounded-lg transition-all border flex items-center justify-center cursor-pointer ${showDimensions
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700'
                      }`}
                    aria-label="Toggle Dimensions Display"
                  >
                    <Ruler className="w-4 h-4" />
                  </button>
                  <div className="absolute top-full mt-2 right-0 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-2xl whitespace-nowrap pointer-events-none border border-slate-700/80">
                    Dimensions ({showDimensions ? 'ON' : 'OFF'})
                  </div>
                </div>
              </div>
            </div>


            {/* Render Three.js Parametric Canvas */}
            <FurnitureCanvas
              config={activeConfig}
              materialsMaster={materials}
              finishesMaster={finishes}
              edgesMaster={edges}
              selectedPanelId={selectedPanelId}
              onSelectPanel={setSelectedPanelId}
              showDimensions={showDimensions}
              cameraPreset={cameraPreset}
              onResetPreset={() => setCameraPreset('3D')}
              onChangeConfig={handleUpdateActiveConfig}
            />
          </div>
        </div>


        {/* Right Side Panel: Real-time Cost Summary & Detailed Calculations */}
        <div className={`transition-all duration-300 ${isCostSummaryOpen ? 'lg:col-span-3' : 'lg:col-span-0 hidden'} space-y-4`}>
          <div className="relative">
            <button
              onClick={() => setIsCostSummaryOpen(false)}
              className="absolute top-3 right-3 z-10 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
              title="Collapse Side Panel"
            >
              <X className="w-4 h-4" />
            </button>
            <CostSummary
              breakdown={activeBreakdown}
              wastagePercent={wastagePercent}
              marginPercent={marginPercent}
              taxPercent={taxPercent}
              onChangeWastage={setWastagePercent}
              onChangeMargin={setMarginPercent}
              onChangeTax={setTaxPercent}
              onOpenInvoice={handleOpenInvoice}
            />
          </div>
        </div>

        {/* Wardrobe Accordion Compartment & Section Manager */}
        {activeConfig.type === 'wardrobe' && (
          <div className="lg:col-span-12">
            <WardrobeSectionManager
              config={activeConfig}
              selectedPanelId={selectedPanelId}
              onSelectPanel={setSelectedPanelId}
              onChangeConfig={handleUpdateActiveConfig}
            />
          </div>
        )}
      </main>

      {/* Customer Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        companySettings={companySettings}
        furnitureConfigs={furnitureConfigs}
        breakdowns={breakdowns}
        canvasDataUrl={canvasDataUrl}
      />

      {/* Master Rates & Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        companySettings={companySettings}
        materials={materials}
        finishes={finishes}
        edges={edges}
        hardware={hardware}
        labour={labour}
        onSaveCompanySettings={setCompanySettings}
        onSaveMaterials={setMaterials}
        onSaveFinishes={setFinishes}
        onSaveEdges={setEdges}
        onSaveHardware={setHardware}
        onSaveLabour={setLabour}
      />
    </div>
  );
}
