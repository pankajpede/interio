import React, { useState } from 'react';
import { FurnitureConfig, WardrobeSection, WardrobeCompartment, CompartmentModuleType } from '../../types/furniture';
import { Layers, Box, Plus, Trash2, ChevronDown, ChevronRight, Sliders, MoveUp, MoveDown, Lock, Shirt, Grid } from 'lucide-react';

interface WardrobeSectionManagerProps {
  config: FurnitureConfig;
  selectedPanelId: string | null;
  onSelectPanel: (id: string | null) => void;
  onChangeConfig: (updated: FurnitureConfig) => void;
}

export const WardrobeSectionManager: React.FC<WardrobeSectionManagerProps> = ({
  config,
  selectedPanelId,
  onSelectPanel,
  onChangeConfig,
}) => {
  // Keep track of open section IDs (open all sections by default)
  const [openSectionIds, setOpenSectionIds] = useState<string[]>(() =>
    config.wardrobeSections ? config.wardrobeSections.map((s) => s.id) : ['sec-1', 'sec-2']
  );
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  if (config.type !== 'wardrobe' || !config.wardrobeSections) return null;

  // Auto-expand section accordion when user selects a compartment in 3D canvas
  React.useEffect(() => {
    if (selectedPanelId && selectedPanelId.startsWith('comp-')) {
      const secIndex = parseInt(selectedPanelId.split('-')[1]);
      const secId = `sec-${secIndex}`;
      if (secId && !openSectionIds.includes(secId)) {
        setOpenSectionIds((prev) => [...prev, secId]);
      }
    }
  }, [selectedPanelId]);

  const sections = config.wardrobeSections;

  const toggleSectionOpen = (secId: string) => {
    setOpenSectionIds((prev) =>
      prev.includes(secId) ? prev.filter((id) => id !== secId) : [...prev, secId]
    );
  };

  const updateSection = (secIdx: number, updatedSec: WardrobeSection) => {
    const updatedSections = [...sections];
    updatedSections[secIdx] = updatedSec;
    onChangeConfig({ ...config, wardrobeSections: updatedSections });
  };

  const addCompartmentToSection = (secIdx: number) => {
    const sec = sections[secIdx];
    const compCount = sec.compartments.length;
    const newComp: WardrobeCompartment = {
      id: `comp-${secIdx + 1}-${compCount + 1}`,
      name: `Compartment #${compCount + 1}`,
      moduleType: 'shelves-grid',
      heightFt: 1.5,
      shelvesCount: 1,
    };

    updateSection(secIdx, {
      ...sec,
      compartments: [...sec.compartments, newComp],
    });
  };

  const removeCompartmentFromSection = (secIdx: number, compIdx: number) => {
    const sec = sections[secIdx];
    if (sec.compartments.length <= 1) return; // keep at least 1
    const updatedComps = sec.compartments.filter((_, idx) => idx !== compIdx);
    updateSection(secIdx, {
      ...sec,
      compartments: updatedComps,
    });
  };

  const getModuleIcon = (type: CompartmentModuleType) => {
    if (type === 'hanging-single' || type === 'hanging-double') return <Shirt className="w-3.5 h-3.5 text-blue-500" />;
    if (type === 'drawer-pack') return <Box className="w-3.5 h-3.5 text-amber-500" />;
    if (type === 'locker-box') return <Lock className="w-3.5 h-3.5 text-emerald-500" />;
    return <Grid className="w-3.5 h-3.5 text-purple-500" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              Wardrobe Section & Compartment Accordion Manager
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Customize height, width, and interior module element for each compartment
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
          {sections.length} Active Bays
        </span>
      </div>

      {/* Accordion List for each Wardrobe Section/Bay */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sections.map((sec, secIdx) => {
          const isOpen = openSectionIds.includes(sec.id);

          return (
            <div
              key={sec.id}
              className={`rounded-xl border transition-all ${
                isOpen ? 'border-blue-300 bg-slate-50/70 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              {/* Accordion Header */}
              <div
                onClick={() => toggleSectionOpen(sec.id)}
                className="p-2.5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{sec.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">({sec.widthFt.toFixed(1)} ft wide)</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {sec.compartments.length} Compartment Accordions
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addCompartmentToSection(secIdx);
                  }}
                  className="px-2 py-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Zone
                </button>
              </div>

              {/* Accordion Body: Compartments List */}
              {isOpen && (
                <div className="p-2.5 pt-0 space-y-2 border-t border-slate-100 mt-1">
                  {sec.compartments.map((comp, compIdx) => {
                    const compId = `comp-${secIdx + 1}-${compIdx + 1}`;
                    const isSelected = selectedPanelId === compId;

                    return (
                      <div
                        key={comp.id || compId}
                        onClick={() => onSelectPanel(compId)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-400/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getModuleIcon(comp.moduleType)}
                            <span className="text-xs font-bold text-slate-800">
                              Zone #{compIdx + 1}: {comp.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {sec.compartments.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCompartmentFromSection(secIdx, compIdx);
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Remove compartment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Compartment Options: Element Preset + Height & Width inputs */}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                          {/* Module Element Preset Dropdown */}
                          <div className="relative">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Interior Element
                            </span>
                            {(() => {
                              const moduleOptions: { id: CompartmentModuleType; label: string }[] = [
                                { id: 'hanging-single', label: 'Dress / Shirt Hanger' },
                                { id: 'hanging-double', label: 'Double Coat Hanger' },
                                { id: 'shelves-grid', label: 'Folded Clothes Shelf' },
                                { id: 'drawer-pack', label: 'Internal Drawer Unit' },
                                { id: 'locker-box', label: 'Lockable Locker Vault' },
                              ];
                              const curModule = moduleOptions.find((m) => m.id === comp.moduleType) || moduleOptions[0];
                              const dropdownKey = `sec-comp-module-${secIdx}-${compIdx}`;
                              const isOpen = activeDropdownId === dropdownKey;

                              return (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownId(isOpen ? null : dropdownKey);
                                    }}
                                    className="w-full text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-slate-800 flex items-center justify-between transition-all focus:ring-1 focus:ring-blue-500 shadow-xs"
                                  >
                                    <span className="truncate">{curModule.label}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                                  </button>

                                  {isOpen && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-40"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDropdownId(null);
                                        }}
                                      />
                                      <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 overflow-hidden animate-in fade-in duration-100">
                                        {moduleOptions.map((opt) => (
                                          <button
                                            key={opt.id}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const newType = opt.id;
                                              const defaultH: Record<string, number> = {
                                                'hanging-single': 4.0,
                                                'hanging-double': 4.5,
                                                'shelves-grid': 1.8,
                                                'drawer-pack': 1.6,
                                                'locker-box': 1.2,
                                              };
                                              const updatedComps = [...sec.compartments];
                                              updatedComps[compIdx] = {
                                                ...comp,
                                                moduleType: newType,
                                                heightFt: defaultH[newType] || comp.heightFt,
                                              };
                                              updateSection(secIdx, { ...sec, compartments: updatedComps });
                                              setActiveDropdownId(null);
                                            }}
                                            className={`w-full px-2.5 py-1 text-left text-[11px] font-medium flex items-center justify-between transition-colors ${comp.moduleType === opt.id
                                              ? 'bg-blue-50 text-blue-600 font-bold'
                                              : 'text-slate-700 hover:bg-slate-50'
                                              }`}
                                          >
                                            <span>{opt.label}</span>
                                            {comp.moduleType === opt.id && (
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

                          {/* Height Input (ft & in) */}
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Height (ft)
                            </span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.1"
                                min="0.5"
                                max="6.0"
                                value={comp.heightFt}
                                onChange={(e) => {
                                  const newH = Math.max(0.5, parseFloat(e.target.value) || 1.0);
                                  const updatedComps = [...sec.compartments];
                                  updatedComps[compIdx] = { ...comp, heightFt: newH };
                                  updateSection(secIdx, { ...sec, compartments: updatedComps });
                                }}
                                className="w-full text-[11px] font-bold bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-900 text-center"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
