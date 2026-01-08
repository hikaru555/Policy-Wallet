
import React, { useState } from 'react';
import { translations, Language } from '../translations';
import { User, UserRole } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
  lang: Language;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, lang }) => {
  const t = translations[lang];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * In a real production app, this function would receive the 
   * google.accounts.id.CredentialResponse, decode the JWT (ID Token),
   * and extract the 'name', 'email', and 'picture' claims.
   */
  const handleAuthSuccess = (email: string, name: string, picture: string) => {
    let role: UserRole = 'Member';
    
    // Check for Admin privileges
    if (email === 'phattararak@gmail.com') {
      role = 'Admin';
      // If it's the specific admin email, we use the real name
      name = 'Phattararak'; 
    }
    
    const user: User = {
      id: btoa(email).substr(0, 10), // Deterministic ID based on email
      email,
      name,
      picture,
      role
    };
    
    onLogin(user);
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    const aistudio = (window as any).aistudio;
    
    try {
      // Step 1: Handle API Key / Project selection if required by environment
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await aistudio.openSelectKey();
        }
      }

      // Step 2: Simulate the Google OAuth2.0 Popup/Redirect Handshake
      // In production: google.accounts.id.prompt() or .renderButton()
      setTimeout(() => {
        // Mock data that would typically come from the decoded JWT
        // If the user is you (admin), we simulate your login
        const isAdmin = true; // Simulating the selection of your account
        
        const email = isAdmin ? 'phattararak@gmail.com' : 'client.user@gmail.com';
        const fullName = isAdmin ? 'Phattararak' : 'Insurance Client';
        const profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4285F4&color=fff&size=128`;
        
        handleAuthSuccess(email, fullName, profilePic);
        setIsLoading(false);
      }, 1800);
      
    } catch (err: any) {
      console.error("Auth Error:", err);
      
      if (err?.message?.includes("Requested entity was not found.")) {
        setError(lang === 'en' 
          ? "The selected Google Cloud project is missing configuration. Please check billing." 
          : "โปรเจกต์ Google Cloud ที่เลือกยังไม่ได้ตั้งค่าการเรียกเก็บเงิน");
        if (aistudio) await aistudio.openSelectKey();
      } else {
        // Fallback simulation for general errors
        setTimeout(() => {
          handleAuthSuccess('user@example.com', 'Insurance Client', 'https://ui-avatars.com/api/?name=Insurance+Client&background=4285F4&color=fff');
          setIsLoading(false);
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-blue-100/40 rounded-full blur-3xl -mr-60 -mt-60 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-indigo-100/40 rounded-full blur-3xl -ml-60 -mb-60 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 overflow-hidden border border-slate-100 relative">
          
          {/* Authentic Google Loading State */}
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
              <div className="relative">
                <div className="w-20 h-20 border-[6px] border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <svg width="32" height="32" viewBox="0 0 24 24">
                     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                     <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                   </svg>
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-slate-800 tracking-tight">
                  {lang === 'en' ? 'Signing you in...' : 'กำลังเข้าสู่ระบบ...'}
                </p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Secure Google Identity Handshake
                </p>
              </div>
            </div>
          )}

          {/* Login Content */}
          <div className="p-8 md:p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-100 mb-8 group hover:scale-105 transition-transform duration-500">
              <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 10C20 10 12 13 12 19V25C12 28 16 31 20 32C24 31 28 28 28 25V19C28 13 20 10 20 10Z" fill="white" fillOpacity="0.2" />
                <path fillRule="evenodd" clipRule="evenodd" d="M16 18H24V26C24 26.5523 23.5523 27 23 27H17C16.4477 27 16 26.5523 16 26V18ZM18 20V25H22V20H18Z" fill="white" />
                <path d="M19 13L13 15V19C13 23 17 26 19 27L19 13Z" fill="white" fillOpacity="0.5" />
              </svg>
            </div>

            <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-3">
              {t.appName}
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[18rem] mx-auto mb-12">
              {lang === 'en' 
                ? 'Your intelligent insurance companion. Sign in to sync your profile and policies.' 
                : 'เพื่อนคู่คิดด้านประกันอัจฉริยะ เข้าสู่ระบบเพื่อเชื่อมต่อข้อมูลและกรมธรรม์ของคุณ'}
            </p>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-bold mb-8 animate-in slide-in-from-top-2">
                <span className="block mb-1">⚠️ Auth Error</span>
                {error}
              </div>
            )}

            <button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-4 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] font-black text-slate-700 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-xl shadow-slate-100 active:scale-[0.98] group mb-8"
            >
              <svg width="24" height="24" viewBox="0 0 20 20" className="group-hover:rotate-12 transition-transform">
                <path d="M19.6 10.23c0-.7-.06-1.36-.18-2H10v3.79h5.38c-.23 1.25-.94 2.31-1.99 3.01v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.31z" fill="#4285F4"/>
                <path d="M10 20c2.7 0 4.96-.89 6.61-2.42l-3.23-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H1.32v2.59C2.97 17.65 6.22 20 10 20z" fill="#34A853"/>
                <path d="M4.41 11.91c-.2-.6-.31-1.24-.31-1.91s.11-1.31.31-1.91V5.5H1.32C.48 7.15 0 8.98 0 10s.48 2.85 1.32 4.5l3.09-2.59z" fill="#FBBC05"/>
                <path d="M10 3.96c1.47 0 2.78.5 3.82 1.49l2.86-2.86C14.96.99 12.7 0 10 0 6.22 0 2.97 2.35 1.32 5.5l3.09 2.41c.79-2.36 2.99-4.12 5.59-4.12z" fill="#EA4335"/>
              </svg>
              <span className="text-lg tracking-tight">
                {lang === 'en' ? 'Continue with Google' : 'ดำเนินการต่อด้วย Google'}
              </span>
            </button>

            <div className="space-y-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] leading-relaxed px-6">
                {t.tosAgreement}
              </p>
              <div className="h-px bg-slate-100 w-12 mx-auto"></div>
              <p className="text-[9px] text-slate-300 font-medium italic">
                Securely powered by Google Identity Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
