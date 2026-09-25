import React from 'react';
import { FurnitureConfig, FurniturePanel, FinishItem, EdgeFinishItem, MaterialItem } from '../../types/furniture';
import { Layers, ChevronDown, ChevronRight } from 'lucide-react';

interface PanelConfigurationProps {
  config: FurnitureConfig;
  materialsMaster: MaterialItem[];
  finishesMaster: FinishItem[];
  edgesMaster: EdgeFinishItem[];
  selectedPanelId: string | null;
  onSelectPanel: (panelId: string) => void;
  onChangeConfig: (updated: FurnitureConfig) => void;
}

export const PanelConfiguration: React.FC<PanelConfigurationProps> = ({
  config,
  materialsMaster,
  finishesMaster,
  edgesMaster,
  selectedPanelId,
  onSelectPanel,
  onChangeConfig,
}) => {
  const [expandedPanelId, setExpandedPanelId] = React.useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = React.useState<string | null>(null);

  const updatePanelSurface = (panelId: string, surfaceType: string, enabled: boolean, finishId?: string) => {
    const updatedPanels = config.panels.map((p) => {
      if (p.id !== panelId) return p;
      const surfaces = p.surfaces.map((s) => {
        if (s.type !== surfaceType) return s;
        return {
          ...s,
          enabled,
          finishId: finishId !== undefined ? finishId : s.finishId,
        };
      });
      return { ...p, surfaces };
    });

    onChangeConfig({ ...config, panels: updatedPanels, surfacePreset: 'custom' });
  };

  const updatePanelEdge = (panelId: string, edgeType: string, enabled: boolean, finishId?: string) => {
    const updatedPanels = config.panels.map((p) => {
      if (p.id !== panelId) return p;
      const edges = p.edges.map((e) => {
        if (e.type !== edgeType) return e;
        return {
          ...e,
          enabled,
          finishId: finishId !== undefined ? finishId : e.finishId,
        };
      });
      return { ...p, edges };
    });

    onChangeConfig({ ...config, panels: updatedPanels });
  };

  const updatePanelMaterial = (panelId: string, materialId: string) => {
    const updatedPanels = config.panels.map((p) => {
      if (p.id !== panelId) return p;
      return { ...p, materialId };
    });

    onChangeConfig({ ...config, panels: updatedPanels });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Panel & Surface Finish Matrix
          </h2>
          <p className="text-[11px] text-slate-500">
            Configure surface-level laminates & edge bands for individual panels
          </p>
        </div>
      </div>

      {/* Expandable Panels List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {config.panels.map((panel) => {
          const isExpanded = expandedPanelId === panel.id;
          const isSelectedIn3D = selectedPanelId === panel.id;

          return (
            <div
              key={panel.id}
              className={`rounded-xl border transition-all ${
                isSelectedIn3D
                  ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              {/* Header Bar */}
              <div
                onClick={() => {
                  onSelectPanel(panel.id);
                  setExpandedPanelId(isExpanded ? null : panel.id);
                }}
                className="flex items-center justify-between p-3 cursor-pointer select-none gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div className="truncate">
                    <h3 className="text-xs font-semibold text-slate-800 truncate">
                      {panel.name}
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      {panel.widthFt.toFixed(1)}' × {panel.heightFt.toFixed(1)}' | Qty: {panel.quantity}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    {materialsMaster.find((m) => m.id === panel.materialId)?.name || 'Plywood'}
                  </span>
                </div>
              </div>

              {/* Body Content */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-3">
                  {/* Material Selector */}
                  <div className="relative">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Panel Core Material
                    </label>
                    {(() => {
                      const curMat = materialsMaster.find((m) => m.id === panel.materialId) || materialsMaster[0];
                      const dropdownKey = `mat-${panel.id}`;
                      const isOpen = activeDropdownId === dropdownKey;

                      return (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveDropdownId(isOpen ? null : dropdownKey)}
                            className="w-full text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 flex items-center justify-between transition-all focus:ring-1 focus:ring-blue-500 shadow-xs"
                          >
                            <span className="truncate">{curMat ? `${curMat.name} (₹${curMat.ratePerSqFt}/sq.ft)` : 'Select Material'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                              <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in duration-100">
                                {materialsMaster.map((m) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      updatePanelMaterial(panel.id, m.id);
                                      setActiveDropdownId(null);
                                    }}
                                    className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center justify-between transition-colors ${panel.materialId === m.id
                                      ? 'bg-blue-50 text-blue-600 font-bold'
                                      : 'text-slate-700 hover:bg-slate-50'
                                      }`}
                                  >
                                    <span>{m.name} (₹{m.ratePerSqFt}/sq.ft)</span>
                                    {panel.materialId === m.id && (
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

                  {/* Surface Finishes Matrix */}
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-700 mb-1.5">
                      Surface Finishes
                    </h4>
                    <div className="space-y-1.5">
                      {panel.surfaces.map((surf) => {
                        const curFinish = finishesMaster.find((f) => f.id === (surf.finishId || 'fin-none')) || finishesMaster[0];
                        const dropdownKey = `surf-${panel.id}-${surf.type}`;
                        const isOpen = activeDropdownId === dropdownKey;

                        return (
                          <div key={surf.type} className="flex items-center gap-2 text-xs bg-slate-50 p-1.5 rounded border border-slate-200 relative">
                            <input
                              type="checkbox"
                              checked={surf.enabled}
                              onChange={(e) => updatePanelSurface(panel.id, surf.type, e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="w-24 text-[11px] font-medium text-slate-700">
                              {surf.label}
                            </span>

                            <div className="relative flex-1">
                              <button
                                type="button"
                                disabled={!surf.enabled}
                                onClick={() => setActiveDropdownId(isOpen ? null : dropdownKey)}
                                className="w-full text-[11px] font-medium bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 disabled:opacity-50 flex items-center justify-between transition-all focus:ring-1 focus:ring-blue-500"
                              >
                                <span className="truncate">{curFinish ? `${curFinish.name} ${curFinish.ratePerSqFt ? `(₹${curFinish.ratePerSqFt}/sq.ft)` : ''}` : 'Select Finish'}</span>
                                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isOpen && surf.enabled && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                  <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in duration-100">
                                    {finishesMaster.map((f) => (
                                      <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => {
                                          updatePanelSurface(panel.id, surf.type, surf.enabled, f.id);
                                          setActiveDropdownId(null);
                                        }}
                                        className={`w-full px-2.5 py-1 text-left text-[11px] font-medium flex items-center justify-between transition-colors ${surf.finishId === f.id
                                          ? 'bg-blue-50 text-blue-600 font-bold'
                                          : 'text-slate-700 hover:bg-slate-50'
                                          }`}
                                      >
                                        <span className="truncate">{f.name} {f.ratePerSqFt ? `(₹${f.ratePerSqFt}/sq.ft)` : ''}</span>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Edge Bands Matrix */}
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-700 mb-1.5">
                      Edge Band Treatments
                    </h4>
                    <div className="space-y-1.5">
                      {panel.edges.map((edge) => {
                        const curEdge = edgesMaster.find((e) => e.id === (edge.finishId || 'edge-none')) || edgesMaster[0];
                        const dropdownKey = `edge-${panel.id}-${edge.type}`;
                        const isOpen = activeDropdownId === dropdownKey;

                        return (
                          <div key={edge.type} className="flex items-center gap-2 text-xs bg-slate-50 p-1.5 rounded border border-slate-200 relative">
                            <input
                              type="checkbox"
                              checked={edge.enabled}
                              onChange={(e) => updatePanelEdge(panel.id, edge.type, e.target.checked)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="w-24 text-[11px] font-medium text-slate-700">
                              {edge.label}
                            </span>

                            <div className="relative flex-1">
                              <button
                                type="button"
                                disabled={!edge.enabled}
                                onClick={() => setActiveDropdownId(isOpen ? null : dropdownKey)}
                                className="w-full text-[11px] font-medium bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 disabled:opacity-50 flex items-center justify-between transition-all focus:ring-1 focus:ring-blue-500"
                              >
                                <span className="truncate">{curEdge ? `${curEdge.name} ${curEdge.ratePerRft ? `(₹${curEdge.ratePerRft}/r.ft)` : ''}` : 'Select Edge Tape'}</span>
                                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isOpen && edge.enabled && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                  <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in duration-100">
                                    {edgesMaster.map((e) => (
                                      <button
                                        key={e.id}
                                        type="button"
                                        onClick={() => {
                                          updatePanelEdge(panel.id, edge.type, edge.enabled, e.id);
                                          setActiveDropdownId(null);
                                        }}
                                        className={`w-full px-2.5 py-1 text-left text-[11px] font-medium flex items-center justify-between transition-colors ${edge.finishId === e.id
                                          ? 'bg-blue-50 text-blue-600 font-bold'
                                          : 'text-slate-700 hover:bg-slate-50'
                                          }`}
                                      >
                                        <span className="truncate">{e.name} {e.ratePerRft ? `(₹${e.ratePerRft}/r.ft)` : ''}</span>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
