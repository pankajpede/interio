import React from 'react';
import { FurnitureConfig, FurnitureType, DimensionUnit, MaterialItem } from '../../types/furniture';
import { normalizeToFeet, createDefaultWardrobeSections } from '../../data/furnitureTemplates';
import { Layers, Box, Ruler, RotateCcw, Save, Settings, Calculator, Receipt, Lightbulb } from 'lucide-react';

interface FurnitureInputProps {
  config: FurnitureConfig;
  materialsMaster: MaterialItem[];
  onChangeConfig: (updated: FurnitureConfig) => void;
  onNewEstimate?: () => void;
  onSaveLocally?: () => void;
  onOpenSettings?: () => void;
  isCostSummaryOpen?: boolean;
  onToggleCostSummary?: () => void;
  onOpenInvoice?: () => void;
}

export const FurnitureInput: React.FC<FurnitureInputProps> = ({
  config,
  materialsMaster,
  onChangeConfig,
  onNewEstimate,
  onSaveLocally,
  onOpenSettings,
  isCostSummaryOpen,
  onToggleCostSummary,
  onOpenInvoice,
}) => {
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

    onChangeConfig({
      ...config,
      type,
      title,
    });
  };

  const handleDimChange = (field: 'width' | 'height' | 'depth', val: number) => {
    onChangeConfig({
      ...config,
      dimensions: {
        ...config.dimensions,
        [field]: Math.max(0.1, val),
      },
    });
  };

  const handleUnitChange = (unit: DimensionUnit) => {
    onChangeConfig({
      ...config,
      dimensions: {
        ...config.dimensions,
        unit,
      },
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2.5 px-3.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Left Group: Logo/Title, Type Selector & Compact Dimensions Badge */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Brand Logo & Product Dropdown */}
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-extrabold text-slate-900 leading-none tracking-tight">
            FurnitureCost
          </h1>
          <div className="relative">
            {(() => {
              const [isOpen, setIsOpen] = React.useState(false);
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
              const curLabel = typeOptions.find((t) => t.id === config.type)?.label || 'Carcass Unit';

              return (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition-all focus:outline-none shadow-xs"
                  >
                    <span>{curLabel}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                      <div className="absolute top-full mt-1.5 left-0 z-50 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 overflow-hidden animate-in fade-in duration-100">
                        {typeOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              handleTypeChange(opt.id);
                              setIsOpen(false);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center justify-between transition-colors ${config.type === opt.id
                              ? 'bg-blue-50 text-blue-600 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                              }`}
                          >
                            <span>{opt.label}</span>
                            {config.type === opt.id && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Overall Dimensions Summary Pill */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
          <Ruler className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            {config.dimensions.width} × {config.dimensions.height} × {config.dimensions.depth} {config.dimensions.unit}
          </span>
          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-mono">
            {config.panelThicknessMm}mm
          </span>
        </div>
      </div>

      {/* Right Group: 5 Action Buttons */}
      <div className="flex items-center gap-1.5">
        {onNewEstimate && (
          <div className="relative group">
            <button
              onClick={onNewEstimate}
              className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-all shadow-xs flex items-center justify-center"
              aria-label="New Estimate"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none">
              New Estimate
            </div>
          </div>
        )}

        {onSaveLocally && (
          <div className="relative group">
            <button
              onClick={onSaveLocally}
              className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-all shadow-xs flex items-center justify-center"
              aria-label="Save Locally"
            >
              <Save className="w-4 h-4" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none">
              Save Locally
            </div>
          </div>
        )}

        {onOpenSettings && (
          <div className="relative group">
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-all shadow-xs flex items-center justify-center"
              aria-label="Master Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none">
              Master Settings
            </div>
          </div>
        )}

        {onToggleCostSummary && (
          <div className="relative group">
            <button
              onClick={onToggleCostSummary}
              className={`p-2 rounded-xl transition-all shadow-xs flex items-center justify-center border ${isCostSummaryOpen
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent'
                }`}
              aria-label="Cost Calculation Summary"
            >
              <Calculator className="w-4 h-4" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none">
              Cost Summary ({isCostSummaryOpen ? 'Hide' : 'Show'})
            </div>
          </div>
        )}

        {onOpenInvoice && (
          <div className="relative group">
            <button
              onClick={onOpenInvoice}
              className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center justify-center"
              aria-label="Generate Invoice"
            >
              <Receipt className="w-4 h-4" />
            </button>
            <div className="absolute top-full mt-2 right-0 hidden group-hover:block z-50 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none">
              Generate Invoice & Job Sheet
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

