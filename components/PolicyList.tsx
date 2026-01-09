
import React from 'react';
import { Policy, calculatePolicyStatus } from '../types';
import { translations, Language } from '../translations';

interface PolicyListProps {
  policies: Policy[];
  onDelete: (id: string) => void;
  onEdit: (policy: Policy) => void;
  onViewDetails?: (policy: Policy) => void;
  lang: Language;
}

const PolicyList: React.FC<PolicyListProps> = ({ policies, onDelete, onEdit, onViewDetails, lang }) => {
  const t = translations[lang];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h4 className="font-bold text-lg">{t.policies}</h4>
        <span className="text-sm text-slate-500">{policies.length} total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-4">{t.companyPlan}</th>
              <th className="px-6 py-4">{t.coverageType}</th>
              <th className="px-6 py-4">{t.sumAssured}</th>
              <th className="px-6 py-4">{t.status}</th>
              <th className="px-6 py-4">{t.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {policies.map(p => {
              const totalSum = p.coverages.reduce((acc, c) => acc + c.sumAssured, 0);
              const types = p.coverages
                .map(c => c.type)
                .join(", ");
              const currentStatus = calculatePolicyStatus(p.dueDate);
              const hasDocs = p.documents && p.documents.length > 0;
              
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => onViewDetails?.(p)}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-800 group-hover:text-blue-600">{p.planName}</div>
                        {hasDocs && (
                          <span className="text-slate-400" title={`${p.documents?.length} documents`}>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold tracking-tight">{p.company} {p.policyNumber ? `| ${p.policyNumber}` : ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-600 line-clamp-1 max-w-[150px]" title={types}>
                      {types}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">฿{totalSum.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      currentStatus === 'Active' ? 'bg-green-100 text-green-800' : 
                      currentStatus === 'Grace Period' ? 'bg-amber-100 text-amber-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentStatus === 'Active' ? t.active : 
                       currentStatus === 'Grace Period' ? t.gracePeriod : 
                       currentStatus === 'Terminated' ? t.terminated : currentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-4">
                      <button onClick={() => onEdit(p)} className="text-slate-400 hover:text-blue-600 transition-colors" title={t.edit}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => onDelete(p.id)} className="text-slate-400 hover:text-red-600 transition-colors" title={t.remove}>
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
  );
};

export default PolicyList;
