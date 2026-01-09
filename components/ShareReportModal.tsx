import React, { useRef, useState } from 'react';
import { Policy, PaymentFrequency, UserProfile, CoverageType, User, calculatePolicyStatus } from '../types';
import { translations, Language } from '../translations';
import html2canvas from 'html2canvas';
import AppLogo from './AppLogo';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  policies: Policy[];
  profile: UserProfile;
  user: User;
  lang: Language;
}

const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  policies,
  profile,
  user,
  lang
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  if (!isOpen) return null;
  const t = translations[lang];

  const activePolicies = policies.filter(p => calculatePolicyStatus(p.dueDate) !== 'Terminated');

  const totalSumAssured = activePolicies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => {
      const includedTypes = [CoverageType.LIFE, CoverageType.PENSION, CoverageType.SAVINGS];
      return includedTypes.includes(c.type) ? cAcc + c.sumAssured : cAcc;
    }, 0), 0);

  const totalRoomRate = activePolicies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => cAcc + (c.roomRate || 0), 0), 0);

  const totalCritical = activePolicies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => 
      c.type === CoverageType.CRITICAL ? cAcc + c.sumAssured : cAcc, 0), 0);

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    setIsProcessing(true);
    
    // Tiny delay to ensure styles are perfectly computed
    await new Promise(r => setTimeout(r, 100));

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 3, // High resolution
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false,
        onclone: (clonedDoc) => {
          // You can modify the cloned document here if needed
          const el = clonedDoc.getElementById('capture-card');
          if (el) el.style.borderRadius = '0px'; // Ensure corners are clean if needed
        }
      });
      
      const link = document.createElement('a');
      link.download = `PolicyWallet-Summary-${profile.name.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error("Download failed", err);
      alert(lang === 'en' ? "Failed to generate image. Please try again." : "ไม่สามารถสร้างรูปภาพได้ โปรดลองอีกครั้ง");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="bg-indigo-600 p-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-1">{t.shareTitle}</h3>
              <p className="text-indigo-100 text-sm font-medium opacity-90">{lang === 'en' ? 'Your professional protection summary card.' : 'บัตรสรุปข้อมูลความคุ้มครองระดับมืออาชีพของคุณ'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto flex-1">
          {/* Preview Container */}
          <div className="flex justify-center">
            <div 
              ref={reportRef} 
              id="capture-card"
              className="w-full max-w-[400px] aspect-[4/5] bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5"
            >
              {/* Subtle Invisible/Visible Watermark Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-25deg] select-none">
                <p className="text-[14px] font-black text-white uppercase text-center whitespace-nowrap">
                  {t.creatorCredit}
                </p>
              </div>

              {/* Background Accents for the saved image */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center gap-3">
                    <AppLogo size={42} id="share-card-logo" />
                    <div>
                      <h4 className="text-sm font-black tracking-tighter leading-none">{t.appName}</h4>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Snapshot Report</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.snapshotDate}</p>
                    <p className="text-[11px] font-bold text-slate-300">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mb-10">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">{t.protectionSummary}</p>
                  <h2 className="text-2xl font-black tracking-tight mb-6">{profile.name}</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t.totalSumAssured}</p>
                      <p className="text-4xl font-black tracking-tighter tabular-nums">฿{totalSumAssured.toLocaleString()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t.dailyRoomRate}</p>
                        <p className="text-xl font-black tabular-nums text-emerald-400">฿{totalRoomRate.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t.critical}</p>
                        <p className="text-xl font-black tabular-nums text-rose-400">฿{totalCritical.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-6">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🛡️</span>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{t.active} {t.policies}</span>
                      </div>
                      <span className="text-lg font-black">{activePolicies.length}</span>
                   </div>

                   <div className="flex items-center justify-between border-t border-white/5 pt-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-[10px] font-black">AI</div>
                        <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Verified Protection</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.1em] max-w-[150px] leading-tight opacity-70">
                           {t.creatorCredit}
                         </p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleDownloadImage}
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-3 py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl shadow-indigo-100 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t.processing}</span>
                </>
              ) : (
                <>
                  <span className="text-lg">💾</span>
                  <span>{t.downloadImage}</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest px-10 leading-relaxed">
              {lang === 'en' ? 'This card is generated for informational purposes and shows only your active local portfolio.' : 'บัตรสรุปข้อมูลนี้สร้างขึ้นเพื่อแจ้งข้อมูลเบื้องต้นจากรายการกรมธรรม์ที่เปิดใช้งานในเครื่องของคุณเท่านั้น'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareReportModal;