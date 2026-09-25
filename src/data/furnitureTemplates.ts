import {
  FurnitureConfig,
  FurniturePanel,
  SurfacePreset,
  DimensionUnit,
  PanelSurface,
  PanelEdge
} from '../types/furniture';

export function normalizeToFeet(val: number, unit: DimensionUnit): number {
  if (unit === 'ft') return val;
  if (unit === 'inch') return val / 12;
  if (unit === 'mm') return val / 304.8;
  return val;
}

export function createSurfacesForPanel(
  category: FurniturePanel['category'],
  outerFinishId: string,
  innerFinishId: string,
  preset: SurfacePreset
): PanelSurface[] {
  let outerEnable = true;
  let innerEnable = preset === 'fully-laminated';

  if (preset === 'external-shelf-tops') {
    if (category === 'shelf') {
      outerEnable = true; // top face
      innerEnable = false; // bottom face
    } else {
      outerEnable = true;
      innerEnable = false;
    }
  } else if (preset === 'raw-interior') {
    outerEnable = true;
    innerEnable = false;
  } else if (preset === 'external-only') {
    outerEnable = true;
    innerEnable = false;
  }

  if (category === 'shelf') {
    return [
      { type: 'top', label: 'Top Face', enabled: outerEnable, finishId: outerFinishId },
      { type: 'bottom', label: 'Bottom Face', enabled: innerEnable, finishId: innerFinishId },
    ];
  }

  if (category === 'top' || category === 'bottom') {
    return [
      { type: 'top', label: 'Outer/Top Face', enabled: outerEnable, finishId: outerFinishId },
      { type: 'bottom', label: 'Inner/Bottom Face', enabled: innerEnable, finishId: innerFinishId },
    ];
  }

  if (category === 'back') {
    return [
      { type: 'front', label: 'Front Face (Interior)', enabled: outerEnable, finishId: outerFinishId },
      { type: 'back', label: 'Back Face (Wall side)', enabled: false, finishId: 'fin-none' },
    ];
  }

  return [
    { type: 'outer', label: 'Outer Face', enabled: outerEnable, finishId: outerFinishId },
    { type: 'inner', label: 'Inner Face', enabled: innerEnable, finishId: innerFinishId },
  ];
}

export function createEdgesForPanel(
  category: FurniturePanel['category'],
  edgeFinishId: string
): PanelEdge[] {
  if (category === 'shelf') {
    return [
      { type: 'front', label: 'Front Edge', enabled: true, finishId: edgeFinishId },
      { type: 'back', label: 'Back Edge', enabled: false, finishId: 'edge-none' },
      { type: 'left', label: 'Left Edge', enabled: false, finishId: 'edge-none' },
      { type: 'right', label: 'Right Edge', enabled: false, finishId: 'edge-none' },
    ];
  }

  if (category === 'side') {
    return [
      { type: 'front', label: 'Front Edge', enabled: true, finishId: edgeFinishId },
      { type: 'back', label: 'Back Edge', enabled: false, finishId: 'edge-none' },
      { type: 'top', label: 'Top Edge', enabled: false, finishId: 'edge-none' } as any,
      { type: 'bottom', label: 'Bottom Edge', enabled: false, finishId: 'edge-none' } as any,
    ];
  }

  return [
    { type: 'front', label: 'Front Edge', enabled: true, finishId: edgeFinishId },
    { type: 'back', label: 'Back Edge', enabled: false, finishId: 'edge-none' },
    { type: 'left', label: 'Left Edge', enabled: false, finishId: 'edge-none' },
    { type: 'right', label: 'Right Edge', enabled: false, finishId: 'edge-none' },
  ];
}

