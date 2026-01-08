
import React, { useRef, useState } from 'react';
import { Policy, PaymentFrequency, UserProfile, CoverageType, User } from '../types';
import { translations, Language } from '../translations';
import html2canvas from 'html2canvas';

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

  const totalSumAssured = policies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => {
      const includedTypes = [CoverageType.LIFE, CoverageType.PENSION, CoverageType.SAVINGS];
      return includedTypes.includes(c.type) ? cAcc + c.sumAssured : cAcc;
    }, 0), 0);

  const totalRoomRate = policies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => cAcc + (c.roomRate || 0), 0), 0);

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    setIsProcessing(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
      });
      const link = document.createElement('a');
      link.download = `Protection-Summary-${profile.name.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 p-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold mb-1">{t.shareTitle}</h3>
              <p className="text-indigo-100 text-sm opacity-90">{lang === 'en' ? 'Download a snapshot of your protection.' : 'ดาวน์โหลดสรุปความคุ้มครองของคุณ'}</p>
            </div>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">✕</button>
          </div>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto flex-1">
          <div ref={reportRef} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">PW</div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t.protectionSummary}</p>
                  <h4 className="text-lg font-bold text-slate-800">{profile.name}</h4>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.snapshotDate}</p>
                <p className="text-xs font-bold text-slate-600">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[9px] font-bold text-slate-500 uppercase">{t.totalSumAssured}</span>
                <span className="text-xs font-black text-blue-600">฿{totalSumAssured.toLocaleString()}</span>
              </div>
              <div className="flex flex-col p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[9px] font-bold text-slate-500 uppercase">{t.dailyRoomRate}</span>
                <span className="text-xs font-black text-emerald-600">฿{totalRoomRate.toLocaleString()}/d</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleDownloadImage}
            disabled={isProcessing}
            className="w-full flex items-center justify-center space-x-2 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100"
          >
            {isProcessing ? t.savingImage : t.downloadImage}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareReportModal;
