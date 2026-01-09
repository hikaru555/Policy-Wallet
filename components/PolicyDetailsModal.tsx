
import React from 'react';
import { Policy, PaymentFrequency, calculatePolicyStatus } from '../types';
import { translations, Language } from '../translations';

interface PolicyDetailsModalProps {
  policy: Policy | null;
  onClose: () => void;
  onEdit: (policy: Policy) => void;
  lang: Language;
}

const PolicyDetailsModal: React.FC<PolicyDetailsModalProps> = ({ policy, onClose, onEdit, lang }) => {
  if (!policy) return null;
  const t = translations[lang];

  const getFreqLabel = (f: PaymentFrequency) => {
    switch(f) {
      case PaymentFrequency.MONTHLY: return t.monthly;
      case PaymentFrequency.QUARTERLY: return t.quarterly;
      case PaymentFrequency.YEARLY: return t.yearly;
      default: return t.yearly;
    }
  }

  const totalSumAssured = policy.coverages.reduce((acc, c) => acc + c.sumAssured, 0);
  const currentStatus = calculatePolicyStatus(policy.dueDate);
  const documents = policy.documents || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">✕</button>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-inner">📄</div>
            <div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">{policy.company}</p>
              <h3 className="text-2xl font-bold leading-tight">{policy.planName}</h3>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.status}</p>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                currentStatus === 'Active' ? 'bg-green-100 text-green-700' : 
                currentStatus === 'Grace Period' ? 'bg-amber-100 text-amber-700' : 
                'bg-red-100 text-red-700'
              }`}>
                {currentStatus === 'Active' ? t.active : 
                 currentStatus === 'Grace Period' ? t.gracePeriod : 
                 currentStatus === 'Terminated' ? t.terminated : currentStatus}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.premium} ({getFreqLabel(policy.frequency)})</p>
              <p className="text-xl font-bold text-amber-600">฿{policy.premiumAmount.toLocaleString()}</p>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* List of Coverages */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.details}</h5>
            <div className="space-y-3">
              {policy.coverages.map((c, idx) => (
                <div key={idx} className="flex justify-between items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {c.type}
                    </p>
                    {c.roomRate && <p className="text-[10px] text-slate-500">{t.dailyRoomRate}: ฿{c.roomRate.toLocaleString()}</p>}
                  </div>
                  <p className="font-bold text-blue-600 text-sm">฿{c.sumAssured.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center px-3 pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.totalSumAssured}</span>
              <span className="text-lg font-bold text-blue-800">฿{totalSumAssured.toLocaleString()}</span>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Digital Documents Section */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span>🗄️ {t.vaultTitle}</span>
              {documents.length > 0 && <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px]">{documents.length}</span>}
            </h5>
            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                        {doc.mimeType.includes('pdf') ? '📄' : '🖼️'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-black">{doc.category}</p>
                      </div>
                    </div>
                    <a 
                      href={doc.url} 
                      download={doc.name}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.noDocs}</p>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-100 w-full" />

          <div className="grid grid-cols-1 gap-6">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t.dueDateLabel}</p>
              <p className="text-xl font-bold text-slate-800">{new Date(policy.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button onClick={() => { onEdit(policy); onClose(); }} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">{t.edit}</button>
            <button onClick={onClose} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">{t.done}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetailsModal;
