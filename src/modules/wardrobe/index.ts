import { IFurnitureArchetype, FurnitureConfig, FurniturePanel, DimensionUnit } from '../../types/furniture';
import { generatePanelsForConfig, createDefaultWardrobeSections, normalizeToFeet } from '../../data/furnitureTemplates';

export const wardrobeArchetype: IFurnitureArchetype = {
  id: 'wardrobe',
  label: 'Modular Wardrobe',
  description: 'Multi-bay wardrobe unit with customizable hanging zones, drawers, and compartment sections',
  defaultConfig: (unit: DimensionUnit = 'ft') => {
    const w = unit === 'mm' ? 1800 : unit === 'inch' ? 72 : 6;
    const h = unit === 'mm' ? 2100 : unit === 'inch' ? 84 : 7;
    const d = unit === 'mm' ? 600 : unit === 'inch' ? 24 : 2;
    const wFt = normalizeToFeet(w, unit);
    const hFt = normalizeToFeet(h, unit);

    const config: FurnitureConfig = {
      id: `est-wardrobe-${Date.now()}`,
      title: 'Modular Wardrobe',
      type: 'wardrobe',
      carcassSubType: 'tall-unit',
      skirtingHeight: unit === 'mm' ? 100 : unit === 'inch' ? 4 : 0.33,
      dimensions: { width: w, height: h, depth: d, unit },
      panelThicknessMm: 18,
      shelvesCount: 3,
      shelfThicknessMm: 18,
      sectionsCount: 2,
      wardrobeSections: createDefaultWardrobeSections(2, hFt, wFt),
      hasBackPanel: true,
      backPanelMaterialId: 'mat-mdf-6',
      backPanelThicknessMm: 6,
      defaultMaterialId: 'mat-bwp-18',
      defaultOuterFinishId: 'fin-walnut',
      defaultInnerFinishId: 'fin-none',
      defaultEdgeFinishId: 'edge-walnut-2',
      surfacePreset: 'external-only',
      panels: [],
    };
    config.panels = generatePanelsForConfig(config);
    return config;
  },
  generatePanels: (config: FurnitureConfig): FurniturePanel[] => generatePanelsForConfig(config),
  getInspectorTabs: (config: FurnitureConfig) => [
    { id: 'config', label: 'Carcass Config', iconName: 'Settings2' },
    { id: 'lighting', label: 'LED Lights', iconName: 'Lightbulb' },
  ],
};
