
import React from 'react';
import { translations, Language } from '../translations';
import { Policy } from '../types';

interface VaultViewProps {
  policies: Policy[];
  lang: Language;
}

const VaultView: React.FC<VaultViewProps> = ({ policies, lang }) => {
  const t = translations[lang];

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
        {/* Abstract background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full -ml-10 -mb-10 blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '📄', label: t.policyDoc, count: policies.length, color: 'blue' },
          { icon: '🧾', label: t.receiptDoc, count: 0, color: 'emerald' },
          { icon: '🏥', label: t.medicalDoc, count: 0, color: 'rose' }
        ].map((cat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer opacity-80 hover:opacity-100">
            <div className={`w-12 h-12 rounded-xl bg-${cat.color}-50 text-${cat.color}-600 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>
              {cat.icon}
            </div>
            <h4 className="font-bold text-slate-800">{cat.label}</h4>
            <p className="text-xs text-slate-500 mt-1">{cat.count} Files</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
          <h4 className="font-bold text-slate-800">{t.vaultTitle}</h4>
          <button className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center opacity-50 cursor-not-allowed">
            <span className="mr-1 text-lg">+</span> {t.uploadDoc}
          </button>
        </div>
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
            <span className="text-3xl opacity-20">📂</span>
          </div>
          <p className="text-slate-400 font-medium text-sm">{t.noDocs}</p>
          <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest font-bold">{t.vaultAccess}</p>
        </div>
      </div>
    </div>
  );
};

export default VaultView;
