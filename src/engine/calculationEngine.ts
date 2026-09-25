import {
  FurnitureConfig,
  CalculationBreakdown,
  MaterialItem,
  FinishItem,
  EdgeFinishItem,
  HardwareItem,
  LabourItem
} from '../types/furniture';

export function calculateFurnitureCost(
  config: FurnitureConfig,
  materialsMaster: MaterialItem[],
  finishesMaster: FinishItem[],
  edgesMaster: EdgeFinishItem[],
  hardwareMaster: HardwareItem[],
  labourMaster: LabourItem[],
  wastagePercent: number = 10,
  taxPercent: number = 18,
  marginPercent: number = 20
): CalculationBreakdown {
  const materialsMap = new Map(materialsMaster.map(m => [m.id, m]));
  const finishesMap = new Map(finishesMaster.map(f => [f.id, f]));
  const edgesMap = new Map(edgesMaster.map(e => [e.id, e]));

  // Material calculations
  const matAreaMap = new Map<string, number>(); // materialId -> netSqFt
  const finAreaMap = new Map<string, number>(); // finishId -> netSqFt
  const edgeRftMap = new Map<string, number>(); // edgeId -> netRft

  let totalNetMaterialArea = 0;

  for (const panel of config.panels) {
    // Material area: quantity * widthFt * heightFt
    // (Note: for side/top panels, width/height represent physical panel dimensions)
    const panelAreaSqFt = panel.widthFt * panel.heightFt * panel.quantity;
    totalNetMaterialArea += panelAreaSqFt;

    const currentMatArea = matAreaMap.get(panel.materialId) || 0;
    matAreaMap.set(panel.materialId, currentMatArea + panelAreaSqFt);

    // Surface finish calculations (each enabled surface adds panelAreaSqFt to its finish)
    for (const surf of panel.surfaces) {
      if (surf.enabled && surf.finishId && surf.finishId !== 'fin-none') {
        const currentFinArea = finAreaMap.get(surf.finishId) || 0;
        finAreaMap.set(surf.finishId, currentFinArea + panelAreaSqFt);
      }
    }

    // Edge band calculations (Front edge = panel.widthFt * quantity, etc.)
    for (const edge of panel.edges) {
      if (edge.enabled && edge.finishId && edge.finishId !== 'edge-none') {
        let lengthRft = 0;
        if (edge.type === 'front' || edge.type === 'back') {
          lengthRft = panel.widthFt * panel.quantity;
        } else {
          lengthRft = panel.heightFt * panel.quantity;
        }
        const currentEdgeRft = edgeRftMap.get(edge.finishId) || 0;
        edgeRftMap.set(edge.finishId, currentEdgeRft + lengthRft);
      }
    }
  }

  // Material summary
  const materialsResult: CalculationBreakdown['materials'] = [];
  let materialSubtotal = 0;

  matAreaMap.forEach((netSqFt, matId) => {
    const mat = materialsMap.get(matId);
    if (!mat) return;
    const wastageSqFt = (netSqFt * wastagePercent) / 100;
    const totalSqFt = netSqFt + wastageSqFt;
    const sheetArea = mat.sheetWidthFt * mat.sheetHeightFt || 32;
    const estimatedSheets = Math.ceil(totalSqFt / sheetArea);
    const amount = totalSqFt * mat.ratePerSqFt;

    materialSubtotal += amount;
    materialsResult.push({
      materialId: mat.id,
      materialName: mat.name,
      thicknessMm: mat.thicknessMm,
      ratePerSqFt: mat.ratePerSqFt,
      netSqFt: Math.round(netSqFt * 100) / 100,
      wastageSqFt: Math.round(wastageSqFt * 100) / 100,
      totalSqFt: Math.round(totalSqFt * 100) / 100,
      estimatedSheets,
      amount: Math.round(amount),
    });
  });

  // Finish summary
  const finishesResult: CalculationBreakdown['finishes'] = [];
  let finishSubtotal = 0;

  finAreaMap.forEach((netSqFt, finId) => {
    const fin = finishesMap.get(finId);
    if (!fin) return;
    const wastageSqFt = (netSqFt * wastagePercent) / 100;
    const totalSqFt = netSqFt + wastageSqFt;
    const amount = totalSqFt * fin.ratePerSqFt;

    finishSubtotal += amount;
    finishesResult.push({
      finishId: fin.id,
      finishName: fin.name,
      ratePerSqFt: fin.ratePerSqFt,
      netSqFt: Math.round(netSqFt * 100) / 100,
      wastageSqFt: Math.round(wastageSqFt * 100) / 100,
      totalSqFt: Math.round(totalSqFt * 100) / 100,
      amount: Math.round(amount),
    });
  });

  // Edge band summary
  const edgesResult: CalculationBreakdown['edges'] = [];
  let edgeSubtotal = 0;

  edgeRftMap.forEach((netRft, edgeId) => {
    const edge = edgesMap.get(edgeId);
    if (!edge) return;
    const wastageRft = (netRft * wastagePercent) / 100;
    const totalRft = netRft + wastageRft;
    const amount = totalRft * edge.ratePerRft;

    edgeSubtotal += amount;
    edgesResult.push({
      edgeId: edge.id,
      edgeName: edge.name,
      ratePerRft: edge.ratePerRft,
      netRft: Math.round(netRft * 100) / 100,
      wastageRft: Math.round(wastageRft * 100) / 100,
      totalRft: Math.round(totalRft * 100) / 100,
      amount: Math.round(amount),
    });
  });

  // Hardware summary
  const hardwareResult: CalculationBreakdown['hardware'] = [];
  let hardwareSubtotal = 0;

  hardwareMaster.filter(h => h.enabled).forEach(h => {
    const amount = h.quantity * h.rate;
    hardwareSubtotal += amount;
    hardwareResult.push({
      hardwareId: h.id,
      hardwareName: h.name,
      unit: h.unit,
      quantity: h.quantity,
      rate: h.rate,
      amount: Math.round(amount),
    });
  });

  // Labour summary (basis is totalNetMaterialArea for sq.ft basis)
  const labourResult: CalculationBreakdown['labour'] = [];
  let labourSubtotal = 0;

  labourMaster.filter(l => l.enabled).forEach(l => {
    const qty = l.unit === 'sq.ft' ? totalNetMaterialArea : 1;
    const amount = qty * l.rate;
    labourSubtotal += amount;
    labourResult.push({
      labourId: l.id,
      labourName: l.name,
      rate: l.rate,
      unit: l.unit,
      basisQuantity: Math.round(qty * 100) / 100,
      amount: Math.round(amount),
    });
  });

  const rawCostBeforeWastage = materialSubtotal + finishSubtotal + edgeSubtotal;
  const wastageAmount = Math.round((rawCostBeforeWastage * wastagePercent) / 100);
  const subtotalCost = rawCostBeforeWastage + wastageAmount;

  const marginAmount = Math.round((subtotalCost * marginPercent) / 100);
  const sellingPriceBeforeTax = subtotalCost + marginAmount;

  const taxAmount = Math.round((sellingPriceBeforeTax * taxPercent) / 100);
  const grandTotal = sellingPriceBeforeTax + taxAmount;

  return {
    furnitureId: config.id,
    furnitureTitle: config.title,
    materials: materialsResult,
    finishes: finishesResult,
    edges: edgesResult,
    hardware: hardwareResult,
    labour: labourResult,
    materialSubtotal: Math.round(materialSubtotal),
    finishSubtotal: Math.round(finishSubtotal),
    edgeSubtotal: Math.round(edgeSubtotal),
    hardwareSubtotal: Math.round(hardwareSubtotal),
    labourSubtotal: Math.round(labourSubtotal),
    totalNetMaterialAreaSqFt: Math.round(totalNetMaterialArea * 100) / 100,
    wastagePercent,
    wastageAmount,
    subtotalCost,
    marginPercent,
    marginAmount,
    sellingPriceBeforeTax,
    taxPercent,
    taxAmount,
    grandTotal,
  };
}

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}
