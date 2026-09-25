import React, { useState } from 'react';
import { CompanySettings, InvoiceCustomer, FurnitureConfig, CalculationBreakdown, FurniturePanel } from '../../types/furniture';
import { formatINR } from '../../engine/calculationEngine';
import { Printer, Download, Image as ImageIcon, Building2, User, FileCheck, Layers, Wrench, CheckSquare, Factory, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
  furnitureConfigs: FurnitureConfig[];
  breakdowns: CalculationBreakdown[];
  canvasDataUrl: string | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  companySettings,
  furnitureConfigs,
  breakdowns,
  canvasDataUrl,
}) => {
  const [docType, setDocType] = useState<'job-sheet' | 'tax-invoice'>('job-sheet');

  const [customer, setCustomer] = useState<InvoiceCustomer>({
    name: 'Rahul Sharma',
    phone: '+91 98220 12345',
    email: 'rahul.sharma@example.com',
    address: 'Koregaon Park, Pune, Maharashtra 411001',
  });

  const [projectName, setProjectName] = useState('Modular Interior Project');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });

  const [include3DPreview, setInclude3DPreview] = useState(true);
  const [showCutList, setShowCutList] = useState(true);
  const [showHardwareSchedule, setShowHardwareSchedule] = useState(true);
  const [showMaterialSummary, setShowMaterialSummary] = useState(true);
  const [showQcChecklist, setShowQcChecklist] = useState(true);

  if (!isOpen) return null;

  const invoiceNumber = `${companySettings.invoicePrefix}-${companySettings.lastInvoiceNumber}`;
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const grandSubtotal = breakdowns.reduce((acc, b) => acc + b.sellingPriceBeforeTax, 0);
  const grandTax = breakdowns.reduce((acc, b) => acc + b.taxAmount, 0);
  const grandTotal = breakdowns.reduce((acc, b) => acc + b.grandTotal, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-printable-area');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileNamePrefix = docType === 'job-sheet' ? 'Job_Sheet' : 'Tax_Invoice';
      pdf.save(`${invoiceNumber}_${fileNamePrefix}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  // Helper to format surface names nicely for shopfloor
  const formatSurfaceName = (panel: FurniturePanel, surfaceType: string) => {
    const surf = panel.surfaces.find((s) => s.type === surfaceType);
    if (!surf || !surf.enabled) return 'Raw / None';
    return surf.finishId || 'Applied Finish';
  };

  const formatEdgeName = (panel: FurniturePanel, edgeType: string) => {
    const edge = panel.edges.find((e) => e.type === edgeType);
    if (!edge || !edge.enabled) return 'Unbanded';
    return edge.finishId || 'PVC Band';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Manufacturing Job Sheet & Factory Order
              </h2>
              <p className="text-xs text-slate-400">
                Generate production cut lists, edge-banding schedules & technical specs for workshop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Printer className="w-4 h-4" /> Print Order
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm font-semibold"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold px-2 py-1 text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body with Left Configuration Controls & Right Printable Document */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-100">
          {/* Controls Side Panel */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 space-y-4 h-fit shadow-xs">
            {/* Document Type Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                Document Type
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setDocType('job-sheet')}
                  className={`py-1.5 px-2 rounded text-xs font-semibold transition-all ${
                    docType === 'job-sheet'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Factory Job Sheet
                </button>
                <button
                  onClick={() => setDocType('tax-invoice')}
                  className={`py-1.5 px-2 rounded text-xs font-semibold transition-all ${
                    docType === 'tax-invoice'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Client Tax Invoice
                </button>
              </div>
            </div>

            {/* Project & Client Metadata */}
            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <h3 className="text-xs font-bold uppercase text-slate-500">Project & Client Info</h3>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Client Name</label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Target Dispatch Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
            </div>

            {/* Production Sections Toggles */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-500">Document Sections</h3>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={include3DPreview}
                  onChange={(e) => setInclude3DPreview(e.target.checked)}
                  className="rounded text-blue-600"
                />
                Include 3D Render CAD Diagram
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCutList}
                  onChange={(e) => setShowCutList(e.target.checked)}
                  className="rounded text-blue-600"
                />
                Show Panel Cut List Schedule
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showQcChecklist}
                  onChange={(e) => setShowQcChecklist(e.target.checked)}
                  className="rounded text-blue-600"
                />
                Include Workshop QC Sign-off Block
              </label>
            </div>
          </div>

          {/* Printable Document Area */}
          <div className="lg:col-span-8">
            <div
              id="invoice-printable-area"
              className="bg-white p-8 rounded-xl border border-slate-300 shadow-md text-slate-800 space-y-6 min-h-[850px]"
            >
              {/* Document Header */}
              <div className="flex justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{companySettings.companyName}</h1>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Manufacturing & Technical Workshop Division</p>
                  <p className="text-[11px] text-slate-500 mt-1">{companySettings.address}</p>
                  <p className="text-[11px] text-slate-500">GSTIN: {companySettings.gstin} | Phone: {companySettings.phone}</p>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-3 py-1 font-bold text-xs uppercase tracking-wider rounded ${
                    docType === 'job-sheet' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {docType === 'job-sheet' ? 'PRODUCTION JOB SHEET' : 'COMMERCIAL TAX INVOICE'}
                  </span>
                  <div className="mt-2 text-xs space-y-0.5 font-medium">
                    <p className="font-bold text-slate-900">Order #: {invoiceNumber}</p>
                    <p className="text-slate-600">Issued Date: {currentDate}</p>
                    <p className="text-blue-700 font-semibold">Target Dispatch: {targetDate}</p>
                  </div>
                </div>
              </div>

              {/* Job & Client Meta Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Project Reference</span>
                  <p className="font-bold text-slate-900 text-sm">{projectName}</p>
                  <p className="text-slate-600 font-medium">Units: {furnitureConfigs.map(c => c.title).join(', ')}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Client Details</span>
                  <p className="font-bold text-slate-900">{customer.name}</p>
                  <p className="text-slate-600">{customer.phone} | {customer.email}</p>
                </div>
              </div>

              {/* 3D CAD Render Block */}
              {include3DPreview && canvasDataUrl && (
                <div className="border border-slate-300 rounded-xl p-3 bg-slate-950 text-center space-y-1">
                  <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                    <span className="font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> 3D Assembly Render & Elevation Specification
                    </span>
                    <span>CAD Parametric View</span>
                  </div>
                  <img src={canvasDataUrl} alt="3D Furniture Render" className="max-h-56 mx-auto rounded shadow-sm object-contain" />
                </div>
              )}

              {/* Manufacturing Section: Panel Cutting Schedule */}
              {showCutList && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-600" />
                      1. Panel Cutting List Schedule (Shopfloor Cut Sizes)
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Dimensions in Feet & (mm)
                    </span>
                  </div>

                  {furnitureConfigs.map((cfg) => (
                    <div key={cfg.id} className="space-y-1">
                      <div className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 flex justify-between">
                        <span>Unit: {cfg.title}</span>
                        <span>Overall: {cfg.dimensions.width}' W × {cfg.dimensions.height}' H × {cfg.dimensions.depth}' D</span>
                      </div>

                      <table className="w-full text-[11px] text-left border border-slate-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-800 text-white font-semibold">
                          <tr>
                            <th className="p-2 border-b">Panel Tag / Name</th>
                            <th className="p-2 border-b text-center">Cut Size (W × H)</th>
                            <th className="p-2 border-b text-center">Thick</th>
                            <th className="p-2 border-b text-center">Qty</th>
                            <th className="p-2 border-b">Core Substrate</th>
                            <th className="p-2 border-b">Outer / Front Finish</th>
                            <th className="p-2 border-b">Front Edge Band</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {cfg.panels.map((panel) => {
                            const widthMm = Math.round(panel.widthFt * 304.8);
                            const heightMm = Math.round(panel.heightFt * 304.8);
                            const outerSurf = panel.surfaces.find(s => s.type === 'outer' || s.type === 'top' || s.type === 'front');
                            const frontEdge = panel.edges.find(e => e.type === 'front');

                            return (
                              <tr key={panel.id} className="hover:bg-slate-50">
                                <td className="p-2 font-bold text-slate-900">{panel.name}</td>
                                <td className="p-2 text-center font-mono text-[10px] font-semibold">
                                  {panel.widthFt.toFixed(1)}' × {panel.heightFt.toFixed(1)}'
                                  <span className="block text-slate-500 text-[9px]">({widthMm} × {heightMm} mm)</span>
                                </td>
                                <td className="p-2 text-center font-semibold">{panel.thicknessMm}mm</td>
                                <td className="p-2 text-center font-bold bg-blue-50 text-blue-700">{panel.quantity}</td>
                                <td className="p-2 font-medium text-slate-700">{panel.materialId}</td>
                                <td className="p-2 text-slate-700 text-[10px]">
                                  {outerSurf?.enabled ? (outerSurf.finishId || 'Laminate') : 'Raw / None'}
                                </td>
                                <td className="p-2 text-slate-700 text-[10px]">
                                  {frontEdge?.enabled ? (frontEdge.finishId || 'PVC Band') : 'Unbanded'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* Commercial Summary Section */}
              <div className="flex justify-between items-start pt-4 border-t-2 border-slate-900">
                <div className="text-[11px] text-slate-500 max-w-sm space-y-1">
                  <p className="font-bold text-slate-800">Production Terms & Specs Notes:</p>
                  <p className="text-[10px]">
                    {companySettings.paymentTerms && !companySettings.paymentTerms.includes('50% Advance')
                      ? companySettings.paymentTerms
                      : 'All dimensions are finished dimensions. Tolerances +/- 0.5mm.'}
                  </p>
                </div>

                <div className="w-64 text-xs space-y-1.5 text-right">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Estimate Subtotal</span>
                    <span className="font-semibold">{formatINR(grandSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>GST Tax ({companySettings.defaultTaxPercent || 18}%)</span>
                    <span className="font-semibold">{formatINR(grandTax)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-300 flex justify-between font-bold text-sm text-blue-700">
                    <span>Grand Production Total</span>
                    <span>{formatINR(grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
                {companySettings.invoiceFooter || 'Generated by FurnitureCost 3D CAD Manufacturing System'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

