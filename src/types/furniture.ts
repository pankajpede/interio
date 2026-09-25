export type FurnitureType =
  | 'bookshelf'
  | 'wardrobe'
  | 'tv-unit'
  | 'study-table'
  | 'base-cabinet'
  | 'wall-cabinet'
  | 'shoe-rack'
  | 'custom';

export type DimensionUnit = 'ft' | 'inch' | 'mm';

export type SurfaceType = 'outer' | 'inner' | 'top' | 'bottom' | 'front' | 'back';
export type EdgeType = 'front' | 'back' | 'left' | 'right';

export type SurfacePreset =
  | 'external-only'
  | 'fully-laminated'
  | 'external-shelf-tops'
  | 'raw-interior'
  | 'custom';

export interface PanelSurface {
  type: SurfaceType;
  label: string;
  enabled: boolean;
  finishId?: string; // ID of finish in finish master
}

export interface PanelEdge {
  type: EdgeType;
  label: string;
  enabled: boolean;
  finishId?: string; // ID of edge finish (PVC edge band)
}

export type LightingFixtureType = 'spotlight' | 'strip' | 'none';
export type LightingColorTemp = '3000K' | '4000K' | '6000K';

export interface PanelLighting {
  enabled: boolean;
  type: 'under-shelf-strip' | 'top-spotlight' | 'side-profile' | 'backlight';
  fixtureType?: LightingFixtureType; // 'spotlight' | 'strip' | 'none'
  colorTemp: LightingColorTemp; // 3000K Warm, 4000K Neutral, 6000K Cool
  intensity: number; // 0.1 to 2.0
}

export interface FurniturePanel {
  id: string;
  name: string;
  category: 'side' | 'top' | 'bottom' | 'shelf' | 'back' | 'door' | 'drawer' | 'divider' | 'shutter';
  quantity: number;
  widthFt: number;  // normalised to feet
  heightFt: number; // normalised to feet
  depthFt: number;  // normalised to feet
  thicknessMm: number;
  materialId: string; // Material master ID
  surfaces: PanelSurface[];
  edges: PanelEdge[];
  lighting?: PanelLighting;
  isCompartment?: boolean;
  secIdx?: number;
  compIdx?: number;
  comp?: WardrobeCompartment;
}

export type CompartmentModuleType =
  | 'hanging-single'
  | 'hanging-double'
  | 'shelves-grid'
  | 'drawer-pack'
  | 'locker-box'
  | 'empty';

export interface WardrobeCompartment {
  id: string;
  name: string;
  moduleType: CompartmentModuleType;
  heightFt: number; // Height in feet
  shelvesCount?: number;
  drawersCount?: number;
}

export interface WardrobeSection {
  id: string;
  name: string;
  widthRatio: number; // e.g. 1 (equal width proportion)
  widthFt: number; // Computed width in feet
  compartmentsMode: 'equal' | 'custom' | 'preset';
  compartments: WardrobeCompartment[];
}

export type CarcassSubType = 'base-cabinet' | 'wall-cabinet' | 'tall-unit' | 'corner-cabinet';

export interface FurnitureConfig {
  id: string;
  title: string;
  type: FurnitureType;
  carcassSubType?: CarcassSubType;
  skirtingHeight?: number; // Height in current dimensions.unit
  // Raw inputs
  dimensions: {
    width: number;
    height: number;
    depth: number;
    unit: DimensionUnit;
  };
  panelThicknessMm: number;
  // Specific structure parameters
  shelvesCount: number;
  shelfThicknessMm: number;
  customShelfPositions?: number[]; // Custom Y positions for individual shelves (in feet)
  shelfPartitions?: Record<number, number>; // Mapping compartment index (0..shelvesCount) to partition count
  customPartitionWidths?: Record<string, number[]>; // Mapping compartment key "compIdx" to array of sub-compartment widths (in feet)
  shelfSubShelves?: Record<string, number>; // Mapping compKey ("compIdx" or "compIdx-subIdx") to inner horizontal sub-shelves count
  shelfSubPartitions?: Record<string, number>; // Mapping sub-compKey ("compIdx-subIdx") to inner vertical sub-partition count
  hasBackPanel: boolean;
  backPanelMaterialId: string;
  backPanelThicknessMm: number;
  // Wardrobe Multi-Bay & Compartment Configuration
  sectionsCount?: number;
  wardrobeSections?: WardrobeSection[];
  // Additional parametric options
  doorsCount?: number;
  drawersCount?: number;
  separateShelves?: boolean;
  // Lighting Preset Packages (Multi-Selectable)
  lightingPackage?: 'none' | 'top-spots' | 'under-shelves' | 'side-channels' | 'curated-premium';
  lightingPackages?: string[];
  // Master defaults used for new panels
  defaultMaterialId: string;
  defaultOuterFinishId: string;
  defaultInnerFinishId: string;
  defaultEdgeFinishId: string;
  surfacePreset: SurfacePreset;
  // Generated panels list (editable)
  panels: FurniturePanel[];
}

