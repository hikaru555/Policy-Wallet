
import React, { useState, useMemo } from 'react';
import { Policy, UserProfile, CoverageType, PaymentFrequency, calculatePolicyStatus, UsageStats } from '../types';
import { translations, Language } from '../translations';
import { analyzeTaxOptimization } from '../services/geminiService';
import { storageManager } from '../services/storageManager';

interface TaxOptimizationViewProps {
  policies: Policy[];
  profile: UserProfile;
  lang: Language;
  isPro: boolean;
}

const TaxOptimizationView: React.FC<TaxOptimizationViewProps> = ({ policies, profile, lang, isPro }) => {
  const t = translations[lang];
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [usage, setUsage] = useState<UsageStats>(storageManager.getAiUsage());
  const [aiResult, setAiResult] = useState<{
    advice: string[];
    suggestedProducts: string[];
    estimatedTotalBenefit: number;
  } | null>(null);

  const MAX_AI_USAGE = 10;
  const remaining = isPro ? Infinity : Math.max(0, MAX_AI_USAGE - usage.count);

  const activePolicies = useMemo(() => 
    policies.filter(p => calculatePolicyStatus(p.dueDate) !== 'Terminated'),
  [policies]);

  const taxMetrics = useMemo(() => {
    let lifeHealthSum = 0;
    let pensionSum = 0;

    activePolicies.forEach(p => {
      let annualPremium = p.premiumAmount;
      if (p.frequency === PaymentFrequency.MONTHLY) annualPremium *= 12;
      if (p.frequency === PaymentFrequency.QUARTERLY) annualPremium *= 4;

      const hasPension = p.coverages.some(c => c.type === CoverageType.PENSION);
      const hasLifeHealth = p.coverages.some(c => 
        c.type === CoverageType.LIFE || 
        c.type === CoverageType.HEALTH || 
        c.type === CoverageType.SAVINGS || 
        c.type === CoverageType.CRITICAL
      );

      if (hasPension) {
        pensionSum += annualPremium;
      } else if (hasLifeHealth) {
        lifeHealthSum += annualPremium;
      }
    });

    const lifeHealthUsed = Math.min(lifeHealthSum, 100000);
    const pensionCapByPercent = profile.annualIncome * 0.15;
    const pensionMaxLimit = Math.min(200000, pensionCapByPercent);
    const pensionUsed = Math.min(pensionSum, pensionMaxLimit);

    const standardPersonal = 60000;
    const standardExpense = Math.min(profile.annualIncome * 0.5, 100000);
    const ded = profile.taxDeductions;
    const spouseSum = ded?.spouseDeduction ? 60000 : 0;
    const parentCareSum = (ded?.fatherCare ? 30000 : 0) + (ded?.motherCare ? 30000 : 0);
    const parentHealthSum = Math.min(ded?.parentHealthInsurance || 0, 15000);
    const childSum = (ded?.childAllowance || 0) * 30000;
    const disabledSum = (ded?.disabledCareCount || 0) * 60000;
    const prenatalSum = Math.min(ded?.prenatalExpenses || 0, 60000);
    const investmentSumRaw = (ded?.ssf || 0) + (ded?.rmf || 0) + (ded?.pvd || 0) + pensionUsed;
    const investmentCombinedUsed = Math.min(investmentSumRaw, 500000);
    const thaiEsgCap = Math.min(profile.annualIncome * 0.3, 300000);
    const thaiEsgUsed = Math.min(ded?.thaiEsg || 0, thaiEsgCap);
    const otherManualSum = (ded?.socialSecurity || 0) + 
                           (ded?.homeLoanInterest || 0) + 
                           (ded?.donations || 0) + 
                           ((ded?.donationsEducation || 0) * 2) +
                           (ded?.otherDeductions || 0);

    const totalInsuranceDeduction = lifeHealthUsed + pensionUsed + parentHealthSum;
    const totalDeductionCombined = standardPersonal + standardExpense + spouseSum + parentCareSum + parentHealthSum + childSum + disabledSum + prenatalSum + investmentCombinedUsed + thaiEsgUsed + otherManualSum;

    const calculateBracket = (income: number) => {
      const taxableIncome = Math.max(0, income - totalDeductionCombined);
      if (taxableIncome <= 150000) return 0;
      if (taxableIncome <= 300000) return 5;
      if (taxableIncome <= 500000) return 10;
      if (taxableIncome <= 750000) return 15;
      if (taxableIncome <= 1000000) return 20;
      if (taxableIncome <= 2000000) return 25;
      if (taxableIncome <= 5000000) return 30;
      return 35;
    };

    const bracket = calculateBracket(profile.annualIncome);
    const taxableIncome = Math.max(0, profile.annualIncome - totalDeductionCombined);
    let totalTaxLiability = 0;
    if (taxableIncome > 150000) {
      if (taxableIncome <= 300000) totalTaxLiability = (taxableIncome - 150000) * 0.05;
      else if (taxableIncome <= 500000) totalTaxLiability = 7500 + (taxableIncome - 300000) * 0.10;
      else if (taxableIncome <= 750000) totalTaxLiability = 27500 + (taxableIncome - 500000) * 0.15;
      else if (taxableIncome <= 1000000) totalTaxLiability = 65000 + (taxableIncome - 750000) * 0.20;
      else if (taxableIncome <= 2000000) totalTaxLiability = 115000 + (taxableIncome - 1000000) * 0.25;
      else if (taxableIncome <= 5000000) totalTaxLiability = 365000 + (taxableIncome - 2000000) * 0.30;
      else totalTaxLiability = 1265000 + (taxableIncome - 5000000) * 0.35;
    }

    const taxWithheld = ded?.taxWithheld || 0;
    const netTaxResult = taxWithheld - totalTaxLiability;

    return {
      lifeHealthUsed,
      pensionUsed,
      pensionMaxLimit,
      bracket,
      totalInsuranceDeduction,
      totalDeductionCombined,
      standardPersonal,
      standardExpense,
      parentCareSum,
      parentHealthSum,
      childSum,
      spouseSum,
      disabledSum,
      prenatalSum,
      investmentCombinedUsed,
      thaiEsgUsed,
      totalTaxLiability,
      taxWithheld,
      netTaxResult
    };
  }, [activePolicies, profile]);

  const handleRunAiTax = async () => {
    if (!isPro && remaining <= 0) { 
      setShowUpgradeModal(true); 
      return; 
    }
    setLoading(true);
    try {
      const result = await analyzeTaxOptimization(activePolicies, profile, lang);
      setAiResult(result);
      if (!isPro) {
        storageManager.incrementAiUsage();
        setUsage(storageManager.getAiUsage());
      }
    } catch (e) {
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const isRefund = taxMetrics.netTaxResult >= 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="bg-white p-6 sm:p-10 lg:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 max-w-[1400px] mx-auto overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none opacity-60"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8 mb-12">
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                <span className="text-xs font-black uppercase tracking-widest">{t.smartPlanner}</span>
              </div>
              <h3 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none">{t.taxTitle}</h3>
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl font-medium mt-4">{t.taxSubtitle}</p>
            </div>
            
            <div className="flex justify-center lg:justify-start gap-4">
              <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t.remainingUsage}:</span>
                <span className={`text-sm font-black tracking-tight ${remaining > 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
                  {isPro ? t.unlimited : `${remaining} / ${MAX_AI_USAGE}`}
                </span>
              </div>
              {isPro && (
                <div className="px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-2">
                   <span className="text-xs">⭐</span>
                   <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">{t.proActive}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full lg:w-auto flex-shrink-0">
            <button 
              onClick={handleRunAiTax}
              disabled={loading || (!isPro && remaining <= 0)}
              className="w-full lg:w-auto px-10 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] transition-all font-black text-lg shadow-2xl shadow-indigo-200 hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="text-2xl group-hover:animate-pulse">✨</span>}
              <span>{loading ? t.processing : t.optimizeNow}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          <div className="group p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-6">
               <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-blue-100/50 group-hover:scale-110 transition-transform">🧬</div>
               <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${taxMetrics.lifeHealthUsed >= 100000 ? 'text-emerald-500' : 'text-blue-400'}`}>
                 {taxMetrics.lifeHealthUsed >= 100000 ? t.taxMaximized : t.taxOptimizing}
               </span>
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t.lifeDeduction}</p>
            <h4 className="text-3xl font-black text-slate-900 tabular-nums">฿{taxMetrics.lifeHealthUsed.toLocaleString()}</h4>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase">
                <span className="text-slate-400">Max ฿100,000</span>
                <span className="text-blue-600">{Math.round((taxMetrics.lifeHealthUsed / 100000) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000" style={{ width: `${(taxMetrics.lifeHealthUsed / 100000) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="group p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-6">
               <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-violet-100/50 group-hover:scale-110 transition-transform">⛱️</div>
               <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${taxMetrics.pensionUsed >= taxMetrics.pensionMaxLimit && taxMetrics.pensionMaxLimit > 0 ? 'text-emerald-500' : 'text-violet-400'}`}>
                 {taxMetrics.pensionUsed >= taxMetrics.pensionMaxLimit && taxMetrics.pensionMaxLimit > 0 ? t.taxMaximized : t.taxOptimizing}
               </span>
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t.pensionDeduction}</p>
            <h4 className="text-3xl font-black text-slate-900 tabular-nums">฿{taxMetrics.pensionUsed.toLocaleString()}</h4>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase">
                <span className="text-slate-400">Max ฿{taxMetrics.pensionMaxLimit.toLocaleString()}</span>
                <span className="text-violet-600">{Math.round((taxMetrics.pensionUsed / (taxMetrics.pensionMaxLimit || 1)) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full transition-all duration-1000" style={{ width: `${(taxMetrics.pensionUsed / (taxMetrics.pensionMaxLimit || 1)) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-inner overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl">📊</span>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.totalTaxDeduction}</p>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                 <h4 className="text-3xl font-black text-slate-900 tabular-nums">฿{taxMetrics.totalDeductionCombined.toLocaleString()}</h4>
              </div>
              <div className="grid grid-cols-1 gap-3 pt-2">
                 {[
                   { label: t.taxPersonal, val: taxMetrics.standardPersonal, color: 'bg-blue-400' },
                   { label: t.taxExpense, val: taxMetrics.standardExpense, color: 'bg-emerald-400' },
                   { label: t.taxFamily, val: taxMetrics.parentCareSum + taxMetrics.childSum + taxMetrics.spouseSum + taxMetrics.disabledSum, color: 'bg-amber-400' },
                   { label: t.taxInvest, val: taxMetrics.investmentCombinedUsed + taxMetrics.thaiEsgUsed, color: 'bg-indigo-400' },
                 ].map((item, idx) => (
                   <div key={idx} className="flex items-center justify-between">
                     <div className="flex items-center gap-2 overflow-hidden">
                       <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.color}`}></div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{item.label}</span>
                     </div>
                     <span className="text-[11px] font-black text-slate-600 tabular-nums ml-2">฿{item.val.toLocaleString()}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-700 ${isRefund ? 'bg-emerald-600 scale-105 z-20 ring-8 ring-emerald-50' : 'bg-slate-900'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{isRefund ? '🎉' : '🧾'}</span>
                <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.2em]">{isRefund ? t.taxRefund : t.taxPayable}</p>
              </div>
              <h4 className="text-4xl font-black text-white tabular-nums tracking-tighter">฿{Math.abs(taxMetrics.netTaxResult).toLocaleString()}</h4>
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase text-white/50">{t.taxWithheld}</span>
                  <span className="text-[12px] font-black tabular-nums">฿{taxMetrics.taxWithheld.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-white/50">{t.taxBracket}</span>
                  <span className="text-xl font-black tabular-nums">{taxMetrics.bracket}%</span>
                </div>
              </div>
            </div>
            {isRefund && <div className="mt-6 px-4 py-2 bg-white/20 rounded-xl text-center backdrop-blur-sm border border-white/20"><span className="text-[10px] font-black uppercase tracking-widest">{t.alreadySettled}</span></div>}
          </div>
        </div>

        {aiResult ? (
          <div className="mt-16 space-y-10 animate-in slide-in-from-bottom-8 duration-1000 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl shadow-slate-200">🤖</div>
                <div>
                  <h5 className="font-black text-slate-900 text-2xl tracking-tight mb-1">{t.aiTaxStrategy}</h5>
                  <p className="text-indigo-600 text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2"><span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>{t.optimizedFor2025}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm">
                 <span className="text-xl">💰</span>
                 <div>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{t.potentialBenefit}</p>
                    <p className="text-xl font-black text-emerald-700 leading-none">฿{aiResult.estimatedTotalBenefit.toLocaleString()}</p>
                 </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h6 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3"><div className="w-1 h-4 bg-indigo-500 rounded-full"></div> {t.recommendations}</h6>
                <div className="space-y-4">
                  {aiResult.advice.map((adv, i) => (
                    <div key={i} className="p-8 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-100 group-hover:bg-indigo-600 transition-colors"></div>
                      <div className="flex items-start"><span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mr-6 font-black text-sm group-hover:scale-110 transition-transform">{i+1}</span><p className="text-lg text-slate-700 leading-relaxed font-bold tracking-tight">{adv}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <h6 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3"><div className="w-1 h-4 bg-emerald-500 rounded-full"></div> {t.suggestedProducts}</h6>
                <div className="grid grid-cols-1 gap-5">
                  {aiResult.suggestedProducts.map((prod, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-2xl transition-all group overflow-hidden relative">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-50 transition-colors"></div>
                      <div className="flex items-center space-x-5 relative z-10"><div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-6 transition-transform">📈</div><span className="text-lg font-black text-slate-800 tracking-tight">{prod}</span></div>
                      <button onClick={() => window.open('https://line.me/ti/p/@patrickfwd', '_blank')} className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-indigo-600 transition-all active:scale-95 shadow-lg relative z-10">{t.askPatrick}</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : !loading && (
          <div className="mt-12 py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm border border-slate-100 animate-bounce">🛡️</div>
             <h5 className="text-xl font-black text-slate-800 mb-2">{t.readyForAi}</h5>
             <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium leading-relaxed">{t.readyForAiDesc}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxOptimizationView;
