
import React, { useRef, useState } from 'react';
import { translations, Language } from '../translations';
import { Policy, PolicyDocument } from '../types';

interface VaultViewProps {
  policies: Policy[];
  onUpload: (policyId: string, doc: PolicyDocument) => void;
  onDelete: (policyId: string, docId: string) => void;
  lang: Language;
}

const VaultView: React.FC<VaultViewProps> = ({ policies, onUpload, onDelete, lang }) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(policies[0]?.id || '');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Flatten all documents for listing
  const allDocs = policies.flatMap(p => 
    (p.documents || []).map(d => ({ ...d, policyName: p.planName, policyId: p.id }))
  ).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

  const policyDocs = allDocs.filter(d => d.category === 'Policy');
  const receiptDocs = allDocs.filter(d => d.category === 'Receipt');
  const medicalDocs = allDocs.filter(d => d.category === 'Medical');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPolicyId) return;

    setIsUploading(true);

    try {
      // Simulate base64 reading
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const newDoc: PolicyDocument = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          category: 'Policy',
          mimeType: file.type,
          url: base64,
          uploadDate: new Date().toISOString()
        };
        onUpload(selectedPolicyId, newDoc);
        setIsUploading(false);
        setShowUploadModal(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload failed", err);
      setIsUploading(false);
    }
  };

  const triggerUpload = () => {
    if (policies.length === 0) {
      alert(lang === 'en' ? "Please add a policy first" : "กรุณาเพิ่มกรมธรรม์ก่อน");
      return;
    }
    setShowUploadModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-slate-700">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border border-amber-500/30">
              <span className="mr-1">⭐</span> {t.proFeature}
            </div>
            <h3 className="text-3xl font-bold mb-3">{t.vaultTitle}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{t.proDesc}</p>
            <button className="mt-6 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95">
              {t.upgradeNow}
            </button>
          </div>
          <div className="hidden lg:block">
             <div className="w-32 h-32 bg-slate-700/50 rounded-3xl flex items-center justify-center text-6xl shadow-inner border border-slate-600/50">
               🛡️
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full -ml-10 -mb-10 blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '📄', label: t.policyDoc, count: policyDocs.length, color: 'blue' },
          { icon: '🧾', label: t.receiptDoc, count: receiptDocs.length, color: 'emerald' },
          { icon: '🏥', label: t.medicalDoc, count: medicalDocs.length, color: 'rose' }
        ].map((cat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer opacity-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg">{cat.count} Files</span>
            </div>
            <h4 className="font-bold text-slate-800">{cat.label}</h4>
            <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (cat.count / 5) * 100)}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
          <h4 className="font-bold text-slate-800">{t.vaultTitle}</h4>
          <button 
            onClick={triggerUpload}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center transition-colors"
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
              <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest font-bold">{t.vaultAccess}</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-3">{t.docCategory}</th>
                  <th className="px-6 py-3">File Name</th>
                  <th className="px-6 py-3">{t.companyPlan}</th>
                  <th className="px-6 py-3">Date</th>
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
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">
                          {doc.mimeType.includes('pdf') ? '📕' : '🖼️'}
                        </span>
                        <span className="text-sm font-medium text-slate-800 truncate max-w-[200px]" title={doc.name}>
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{doc.policyName}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <a 
                          href={doc.url} 
                          download={doc.name}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title={t.viewFile}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                        <button 
                          onClick={() => onDelete(doc.policyId, doc.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                          title={t.deleteFile}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,application/pdf"
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isUploading && setShowUploadModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">{t.uploadDoc}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.selectPolicy}</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={selectedPolicyId}
                    onChange={(e) => setSelectedPolicyId(e.target.value)}
                    disabled={isUploading}
                  >
                    {policies.map(p => (
                      <option key={p.id} value={p.id}>{p.company} - {p.planName}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`w-full py-4 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center space-y-2 ${
                    isUploading ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/50 border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center space-y-2">
                       <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                       <span className="text-xs font-bold text-blue-600">{t.uploading}</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl">📤</div>
                      <span className="text-xs font-bold text-blue-600">{lang === 'en' ? 'Click to select file' : 'คลิกเพื่อเลือกไฟล์'}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">JPG, PNG, PDF (MAX 5MB)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-8 flex space-x-3">
                <button 
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultView;
