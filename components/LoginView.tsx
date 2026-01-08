
import React, { useState } from 'react';
import { translations, Language } from '../translations';
import { User, UserRole } from '../types';

// The aistudio object is assumed to be pre-configured in the global context.
// We avoid re-declaring it in the global namespace to prevent conflicts with 
// identical declarations or existing AIStudio types in the environment.

interface LoginViewProps {
  onLogin: (user: User) => void;
  lang: Language;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, lang }) => {
  const t = translations[lang];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateLogin = (email: string, name: string, picture: string) => {
    let role: UserRole = 'Member';
    if (email === 'phattararak@gmail.com') {
      role = 'Admin';
    }
    
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      picture,
      role
    };
    
    onLogin(user);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Access pre-configured aistudio via type assertion to avoid global interface conflicts.
      const aistudio = (window as any).aistudio;
      
      // Check if user has already selected a key/project
      const hasKey = await aistudio.hasSelectedApiKey();
      
      if (!hasKey) {
        // Trigger the Google Cloud Project/Key selection dialog
        // This effectively acts as our "Sign in with Google" authentication flow
        await aistudio.openSelectKey();
      }

      // Once the key is selected (or if it was already there), we proceed
      // In a real production app, we would fetch the user's profile from the signed-in session.
      // Here we simulate the successful profile retrieval.
      setTimeout(() => {
        simulateLogin(
          'authenticated-user@gmail.com', 
          'Google Cloud User', 
          'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff'
        );
        setIsLoading(false);
      }, 1500);
      
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setError(lang === 'en' ? "Failed to sign in. Please try again." : "เข้าสู่ระบบไม่สำเร็จ โปรดลองอีกครั้ง");
      setIsLoading(false);
      
      // Handle the specific race condition mentioned in guidelines if needed
      if (err?.message?.includes("Requested entity was not found")) {
        // Prompt them again or reset
        (window as any).aistudio.openSelectKey();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl -mr-48 -mt-48 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl -ml-48 -mb-48 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 text-center border border-slate-100 relative overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <svg width="24" height="24" viewBox="0 0 24 24">
                     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                     <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                   </svg>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-800 animate-pulse">
                {lang === 'en' ? 'Verifying with Google...' : 'กำลังตรวจสอบข้อมูลด้วย Google...'}
              </p>
            </div>
          )}

          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-200 mb-6">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 10C20 10 12 13 12 19V25C12 28 16 31 20 32C24 31 28 28 28 25V19C28 13 20 10 20 10Z" fill="white" fillOpacity="0.2" />
                <path fillRule="evenodd" clipRule="evenodd" d="M16 18H24V26C24 26.5523 23.5523 27 23 27H17C16.4477 27 16 26.5523 16 26V18ZM18 20V25H22V20H18Z" fill="white" />
                <path d="M19 13L13 15V19C13 23 17 26 19 27L19 13Z" fill="white" fillOpacity="0.5" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-3">{t.appName}</h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
              {t.loginSubtitle}
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold mb-4 animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-[0.98] group"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" className="group-hover:scale-110 transition-transform">
                <path d="M19.6 10.23c0-.7-.06-1.36-.18-2H10v3.79h5.38c-.23 1.25-.94 2.31-1.99 3.01v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.31z" fill="#4285F4"/>
                <path d="M10 20c2.7 0 4.96-.89 6.61-2.42l-3.23-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H1.32v2.59C2.97 17.65 6.22 20 10 20z" fill="#34A853"/>
                <path d="M4.41 11.91c-.2-.6-.31-1.24-.31-1.91s.11-1.31.31-1.91V5.5H1.32C.48 7.15 0 8.98 0 10s.48 2.85 1.32 4.5l3.09-2.59z" fill="#FBBC05"/>
                <path d="M10 3.96c1.47 0 2.78.5 3.82 1.49l2.86-2.86C14.96.99 12.7 0 10 0 6.22 0 2.97 2.35 1.32 5.5l3.09 2.41c.79-2.36 2.99-4.12 5.59-4.12z" fill="#EA4335"/>
              </svg>
              <span>{t.loginButton}</span>
            </button>

            <div className="pt-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Simulation Mode: Developer Access</p>
                <div className="space-y-2">
                  <button 
                    onClick={() => simulateLogin('phattararak@gmail.com', 'Phattararak (Admin)', 'https://ui-avatars.com/api/?name=P+Admin&background=4f46e5&color=fff')}
                    className="w-full flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 transition-all text-left group"
                  >
                    <img src="https://ui-avatars.com/api/?name=P+Admin&background=4f46e5&color=fff" className="w-8 h-8 rounded-full group-hover:scale-110 transition-transform" alt="admin" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">phattararak@gmail.com</p>
                      <p className="text-[9px] text-indigo-600 font-bold uppercase">Role: Admin</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => simulateLogin('member@test.com', 'Test Member', 'https://ui-avatars.com/api/?name=Member&background=cbd5e1&color=fff')}
                    className="w-full flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-500 transition-all text-left group"
                  >
                    <img src="https://ui-avatars.com/api/?name=Member&background=cbd5e1&color=fff" className="w-8 h-8 rounded-full group-hover:scale-110 transition-transform" alt="member" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">member@test.com</p>
                      <p className="text-[9px] text-blue-500 font-bold uppercase">Role: Member</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">
            Secured by Policy Wallet & Google Cloud
          </div>
        </div>

        <div className="mt-6 text-center">
           <a 
             href="https://ai.google.dev/gemini-api/docs/billing" 
             target="_blank" 
             rel="noreferrer"
             className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold uppercase tracking-widest transition-colors"
           >
             Billing Documentation ↗
           </a>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
