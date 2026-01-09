
import React, { useState, useRef, useEffect } from 'react';
import { User, UnderwritingResult, UsageStats } from '../types';
import { translations, Language } from '../translations';
import { performPreUnderwriting } from '../services/geminiService';
import { storageManager } from '../services/storageManager';

interface PreUnderwritingViewProps {
  user: User | null;
  lang: Language;
  isPro: boolean;
}

const PreUnderwritingView: React.FC<PreUnderwritingViewProps> = ({ user, lang, isPro }) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string, data: string, mimeType: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<UnderwritingResult | null>(null);
  const [usage, setUsage] = useState<UsageStats>(storageManager.getAiUsage());

  const MAX_AI_USAGE = 3;
  const remaining = isPro ? Infinity : Math.max(0, MAX_AI_USAGE - usage.count);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAttachedFiles(prev => [...prev, { name: file.name, data: base64, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRunAnalysis = async () => {
    if (!isPro && remaining <= 0) {
      alert(t.limitReached);
      return;
    }
    if (!history.trim()) {
      alert(lang === 'en' ? "Please describe your medical history." : "กรุณาระบุประวัติสุขภาพของคุณ");
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const res = await performPreUnderwriting(history, attachedFiles, lang);
      if (res) {
        setResult(res);
        if (!isPro) {
          storageManager.incrementAiUsage();
          setUsage(storageManager.getAiUsage());
        }
      } else {
        alert(lang === 'en' ? "Analysis failed. Please try again." : "การวิเคราะห์ล้มเหลว โปรดลองอีกครั้ง");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Standard': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Sub-standard': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Postpone': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Decline': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'Standard': return t.standard;
      case 'Sub-standard': return t.substandard;
      case 'Postpone': return t.postpone;
      case 'Decline': return t.decline;
      default: return level;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10 border-b border-slate-50 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{t.underwritingTitle}</h3>
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isPro ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                {isPro ? t.proPlan : t.memberPlan}
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-1">{t.underwritingDesc}</p>
          </div>
          <div className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center min-w-[140px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.remainingUsage}</p>
            {isPro ? (
              <p className="text-xl font-black text-emerald-600">{t.unlimited}</p>
            ) : (
              <div>
                <p className="text-xl font-black text-slate-800">{remaining} / {MAX_AI_USAGE}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                  {lang === 'en' ? `Used ${usage.count} AI calls today` : `วันนี้ใช้ AI ไปแล้ว ${usage.count} ครั้ง`}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t.medicalHistory}</label>
              <textarea 
                className="w-full h-48 p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none font-medium leading-relaxed"
                placeholder={t.medicalHistoryPlaceholder}
                value={history}
                onChange={(e) => setHistory(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{t.attachRecords}</label>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl transition-all hover:bg-indigo-100"
                >
                  + {lang === 'en' ? 'Add Files' : 'เพิ่มไฟล์'}
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,application/pdf" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <span className="text-lg">📄</span>
                      <span className="text-[10px] font-bold text-slate-600 truncate">{file.name}</span>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-slate-300 hover:text-rose-500 p-1 transition-colors">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || (!isPro && remaining <= 0)}
                className="w-full md:w-fit px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isAnalyzing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {isAnalyzing ? t.evaluatingRisk : t.runUnderwriting}
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-sm">💡</span>
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">{t.medicalHistoryGuidelineTitle}</h4>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start"><span className="text-indigo-400 mt-1">✨</span><p className="text-[11px] font-semibold text-slate-600 leading-relaxed">{t.medicalHistoryGuideline1}</p></li>
                <li className="flex gap-3 items-start"><span className="text-indigo-400 mt-1">✨</span><p className="text-[11px] font-semibold text-slate-600 leading-relaxed">{t.medicalHistoryGuideline2}</p></li>
                <li className="flex gap-3 items-start"><span className="text-indigo-400 mt-1">✨</span><p className="text-[11px] font-semibold text-slate-600 leading-relaxed">{t.medicalHistoryGuideline3}</p></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div ref={resultRef} className="animate-in slide-in-from-bottom-6 duration-700">
        {result ? (
          <div className="space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100">
              <div className="flex items-center space-x-4 mb-10">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-100">🩺</div>
                <div>
                  <h5 className="font-black text-slate-800 uppercase tracking-widest text-lg">AI Underwriting Assessment</h5>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Generated by Intelligent Risk Engine</p>
                </div>
              </div>

              <div className={`p-10 rounded-[2.5rem] border ${getRiskColor(result.riskLevel)} transition-all shadow-md mb-12`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t.riskLevel}</span>
                    <h4 className="text-3xl font-black tracking-tight">{getRiskLabel(result.riskLevel)}</h4>
                  </div>
                </div>
                <div className="h-px bg-current opacity-10 mb-8" />
                <p className="text-lg md:text-xl font-bold leading-relaxed">{result.assessment}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                    <h6 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.reasons}</h6>
                  </div>
                  <div className="space-y-3">
                    {result.reasons.map((reason, i) => (
                      <div key={i} className="flex items-start bg-slate-50/80 p-6 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all hover:bg-white hover:shadow-md group">
                        <span className="text-indigo-400 mr-4 mt-0.5 font-black group-hover:scale-125 transition-transform">•</span>
                        <p className="text-sm text-slate-700 font-semibold leading-relaxed">{reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-10">
                  {result.additionalRequirements.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 px-1">
                        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                        <h6 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.requirements}</h6>
                      </div>
                      <div className="space-y-3">
                        {result.additionalRequirements.map((req, i) => (
                          <div key={i} className="flex items-center space-x-4 p-5 bg-amber-50/50 border border-amber-100 rounded-2xl">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm"><span className="text-amber-500 text-lg">📎</span></div>
                            <p className="text-sm text-amber-900 font-bold">{req}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col space-y-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-2xl flex-shrink-0">🧔</div>
                      <div className="text-left">
                        <h4 className="font-black text-slate-800 tracking-tight text-sm">{t.underwritingConsult}</h4>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-tight mt-0.5">{t.underwritingConsultDesc}</p>
                      </div>
                    </div>
                    <button onClick={() => window.open('https://line.me/ti/p/@patrickfwd', '_blank')} className="w-full py-3.5 bg-[#00B900] hover:bg-[#00a300] text-white rounded-2xl font-black text-xs shadow-lg shadow-green-100/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5">
                      <span>{t.connectLine}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-16 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mb-8 animate-pulse shadow-inner">🤖</div>
            <p className="text-base font-black text-slate-900 uppercase tracking-widest mb-3">{t.awaitingMedicalContext}</p>
            <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[320px]">
              {lang === 'en' ? 'Describe your health history and upload any available records to receive your AI underwriting risk assessment.' : 'ระบุประวัติสุขภาพของคุณและอัปโหลดเอกสารที่มีเพื่อให้ AI ประเมินความเสี่ยงในการรับประกัน'}
            </p>
          </div>
        )}
      </div>

      <div className="p-10 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 flex items-start gap-6">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl flex-shrink-0">🛡️</div>
        <div>
          <h4 className="font-black text-blue-900 text-sm mb-1 uppercase tracking-tight">{t.underwritingDisclaimerTitle}</h4>
          <p className="text-blue-800 text-xs leading-relaxed font-medium opacity-70">{t.underwritingDisclaimerBody}</p>
        </div>
      </div>
    </div>
  );
};

export default PreUnderwritingView;
