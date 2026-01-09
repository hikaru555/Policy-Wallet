
import React, { useState } from 'react';
import { translations, Language } from '../translations';
import { User, UserRole } from '../types';
import AppLogo from './AppLogo';

interface LoginViewProps {
  onLogin: (user: User) => void;
  lang: Language;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, lang }) => {
  const t = translations[lang];
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSuccess = (email: string, name: string, picture: string) => {
    let role: UserRole = 'Member';
    if (email === 'phattararak@gmail.com') {
      role = 'Admin';
      name = 'Phattararak'; 
    }
    const user: User = {
      id: btoa(email).substr(0, 10),
      email,
      name,
      picture,
      role
    };
    onLogin(user);
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      const email = 'phattararak@gmail.com';
      const fullName = 'Phattararak';
      const profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4285F4&color=fff&size=128`;
      handleAuthSuccess(email, fullName, profilePic);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-blue-100/40 rounded-full blur-3xl -mr-60 -mt-60 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-indigo-100/40 rounded-full blur-3xl -ml-60 -mb-60 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 overflow-hidden border border-slate-100 relative">
          
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 border-[6px] border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-lg font-black text-slate-800 tracking-tight">{t.signIn}</p>
            </div>
          )}

          <div className="p-8 md:p-12 text-center">
            <div className="flex justify-center mb-8 group hover:scale-105 transition-transform duration-500">
               <AppLogo id="login-logo" size={100} />
            </div>

            <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-3">{t.appName}</h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[18rem] mx-auto mb-12">
              {t.intelligentCompanion}
            </p>

            <button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-4 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] font-black text-slate-700 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-xl shadow-slate-100 active:scale-[0.98] group mb-8"
            >
              <svg width="24" height="24" viewBox="0 0 20 20"><path d="M19.6 10.23c0-.7-.06-1.36-.18-2H10v3.79h5.38c-.23 1.25-.94 2.31-1.99 3.01v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.31z" fill="#4285F4"/><path d="M10 20c2.7 0 4.96-.89 6.61-2.42l-3.23-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H1.32v2.59C2.97 17.65 6.22 20 10 20z" fill="#34A853"/><path d="M4.41 11.91c-.2-.6-.31-1.24-.31-1.91s.11-1.31.31-1.91V5.5H1.32C.48 7.15 0 8.98 0 10s.48 2.85 1.32 4.5l3.09-2.59z" fill="#FBBC05"/><path d="M10 3.96c1.47 0 2.78.5 3.82 1.49l2.86-2.86C14.96.99 12.7 0 10 0 6.22 0 2.97 2.35 1.32 5.5l3.09 2.41c.79-2.36 2.99-4.12 5.59-4.12z" fill="#EA4335"/></svg>
              <span className="text-lg tracking-tight">{t.googleAuth}</span>
            </button>

            <div className="space-y-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] leading-relaxed px-6">{t.tosAgreement}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
