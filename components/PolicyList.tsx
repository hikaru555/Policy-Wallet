
import React, { useMemo, useState } from 'react';
import { Policy, calculatePolicyStatus, CoverageType } from '../types';
import { translations, Language } from '../translations';

interface PolicyListProps {
  policies: Policy[];
  onDelete: (id: string) => void;
  onEdit: (policy: Policy) => void;
  onViewDetails?: (policy: Policy) => void;
  onAddNew?: () => void;
  lang: Language;
}

const getCoverageColor = (type: string): string => {
  switch (type) {
    case CoverageType.LIFE: return 'text-blue-600 bg-blue-50';
    case CoverageType.HEALTH: return 'text-emerald-600 bg-emerald-50';
    case CoverageType.ACCIDENT: return 'text-orange-600 bg-orange-50';
    case CoverageType.CRITICAL: return 'text-rose-600 bg-rose-50';
    case CoverageType.SAVINGS: return 'text-violet-600 bg-violet-50';
    case CoverageType.PENSION: return 'text-indigo-600 bg-indigo-50';
    case CoverageType.HOSPITAL_BENEFIT: return 'text-pink-600 bg-pink-50';
    default: return 'text-slate-600 bg-slate-50';
  }
};

const PolicyList: React.FC<PolicyListProps> = ({ policies, onDelete, onEdit, onViewDetails, onAddNew, lang }) => {
  const t = translations[lang];
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);

  const groupedPolicies = useMemo(() => {
    const groups = {
      grace: [] as Policy[],
      active: [] as Policy[],
      terminated: [] as Policy[]
    };

    policies.forEach(p => {
      const status = calculatePolicyStatus(p.dueDate);
      if (status === 'Grace Period') groups.grace.push(p);
      else if (status === 'Active') groups.active.push(p);
      else groups.terminated.push(p);
    });

    return groups;
  }, [policies]);

  const getOptimizationTip = (policy: Policy) => {
    const tips: string[] = [];
    policy.coverages.forEach(c => {
      if (c.type === CoverageType.HEALTH && c.roomRate && c.roomRate < 4000) {
        tips.push(lang === 'en' 
          ? `Low Room Rate (฿${c.roomRate.toLocaleString()}). Modern hospital costs in Thailand average ฿6,000+. Consider an upgrade.`
          : `ค่าห้องต่ำ (฿${c.roomRate.toLocaleString()}) ค่ารักษาพยาบาลปัจจุบันเฉลี่ย 6,000+ บาท ควรพิจารณาปรับแผน`);
      }
      if (c.type === CoverageType.LIFE && c.sumAssured < 1000000) {
        tips.push(lang === 'en'
          ? "Sum assured is below recommended ฿1M benchmark for income protection."
          : "ทุนประกันต่ำกว่า 1 ล้านบาท ซึ่งเป็นเกณฑ์แนะนำพื้นฐานสำหรับการคุ้มครองรายได้");
      }
    });
    return tips.length > 0 ? tips[0] : null;
  };

  const renderPolicyTable = (list: Policy[], statusType: 'active' | 'grace' | 'terminated') => {
    if (list.length === 0) return null;

    const config = {
      grace: { title: t.gracePeriod, icon: '⚠️', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-100' },
      active: { title: t.active, icon: '✅', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100' },
      terminated: { title: t.terminated, icon: '📁', color: 'text-slate-500', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' }
    }[statusType];

    return (
      <div className="space-y-4 mb-10 last:mb-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className={`flex items-center justify-between px-6 py-3 rounded-2xl border ${config.borderColor} ${config.bgColor}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{config.icon}</span>
            <h5 className={`font-black uppercase tracking-widest text-xs ${config.color}`}>{config.title}</h5>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full bg-white/50 border ${config.borderColor} ${config.color}`}>
            {list.length} {list.length === 1 ? 'Policy' : 'Policies'}
          </span>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 w-[35%]">{t.companyPlan}</th>
                  <th className="px-4 py-5 w-[25%]">{t.coverageType}</th>
                  <th className="px-8 py-5 w-[25%] text-right">{t.sumAssured}</th>
                  <th className="px-8 py-5 w-[15%] text-right">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {list.map(p => {
                  const hasDocs = p.documents && p.documents.length > 0;
                  const tip = getOptimizationTip(p);
                  
                  return (
                    <tr 
                      key={p.id} 
                      className="hover:bg-slate-50/50 transition-all group cursor-pointer relative" 
                      onClick={() => onViewDetails?.(p)}
                    >
                      <td className="px-8 py-6 align-top">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <div className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors truncate">{p.planName}</div>
                            {tip && (
                              <div className="relative flex-shrink-0">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setActiveSuggestion(activeSuggestion === p.id ? null : p.id); }}
                                  className="w-5 h-5 flex items-center justify-center bg-amber-100 text-amber-600 rounded-full text-[10px] animate-pulse hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                                  title="AI Insight Available"
                                >
                                  💡
                                </button>
                                {activeSuggestion === p.id && (
                                  <div className="absolute left-full ml-4 top-0 w-64 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl z-50 text-[11px] font-bold leading-relaxed animate-in slide-in-from-left-2 duration-300">
                                    <div className="text-amber-400 mb-2 uppercase tracking-widest text-[9px] font-black">AI Protection Insight</div>
                                    {tip}
                                    <div className="mt-3 pt-2 border-t border-white/10 flex justify-end">
                                      <button onClick={(e) => { e.stopPropagation(); setActiveSuggestion(null); }} className="text-white/40 hover:text-white transition-colors">Dismiss</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {hasDocs && (
                              <span className="text-slate-300 flex-shrink-0">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold tracking-tight mt-1 truncate">
                            {p.company} {p.policyNumber ? `| ${p.policyNumber}` : ''}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-6 align-top">
                        <div className="space-y-3">
                          {p.coverages.map((c, i) => (
                            <div key={i} className="h-[22px] flex items-center">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${getCoverageColor(c.type)} whitespace-nowrap`}>
                                {(t.coverageTypeLabels as any)[c.type] || c.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-8 py-6 align-top text-right">
                        <div className="space-y-3">
                          {p.coverages.map((c, i) => (
                            <div key={i} className="h-[22px] flex items-center justify-end font-black text-slate-800 tabular-nums text-xs">
                              ฿{c.sumAssured.toLocaleString()}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-8 py-6 text-right align-top" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          <button onClick={() => onEdit(p)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => onDelete(p.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {policies.length > 0 ? (
        <>
          {renderPolicyTable(groupedPolicies.grace, 'grace')}
          {renderPolicyTable(groupedPolicies.active, 'active')}
          {renderPolicyTable(groupedPolicies.terminated, 'terminated')}
        </>
      ) : (
        <div className="bg-white rounded-[3rem] p-16 md:p-24 border border-slate-100 shadow-sm text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20"></div>
           <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
             <span className="text-6xl">📂</span>
           </div>
           <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">{t.noPoliciesFound}</h3>
           <p className="text-slate-400 font-medium mb-10 max-w-sm mx-auto">{lang === 'en' ? 'Start organizing your insurance portfolio today.' : 'เริ่มต้นจัดระเบียบพอร์ตกรมธรรม์ของคุณวันนี้'}</p>
           
           <button 
             onClick={onAddNew}
             className="px-14 py-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white rounded-[2.5rem] font-black text-lg uppercase tracking-[0.2em] shadow-[0_25px_60px_-15px_rgba(79,70,229,0.5)] hover:shadow-[0_30px_70px_-10px_rgba(79,70,229,0.7)] transition-all hover:-translate-y-1.5 active:scale-95 flex items-center gap-5 mx-auto group border border-white/10"
           >
             <span className="text-3xl font-light group-hover:rotate-90 transition-transform duration-500">+</span>
             <span>{t.addPolicy}</span>
           </button>
        </div>
      )}
    </div>
  );
};

export default PolicyList;