export function generatePanelsForConfig(config: FurnitureConfig): FurniturePanel[] {
  const wFt = normalizeToFeet(config.dimensions.width, config.dimensions.unit);
  const hFt = normalizeToFeet(config.dimensions.height, config.dimensions.unit);
  const dFt = normalizeToFeet(config.dimensions.depth, config.dimensions.unit);

  const matId = config.defaultMaterialId;
  const outerFin = config.defaultOuterFinishId;
  const innerFin = config.defaultInnerFinishId;
  const edgeFin = config.defaultEdgeFinishId;
  const preset = config.surfacePreset;

  const existingMap = new Map((config.panels || []).map((p) => [p.id, p]));

  const getOrMakePanel = (id: string, defaults: Omit<FurniturePanel, 'id'>): FurniturePanel => {
    const existing = existingMap.get(id);
    if (!existing) return { id, ...defaults };
    return {
      ...existing,
      widthFt: (existing as any).isCustomDimension ? existing.widthFt : defaults.widthFt,
      heightFt: (existing as any).isCustomDimension ? existing.heightFt : defaults.heightFt,
      depthFt: (existing as any).isCustomDimension ? existing.depthFt : defaults.depthFt,
      thicknessMm: (existing as any).isCustomDimension ? existing.thicknessMm : defaults.thicknessMm,
    };
  };

  const panels: FurniturePanel[] = [];

  // Left Side
  panels.push(
    getOrMakePanel('panel-left-side', {
      name: 'Left Side Panel',
      category: 'side',
      quantity: 1,
      widthFt: dFt,
      heightFt: hFt,
      depthFt: dFt,
      thicknessMm: config.panelThicknessMm,
      materialId: matId,
      surfaces: createSurfacesForPanel('side', outerFin, innerFin, preset),
      edges: createEdgesForPanel('side', edgeFin),
    })
  );

  // Right Side
  panels.push(
    getOrMakePanel('panel-right-side', {
      name: 'Right Side Panel',
      category: 'side',
      quantity: 1,
      widthFt: dFt,
      heightFt: hFt,
      depthFt: dFt,
      thicknessMm: config.panelThicknessMm,
      materialId: matId,
      surfaces: createSurfacesForPanel('side', outerFin, innerFin, preset),
      edges: createEdgesForPanel('side', edgeFin),
    })
  );

  // Top Panel
  panels.push(
    getOrMakePanel('panel-top', {
      name: 'Top Panel',
      category: 'top',
      quantity: 1,
      widthFt: wFt,
      heightFt: dFt,
      depthFt: dFt,
      thicknessMm: config.panelThicknessMm,
      materialId: matId,
      surfaces: createSurfacesForPanel('top', outerFin, innerFin, preset),
      edges: createEdgesForPanel('top', edgeFin),
    })
  );

  // Bottom Panel
  panels.push(
    getOrMakePanel('panel-bottom', {
      name: 'Bottom Panel',
      category: 'bottom',
      quantity: 1,
      widthFt: wFt,
      heightFt: dFt,
      depthFt: dFt,
      thicknessMm: config.panelThicknessMm,
      materialId: matId,
      surfaces: createSurfacesForPanel('bottom', outerFin, innerFin, preset),
      edges: createEdgesForPanel('bottom', edgeFin),
    })
  );

  // Shelves
  if (config.shelvesCount > 0) {
    if (config.separateShelves) {
      const commonShelfPanel = config.panels?.find((p) => p.id === 'panel-shelves');
      for (let i = 0; i < config.shelvesCount; i++) {
        const shelfId = `panel-shelf-${i + 1}`;
        panels.push(
          getOrMakePanel(shelfId, {
            name: `Shelf #${i + 1}`,
            category: 'shelf',
            quantity: 1,
            widthFt: wFt,
            heightFt: dFt,
            depthFt: dFt,
            thicknessMm: config.shelfThicknessMm,
            materialId: commonShelfPanel?.materialId || matId,
            surfaces: commonShelfPanel?.surfaces
              ? JSON.parse(JSON.stringify(commonShelfPanel.surfaces))
              : createSurfacesForPanel('shelf', outerFin, innerFin, preset),
            edges: commonShelfPanel?.edges
              ? JSON.parse(JSON.stringify(commonShelfPanel.edges))
              : createEdgesForPanel('shelf', edgeFin),
            lighting: commonShelfPanel?.lighting
              ? JSON.parse(JSON.stringify(commonShelfPanel.lighting))
              : undefined,
          })
        );
      }
    } else {
      panels.push(
        getOrMakePanel('panel-shelves', {
          name: `Shelves (×${config.shelvesCount})`,
          category: 'shelf',
          quantity: config.shelvesCount,
          widthFt: wFt,
          heightFt: dFt,
          depthFt: dFt,
          thicknessMm: config.shelfThicknessMm,
          materialId: matId,
          surfaces: createSurfacesForPanel('shelf', outerFin, innerFin, preset),
          edges: createEdgesForPanel('shelf', edgeFin),
        })
      );
    }
  }

  // Vertical Compartment Divider Partitions (for Carcass & Wardrobe)
  let totalDividersCount = 0;
  if (config.type === 'wardrobe' && secCount > 1) {
    totalDividersCount += secCount - 1;
  }
  if (config.shelfPartitions) {
    totalDividersCount += Object.values(config.shelfPartitions).reduce((sum, cnt) => sum + (cnt || 0), 0);
  }

  if (totalDividersCount > 0) {
    panels.push(
      getOrMakePanel('panel-vertical-dividers', {
        name: `Vertical Partitions (×${totalDividersCount})`,
        category: 'divider',
        quantity: totalDividersCount,
        widthFt: dFt,
        heightFt: hFt,
        depthFt: dFt,
        thicknessMm: config.panelThicknessMm,
        materialId: matId,
        surfaces: createSurfacesForPanel('side', outerFin, innerFin, preset),
        edges: createEdgesForPanel('side', edgeFin),
      })
    );
  }

  // Back Panel
  if (config.hasBackPanel) {
    panels.push(
      getOrMakePanel('panel-back', {
        name: 'Back Panel',
        category: 'back',
        quantity: 1,
        widthFt: wFt,
        heightFt: hFt,
        depthFt: 0.05,
        thicknessMm: config.backPanelThicknessMm,
        materialId: config.backPanelMaterialId || 'mat-mdf-6',
        surfaces: createSurfacesForPanel('back', outerFin, 'fin-none', preset),
        edges: createEdgesForPanel('back', 'edge-none'),
      })
    );
  }

  // Additional Panels based on furniture type
  if (
    config.type === 'wardrobe' ||
    config.type === 'base-cabinet' ||
    config.type === 'wall-cabinet' ||
    config.type === 'shoe-rack'
  ) {
    const doorsCount = config.doorsCount || 2;
    if (doorsCount > 0) {
      panels.push(
        getOrMakePanel('panel-doors', {
          name: `Front Shutters / Doors (×${doorsCount})`,
          category: 'door',
          quantity: doorsCount,
          widthFt: wFt / doorsCount,
          heightFt: hFt,
          depthFt: dFt,
          thicknessMm: config.panelThicknessMm,
          materialId: matId,
          surfaces: createSurfacesForPanel('door', outerFin, innerFin, preset),
          edges: createEdgesForPanel('door', edgeFin),
        })
      );
    }
  }

  if (config.type === 'tv-unit' || config.type === 'study-table') {
    const drawers = config.drawersCount || 2;
    if (drawers > 0) {
      panels.push(
        getOrMakePanel('panel-drawers', {
          name: `Drawer Fronts (×${drawers})`,
          category: 'drawer',
          quantity: drawers,
          widthFt: wFt / drawers,
          heightFt: hFt * 0.35,
          depthFt: dFt,
          thicknessMm: config.panelThicknessMm,
          materialId: matId,
          surfaces: createSurfacesForPanel('drawer', outerFin, innerFin, preset),
          edges: createEdgesForPanel('drawer', edgeFin),
        })
      );
    }
  }

  return panels;
}

