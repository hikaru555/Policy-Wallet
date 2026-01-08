
import React, { useState } from 'react';
import { translations, Language } from '../translations';

interface EmergencyProps {
  lang: Language;
}

const LineIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 10.304c0-5.231-5.383-9.486-12-9.486s-12 4.255-12 9.486c0 4.69 4.27 8.602 10.046 9.324.391.084.922.258 1.057.592.121.303.079.777.039 1.083l-.171 1.027c-.052.312-.252 1.22 1.085.666 1.336-.554 7.21-4.246 9.837-7.269 1.832-1.995 2.107-3.818 2.107-5.423z"/>
  </svg>
);

const EmergencyContacts: React.FC<EmergencyProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[lang];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Floating Action Button - Clean LINE Theme */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-16 h-16 bg-[#00B900] text-white rounded-full shadow-[0_8px_30px_rgb(0,185,0,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 relative group"
      >
        <LineIcon className="w-8 h-8" />
        {/* Subtle Ping Animation */}
        <span className="absolute inset-0 rounded-full bg-[#00B900] animate-ping opacity-20 pointer-events-none"></span>
      </button>

      {/* Modern Contact Popup */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
          <div className="p-6 border-b border-slate-50">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-50 text-[#00B900] rounded-xl flex items-center justify-center">
                  <LineIcon className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="font-black text-slate-800 text-sm tracking-tight">{lang === 'en' ? 'Insurance Consultant' : 'ปรึกษาผู้เชี่ยวชาญ'}</h5>
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{t.agent}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-slate-300 hover:text-slate-500 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {lang === 'en' 
                ? "Get expert advice on policies, tax optimization, and emergency claims via LINE." 
                : "รับคำปรึกษาจากผู้เชี่ยวชาญด้านกรมธรรม์ การวางแผนภาษี และการแจ้งเคลมฉุกเฉินผ่าน LINE"}
            </p>
          </div>

          <div className="p-6 space-y-4 bg-slate-50/50">
            <a 
              href="https://line.me/ti/p/@patrickfwd" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center justify-center space-x-3 w-full py-4 bg-[#00B900] hover:bg-[#00a300] text-white rounded-2xl font-black text-sm shadow-xl shadow-green-100 transition-all active:scale-95 group"
            >
              <LineIcon className="w-5 h-5" />
              <span>{t.connectLine}</span>
            </a>
            
            <div className="text-center pt-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.creatorCredit}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyContacts;
