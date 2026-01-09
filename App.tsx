
import React, { useState, useEffect, useRef } from 'react';
import { Policy, CoverageType, UserProfile, PaymentFrequency, PolicyDocument, User, UserRole } from './types';
import { translations, Language } from './translations';
import Dashboard from './components/Dashboard';
import PolicyList from './components/PolicyList';
import GapAnalysisView from './components/GapAnalysisView';
import EmergencyContacts from './components/EmergencyContacts';
import PolicyForm from './components/PolicyForm';
import PolicyDetailsModal from './components/PolicyDetailsModal';
import ProfileForm from './components/ProfileForm';
import VaultView from './components/VaultView';
import ConfirmDialog from './components/ConfirmDialog';
import ShareReportModal from './components/ShareReportModal';
import TaxOptimizationView from './components/TaxOptimizationView';
import LoginView from './components/LoginView';
import AdminConsole from './components/AdminConsole';
import ProtectionIndex from './components/ProtectionIndex';
import PreUnderwritingView from './components/PreUnderwritingView';
import { storageManager, STORAGE_KEYS } from './services/storageManager';

// Initialize Versioned Storage
storageManager.init();

const AppLogo = ({ className = "", id = "main" }: { className?: string, id?: string }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shadow-lg rounded-xl flex-shrink-0 ${className}`}>
    <rect width="40" height="40" rx="12" fill={`url(#logo_gradient_${id})`} />
    <path d="M20 10C20 10 12 13 12 19V25C12 28 16 31 20 32C24 31 28 28 28 25V19C28 13 20 10 20 10Z" fill="white" fillOpacity="0.2" />
    <path fillRule="evenodd" clipRule="evenodd" d="M16 18H24V26C24 26.5523 23.5523 27 23 27H17C16.4477 27 16 26.5523 16 26V18ZM18 20V25H22V20H18Z" fill="white" />
    <path d="M19 13L13 15V19C13 23 17 26 19 27L19 13Z" fill="white" fillOpacity="0.5" />
    <defs>
      <linearGradient id={`logo_gradient_${id}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
  </svg>
);

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('th');
  const [user, setUser] = useState<User | null>(() => storageManager.load<User | null>(STORAGE_KEYS.SESSION, null));
  
  const t = translations[lang];

  // Sidebar State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Business State
  const [policies, setPolicies] = useState<Policy[]>(() => storageManager.load<Policy[]>(STORAGE_KEYS.POLICIES, []));
  const [profile, setProfile] = useState<UserProfile | null>(() => storageManager.load<UserProfile | null>(STORAGE_KEYS.PROFILE, null));
  const [protectionScore, setProtectionScore] = useState<number | null>(() => storageManager.load<number | null>(STORAGE_KEYS.SCORE, null));

  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'analysis' | 'tax' | 'underwriting' | 'vault' | 'profile' | 'admin'>('overview');
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null);
  const [policyIdToDelete, setPolicyIdToDelete] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Persistence logic using storageManager
  useEffect(() => {
    storageManager.save(STORAGE_KEYS.POLICIES, policies);
  }, [policies]);

  useEffect(() => {
    if (profile) storageManager.save(STORAGE_KEYS.PROFILE, profile);
  }, [profile]);

  useEffect(() => {
    if (protectionScore !== null) storageManager.save(STORAGE_KEYS.SCORE, protectionScore);
  }, [protectionScore]);

  const handleLogin = (newUser: User) => {
    storageManager.save(STORAGE_KEYS.SESSION, newUser);
    setUser(newUser); 
  };

  const handleLogout = () => {
    setUser(null);
    // Persist data by only clearing the session token, not the whole wallet
    storageManager.clearSession();
    setActiveTab('overview');
    setIsMobileMenuOpen(false);
  };

  const handleSavePolicy = (policy: Policy) => {
    if (editingPolicy) {
      setPolicies(prev => prev.map(p => p.id === policy.id ? policy : p));
    } else {
      setPolicies(prev => [policy, ...prev]);
    }
    setIsAddingPolicy(false);
    setEditingPolicy(null);
  };

  const handleEditPolicy = (policy: Policy) => {
    setActiveTab('policies');
    setEditingPolicy(policy);
    setIsAddingPolicy(false);
    setIsMobileMenuOpen(false);
  };

  const handleDeletePolicy = (id: string) => setPolicyIdToDelete(id);

  const confirmDeletePolicy = () => {
    if (policyIdToDelete) {
      setPolicies(prev => prev.filter(p => p.id !== policyIdToDelete));
      setPolicyIdToDelete(null);
    }
  };

  const handleUploadDocument = (policyId: string, doc: PolicyDocument) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === policyId) {
        return { ...p, documents: [...(p.documents || []), doc] };
      }
      return p;
    }));
  };

  const handleDeleteDocument = (policyId: string, docId: string) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === policyId) {
        return { ...p, documents: (p.documents || []).filter(d => d.id !== docId) };
      }
      return p;
    }));
  };

  const toggleAddingPolicy = () => {
    setActiveTab('policies');
    setIsAddingPolicy(!isAddingPolicy);
    setEditingPolicy(null);
    setIsMobileMenuOpen(false);
  };

  const handleImportPortfolio = (data: { profile: UserProfile, policies: Policy[] }) => {
    setProfile(data.profile);
    setPolicies(data.policies);
    setProtectionScore(null); 
  };

  const handleConnectLine = () => window.open('https://line.me/ti/p/@patrickfwd', '_blank');

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsAddingPolicy(false);
    setEditingPolicy(null);
    setIsMobileMenuOpen(false);
  };

  if (!user) return <LoginView onLogin={handleLogin} lang={lang} />;

  const isPro = user.role === 'Pro-Member' || user.role === 'Admin';

  const ProfileRequiredView = () => (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-6">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl">👤</div>
      <div className="max-w-md space-y-2">
        <h3 className="text-2xl font-black text-slate-800">{lang === 'en' ? 'Profile Information Required' : 'ต้องระบุข้อมูลส่วนตัว'}</h3>
        <p className="text-slate-500 text-sm">
          {lang === 'en' 
            ? 'To provide accurate AI analysis and tax optimization, we need some basic financial information first.' 
            : 'เพื่อให้ AI สามารถวิเคราะห์ช่องว่างความคุ้มครองและวางแผนภาษีได้อย่างแม่นยำ โปรดระบุข้อมูลพื้นฐานทางการเงินของคุณก่อน'}
        </p>
      </div>
      <button 
        onClick={() => setActiveTab('profile')}
        className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
      >
        {t.updateProfile}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar and Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white border-r border-slate-200 flex flex-col p-4 space-y-6 transform transition-transform duration-300 md:relative md:translate-x-0 md:w-64 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-3">
            <AppLogo id="desktop-sidebar" />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{t.appName}</h1>
          </div>
          <button onClick={() => setLang(lang === 'en' ? 'th' : 'en')} className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded">
            {lang === 'en' ? 'TH' : 'EN'}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {['overview', 'policies', 'analysis', 'tax', 'underwriting', 'profile', 'vault'].map(tabId => (
            <button key={tabId} onClick={() => handleTabChange(tabId)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tabId ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
              <span className="text-lg">
                {tabId === 'overview' ? '📊' : tabId === 'policies' ? '📄' : tabId === 'analysis' ? '🤖' : tabId === 'tax' ? '💰' : tabId === 'underwriting' ? '🩺' : tabId === 'profile' ? '👤' : '🛡️'}
              </span>
              <span>{t[tabId as keyof typeof t] || tabId}</span>
            </button>
          ))}
          {user.role === 'Admin' && (
            <button onClick={() => handleTabChange('admin')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}>
              <span className="text-lg">⚙️</span><span>{t.admin}</span>
            </button>
          )}

          <div className="pt-4 mt-4 border-t border-slate-100">
            <div className="px-4 py-3 rounded-xl border border-emerald-50 bg-emerald-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.syncStatus}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-tighter text-emerald-700">
                {t.localStorage}
              </p>
            </div>
          </div>
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-auto">
          <div className="flex items-center space-x-3">
            <img src={user.picture} className="w-8 h-8 rounded-full border" alt="" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-800 truncate">{user.name}</p>
              <button onClick={handleLogout} className="text-[9px] font-bold text-red-500 hover:underline">{t.logout}</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-10 space-y-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 capitalize tracking-tight">{t[activeTab as keyof typeof t] || activeTab}</h2>
              <p className="text-slate-500 text-sm font-medium">{t.welcomeBack} <b className="text-slate-800">{user.name}</b></p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {activeTab === 'overview' && policies.length > 0 && (
              <button 
                onClick={() => setIsShareModalOpen(true)} 
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-colors hover:bg-slate-50"
              >
                {t.shareReport}
              </button>
            )}
            {(activeTab === 'overview' || activeTab === 'policies') && (
              <button 
                onClick={toggleAddingPolicy} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all hover:bg-indigo-700"
              >
                {(isAddingPolicy || editingPolicy) ? t.cancel : `+ ${t.addPolicy}`}
              </button>
            )}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {policies.length > 0 ? (
              <>
                <Dashboard 
                  policies={policies} 
                  onViewDetails={setViewingPolicy} 
                  lang={lang} 
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2"><PolicyList policies={policies} onDelete={handleDeletePolicy} onEdit={handleEditPolicy} onViewDetails={setViewingPolicy} lang={lang} /></div>
                  <div className="space-y-6">
                    {/* Connect with Patrick Card - Minimal Style (No Logo) */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
                      <div className="mb-4">
                        <h5 className="font-black text-slate-900 text-lg leading-tight mb-1">{t.lineSync}</h5>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{lang === 'en' ? 'FWD Insurance Clinic' : 'คลินิกประกัน FWD'}</p>
                      </div>
                      
                      <button 
                        onClick={handleConnectLine} 
                        className="w-full py-3.5 bg-[#00B900] hover:bg-[#00a300] text-white rounded-2xl font-black text-sm shadow-xl shadow-green-50 transition-all active:scale-95 flex items-center justify-center"
                      >
                        {t.connectLine}
                      </button>
                    </div>

                    <ProtectionIndex 
                      score={protectionScore} 
                      onRunAnalysis={() => setActiveTab('analysis')} 
                      lang={lang} 
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-5xl">📁</span></div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">{lang === 'en' ? 'No policies found' : 'ไม่พบข้อมูลกรมธรรม์'}</h3>
                <button onClick={toggleAddingPolicy} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95 hover:bg-indigo-700">+ {t.addPolicy}</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="animate-in fade-in duration-500">
             {(isAddingPolicy || editingPolicy) && <PolicyForm initialPolicy={editingPolicy || undefined} onSubmit={handleSavePolicy} onCancel={() => { setIsAddingPolicy(false); setEditingPolicy(null); }} lang={lang} />}
             <PolicyList policies={policies} onDelete={handleDeletePolicy} onEdit={handleEditPolicy} onViewDetails={setViewingPolicy} lang={lang} />
          </div>
        )}

        {activeTab === 'analysis' && (profile ? <GapAnalysisView policies={policies} profile={profile} lang={lang} onAnalysisComplete={setProtectionScore} /> : <ProfileRequiredView />)}
        {activeTab === 'tax' && (profile ? <TaxOptimizationView policies={policies} profile={profile} lang={lang} isPro={isPro} /> : <ProfileRequiredView />)}
        {activeTab === 'underwriting' && <PreUnderwritingView user={user} lang={lang} isPro={isPro} />}
        {activeTab === 'profile' && <ProfileForm initialProfile={profile || { name: user.name, sex: 'Male', birthDate: '1990-01-01', maritalStatus: 'Single', dependents: 0, annualIncome: 0, monthlyExpenses: 0, totalDebt: 0 }} onSave={setProfile} lang={lang} policies={policies} onImport={handleImportPortfolio} isPro={isPro} />}
        {activeTab === 'vault' && <VaultView policies={policies} onUpload={handleUploadDocument} onDelete={handleDeleteDocument} lang={lang} isPro={isPro} user={user} />}
        {activeTab === 'admin' && <AdminConsole currentUser={user} lang={lang} />}
      </main>

      <EmergencyContacts lang={lang} />
      <PolicyDetailsModal policy={viewingPolicy} onClose={() => setViewingPolicy(null)} onEdit={handleEditPolicy} lang={lang} />
      <ConfirmDialog isOpen={!!policyIdToDelete} title={lang === 'en' ? "Delete Policy" : "ลบกรมธรรม์"} message={t.confirmDelete} onConfirm={confirmDeletePolicy} onCancel={() => setPolicyIdToDelete(null)} lang={lang} />
      {profile && <ShareReportModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} policies={policies} profile={profile} user={user} lang={lang} />}
      
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
