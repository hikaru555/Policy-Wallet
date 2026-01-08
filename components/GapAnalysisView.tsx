
import React, { useState } from 'react';
import { GapAnalysisResult, Policy, UserProfile, calculatePolicyStatus } from '../types';
import { analyzeCoverageGaps } from '../services/geminiService';
import { translations, Language } from '../translations';

interface GapAnalysisViewProps {
  policies: Policy[];
  profile: UserProfile;
  lang: Language;
  onAnalysisComplete?: (score: number) => void;
}

const GapAnalysisView: React.FC<GapAnalysisViewProps> = ({ policies, profile, lang, onAnalysisComplete }) => {
  const t = translations[lang];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapAnalysisResult | null>(null);

  const handleRunAnalysis = async () => {
    setLoading(true);
    // Filter out Terminated policies so AI doesn't count them as existing coverage
    const activePolicies = policies.filter(p => calculatePolicyStatus(p.dueDate) !== 'Terminated');
    
    try {
      const res = await analyzeCoverageGaps(activePolicies, profile, lang);
      setResult(res);
      if (onAnalysisComplete && res.score !== undefined) {
        onAnalysisComplete(res.score);
      }
    } catch (e) {
      alert("Failed to run analysis.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreStroke = (score: number) => {
    if (score >= 80) return '#10b981'; // emerald-500
    if (score >= 50) return '#f59e0b'; // amber-500
    return '#f43f5e'; // rose-500
  };

  const handleConsultExpert = () => {
    window.open('https://line.me/ti/p/@patrickfwd', '_blank');
  };

  const activeCount = policies.filter(p => calculatePolicyStatus(p.dueDate) !== 'Terminated').length;

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-slate-50">
        <div>
          <h4 className="font-bold text-2xl text-slate-800">{t.analysis}</h4>
          <p className="text-sm text-slate-500 mt-1">Smart portfolio review based on your profile and {activeCount} active policies.</p>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={loading}
          className={`px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all font-bold text-sm shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50 flex items-center space-x-2`}
        >
          {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
          <span>{loading ? (lang === 'en' ? 'Processing...' : 'กำลังวิเคราะห์...') : t.runAnalysis}</span>
        </button>
      </div>

      {!result && !loading && (
        <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span className="text-5xl animate-bounce">🤖</span>
          </div>
          <h5 className="font-bold text-slate-800 text-lg mb-2">Ready for Intelligent Analysis</h5>
          <p className="text-slate-400 max-w-sm mx-auto text-sm">
            Our AI will evaluate your total sum assured, room rates, and critical illness coverage against your financial liabilities.
          </p>
          {policies.some(p => calculatePolicyStatus(p.dueDate) === 'Terminated') && (
            <p className="mt-4 text-[10px] text-amber-600 font-bold uppercase tracking-widest italic">
              Note: Terminated policies are excluded from analysis.
            </p>
          )}
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          <div className="flex items-center space-x-6 animate-pulse">
            <div className="w-32 h-32 bg-slate-100 rounded-full"></div>
            <div className="space-y-3 flex-1">
              <div className="h-4 bg-slate-100 rounded w-1/4"></div>
              <div className="h-6 bg-slate-100 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="h-48 bg-slate-50 rounded-3xl animate-pulse"></div>
            <div className="h-48 bg-slate-50 rounded-3xl animate-pulse"></div>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Enhanced Protection Index View */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="relative w-48 h-48 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  {/* Track */}
                  <circle 
                    cx="96" cy="96" r="80" 
                    stroke="rgba(255,255,255,0.1)" 
                    strokeWidth="16" fill="transparent" 
                  />
                  {/* Progress */}
                  <circle 
                    cx="96" cy="96" r="80" 
                    stroke={getScoreStroke(result.score)} 
                    strokeWidth="16" 
                    fill="transparent" 
                    strokeDasharray={502.65}
                    strokeDashoffset={502.65 - (502.65 * result.score) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-[1500ms] ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-black ${getScoreColor(result.score)} tabular-nums`}>{result.score}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Level</span>
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left space-y-4">
                <div>
                  <h3 className="text-3xl font-black tracking-tight mb-2">{t.healthIndex}</h3>
                  <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border ${
                    result.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    result.score >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    <span className="mr-2">
                      {result.score >= 80 ? '✨ Excellent Protection' : 
                       result.score >= 50 ? '🛡️ Moderate Protection' : 
                       '⚠️ Critical Gaps Found'}
                    </span>
                  </div>
                </div>
                <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
                  {result.score >= 80 
                    ? (lang === 'en' ? "Your current portfolio is robust and well-balanced. You have covered major risks according to industry standards." : "พอร์ตโฟลิโอของคุณแข็งแกร่งและสมดุลเป็นอย่างดี คุณได้รับความคุ้มครองความเสี่ยงหลักตามมาตรฐานอุตสาหกรรมแล้ว")
                    : result.score >= 50 
                    ? (lang === 'en' ? "Your protection is decent but lacks specialization in key areas. Consider strengthening the gaps identified below." : "ความคุ้มครองของคุณอยู่ในระดับพอใช้แต่ยังขาดความเฉพาะเจาะจงในบางด้าน ควรพิจารณาเสริมความแข็งแกร่งในจุดที่ยังเป็นช่องว่าง")
                    : (lang === 'en' ? "Urgent attention required. Significant financial exposure detected. Follow the recommendations to secure your family's future." : "ต้องการการดูแลอย่างเร่งด่วน พบความเสี่ยงทางการเงินที่สำคัญ โปรดปฏิบัติตามคำแนะนำเพื่อรักษาอนาคตของครอบครัวคุณ")
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 px-1 border-b border-slate-100 pb-4">
                <span className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-xl shadow-sm">🚩</span>
                <h5 className="font-black text-slate-800 uppercase tracking-widest">{t.gaps}</h5>
              </div>
              <div className="space-y-4">
                {result.gaps.map((gap, i) => (
                  <div key={i} className={`group p-6 rounded-[2rem] border transition-all hover:shadow-xl hover:-translate-y-1 ${
                    gap.priority === 'High' ? 'bg-rose-50 border-rose-100' : 
                    gap.priority === 'Medium' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <p className={`font-black text-xs uppercase tracking-widest ${
                        gap.priority === 'High' ? 'text-rose-700' : 
                        gap.priority === 'Medium' ? 'text-amber-700' : 'text-slate-700'
                      }`}>{gap.category}</p>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm ${
                        gap.priority === 'High' ? 'bg-rose-200 text-rose-900' : 
                        gap.priority === 'Medium' ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-900'
                      }`}>{gap.priority}</span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed font-semibold">{gap.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-3 px-1 border-b border-slate-100 pb-4">
                <span className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-sm">💡</span>
                <h5 className="font-black text-slate-800 uppercase tracking-widest">{t.recommendations}</h5>
              </div>
              <div className="space-y-4">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-lg transition-all">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mr-4 mt-0.5 font-bold text-sm">
                      {i + 1}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-10 flex flex-col items-center border-t border-slate-100">
            <h5 className="text-lg font-bold text-slate-800 mb-6">{t.consultExpert}</h5>
            <button 
              onClick={handleConsultExpert}
              className="px-12 py-4 bg-[#00B900] hover:bg-[#009e00] text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-green-200 transition-all flex items-center gap-4 active:scale-95 group"
            >
              <span className="text-3xl bg-white/20 p-2 rounded-full group-hover:rotate-12 transition-transform">🧔</span>
              <span>{t.connectLine}</span>
            </button>
            <div className="mt-8 px-6 py-2 bg-slate-100 rounded-full text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] shadow-inner">
              Powered by Gemini 3 Pro
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GapAnalysisView;
