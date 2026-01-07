
import React, { useState, useMemo } from 'react';
import { Policy, UserProfile, CoverageType, PaymentFrequency } from '../types';
import { translations, Language } from '../translations';
import { analyzeTaxOptimization } from '../services/geminiService';

interface TaxOptimizationViewProps {
  policies: Policy[];
  profile: UserProfile;
  lang: Language;
}

const TaxOptimizationView: React.FC<TaxOptimizationViewProps> = ({ policies, profile, lang }) => {
  const t = translations[lang];
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    advice: string[];
    suggestedProducts: string[];
    estimatedTotalBenefit: number;
  } | null>(null);

  const taxMetrics = useMemo(() => {
    let lifeHealthSum = 0;
    let pensionSum = 0;

    policies.forEach(p => {
      let annualPremium = p.premiumAmount;
      if (p.frequency === PaymentFrequency.MONTHLY) annualPremium *= 12;
      if (p.frequency === PaymentFrequency.QUARTERLY) annualPremium *= 4;

      const hasPension = p.coverages.some(c => c.type === CoverageType.PENSION);
      // Health/Life bucket (100k cap)
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
    // Pension limit is 200,000 AND max 15% of income
    const pensionCapByIncome = profile.annualIncome * 0.15;
    const pensionMaxLimit = Math.min(200000, pensionCapByIncome);
    const pensionUsed = Math.min(pensionSum, pensionMaxLimit);

    const calculateBracket = (income: number) => {
      if (income <= 150000) return 0;
      if (income <= 300000) return 5;
      if (income <= 500000) return 10;
      if (income <= 750000) return 15;
      if (income <= 1000000) return 20;
      if (income <= 2000000) return 25;
      if (income <= 5000000) return 30;
      return 35;
    };

    const bracket = calculateBracket(profile.annualIncome);
    const totalDeduction = lifeHealthUsed + pensionUsed;
    const estSavings = totalDeduction * (bracket / 100);

    return {
      lifeHealthUsed,
      pensionUsed,
      pensionMaxLimit,
      bracket,
      estSavings,
      totalDeduction,
      pensionCapByIncome
    };
  }, [policies, profile]);

  const handleRunAiTax = async () => {
    setLoading(true);
    try {
      const result = await analyzeTaxOptimization(policies, profile, lang);
      setAiResult(result);
    } catch (e) {
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConsultExpert = () => {
    window.open('https://line.me/ti/p/@patrickfwd', '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{t.taxTitle}</h3>
            <p className="text-slate-500 text-sm mt-1">{t.taxSubtitle}</p>
          </div>
          <button 
            onClick={handleRunAiTax}
            disabled={loading}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            {t.optimizeNow}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">{t.lifeDeduction}</p>
            <h4 className="text-2xl font-black text-slate-900">฿{taxMetrics.lifeHealthUsed.toLocaleString()}</h4>
            <div className="mt-3 flex items-center justify-between text-[10px] text-blue-400">
              <span>{t.maxLimit}: ฿100k</span>
              <span className="font-bold">{Math.round((taxMetrics.lifeHealthUsed / 100000) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-blue-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${(taxMetrics.lifeHealthUsed / 100000) * 100}%` }}></div>
            </div>
          </div>

          <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">{t.pensionDeduction}</p>
            <h4 className="text-2xl font-black text-slate-900">฿{taxMetrics.pensionUsed.toLocaleString()}</h4>
            <div className="mt-3 flex items-center justify-between text-[10px] text-indigo-400">
              <span title={`Max 15% of Income: ฿${taxMetrics.pensionCapByIncome.toLocaleString()}`}>{t.maxLimit}: ฿200k</span>
              <span className="font-bold">{Math.round((taxMetrics.pensionUsed / taxMetrics.pensionMaxLimit) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-indigo-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${(taxMetrics.pensionUsed / taxMetrics.pensionMaxLimit) * 100}%` }}></div>
            </div>
          </div>

          <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl lg:col-span-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.taxSavings}</p>
                <h4 className="text-4xl font-black text-emerald-400">฿{taxMetrics.estSavings.toLocaleString()}</h4>
                <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Total Deduction: ฿{taxMetrics.totalDeduction.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.taxBracket}</p>
                <span className="text-xl font-bold px-3 py-1 bg-white/10 rounded-xl">{taxMetrics.bracket}%</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-4 leading-relaxed italic">{t.thaiTaxNotice}</p>
          </div>
        </div>

        {aiResult && (
          <div className="mt-12 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-200 text-white">🤖</div>
              <h5 className="font-black text-slate-800 uppercase tracking-widest">AI Optimization Strategy</h5>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h6 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{t.recommendations}</h6>
                {aiResult.advice.map((adv, i) => (
                  <div key={i} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start group hover:border-indigo-200 transition-all">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mr-4 font-bold text-xs">{i+1}</span>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{adv}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h6 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Suggested Solutions</h6>
                <div className="grid grid-cols-1 gap-3">
                  {aiResult.suggestedProducts.map((prod, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-lg">📈</div>
                        <span className="text-sm font-bold text-slate-800">{prod}</span>
                      </div>
                      <button 
                        onClick={handleConsultExpert}
                        className="text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:underline"
                      >
                        Ask Patrick
                      </button>
                    </div>
                  ))}
                  {aiResult.suggestedProducts.length === 0 && (
                    <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-400 font-medium">Your current portfolio covers all major tax saving categories!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-10 flex flex-col items-center border-t border-slate-100 mt-8">
              <h5 className="text-lg font-bold text-slate-800 mb-6">{t.consultExpert}</h5>
              <button 
                onClick={handleConsultExpert}
                className="px-12 py-4 bg-[#00B900] hover:bg-[#009e00] text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-green-200 transition-all flex items-center gap-4 active:scale-95 group"
              >
                <span className="text-3xl bg-white/20 p-2 rounded-full group-hover:rotate-12 transition-transform">🧔</span>
                <span>{t.connectLine}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
        <h5 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6">Thai Personal Income Tax Brackets 2024</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { range: '0-150k', rate: '0%' },
            { range: '150-300k', rate: '5%' },
            { range: '300-500k', rate: '10%' },
            { range: '500-750k', rate: '15%' },
            { range: '750k-1M', rate: '20%' },
            { range: '1M-2M', rate: '25%' },
            { range: '2M-5M', rate: '30%' },
            { range: '5M+', rate: '35%' },
          ].map((b, i) => (
            <div key={i} className={`p-3 rounded-2xl text-center border transition-all ${taxMetrics.bracket === parseInt(b.rate) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' : 'bg-white text-slate-600 border-slate-100'}`}>
              <p className="text-[10px] font-bold opacity-60 mb-1">{b.range}</p>
              <p className="text-lg font-black">{b.rate}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaxOptimizationView;
