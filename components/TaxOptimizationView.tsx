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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="bg-white p-6 sm:p-10 lg:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-sm border border-slate-100 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-center gap-8 mb-12 pb-10 border-b border-slate-50">
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight leading-none">{t.taxTitle}</h3>
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl font-medium mt-3">
                {t.taxSubtitle}
              </p>
            </div>
            
            {/* Usage Indicator: Consistent with Gap Analysis */}
            <div className="flex justify-center lg:justify-start">
              <div className="px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">{t.remainingUsage}:</span>
                <span className={`text-sm sm:text-base font-black tracking-tight ${remaining > 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
                  {isPro ? t.unlimited : `${remaining} / ${MAX_AI_USAGE}`}
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-auto flex-shrink-0">
            <button 
              onClick={handleRunAiTax}
              disabled={loading || (!isPro && remaining <= 0)}
              className="w-full lg:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] transition-all font-black text-lg shadow-2xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 hover:-translate-y-1"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="text-2xl">⚡</span>
              )}
              <span>{loading ? t.processing : t.optimizeNow}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">{t.lifeDeduction}</p>
            <h4 className="text-2xl font-black text-slate-900">฿{taxMetrics.lifeHealthUsed.toLocaleString()}</h4>
            <div className="mt-3 flex items-center justify-between text-[10px] text-blue-400 font-bold uppercase">
              <span>{t.maxLimit}: ฿100,000</span>
              <span>{Math.round((taxMetrics.lifeHealthUsed / 100000) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-blue-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${(taxMetrics.lifeHealthUsed / 100000) * 100}%` }}></div>
            </div>
          </div>

          <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">{t.pensionDeduction}</p>
            <h4 className="text-2xl font-black text-slate-900">฿{taxMetrics.pensionUsed.toLocaleString()}</h4>
            <div className="mt-3 flex items-center justify-between text-[10px] text-indigo-400 font-bold uppercase">
              <span>{t.maxLimit}: ฿{taxMetrics.pensionMaxLimit.toLocaleString()}</span>
              <span>{Math.round((taxMetrics.pensionUsed / (taxMetrics.pensionMaxLimit || 1)) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-indigo-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${(taxMetrics.pensionUsed / (taxMetrics.pensionMaxLimit || 1)) * 100}%` }}></div>
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.totalTaxDeduction}</p>
            <h4 className="text-2xl font-black text-slate-900">฿{taxMetrics.totalDeductionCombined.toLocaleString()}</h4>
            <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1">
               <p className="text-[8px] text-slate-400 font-bold uppercase">{t.taxPersonal}: ฿{taxMetrics.standardPersonal.toLocaleString()}</p>
               <p className="text-[8px] text-slate-400 font-bold uppercase">{t.taxExpense}: ฿{taxMetrics.standardExpense.toLocaleString()}</p>
               <p className="text-[8px] text-slate-400 font-bold uppercase">{t.taxFamily}: ฿{(taxMetrics.parentCareSum + taxMetrics.childSum + taxMetrics.spouseSum + taxMetrics.disabledSum).toLocaleString()}</p>
               <p className="text-[8px] text-slate-400 font-bold uppercase">{t.taxInvest}: ฿{(taxMetrics.investmentCombinedUsed + taxMetrics.thaiEsgUsed).toLocaleString()}</p>
            </div>
          </div>

          <div className={`p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between transition-colors ${taxMetrics.netTaxResult >= 0 ? 'bg-emerald-600' : 'bg-slate-900'}`}>
            <div>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">
                {taxMetrics.netTaxResult >= 0 ? t.taxRefund : t.taxPayable}
              </p>
              <h4 className="text-3xl font-black text-white">฿{Math.abs(taxMetrics.netTaxResult).toLocaleString()}</h4>
              <p className="text-[9px] text-white/50 mt-2 italic">
                {t.taxWithheld}: ฿{taxMetrics.taxWithheld.toLocaleString()}
              </p>
            </div>
            <div className="flex justify-between items-center mt-4">
               <span className="text-[10px] font-bold text-white/40 uppercase">{t.taxBracket}</span>
               <span className="text-xl font-bold">{taxMetrics.bracket}%</span>
            </div>
          </div>
        </div>

        {aiResult && (
          <div className="mt-12 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg shadow-indigo-100">🤖</div>
              <div>
                <h5 className="font-black text-slate-800 uppercase tracking-widest text-lg">{t.aiTaxStrategy}</h5>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t.optimizedFor2025}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h6 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> {t.recommendations}
                </h6>
                {aiResult.advice.map((adv, i) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start group hover:bg-white hover:shadow-xl transition-all">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mr-4 font-black text-xs">{i+1}</span>
                    <p className="text-sm text-slate-700 leading-relaxed font-semibold">{adv}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h6 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> {t.suggestedProducts}
                </h6>
                <div className="grid grid-cols-1 gap-4">
                  {aiResult.suggestedProducts.map((prod, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📈</div>
                        <span className="text-sm font-black text-slate-800 tracking-tight">{prod}</span>
                      </div>
                      <button onClick={() => window.open('https://line.me/ti/p/@patrickfwd', '_blank')} className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg hover:bg-indigo-600 hover:text-white transition-all">{t.askPatrick}</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-10 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6">🔒</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{t.limitReached}</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">{t.proDesc}</p>
            <button onClick={() => setShowUpgradeModal(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 active:scale-95 transition-all">{t.upgradeNow}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxOptimizationView;