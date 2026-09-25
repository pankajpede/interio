import React, { useState } from 'react';
import {
  CompanySettings,
  MaterialItem,
  FinishItem,
  EdgeFinishItem,
  HardwareItem,
  LabourItem
} from '../../types/furniture';
import { Settings as SettingsIcon, Building, Layers, Palette, Wrench, Percent, Save, Trash2, Plus } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings;
  materials: MaterialItem[];
  finishes: FinishItem[];
  edges: EdgeFinishItem[];
  hardware: HardwareItem[];
  labour: LabourItem[];
  onSaveCompanySettings: (settings: CompanySettings) => void;
  onSaveMaterials: (materials: MaterialItem[]) => void;
  onSaveFinishes: (finishes: FinishItem[]) => void;
  onSaveEdges: (edges: EdgeFinishItem[]) => void;
  onSaveHardware: (hardware: HardwareItem[]) => void;
  onSaveLabour: (labour: LabourItem[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  companySettings,
  materials,
  finishes,
  edges,
  hardware,
  labour,
  onSaveCompanySettings,
  onSaveMaterials,
  onSaveFinishes,
  onSaveEdges,
  onSaveHardware,
  onSaveLabour,
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'materials' | 'finishes' | 'hardware' | 'labour'>('company');

  const [companyForm, setCompanyForm] = useState<CompanySettings>(companySettings);
  const [materialsList, setMaterialsList] = useState<MaterialItem[]>(materials);
  const [finishesList, setFinishesList] = useState<FinishItem[]>(finishes);
  const [hardwareList, setHardwareList] = useState<HardwareItem[]>(hardware);
  const [labourList, setLabourList] = useState<LabourItem[]>(labour);

  if (!isOpen) return null;

  const handleSaveAll = () => {
    onSaveCompanySettings(companyForm);
    onSaveMaterials(materialsList);
    onSaveFinishes(finishesList);
    onSaveHardware(hardwareList);
    onSaveLabour(labourList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            Master Settings & Rates Configuration
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'company'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> Company Profile
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'materials'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Core Materials
          </button>

          <button
            onClick={() => setActiveTab('finishes')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'finishes'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" /> Laminates & Finishes
          </button>

          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'hardware'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Hardware Master
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs space-y-4">
          {activeTab === 'company' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">GSTIN</label>
                <input
                  type="text"
                  value={companyForm.gstin}
                  onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value })}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-600 font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Email</label>
                <input
                  type="text"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Plywood / MDF Rates (₹ / sq.ft)</h3>
              </div>
              <div className="space-y-2">
                {materialsList.map((m, idx) => (
                  <div key={m.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded border">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => {
                        const updated = [...materialsList];
                        updated[idx].name = e.target.value;
                        setMaterialsList(updated);
                      }}
                      className="flex-1 text-xs font-semibold bg-white border rounded px-2 py-1"
                    />
                    <div className="flex items-center gap-1">
                      <span>₹</span>
                      <input
                        type="number"
                        value={m.ratePerSqFt}
                        onChange={(e) => {
                          const updated = [...materialsList];
                          updated[idx].ratePerSqFt = parseFloat(e.target.value) || 0;
                          setMaterialsList(updated);
                        }}
                        className="w-20 text-xs font-bold bg-white border rounded px-2 py-1 text-right"
                      />
                      <span>/sq.ft</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'finishes' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700">Surface Laminates & Veneer Rates (₹ / sq.ft)</h3>
              <div className="space-y-2">
                {finishesList.map((f, idx) => (
                  <div key={f.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded border">
                    <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: f.colorHex }}></span>
                    <input
                      type="text"
                      value={f.name}
                      onChange={(e) => {
                        const updated = [...finishesList];
                        updated[idx].name = e.target.value;
                        setFinishesList(updated);
                      }}
                      className="flex-1 text-xs font-semibold bg-white border rounded px-2 py-1"
                    />
                    <div className="flex items-center gap-1">
                      <span>₹</span>
                      <input
                        type="number"
                        value={f.ratePerSqFt}
                        onChange={(e) => {
                          const updated = [...finishesList];
                          updated[idx].ratePerSqFt = parseFloat(e.target.value) || 0;
                          setFinishesList(updated);
                        }}
                        className="w-20 text-xs font-bold bg-white border rounded px-2 py-1 text-right"
                      />
                      <span>/sq.ft</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700">Hardware & Fitting Rates</h3>
              <div className="space-y-2">
                {hardwareList.map((h, idx) => (
                  <div key={h.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded border">
                    <input
                      type="text"
                      value={h.name}
                      onChange={(e) => {
                        const updated = [...hardwareList];
                        updated[idx].name = e.target.value;
                        setHardwareList(updated);
                      }}
                      className="flex-1 text-xs font-semibold bg-white border rounded px-2 py-1"
                    />
                    <div className="flex items-center gap-1">
                      <span>Qty:</span>
                      <input
                        type="number"
                        value={h.quantity}
                        onChange={(e) => {
                          const updated = [...hardwareList];
                          updated[idx].quantity = parseInt(e.target.value) || 0;
                          setHardwareList(updated);
                        }}
                        className="w-14 text-xs font-bold bg-white border rounded px-1.5 py-1 text-center"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>₹</span>
                      <input
                        type="number"
                        value={h.rate}
                        onChange={(e) => {
                          const updated = [...hardwareList];
                          updated[idx].rate = parseFloat(e.target.value) || 0;
                          setHardwareList(updated);
                        }}
                        className="w-20 text-xs font-bold bg-white border rounded px-2 py-1 text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-700">
            Cancel
          </button>
          <button onClick={handleSaveAll} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1">
            <Save className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
