import { IFurnitureArchetype, FurnitureConfig, FurniturePanel, DimensionUnit } from '../../types/furniture';
import { generatePanelsForConfig } from '../../data/furnitureTemplates';

export const tvUnitArchetype: IFurnitureArchetype = {
  id: 'tv-unit',
  label: 'TV Console Unit',
  description: 'Media console unit with backer panel, cable channels, and lower storage drawers',
  defaultConfig: (unit: DimensionUnit = 'ft') => {
    const w = unit === 'mm' ? 2100 : unit === 'inch' ? 84 : 7;
    const h = unit === 'mm' ? 1500 : unit === 'inch' ? 60 : 5;
    const d = unit === 'mm' ? 400 : unit === 'inch' ? 16 : 1.33;

    const config: FurnitureConfig = {
      id: `est-tv-${Date.now()}`,
      title: 'TV Console Unit',
      type: 'tv-unit',
      carcassSubType: 'base-cabinet',
      skirtingHeight: unit === 'mm' ? 100 : unit === 'inch' ? 4 : 0.33,
      dimensions: { width: w, height: h, depth: d, unit },
      panelThicknessMm: 18,
      shelvesCount: 2,
      shelfThicknessMm: 18,
      drawersCount: 3,
      hasBackPanel: true,
      backPanelMaterialId: 'mat-hdhmr-18',
      backPanelThicknessMm: 18,
      defaultMaterialId: 'mat-hdhmr-18',
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
    { id: 'config', label: 'Console Config', iconName: 'Settings2' },
    { id: 'lighting', label: 'LED Lights', iconName: 'Lightbulb' },
  ],
};
