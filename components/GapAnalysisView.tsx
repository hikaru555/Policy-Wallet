
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

  useEffect(() => {
    if (autoRun && !loading && !result) {
      handleRunAnalysis();
    }
  }, [autoRun]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // emerald-500
    if (score >= 50) return '#f59e0b'; // amber-500
    return '#f43f5e'; // rose-500
  };

  const activeCount = policies.filter(p => calculatePolicyStatus(p.dueDate) !== 'Terminated').length;
  const displayScore = result?.score || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="bg-white p-6 sm:p-10 lg:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 max-w-[1400px] mx-auto overflow-hidden relative">
        {/* Subtle Decorative Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none opacity-60"></div>
        
        {/* Header Section */}
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8 mb-12">
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                <span className="text-xs font-black uppercase tracking-widest">{t.portfolioDiagnostic}</span>
              </div>
              <h3 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none">{t.analysis}</h3>
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl font-medium mt-4">
                {t.portfolioDiagnosticDesc.replace('{count}', activeCount.toString())}
              </p>
            </div>
            
            <div className="flex justify-center lg:justify-start gap-4">
              <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{t.remainingUsage}:</span>
                <span className={`text-sm font-black tracking-tight ${remaining > 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
                  {isPro ? t.unlimited : `${remaining} / ${MAX_AI_USAGE}`}
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-auto flex-shrink-0">
            <button
              onClick={handleRunAnalysis}
              disabled={loading || (!isPro && remaining <= 0)}
              className="w-full lg:w-auto px-10 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] transition-all font-black text-lg shadow-2xl shadow-indigo-200 hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="text-2xl group-hover:animate-bounce">🤖</span>
              )}
              <span>{loading ? t.processing : t.runAnalysis}</span>
            </button>
          </div>
        </div>

        {!result && !loading && (
          <div className="mt-12 py-32 lg:py-48 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-8 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white/40 pointer-events-none"></div>
             
             {/* Micro-animated Diagnostic Station */}
             <div className="relative z-10">
               <div className="relative w-32 h-32 lg:w-44 lg:h-44 mx-auto mb-12">
                  <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute inset-0 border-4 border-dashed border-indigo-200 rounded-full animate-[spin_10s_linear_infinite] opacity-50"></div>
                  <div className="absolute inset-4 border-2 border-indigo-100 rounded-full animate-[spin_6s_linear_infinite_reverse] opacity-40"></div>
                  <div className="absolute inset-6 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl border border-slate-100 overflow-hidden group">
                     <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
                        <div className="w-full h-1 bg-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.8)] absolute top-0 left-0 animate-[scan_3s_ease-in-out_infinite]"></div>
                     </div>
                     <span className="text-5xl lg:text-7xl transition-transform duration-500 group-hover:scale-110">🛡️</span>
                  </div>
               </div>

               <style>{`
                 @keyframes scan {
                   0%, 100% { top: 0%; opacity: 0; }
                   20%, 80% { opacity: 1; }
                   50% { top: 100%; }
                 }
               `}</style>

               <h5 className="font-black text-slate-800 text-xl lg:text-3xl mb-4 tracking-tight">{t.awaitingDiagnostic}</h5>
               <p className="text-slate-500 max-w-lg mx-auto text-base lg:text-lg leading-relaxed font-medium">
                 {t.awaitingDiagnosticDesc}
               </p>
             </div>
          </div>
        )}

        {loading && (
          <div className="space-y-12 py-10 animate-pulse">
            <div className="h-[400px] bg-slate-50 rounded-[3rem] w-full border border-slate-100 flex flex-col items-center justify-center gap-6">
               <div className="w-20 h-20 bg-slate-200 rounded-full"></div>
               <div className="h-6 w-48 bg-slate-200 rounded-full"></div>
               <div className="h-10 w-96 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-16 animate-in slide-in-from-bottom-8 duration-1000 relative z-10">
            {/* Main Result Hero Card */}
            <div className="bg-slate-900 rounded-[3rem] lg:rounded-[4rem] p-10 lg:p-20 text-white shadow-2xl relative overflow-hidden ring-8 ring-slate-50">
              <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full blur-[150px] -mr-60 -mt-60 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-[50rem] h-[50rem] bg-emerald-600/10 rounded-full blur-[150px] -ml-60 -mb-60 pointer-events-none"></div>

              <div className="relative z-10 flex flex-col gap-16">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                  <div className="space-y-8 flex-1">
                    <div>
                      <h3 className="text-3xl lg:text-5xl font-black tracking-tight leading-none mb-6">{t.healthIndex}</h3>
                      <div className={`inline-flex items-center px-10 py-3 rounded-full text-lg font-black border transition-all duration-500 ${
                        result.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 
                        result.score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 
                        'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                      }`}>
                        <span className="mr-3">
                          {result.score >= 80 ? '✨ ' + t.excellence : 
                           result.score >= 50 ? '🛡️ ' + t.moderate : 
                           '⚠️ ' + t.poor}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-slate-300 text-xl lg:text-3xl leading-snug max-w-3xl font-bold tracking-tight">
                      {result.score >= 80 ? (lang === 'en' ? 'Your financial shield is robust. We recommend fine-tuning for maximum tax efficiency.' : 'เกราะป้องกันทางการเงินของคุณแข็งแกร่งมาก เราแนะนำให้ปรับจูนเพื่อประสิทธิภาพทางภาษีสูงสุด') : 
                       result.score >= 50 ? (lang === 'en' ? 'You have a foundation, but critical gaps exist in your recovery protection.' : 'คุณมีรากฐานที่ดีแล้ว แต่ยังมีช่องว่างที่สำคัญในการคุ้มครองเพื่อการฟื้นฟู') : 
                       (lang === 'en' ? 'Urgent attention required. Your current portfolio leaves significant wealth at risk.' : 'ต้องการความช่วยเหลือเร่งด่วน พอร์ตโฟลิโอปัจจุบันของคุณมีความเสี่ยงสูงต่อความมั่งคั่ง')}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center lg:pr-10">
                     <div className="relative">
                        <div className="absolute inset-0 blur-3xl opacity-20 animate-pulse" style={{ backgroundColor: getScoreColor(result.score) }}></div>
                        <span className="text-[120px] lg:text-[180px] font-black tabular-nums tracking-tighter leading-none relative z-10" style={{ color: getScoreColor(result.score) }}>
                          {result.score}<span className="text-4xl lg:text-6xl font-black opacity-40 ml-1">%</span>
                        </span>
                     </div>
                  </div>
                </div>

                <div className="w-full space-y-12">
                  <div className="relative px-2">
                    <div className="flex justify-between w-full mb-6">
                      <span className="text-xs font-black text-rose-400 uppercase tracking-[0.2em]">{lang === 'en' ? 'High Risk' : 'ความเสี่ยงสูง'}</span>
                      <span className="text-xs font-black text-amber-400 uppercase tracking-[0.2em]">{lang === 'en' ? 'Secured' : 'เริ่มมั่นคง'}</span>
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">{lang === 'en' ? 'Optimized' : 'เหมาะสมที่สุด'}</span>
                    </div>
                    <div className="h-4 lg:h-6 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
                      <div className="h-full w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 opacity-90 transition-all duration-1000"></div>
                    </div>
                    <div 
                      className="absolute top-10 lg:top-14 bottom-0 w-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] transition-all duration-[1.5s] cubic-bezier(0.2, 0.8, 0.2, 1) z-10 rounded-full"
                      style={{ left: `${displayScore}%`, height: '60px' }}
                    >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full border-4 border-slate-900 shadow-2xl flex items-center justify-center">
                         <div className="w-1 h-1 bg-slate-900 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-7 space-y-10">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl border border-rose-100 shadow-sm">🚩</div>
                    <h5 className="font-black text-2xl text-slate-800 uppercase tracking-tight leading-none">{t.gaps}</h5>
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{result.gaps.length} Identifications</span>
                </div>
                <div className="space-y-6">
                  {result.gaps.map((gap, i) => (
                    <div key={i} className={`group p-8 rounded-[2.5rem] border transition-all hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden ${
                      gap.priority === 'High' ? 'bg-rose-50/50 border-rose-100' : 
                      gap.priority === 'Medium' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50/50 border-slate-100'
                    }`}>
                      <div className="absolute top-0 left-0 w-1.5 h-full transition-colors duration-500" style={{ backgroundColor: gap.priority === 'High' ? '#f43f5e' : gap.priority === 'Medium' ? '#f59e0b' : '#64748b' }}></div>
                      <div className="flex justify-between items-start mb-6">
                        <p className={`font-black text-xs uppercase tracking-[0.25em] ${gap.priority === 'High' ? 'text-rose-700' : gap.priority === 'Medium' ? 'text-amber-700' : 'text-slate-700'}`}>{gap.category}</p>
                        <span className={`text-[9px] px-5 py-2 rounded-xl font-black uppercase tracking-widest shadow-sm ${gap.priority === 'High' ? 'bg-rose-600 text-white' : gap.priority === 'Medium' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white'}`}>
                          {gap.priority === 'High' ? (lang === 'en' ? 'Critical' : 'วิกฤต') : 
                           gap.priority === 'Medium' ? (lang === 'en' ? 'Moderate' : 'ปานกลาง') : 
                           (lang === 'en' ? 'Low' : 'ต่ำ')}
                        </span>
                      </div>
                      <p className="text-xl lg:text-2xl text-slate-800 leading-relaxed font-black tracking-tight">{gap.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-10">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl border border-emerald-100 shadow-sm">💡</div>
                  <h5 className="font-black text-2xl text-slate-800 uppercase tracking-tight leading-none">{t.recommendations}</h5>
                </div>
                <div className="space-y-6">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group hover:shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/40 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-100 transition-colors"></div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mr-6 mt-1 font-black text-sm relative z-10 group-hover:scale-110 transition-transform">{i + 1}</div>
                      <p className="text-lg text-slate-700 leading-relaxed font-bold tracking-tight relative z-10">{rec}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-12 p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden shadow-2xl group border border-white/10">
                   <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
                   <div className="relative z-10 flex flex-col gap-8">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden"><img src="profile.jpg" alt="Patrick FWD" className="w-full h-full object-cover" /></div>
                         <div>
                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-1">{t.expertDesk}</p>
                            <h6 className="text-xl font-black tracking-tight">{t.strategyVerification}</h6>
                         </div>
                      </div>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed">{t.strategyVerificationDesc}</p>
                      <button onClick={() => window.open('https://line.me/ti/p/@patrickfwd', '_blank')} className="w-full py-4 bg-[#00B900] hover:bg-[#00a300] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-900/40 transition-all active:scale-95 flex items-center justify-center gap-3">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-5.231-5.383-9.486-12-9.486s-12 4.255-12 9.486c0 4.69 4.27 8.602 10.046 9.324.391.084.922.258 1.057.592.121.303.079.777.039 1.083l-.171 1.027c-.052.312-.252 1.22 1.085.666 1.336-.554 7.21-4.246 9.837-7.269 1.832-1.995 2.107-3.818 2.107-5.423z"/></svg>
                        {t.connectLine}
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GapAnalysisView;
