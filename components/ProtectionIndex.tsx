
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
    if (s >= 50) return lang === 'en' ? 'Moderate' : 'ปานกลาง';
    return lang === 'en' ? 'Poor' : 'ควรปรับปรุง';
  };

  const displayScore = score ?? 0;
  const scoreColor = getScoreColor(displayScore);

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center overflow-hidden relative group">
      <div className="flex justify-between items-center w-full mb-6">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t.healthIndex}</h4>
        {score !== null && (
          <span className="text-xl font-black tabular-nums" style={{ color: scoreColor }}>{score}%</span>
        )}
      </div>
      
      <div className="w-full space-y-4">
        <div className="relative pt-4 pb-2">
          <div className="flex justify-between w-full px-1 mb-2">
            <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">{lang === 'en' ? 'Poor' : 'ควรปรับปรุง'}</span>
            <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">{lang === 'en' ? 'Moderate' : 'ปานกลาง'}</span>
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">{lang === 'en' ? 'Excellence' : 'ดีเยี่ยม'}</span>
          </div>

          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden relative p-[2px]">
             <div className="h-full w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 opacity-90"></div>
          </div>

          <div 
            className="absolute top-6 bottom-0 w-1 bg-slate-900 shadow-xl transition-all duration-1000 ease-out z-10 rounded-full"
            style={{ 
              left: `${displayScore}%`,
              transform: 'translateX(-50%)',
              height: '24px',
              top: '24px'
            }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rounded-full border-2 border-white shadow-sm"></div>
          </div>
        </div>
        
        <div className="text-center pt-2">
          {score !== null ? (
            <div className="animate-in fade-in slide-in-from-top-1 duration-500">
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-100">
                {getScoreStatus(score)}
              </p>
            </div>
          ) : (
            <p className="text-slate-400 text-xs font-medium animate-pulse">{lang === 'en' ? 'Pending Analysis...' : 'กำลังรอการวิเคราะห์...'}</p>
          )}
        </div>
      </div>

      <button 
        onClick={onRunAnalysis}
        className="w-full mt-6 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border border-indigo-100 active:scale-[0.98]"
      >
        {score !== null ? (lang === 'en' ? 'Re-run AI Analysis' : 'เริ่มวิเคราะห์ใหม่อีกครั้ง') : t.runAnalysis}
      </button>

      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
};

export default ProtectionIndex;