export interface MaterialItem {
  id: string;
  name: string;
  category: string; // Plywood, MDF, HDHMR, Blockboard
  thicknessMm: number;
  ratePerSqFt: number;
  unit: 'sq.ft' | 'sheet';
  sheetWidthFt: number;
  sheetHeightFt: number;
  enabled: boolean;
}

export interface FinishItem {
  id: string;
  name: string;
  type: 'laminate' | 'acrylic' | 'veneer' | 'pu' | 'membrane' | 'none';
  thicknessMm: number;
  ratePerSqFt: number;
  colorHex: string;
  textureUrl?: string;
  enabled: boolean;
}

export interface EdgeFinishItem {
  id: string;
  name: string;
  thicknessMm: number;
  ratePerRft: number; // Running ft
  colorHex: string;
  enabled: boolean;
}

export interface HardwareItem {
  id: string;
  name: string;
  rate: number;
  unit: 'piece' | 'pair' | 'set' | 'box' | 'fixed';
  quantity: number;
  enabled: boolean;
}

export interface LabourItem {
  id: string;
  name: string;
  rate: number;
  unit: 'sq.ft' | 'fixed';
  enabled: boolean;
}

export interface CalculationBreakdown {
  furnitureId: string;
  furnitureTitle: string;
  materials: {
    materialId: string;
    materialName: string;
    thicknessMm: number;
    ratePerSqFt: number;
    netSqFt: number;
    wastageSqFt: number;
    totalSqFt: number;
    estimatedSheets: number;
    amount: number;
  }[];
  finishes: {
    finishId: string;
    finishName: string;
    ratePerSqFt: number;
    netSqFt: number;
    wastageSqFt: number;
    totalSqFt: number;
    amount: number;
  }[];
  edges: {
    edgeId: string;
    edgeName: string;
    ratePerRft: number;
    netRft: number;
    wastageRft: number;
    totalRft: number;
    amount: number;
  }[];
  hardware: {
    hardwareId: string;
    hardwareName: string;
    unit: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  labour: {
    labourId: string;
    labourName: string;
    rate: number;
    unit: string;
    basisQuantity: number;
    amount: number;
  }[];
  materialSubtotal: number;
  finishSubtotal: number;
  edgeSubtotal: number;
  hardwareSubtotal: number;
  labourSubtotal: number;
  totalNetMaterialAreaSqFt: number;
  wastagePercent: number;
  wastageAmount: number;
  subtotalCost: number;
  marginPercent: number;
  marginAmount: number;
  sellingPriceBeforeTax: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
}

export interface CompanySettings {
  companyName: string;
  subtitle: string;
  logoDataUrl?: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  pan: string;
  invoicePrefix: string;
  lastInvoiceNumber: number;
  defaultTaxPercent: number;
  defaultMarginPercent: number;
  defaultWastagePercent: number;
  paymentTerms: string;
  invoiceFooter: string;
}

export interface InvoiceCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface EstimateRecord {
  id: string;
  estimateNumber: string;
  customer: InvoiceCustomer;
  date: string;
  furnitureConfigs: FurnitureConfig[];
  totalAmount: number;
}
