
import React from 'react';
import { translations, Language } from '../translations';

interface ProtectionIndexProps {
  score: number | null;
  onRunAnalysis: () => void;
  lang: Language;
}

const ProtectionIndex: React.FC<ProtectionIndexProps> = ({ score, onRunAnalysis, lang }) => {
  const t = translations[lang];

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10b981'; // emerald-500
    if (s >= 50) return '#f59e0b'; // amber-500
    return '#f43f5e'; // rose-500
  };

  const getScoreStatus = (s: number) => {
    if (s >= 80) return lang === 'en' ? 'Excellence' : 'ดีเยี่ยม';
    if (s >= 50) return lang === 'en' ? 'Medium' : 'ปานกลาง';
    return lang === 'en' ? 'Poor' : 'ควรปรับปรุง';
  };

  const displayScore = score ?? 0;
  const scoreColor = getScoreColor(displayScore);

  return (
    <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col items-center overflow-hidden relative group transition-all duration-500">
      {/* Visual Depth Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none opacity-80"></div>
      
      {/* Header: Readable Score and Status */}
      <div className="flex justify-between items-center w-full mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
             <span className="text-xl">🛡️</span>
          </div>
          <div className="flex flex-col">
            <h4 className="text-[12px] font-black text-white uppercase tracking-[0.1em] leading-tight">{t.healthIndex}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">AI Insight</p>
            </div>
          </div>
        </div>
        
        {score !== null && (
          <div className="flex flex-col items-end leading-none">
             <span className="text-4xl font-black tabular-nums tracking-tighter text-white" style={{ textShadow: `0 0 15px ${scoreColor}80` }}>
               {score}%
             </span>
             <span className="text-[12px] font-black uppercase tracking-widest mt-1.5 text-white bg-slate-800/80 px-2 py-0.5 rounded-md border border-white/5">
               {getScoreStatus(score)}
             </span>
          </div>
        )}
      </div>
      
      {/* Gauge: High-Contrast Track and Larger Labels */}
      <div className="w-full relative z-10 mb-6 px-1">
        <div className="relative py-2">
          {/* Main Track - Thicker for visibility */}
          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden relative border border-white/10 shadow-inner">
             <div className="h-full w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 opacity-90"></div>
          </div>

          {/* Pin Indicator - More Prominent */}
          <div 
            className="absolute top-[-4px] w-1 h-8 bg-white shadow-[0_0_12px_rgba(255,255,255,1)] transition-all duration-1000 cubic-bezier(0.2, 0.8, 0.2, 1.2) z-10 rounded-full"
            style={{ 
              left: `${displayScore}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-slate-900 shadow-xl"></div>
          </div>

          {/* Stage Labels: Pure White & Larger */}
          <div className="flex justify-between w-full mt-3.5">
            <span className="text-[11px] font-black text-white uppercase tracking-tight">{lang === 'en' ? 'Poor' : 'ควรปรับปรุง'}</span>
            <span className="text-[11px] font-black text-white uppercase tracking-tight">{lang === 'en' ? 'Medium' : 'ปานกลาง'}</span>
            <span className="text-[11px] font-black text-white uppercase tracking-tight">{lang === 'en' ? 'Excellence' : 'ดีเยี่ยม'}</span>
          </div>
        </div>
      </div>

      {/* Enlarged Action Button */}
      <button 
        onClick={onRunAnalysis}
        className="w-full py-4 bg-white text-slate-900 hover:bg-indigo-50 rounded-2xl font-black text-[13px] uppercase tracking-[0.25em] transition-all active:scale-[0.97] shadow-2xl flex items-center justify-center gap-2.5 group/btn relative z-10 border border-white/20"
      >
        <span>{score !== null ? (lang === 'en' ? 'Recalibrate' : 'วิเคราะห์ข้อมูลใหม่') : t.runAnalysis}</span>
        <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>

      {/* Clear Footer Brand */}
      <div className="mt-4 flex items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
         <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white">INTELLECTUAL PROTECTION ENGINE</span>
      </div>
    </div>
  );
};

export default ProtectionIndex;
