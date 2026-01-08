
import React, { useState } from 'react';
import { translations, Language } from '../translations';

interface EmergencyProps {
  lang: Language;
}

// Patrick's professional photo URL (same as used in Sidebar)
const AGENT_PHOTO_URL = "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&h=256&auto=format&fit=crop";

const EmergencyContacts: React.FC<EmergencyProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[lang];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Button with Patrick's Photo */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-blue-600 relative group overflow-hidden"
      >
        <img 
          src={AGENT_PHOTO_URL} 
          className="w-full h-full object-cover" 
          alt="Patrick" 
        />
        <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-transparent transition-colors"></div>
        {/* Badge icon to signify communication */}
        <div className="absolute -bottom-1 -right-1 bg-[#00B900] text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-md">
          LINE
        </div>
      </button>

      {/* Contact Patrick Popup */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
            {/* Background decorative circles */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">🧔</div>
                <div>
                  <h5 className="font-black text-sm tracking-tight">{lang === 'en' ? 'Consult Patrick' : 'ปรึกษาคุณแพททริค'}</h5>
                  <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">{t.agent}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === 'en' 
                  ? "Get professional insurance advice, sync your renewals, or ask about tax planning." 
                  : "รับคำปรึกษาประกันอย่างมืออาชีพ แจ้งเตือนวันต่ออายุ หรือวางแผนภาษีกับคุณแพททริค"}
              </p>
            </div>

            <div className="space-y-3">
              <a 
                href="https://line.me/ti/p/@patrickfwd" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center space-x-3 w-full py-4 bg-[#00B900] hover:bg-[#00a300] text-white rounded-2xl font-black text-sm shadow-xl shadow-green-100 transition-all active:scale-95 group"
              >
                <span className="text-xl group-hover:rotate-12 transition-transform">💬</span>
                <span>{t.connectLine}</span>
              </a>
              
              <div className="pt-2 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.creatorCredit}</p>
                <p className="text-[9px] text-slate-300 mt-1">คลินิกประกัน FWD</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyContacts;