export function createDefaultWardrobeSections(sectionsCount: number = 2, hFt: number = 7, wFt: number = 6): WardrobeSection[] {
  const bayWidth = wFt / Math.max(1, sectionsCount);
  return Array.from({ length: sectionsCount }).map((_, i) => ({
    id: `sec-${i + 1}`,
    name: `Section #${i + 1}`,
    widthRatio: 1,
    widthFt: bayWidth,
    compartmentsMode: 'preset',
    compartments: [
      {
        id: `comp-${i + 1}-1`,
        name: 'Top Loft Storage',
        moduleType: 'shelves-grid',
        heightFt: 1.5,
        shelvesCount: 1,
      },
      {
        id: `comp-${i + 1}-2`,
        name: i % 2 === 0 ? 'Hanging Zone' : 'Double Hanging',
        moduleType: i % 2 === 0 ? 'hanging-single' : 'hanging-double',
        heightFt: hFt - 3.2,
      },
      {
        id: `comp-${i + 1}-3`,
        name: 'Bottom Drawer Unit',
        moduleType: 'drawer-pack',
        heightFt: 1.7,
        drawersCount: 2,
      },
    ],
  }));
}

export function createDefaultBookshelf(): FurnitureConfig {
  const config: FurnitureConfig = {
    id: 'est-carcass-1',
    title: 'Carcass Unit',
    type: 'bookshelf',
    carcassSubType: 'base-cabinet',
    skirtingHeight: 100,
    dimensions: {
      width: 1800,
      height: 2100,
      depth: 300,
      unit: 'mm',
    },
    panelThicknessMm: 18,
    shelvesCount: 5,
    shelfThicknessMm: 18,
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
}
