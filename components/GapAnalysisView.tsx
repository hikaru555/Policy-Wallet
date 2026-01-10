
import React, { useState, useEffect } from 'react';
import { GapAnalysisResult, Policy, UserProfile, calculatePolicyStatus, UsageStats } from '../types';
import { analyzeCoverageGaps } from '../services/geminiService';
import { translations, Language } from '../translations';
import { storageManager } from '../services/storageManager';

interface GapAnalysisViewProps {
  policies: Policy[];
  profile: UserProfile;
  lang: Language;
  onAnalysisComplete?: (score: number) => void;
  isPro: boolean;
  autoRun?: boolean;
}

const GapAnalysisView: React.FC<GapAnalysisViewProps> = ({ policies, profile, lang, onAnalysisComplete, isPro, autoRun }) => {
  const t = translations[lang];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapAnalysisResult | null>(null);
  const [usage, setUsage] = useState<UsageStats>(storageManager.getAiUsage());

  const MAX_AI_USAGE = 10;
  const remaining = isPro ? Infinity : Math.max(0, MAX_AI_USAGE - usage.count);

  const handleRunAnalysis = async () => {
    if (!isPro && remaining <= 0) {
      alert(t.limitReached);
      return;
    }

    setLoading(true);
    const activePolicies = policies.filter(p => calculatePolicyStatus(p.dueDate) !== 'Terminated');
    
    try {
      const res = await analyzeCoverageGaps(activePolicies, profile, lang);
      setResult(res);
      if (onAnalysisComplete && res.score !== undefined) {
        onAnalysisComplete(res.score);
      }
      
      if (!isPro) {
        storageManager.incrementAiUsage();
        setUsage(storageManager.getAiUsage());
      }
    } catch (e) {
      alert(lang === 'en' ? "Failed to run analysis." : "การวิเคราะห์ล้มเหลว โปรดลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // Automatically run analysis if triggered from another view
  useEffect(() => {
    if (autoRun && !loading) {
      handleRunAnalysis();
    }
  }, [autoRun]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // emerald-500
    if (score >= 50) return '#f59e0b'; // amber-500
    return '#f43f5e'; // rose-500
  };

  const handleConsultExpert = () => {
    window.open('https://line.me/ti/p/@patrickfwd', '_blank');
  };

  const activeCount = policies.filter(p => calculatePolicyStatus(p.dueDate) !== 'Terminated').length;
  const displayScore = result?.score || 0;

  return (
    <div className="bg-white p-6 sm:p-10 lg:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-sm border border-slate-100 max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-center lg:items-center gap-8 mb-12 pb-10 border-b border-slate-50">
        <div className="flex-1 text-center lg:text-left space-y-4">
          <div>
            <h4 className="font-black text-3xl sm:text-4xl text-slate-800 tracking-tight leading-none">{t.analysis}</h4>
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl font-medium mt-3">
              {lang === 'en' 
                ? `Smart portfolio review based on your profile and ${activeCount} active policies.` 
                : `วิเคราะห์พอร์ตอัจฉริยะตามข้อมูลของคุณและกรมธรรม์ที่มีผลคุ้มครอง ${activeCount} ฉบับ`}
            </p>
          </div>
          
          {/* Usage Indicator */}
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
            onClick={handleRunAnalysis}
            disabled={loading || (!isPro && remaining <= 0)}
            className="w-full lg:w-auto px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] transition-all font-black text-lg shadow-2xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 hover:-translate-y-1"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span className="text-2xl">⚡</span>
            )}
            <span>{loading ? (lang === 'en' ? 'Processing...' : 'กำลังวิเคราะห์...') : t.runAnalysis}</span>
          </button>
        </div>
      </div>

      {/* Initial State / Waiting for Analysis */}
      {!result && !loading && (
        <div className="text-center py-24 lg:py-40 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 px-8">
          <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-sm border border-slate-100 transition-transform hover:scale-110 duration-500">
            <span className="text-5xl lg:text-6xl animate-bounce">🤖</span>
          </div>
          <h5 className="font-black text-slate-800 text-xl lg:text-3xl mb-4">{lang === 'en' ? 'Ready for Intelligent Analysis' : 'พร้อมสำหรับการวิเคราะห์อัจฉริยะ'}</h5>
          <p className="text-slate-500 max-w-lg mx-auto text-base lg:text-lg leading-relaxed font-medium">
            {lang === 'en' ? 'Our AI will evaluate your total sum assured, room rates, and critical illness coverage against your financial liabilities.' : 'AI ของเราจะประเมินทุนประกันรวม ค่าห้อง และความคุ้มครองโรคร้ายแรงเทียบกับภาระทางการเงินของคุณ'}
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-12 py-10">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 animate-pulse">
            <div className="w-40 h-40 lg:w-56 lg:h-56 bg-slate-100 rounded-full flex-shrink-0"></div>
            <div className="space-y-6 flex-1 w-full">
              <div className="h-6 bg-slate-100 rounded w-1/4 mx-auto lg:mx-0"></div>
              <div className="h-16 bg-slate-100 rounded w-full lg:w-3/4"></div>
              <div className="h-10 bg-slate-100 rounded w-1/2 mx-auto lg:mx-0"></div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Result State */}
      {result && !loading && (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Main Hero Result Banner */}
          <div className="bg-slate-900 rounded-[3rem] lg:rounded-[4rem] p-10 lg:p-16 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[120px] -mr-60 -mt-60 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-blue-500/10 rounded-full blur-[120px] -ml-60 -mb-60 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-12">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 text-center lg:text-left">
                <div className="space-y-6">
                  <h3 className="text-3xl lg:text-5xl font-black tracking-tight leading-none">{t.healthIndex}</h3>
                  <div className={`inline-flex items-center px-10 py-3 rounded-full text-base lg:text-lg font-black border ${
                    result.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    result.score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    <span className="mr-3">
                      {result.score >= 80 ? '✨ ' + (lang === 'en' ? 'Excellence' : 'ดีเยี่ยม') : 
                       result.score >= 50 ? '🛡️ ' + (lang === 'en' ? 'Moderate' : 'ปานกลาง') : 
                       '⚠️ ' + (lang === 'en' ? 'Poor' : 'ควรปรับปรุง')}
                    </span>
                  </div>
                </div>
                <div className="lg:pr-10">
                   <span className="text-8xl lg:text-9xl font-black tabular-nums tracking-tighter" style={{ color: getScoreColor(result.score), textShadow: `0 0 60px ${getScoreColor(result.score)}40` }}>{result.score}%</span>
                </div>
              </div>

              <div className="w-full space-y-10 pt-10">
                <div className="relative">
                  <div className="flex justify-between w-full px-2 mb-6">
                    <span className="text-xs lg:text-sm font-black text-rose-400 uppercase tracking-[0.2em]">{lang === 'en' ? 'Poor' : 'ควรปรับปรุง'}</span>
                    <span className="text-xs lg:text-sm font-black text-amber-400 uppercase tracking-[0.2em]">{lang === 'en' ? 'Moderate' : 'ปานกลาง'}</span>
                    <span className="text-xs lg:text-sm font-black text-emerald-400 uppercase tracking-[0.2em]">{lang === 'en' ? 'Excellence' : 'ดีเยี่ยม'}</span>
                  </div>

                  <div className="h-10 lg:h-12 w-full bg-white/5 rounded-full overflow-hidden relative p-1 border border-white/5 shadow-inner">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 opacity-90"></div>
                  </div>

                  <div 
                    className="absolute top-10 lg:top-12 bottom-0 w-3 bg-white shadow-[0_0_30px_rgba(255,255,255,0.8)] transition-all duration-1500 cubic-bezier(0.2, 0.8, 0.2, 1) z-10 rounded-full"
                    style={{ 
                      left: `${displayScore}%`,
                      transform: 'translateX(-50%)',
                      height: '80px'
                    }}
                  >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full border-4 border-slate-900 shadow-2xl flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 text-xl lg:text-3xl leading-snug mt-16 max-w-5xl font-medium tracking-tight text-center lg:text-left">
                  {result.score >= 80 ? (lang === 'en' ? 'Excellent protection! Your current portfolio is robust and well-balanced.' : 'ความคุ้มครองดีเยี่ยม! พอร์ตโฟลิโอของคุณแข็งแกร่งและสมดุลเป็นอย่างดี') : result.score >= 50 ? (lang === 'en' ? 'Moderate coverage. Your protection is decent but lacks specialization in key areas.' : 'ความคุ้มครองระดับปานกลาง มีความคุ้มครองพอสมควรแต่ยังขาดความเฉพาะเจาะจงในบางด้าน') : (lang === 'en' ? 'Poor coverage detected. Urgent attention required to secure your financial future.' : 'พบช่องว่างความคุ้มครองที่ควรปรับปรุง ต้องการการดูแลอย่างเร่งด่วนเพื่อความมั่นคงทางการเงินของคุณ')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Gaps List */}
            <div className="space-y-12">
              <div className="flex items-center space-x-6 px-1 border-b border-slate-100 pb-8">
                <span className="w-14 h-14 bg-rose-50 text-rose-600 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-sm border border-rose-100">🚩</span>
                <h5 className="font-black text-2xl text-slate-800 uppercase tracking-widest leading-none">{t.gaps}</h5>
              </div>
              <div className="space-y-6">
                {result.gaps.map((gap, i) => (
                  <div key={i} className={`group p-8 lg:p-10 rounded-[2.5rem] border transition-all hover:shadow-2xl hover:-translate-y-2 ${
                    gap.priority === 'High' ? 'bg-rose-50 border-rose-100' : 
                    gap.priority === 'Medium' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex justify-between items-start mb-6">
                      <p className={`font-black text-xs lg:text-sm uppercase tracking-[0.2em] ${
                        gap.priority === 'High' ? 'text-rose-700' : 
                        gap.priority === 'Medium' ? 'text-amber-700' : 'text-slate-700'
                      }`}>{gap.category}</p>
                      <span className={`text-[10px] px-6 py-2.5 rounded-full font-black uppercase tracking-widest shadow-sm ${
                        gap.priority === 'High' ? 'bg-rose-200 text-rose-900' : 
                        gap.priority === 'Medium' ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-900'
                      }`}>
                        {gap.priority === 'High' ? (lang === 'en' ? 'High' : 'สูง') : 
                         gap.priority === 'Medium' ? (lang === 'en' ? 'Medium' : 'กลาง') : 
                         (lang === 'en' ? 'Low' : 'ต่ำ')}
                      </span>
                    </div>
                    <p className="text-xl lg:text-2xl text-slate-800 leading-relaxed font-bold tracking-tight">{gap.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations List */}
            <div className="space-y-12">
              <div className="flex items-center space-x-6 px-1 border-b border-slate-100 pb-8">
                <span className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-sm border border-emerald-100">💡</span>
                <h5 className="font-black text-2xl text-slate-800 uppercase tracking-widest leading-none">{t.recommendations}</h5>
              </div>
              <div className="space-y-6">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-2xl transition-all group">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mr-8 mt-1 font-black text-xl group-hover:scale-110 transition-transform">
                      {i + 1}
                    </div>
                    <p className="text-lg lg:text-xl text-slate-700 leading-relaxed font-bold tracking-tight">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expert Consultation CTA */}
          <div className="pt-24 flex flex-col items-center border-t border-slate-100 text-center">
            <h5 className="text-2xl lg:text-3xl font-black text-slate-800 mb-12 tracking-tight">{t.consultExpert}</h5>
            <button 
              onClick={handleConsultExpert}
              className="px-12 py-7 lg:px-20 lg:py-8 bg-[#00B900] hover:bg-[#009e00] text-white rounded-[3rem] lg:rounded-[4rem] font-black text-xl lg:text-3xl shadow-2xl shadow-green-200 transition-all flex items-center gap-8 active:scale-95 group hover:-translate-y-2"
            >
              <span className="text-5xl lg:text-7xl bg-white/20 p-4 lg:p-5 rounded-full group-hover:rotate-12 transition-transform">🧔</span>
              <div className="text-left">
                <p className="text-xs lg:text-sm font-black uppercase tracking-[0.3em] text-white/80 leading-none mb-2">Connect via LINE</p>
                <span className="leading-none font-black">@patrickfwd</span>
              </div>
            </button>
            <div className="mt-20 px-16 py-4 bg-slate-50 rounded-full text-[11px] lg:text-xs font-black text-slate-400 uppercase tracking-[0.6em] shadow-inner">
              Powered by Policy Wallet AI Core Engine
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GapAnalysisView;
