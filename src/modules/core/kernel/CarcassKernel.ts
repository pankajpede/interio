import {
  FurnitureConfig,
  FurniturePanel,
  DimensionUnit
} from '../../../types/furniture';
import {
  normalizeToFeet,
  createSurfacesForPanel,
  createEdgesForPanel
} from '../../../data/furnitureTemplates';

export interface KernelSolveOptions {
  prefix?: string;
  secIdx?: number;
}

export class CarcassKernel {
  /**
   * Solves 3D panel geometry calculations for a single carcass box.
   * Can be invoked directly by CarcassArchetype or repeatedly by WardrobeDriver per section.
   */
  static solvePanels(config: FurnitureConfig, options?: KernelSolveOptions): FurniturePanel[] {
    const prefix = options?.prefix || '';
    const wFt = normalizeToFeet(config.dimensions.width, config.dimensions.unit);
    const hFt = normalizeToFeet(config.dimensions.height, config.dimensions.unit);
    const dFt = normalizeToFeet(config.dimensions.depth, config.dimensions.unit);

    const matId = config.defaultMaterialId;
    const outerFin = config.defaultOuterFinishId;
    const innerFin = config.defaultInnerFinishId;
    const edgeFin = config.defaultEdgeFinishId;
    const preset = config.surfacePreset;

    const existingMap = new Map((config.panels || []).map((p) => [p.id, p]));

    const getOrMakePanel = (rawId: string, defaults: Omit<FurniturePanel, 'id'>): FurniturePanel => {
      const id = prefix ? `${prefix}${rawId}` : rawId;
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

    // 1. Left Side Panel
    panels.push(
      getOrMakePanel('panel-left-side', {
        name: prefix ? `Sec #${(options?.secIdx ?? 0) + 1} Left Side` : 'Left Side Panel',
        category: 'side',
        quantity: 1,
        widthFt: dFt,
        heightFt: hFt,
        depthFt: dFt,
        thicknessMm: config.panelThicknessMm,
        materialId: matId,
        surfaces: createSurfacesForPanel('side', outerFin, innerFin, preset),
        edges: createEdgesForPanel('side', edgeFin),
        secIdx: options?.secIdx,
      })
    );

    // 2. Right Side Panel
    panels.push(
      getOrMakePanel('panel-right-side', {
        name: prefix ? `Sec #${(options?.secIdx ?? 0) + 1} Right Side` : 'Right Side Panel',
        category: 'side',
        quantity: 1,
        widthFt: dFt,
        heightFt: hFt,
        depthFt: dFt,
        thicknessMm: config.panelThicknessMm,
        materialId: matId,
        surfaces: createSurfacesForPanel('side', outerFin, innerFin, preset),
        edges: createEdgesForPanel('side', edgeFin),
        secIdx: options?.secIdx,
      })
    );

    // 3. Top Panel
    panels.push(
      getOrMakePanel('panel-top', {
        name: prefix ? `Sec #${(options?.secIdx ?? 0) + 1} Top Panel` : 'Top Panel',
        category: 'top',
        quantity: 1,
        widthFt: wFt,
        heightFt: dFt,
        depthFt: dFt,
        thicknessMm: config.panelThicknessMm,
        materialId: matId,
        surfaces: createSurfacesForPanel('top', outerFin, innerFin, preset),
        edges: createEdgesForPanel('top', edgeFin),
        secIdx: options?.secIdx,
      })
    );

    // 4. Bottom Panel
    panels.push(
      getOrMakePanel('panel-bottom', {
        name: prefix ? `Sec #${(options?.secIdx ?? 0) + 1} Bottom Panel` : 'Bottom Panel',
        category: 'bottom',
        quantity: 1,
        widthFt: wFt,
        heightFt: dFt,
        depthFt: dFt,
        thicknessMm: config.panelThicknessMm,
        materialId: matId,
        surfaces: createSurfacesForPanel('bottom', outerFin, innerFin, preset),
        edges: createEdgesForPanel('bottom', edgeFin),
        secIdx: options?.secIdx,
      })
    );

    // 5. Shelves
    if (config.shelvesCount > 0) {
      if (config.separateShelves) {
        const commonShelfPanel = config.panels?.find((p) => p.id === `${prefix}panel-shelves` || p.id === 'panel-shelves');
        for (let i = 0; i < config.shelvesCount; i++) {
          const shelfId = `panel-shelf-${i + 1}`;
          panels.push(
            getOrMakePanel(shelfId, {
              name: prefix ? `Sec #${(options?.secIdx ?? 0) + 1} Shelf #${i + 1}` : `Shelf #${i + 1}`,
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
              secIdx: options?.secIdx,
            })
          );
        }
      } else {
        panels.push(
          getOrMakePanel('panel-shelves', {
            name: prefix ? `Sec #${(options?.secIdx ?? 0) + 1} Shelves (×${config.shelvesCount})` : `Shelves (×${config.shelvesCount})`,
            category: 'shelf',
            quantity: config.shelvesCount,
            widthFt: wFt,
            heightFt: dFt,
            depthFt: dFt,
            thicknessMm: config.shelfThicknessMm,
            materialId: matId,
            surfaces: createSurfacesForPanel('shelf', outerFin, innerFin, preset),
            edges: createEdgesForPanel('shelf', edgeFin),
            secIdx: options?.secIdx,
          })
        );
      }
    }

    // 6. Vertical Compartment Divider Partitions
    let totalDividersCount = 0;
    const secCount = config.sectionsCount || 2;
    if (config.type === 'wardrobe' && secCount > 1 && options?.secIdx === undefined) {
      totalDividersCount += secCount - 1;
    }
    if (config.shelfPartitions) {
      totalDividersCount += Object.values(config.shelfPartitions).reduce((sum, cnt) => sum + (cnt || 0), 0);
    }

    if (totalDividersCount > 0) {
      panels.push(
        getOrMakePanel('panel-vertical-dividers', {
          name: prefix ? `Sec #${(options?.secIdx ?? 0) + 1} Partitions (×${totalDividersCount})` : `Vertical Partitions (×${totalDividersCount})`,
          category: 'divider',
          quantity: totalDividersCount,
          widthFt: dFt,
          heightFt: hFt,
          depthFt: dFt,
          thicknessMm: config.panelThicknessMm,
          materialId: matId,
          surfaces: createSurfacesForPanel('side', outerFin, innerFin, preset),
          edges: createEdgesForPanel('side', edgeFin),
          secIdx: options?.secIdx,
        })
      );
    }

    // 7. Back Panel
    if (config.hasBackPanel) {
      panels.push(
        getOrMakePanel('panel-back', {
          name: prefix ? `Sec #${(options?.secIdx ?? 0) + 1} Back Panel` : 'Back Panel',
          category: 'back',
          quantity: 1,
          widthFt: wFt,
          heightFt: hFt,
          depthFt: 0.05,
          thicknessMm: config.backPanelThicknessMm,
          materialId: config.backPanelMaterialId || 'mat-mdf-6',
          surfaces: createSurfacesForPanel('back', outerFin, 'fin-none', preset),
          edges: createEdgesForPanel('back', 'edge-none'),
          secIdx: options?.secIdx,
        })
      );
    }

    // 8. Front Shutters / Doors
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
            name: prefix ? `Sec #${(options?.secIdx ?? 0) + 1} Shutters (×${doorsCount})` : `Front Shutters / Doors (×${doorsCount})`,
            category: 'door',
            quantity: doorsCount,
            widthFt: wFt / doorsCount,
            heightFt: hFt,
            depthFt: dFt,
            thicknessMm: config.panelThicknessMm,
            materialId: matId,
            surfaces: createSurfacesForPanel('door', outerFin, innerFin, preset),
            edges: createEdgesForPanel('door', edgeFin),
            secIdx: options?.secIdx,
          })
        );
      }
    }

    // 10. Wardrobe Section Sub-Carcass Panels
    if (config.type === 'wardrobe' && options?.secIdx === undefined && config.wardrobeSections) {
      config.wardrobeSections.forEach((sec, secIdx) => {
        const secShelves = sec.shelvesCount || 0;
        const secPartitions = sec.partitionsCount || 0;

        if (secShelves > 0 || secPartitions > 0) {
          const secConfig: FurnitureConfig = {
            ...config,
            id: `sec-${secIdx + 1}`,
            title: `Section #${secIdx + 1}`,
            type: 'bookshelf', // Virtual carcass unit
            dimensions: {
              ...config.dimensions,
              width: sec.widthFt * (config.dimensions.unit === 'mm' ? 304.8 : config.dimensions.unit === 'inch' ? 12 : 1),
            },
            shelvesCount: secShelves,
            customShelfPositions: sec.customShelfPositions,
            shelfPartitions: sec.shelfPartitions || (secPartitions > 0 ? { 0: secPartitions } : undefined),
            customPartitionWidths: sec.customPartitionWidths,
            shelfSubPartitions: sec.shelfSubPartitions,
            shelfSubShelves: sec.shelfSubShelves,
            defaultMaterialId: sec.materialId || config.defaultMaterialId,
            defaultOuterFinishId: sec.outerFinishId || config.defaultOuterFinishId,
            defaultInnerFinishId: sec.innerFinishId || config.defaultInnerFinishId,
            defaultEdgeFinishId: sec.edgeFinishId || config.defaultEdgeFinishId,
            surfacePreset: sec.surfacePreset || config.surfacePreset,
            panels: [],
          };

          // Solve inner section panels without recreating outer left/right/top/bottom boundaries
          const innerPanels = CarcassKernel.solvePanels(secConfig, {
            prefix: `sec-${secIdx + 1}-`,
            secIdx,
          }).filter((p) => p.category === 'shelf' || p.category === 'divider');

          // Attach lighting if section has LED enabled
          if (sec.lighting?.enabled) {
            innerPanels.forEach((p) => {
              if (p.category === 'shelf') {
                p.lighting = sec.lighting;
              }
            });
          }

          panels.push(...innerPanels);
        }
      });
    }

    return panels;
  }
}
