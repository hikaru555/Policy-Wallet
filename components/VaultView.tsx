
import React, { useRef, useState } from 'react';
import { translations, Language } from '../translations';
import { Policy, PolicyDocument, User } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface VaultViewProps {
  policies: Policy[];
  onUpload: (policyId: string, doc: PolicyDocument) => void;
  onDelete: (policyId: string, docId: string) => void;
  lang: Language;
  isPro: boolean;
  user: User | null;
}

const VaultView: React.FC<VaultViewProps> = ({ policies, onUpload, onDelete, lang, isPro, user }) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(policies[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<'Policy' | 'Receipt' | 'Medical' | 'Other'>('Policy');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ policyId: string, docId: string, name: string } | null>(null);

  const allDocs = policies.flatMap(p => 
    (p.documents || []).map(d => ({ ...d, policyName: p.planName, company: p.company, policyId: p.id }))
  ).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPro) return;
    const file = e.target.files?.[0];
    if (!file || !selectedPolicyId) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newDoc: PolicyDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        category: selectedCategory,
        mimeType: file.type,
        url: base64,
        uploadDate: new Date().toISOString()
      };
      onUpload(selectedPolicyId, newDoc);
      setIsUploading(false);
      setShowUploadModal(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      alert(lang === 'en' ? "Failed to read file." : "อ่านไฟล์ล้มเหลว");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    if (!isPro) return;
    if (policies.length === 0) {
      alert(lang === 'en' ? "Please add a policy first" : "กรุณาเพิ่มกรมธรรม์ก่อน");
      return;
    }
    setShowUploadModal(true);
  };

  const confirmDelete = () => {
    if (docToDelete) {
      onDelete(docToDelete.policyId, docToDelete.docId);
      setDocToDelete(null);
    }
  };

  return (
    <div className={`space-y-6 ${!isPro ? 'filter grayscale-[0.3]' : ''}`}>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-slate-700">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className={`inline-flex items-center px-3 py-1 ${isPro ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'} rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border`}>
              <span className="mr-1">{isPro ? '✅' : '⭐'}</span> {isPro ? t.proVersionActive : t.proFeature}
            </div>
            <h3 className="text-3xl font-bold mb-3">{t.vaultTitle}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{isPro ? t.proVersionActiveDesc : t.proDesc}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
        {!isPro && (
          <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 text-center max-w-xs">
              <span className="text-4xl mb-3 block">🔒</span>
              <p className="text-slate-800 font-bold mb-1">{t.proFeature}</p>
              <button className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">{t.upgradeNow}</button>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
          <h4 className="font-bold text-slate-800">{t.vaultTitle}</h4>
          <button 
            onClick={triggerUpload}
            className={`text-sm font-bold flex items-center transition-colors ${isPro ? 'text-blue-600 hover:text-blue-800' : 'text-slate-300'}`}
          >
            <span className="mr-1 text-lg">+</span> {t.uploadDoc}
          </button>
        </div>

        <div className="overflow-x-auto">
          {allDocs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                <span className="text-3xl opacity-20">📂</span>
              </div>
              <p className="text-slate-400 font-medium text-sm">{t.noDocs}</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3">{t.docCategory}</th>
                  <th className="px-6 py-3">{lang === 'en' ? 'File Name' : 'ชื่อไฟล์'}</th>
                  <th className="px-6 py-3">{t.companyPlan}</th>
                  <th className="px-6 py-3">{t.localStorage}</th>
                  <th className="px-6 py-3 text-right">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${
                        doc.category === 'Policy' ? 'bg-blue-100 text-blue-700' :
                        doc.category === 'Receipt' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {doc.category === 'Policy' ? t.policyDoc : 
                         doc.category === 'Receipt' ? t.receiptDoc : 
                         doc.category === 'Medical' ? t.medicalDoc : t.otherDoc}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{doc.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{doc.company}</span>
                        <span className="text-[10px] text-slate-400 italic">{doc.policyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[9px] font-black uppercase text-emerald-600 tracking-tighter">{lang === 'en' ? 'Sync Active' : 'จัดเก็บถาวร'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <a href={doc.url} download={doc.name} className="p-1.5 text-slate-400 hover:text-blue-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>
                        <button onClick={() => setDocToDelete({ policyId: doc.policyId, docId: doc.id, name: doc.name })} className="p-1.5 text-slate-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />

      <ConfirmDialog isOpen={!!docToDelete} title={lang === 'en' ? "Delete Document" : "ลบเอกสาร"} message={lang === 'en' ? `Are you sure you want to delete "${docToDelete?.name}"?` : `คุณแน่ใจหรือไม่ว่าต้องการลบ "${docToDelete?.name}"?`} onConfirm={confirmDelete} onCancel={() => setDocToDelete(null)} lang={lang} />

      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isUploading && setShowUploadModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">{t.uploadDoc}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t.linkWithPolicy}</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={selectedPolicyId} onChange={(e) => setSelectedPolicyId(e.target.value)} disabled={isUploading}>
                    {policies.map(p => <option key={p.id} value={p.id}>{p.company} - {p.planName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t.selectCategory}</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as any)} disabled={isUploading}>
                    <option value="Policy">{t.policyDoc}</option>
                    <option value="Receipt">{t.receiptDoc}</option>
                    <option value="Medical">{t.medicalDoc}</option>
                    <option value="Other">{t.otherDoc}</option>
                  </select>
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className={`w-full py-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${isUploading ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/30 border-blue-200 hover:bg-blue-50 transition-colors'}`}>
                  {isUploading ? <div className="animate-spin w-8 h-8 border-4 border-t-blue-600 border-blue-100 rounded-full" /> : <><div className="text-3xl mb-1">📤</div><span className="text-xs font-black text-blue-600 uppercase tracking-widest">{lang === 'en' ? 'Select File' : 'เลือกไฟล์'}</span></>}
                </button>
              </div>
              <div className="mt-8 flex justify-center"><button onClick={() => setShowUploadModal(false)} disabled={isUploading} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">{t.cancel}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultView;
