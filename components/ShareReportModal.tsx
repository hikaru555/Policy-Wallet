
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
  const [copiedLink, setCopiedLink] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  if (!isOpen) return null;
  const t = translations[lang];

  const totalSumAssured = policies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => {
      const includedTypes = [CoverageType.LIFE, CoverageType.PENSION, CoverageType.SAVINGS];
      return includedTypes.includes(c.type) ? cAcc + c.sumAssured : cAcc;
    }, 0), 0);

  const totalHospitalBenefit = policies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => 
      c.type === CoverageType.HOSPITAL_BENEFIT ? cAcc + c.sumAssured : cAcc, 0), 0);

  const totalRoomRate = policies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => cAcc + (c.roomRate || 0), 0), 0);

  const annualPremium = policies.reduce((acc, p) => {
    let multiplier = 1;
    if (p.frequency === PaymentFrequency.MONTHLY) multiplier = 12;
    if (p.frequency === PaymentFrequency.QUARTERLY) multiplier = 4;
    return acc + (p.premiumAmount * multiplier);
  }, 0);

  const getPublicUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?view=${user.id}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getReportImageFile = async (): Promise<File | null> => {
    if (!reportRef.current) return null;
    
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f8fafc',
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `Protection-Summary-${profile.name.replace(/\s+/g, '-')}.png`, { type: 'image/png' });
          resolve(file);
        } else {
          resolve(null);
        }
      }, 'image/png');
    });
  };

  const handleDownloadImage = async () => {
    setIsProcessing(true);
    try {
      const imageFile = await getReportImageFile();
      if (imageFile) {
        const link = document.createElement('a');
        link.download = imageFile.name;
        link.href = URL.createObjectURL(imageFile);
        link.click();
      }
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-blob"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold mb-1">{t.shareTitle}</h3>
              <p className="text-indigo-100 text-sm opacity-90">{t.shareSubtitle}</p>
            </div>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto flex-1">
          {/* THE CAPTURE AREA */}
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
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs">🛡️</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">{t.totalSumAssured}</span>
                </div>
                <span className="text-xs font-black text-blue-600">฿{totalSumAssured.toLocaleString()}</span>
              </div>

              <div className="flex flex-col p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs">🏥</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">{t.dailyRoomRate}</span>
                </div>
                <span className="text-xs font-black text-emerald-600">฿{totalRoomRate.toLocaleString()}/d</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.appName}</p>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleCopyLink}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all border flex items-center justify-center gap-3 active:scale-95 shadow-lg ${
                copiedLink ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200' : 'bg-white border-slate-200 text-slate-800 shadow-slate-100 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>{copiedLink ? t.linkCopied : t.copyLink}</span>
            </button>

            <button 
              onClick={handleDownloadImage}
              disabled={isProcessing}
              className="w-full flex items-center justify-center space-x-2 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-xs">{t.savingImage}</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="text-sm">{t.downloadImage}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareReportModal;
