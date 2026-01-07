
import React, { useState } from 'react';
import { EMERGENCY_CONTACTS } from '../constants';
import { translations, Language } from '../translations';

interface EmergencyProps {
  lang: Language;
}

const EmergencyContacts: React.FC<EmergencyProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[lang];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button onClick={() => setIsOpen(!isOpen)} className="w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-red-700 transition-all hover:scale-110 active:scale-95">
        <span className="text-2xl">🆘</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 bg-red-600 text-white flex justify-between items-center">
            <h5 className="font-bold">{t.emergency}</h5>
            <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            <div className="p-3 border-b border-slate-100 mb-2">
              <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">{t.agent}</p>
              <a 
                href="https://line.me/ti/p/@patrickfwd" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-between p-3 rounded-xl bg-blue-50 text-blue-800 mt-1 hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg">🧔</div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold leading-tight">Patrick</span>
                    <span className="text-[9px] text-blue-600 font-bold uppercase">@patrickfwd</span>
                  </div>
                </div>
                <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">LINE</span>
              </a>
            </div>

            {EMERGENCY_CONTACTS.map((contact, i) => (
              <a key={i} href={`tel:${contact.phone}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">📞</div>
                  <span className="text-sm font-medium text-slate-700">{contact.name}</span>
                </div>
                <span className="text-blue-600 font-bold text-sm">{contact.phone}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyContacts;
