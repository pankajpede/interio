import React, { useState } from 'react';
import { CalculationBreakdown } from '../../types/furniture';
import { formatINR } from '../../engine/calculationEngine';
import { Receipt, FileText, ChevronDown, ChevronUp, Layers, Wrench, Percent } from 'lucide-react';

interface CostSummaryProps {
  breakdown: CalculationBreakdown;
  wastagePercent: number;
  marginPercent: number;
  taxPercent: number;
  onChangeWastage: (val: number) => void;
  onChangeMargin: (val: number) => void;
  onChangeTax: (val: number) => void;
  onOpenInvoice: () => void;
}

export const CostSummary: React.FC<CostSummaryProps> = ({
  breakdown,
  wastagePercent,
  marginPercent,
  taxPercent,
  onChangeWastage,
  onChangeMargin,
  onChangeTax,
  onOpenInvoice,
}) => {
  const [showDetailedModal, setShowDetailedModal] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4" >
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          Cost Calculation Summary
        </h2>
        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
          Live Estimate
        </span>
      </div>

      {/* Main Cost Categories */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600 font-medium">Core Material (Plywood/MDF)</span>
          <span className="font-semibold text-slate-800">{formatINR(breakdown.materialSubtotal)}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600 font-medium">Laminates & Surface Finishes</span>
          <span className="font-semibold text-slate-800">{formatINR(breakdown.finishSubtotal)}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-600 font-medium">Edge Banding (PVC)</span>
          <span className="font-semibold text-slate-800">{formatINR(breakdown.edgeSubtotal)}</span>
        </div>
      </div>

      {/* Wastage & Margin Controls */}
      <div className="pt-2 space-y-2.5">
        <div className="flex items-center justify-between text-xs relative">
          <label className="text-slate-600 font-medium flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-slate-400" />
            Wastage Allowance
          </label>
          {(() => {
            const [isOpen, setIsOpen] = React.useState(false);
            const wastageOptions = [
              { val: 0, label: '0% (Default)' },
              { val: 5, label: '5%' },
              { val: 10, label: '10%' },
              { val: 15, label: '15%' },
              { val: 20, label: '20%' },
            ];
            const curLabel = wastageOptions.find((o) => o.val === wastagePercent)?.label || `${wastagePercent}%`;

            return (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-2.5 py-1 text-slate-800 flex items-center gap-1 transition-all shadow-xs"
                >
                  <span>{curLabel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full mt-1 right-0 z-50 w-32 bg-white border border-slate-200 rounded-xl shadow-xl py-1 overflow-hidden animate-in fade-in duration-100">
                      {wastageOptions.map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            onChangeWastage(opt.val);
                            setIsOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center justify-between transition-colors ${wastagePercent === opt.val
                            ? 'bg-blue-50 text-blue-600 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="text-slate-600 font-medium">Profit Margin %</label>
          <input
            type="number"
            min="0"
            max="100"
            value={marginPercent}
            onChange={(e) => onChangeMargin(parseFloat(e.target.value) || 0)}
            className="w-16 text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2 py-1 text-right"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="text-slate-600 font-medium">GST / Tax %</label>
          <input
            type="number"
            min="0"
            max="28"
            value={taxPercent}
            onChange={(e) => onChangeTax(parseFloat(e.target.value) || 0)}
            className="w-16 text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2 py-1 text-right"
          />
        </div>
      </div>

      {/* Totals Section */}
      <div className="pt-3 border-t-2 border-slate-100 space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Total Material Area</span>
          <span className="font-semibold text-slate-700">{breakdown.totalNetMaterialAreaSqFt} sq.ft</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Subtotal Cost (Inc. Wastage)</span>
          <span className="font-semibold text-slate-700">{formatINR(breakdown.subtotalCost)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Profit Margin ({breakdown.marginPercent}%)</span>
          <span className="font-semibold text-slate-700">{formatINR(breakdown.marginAmount)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>GST ({breakdown.taxPercent}%)</span>
          <span className="font-semibold text-slate-700">{formatINR(breakdown.taxAmount)}</span>
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Grand Total</span>
            <span className="text-[10px] block text-slate-400">All inclusive selling price</span>
          </div>
          <span className="text-2xl font-bold text-blue-600 tracking-tight">
            {formatINR(breakdown.grandTotal)}
          </span>
        </div>
      </div>

      {/* Detail Modal Trigger */}
      <button
        onClick={() => setShowDetailedModal(true)}
        className="w-full text-xs font-medium text-slate-600 hover:text-blue-600 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1"
      >
        <FileText className="w-3.5 h-3.5" />
        View Detailed Calculation Breakdown
      </button>

      {/* Generate Invoice Action */}
      <button
        onClick={onOpenInvoice}
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
      >
        <Receipt className="w-4 h-4" />
        Generate Customer Invoice
      </button>

      {/* Detailed Breakdown Modal */}
      {showDetailedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">Detailed Furniture Calculation Breakdown</h3>
              <button
                onClick={() => setShowDetailedModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Materials Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Core Panel Materials</h4>
              <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2 border-b">Material</th>
                    <th className="p-2 border-b">Net Sq.Ft</th>
                    <th className="p-2 border-b">+Wastage</th>
                    <th className="p-2 border-b">Est. Sheets</th>
                    <th className="p-2 border-b">Rate</th>
                    <th className="p-2 border-b text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {breakdown.materials.map((m) => (
                    <tr key={m.materialId}>
                      <td className="p-2 font-medium">{m.materialName}</td>
                      <td className="p-2">{m.netSqFt}</td>
                      <td className="p-2">{m.totalSqFt}</td>
                      <td className="p-2">{m.estimatedSheets} (8×4 ft)</td>
                      <td className="p-2">₹{m.ratePerSqFt}</td>
                      <td className="p-2 text-right font-semibold">{formatINR(m.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Finishes Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Surface Laminates & Finishes</h4>
              <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2 border-b">Finish Name</th>
                    <th className="p-2 border-b">Net Sq.Ft</th>
                    <th className="p-2 border-b">Total Sq.Ft</th>
                    <th className="p-2 border-b">Rate</th>
                    <th className="p-2 border-b text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {breakdown.finishes.map((f) => (
                    <tr key={f.finishId}>
                      <td className="p-2 font-medium">{f.finishName}</td>
                      <td className="p-2">{f.netSqFt}</td>
                      <td className="p-2">{f.totalSqFt}</td>
                      <td className="p-2">₹{f.ratePerSqFt}</td>
                      <td className="p-2 text-right font-semibold">{formatINR(f.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edges Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Edge Bands (PVC)</h4>
              <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2 border-b">Edge Band</th>
                    <th className="p-2 border-b">Net R.Ft</th>
                    <th className="p-2 border-b">Total R.Ft</th>
                    <th className="p-2 border-b">Rate</th>
                    <th className="p-2 border-b text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {breakdown.edges.map((e) => (
                    <tr key={e.edgeId}>
                      <td className="p-2 font-medium">{e.edgeName}</td>
                      <td className="p-2">{e.netRft}</td>
                      <td className="p-2">{e.totalRft}</td>
                      <td className="p-2">₹{e.ratePerRft}/r.ft</td>
                      <td className="p-2 text-right font-semibold">{formatINR(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t text-right">
              <button
                onClick={() => setShowDetailedModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
