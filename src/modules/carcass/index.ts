import { IFurnitureArchetype, FurnitureConfig, FurniturePanel, DimensionUnit } from '../../types/furniture';
import { generatePanelsForConfig, createDefaultBookshelf } from '../../data/furnitureTemplates';

export const carcassArchetype: IFurnitureArchetype = {
  id: 'custom',
  label: 'Carcass / Modular Cabinet',
  description: 'Parametric carcass cabinet with customizable shelves, partitions, back panel, and integrated lighting',
  defaultConfig: (unit: DimensionUnit = 'ft') => createDefaultBookshelf(unit),
  generatePanels: (config: FurnitureConfig): FurniturePanel[] => generatePanelsForConfig(config),
  getInspectorTabs: (config: FurnitureConfig) => [
    { id: 'config', label: 'Carcass Config', iconName: 'Settings2' },
    { id: 'lighting', label: 'LED Lights', iconName: 'Lightbulb' },
    { id: 'zones', label: 'Zones & Bays', iconName: 'Box' },
  ],
};
