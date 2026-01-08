
import React, { useRef, useState } from 'react';
import { Policy, PaymentFrequency, UserProfile } from '../types';
import { translations, Language } from '../translations';
import html2canvas from 'html2canvas';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  policies: Policy[];
  profile: UserProfile;
  lang: Language;
}

const ShareReportModal: React.FC<ShareReportModalProps> = ({
  isOpen,
  onClose,
  policies,
  profile,
  lang
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  if (!isOpen) return null;
  const t = translations[lang];

  const totalSumAssured = policies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => cAcc + c.sumAssured, 0), 0);

  const totalRoomRate = policies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => cAcc + (c.roomRate || 0), 0), 0);

  const annualPremium = policies.reduce((acc, p) => {
    let multiplier = 1;
    if (p.frequency === PaymentFrequency.MONTHLY) multiplier = 12;
    if (p.frequency === PaymentFrequency.QUARTERLY) multiplier = 4;
    return acc + (p.premiumAmount * multiplier);
  }, 0);

  const shareText = `${t.protectionSummary}: ${profile.name}\nTotal Sum: ฿${totalSumAssured.toLocaleString()}\nAnnual Premium: ฿${annualPremium.toLocaleString()}\n\nPowered by ${t.appName}\n${t.creatorCredit}`;

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert(t.linkCopied);
  };

  const handleDirectShare = async () => {
    setIsProcessing(true);
    try {
      const imageFile = await getReportImageFile();
      
      if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          files: [imageFile],
          title: t.appName,
          text: shareText,
        });
      } else {
        // Fallback for browsers that don't support file sharing
        if (imageFile) {
          const link = document.createElement('a');
          link.download = imageFile.name;
          link.href = URL.createObjectURL(imageFile);
          link.click();
          alert(lang === 'en' 
            ? "Your browser doesn't support direct image sharing. The report has been downloaded so you can upload it manually." 
            : "เบราว์เซอร์ของคุณไม่รองรับการแชร์รูปภาพโดยตรง ระบบได้ดาวน์โหลดรูปภาพให้คุณแล้วเพื่อให้คุณนำไปอัปโหลดเอง");
        }
      }
    } catch (err) {
      console.error("Sharing failed", err);
    } finally {
      setIsProcessing(false);
    }
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
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          
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

            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-sm">🛡️</div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{t.totalSumAssured}</span>
                </div>
                <span className="text-sm font-bold text-blue-600">฿{totalSumAssured.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-sm">🏥</div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{t.dailyRoomRate}</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">฿{totalRoomRate.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-sm">💰</div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{t.annualPremium}</span>
                </div>
                <span className="text-sm font-bold text-amber-600">฿{annualPremium.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-1">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.appName}</p>
               <p className="text-[8px] text-slate-300 font-medium italic">{t.creatorCredit}</p>
            </div>
          </div>

          {/* SOCIAL CONNECTOR SECTION */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t.socialConnector}</h5>
            
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'LINE', color: '#00B900', icon: 'L' },
                { label: 'Facebook', color: '#1877F2', icon: 'F' },
                { label: 'X', color: '#000000', icon: 'X' },
                { label: t.shareWeb, color: '#64748b', icon: '...' }
              ].map((btn, idx) => (
                <button 
                  key={idx}
                  onClick={handleDirectShare}
                  disabled={isProcessing}
                  className="flex flex-col items-center space-y-1 group disabled:opacity-50"
                >
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: btn.color }}
                  >
                    {btn.label === t.shareWeb ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6a3 3 0 100-2.684m0 2.684l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    ) : (
                      <span className="font-bold text-lg">{btn.icon}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">{btn.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all border border-slate-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span className="text-xs">{t.copyLink}</span>
              </button>

              <button 
                onClick={handleDownloadImage}
                disabled={isProcessing}
                className="flex-[2] flex items-center justify-center space-x-2 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100"
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
    </div>
  );
};

export default ShareReportModal;
