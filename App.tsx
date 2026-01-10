
import React, { useState, useEffect } from 'react';
import { Policy, UserProfile, PolicyDocument, User } from './types';
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
import AppLogo from './components/AppLogo';
import { storageManager, STORAGE_KEYS } from './services/storageManager';

// Initialize Versioned Storage
storageManager.init();

const ProfileRequiredView: React.FC<{ lang: Language, onUpdate: () => void, t: any }> = ({ lang, onUpdate, t }) => (
  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-6">
    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl">👤</div>
    <div className="max-w-md space-y-2">
      <h3 className="text-2xl font-black text-slate-800 tracking-tight">{lang === 'en' ? 'Profile Information Required' : 'ต้องระบุข้อมูลส่วนตัว'}</h3>
      <p className="text-slate-500 text-sm font-medium">
        {lang === 'en' 
          ? 'To provide accurate AI analysis, sharing management and tax optimization, we need some basic financial information first.' 
          : 'เพื่อให้ AI สามารถวิเคราะห์ช่องว่างความคุ้มครองและวางแผนภาษีได้อย่างแม่นยำ โปรดระบุข้อมูลพื้นฐานทางการเงินของคุณก่อน'}
      </p>
    </div>
    <button 
      onClick={onUpdate}
      className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
    >
      {t.updateProfile}
    </button>
  </div>
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
  const [autoRunAnalysis, setAutoRunAnalysis] = useState(false);

  // Persistence logic
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
    const allUsers = storageManager.load<User[]>(STORAGE_KEYS.USERS, []);
    const existingIdx = allUsers.findIndex(u => u.email === newUser.email);
    
    let updatedUser = { ...newUser };
    if (existingIdx > -1) {
      updatedUser = { 
        ...allUsers[existingIdx],
        name: newUser.name,
        picture: newUser.picture,
        lastLogin: new Date().toISOString(),
        loginCount: (allUsers[existingIdx].loginCount || 0) + 1
      };
      allUsers[existingIdx] = updatedUser;
    } else {
      updatedUser.lastLogin = new Date().toISOString();
      updatedUser.loginCount = 1;
      allUsers.push(updatedUser);
    }
    
    storageManager.save(STORAGE_KEYS.USERS, allUsers);
    storageManager.save(STORAGE_KEYS.SESSION, updatedUser);
    setUser(updatedUser); 
  };

  const handleLogout = () => {
    setUser(null);
    storageManager.clearSession();
    setActiveTab('overview');
    setIsMobileMenuOpen(false);
  };

  const handleSavePolicy = (policy: Policy) => {
    setPolicies(prev => editingPolicy ? prev.map(p => p.id === policy.id ? policy : p) : [policy, ...prev]);
    setIsAddingPolicy(false);
    setEditingPolicy(null);
  };

  const handleEditPolicy = (policy: Policy) => {
    setActiveTab('policies');
    setEditingPolicy(policy);
    setIsAddingPolicy(false);
    setIsMobileMenuOpen(false);
  };

  const handleUploadDocument = (policyId: string, doc: PolicyDocument) => {
    setPolicies(prev => prev.map(p => p.id === policyId ? { ...p, documents: [...(p.documents || []), doc] } : p));
  };

  const handleDeleteDocument = (policyId: string, docId: string) => {
    setPolicies(prev => prev.map(p => p.id === policyId ? { ...p, documents: (p.documents || []).filter(d => d.id !== docId) } : p));
  };

  const toggleAddingPolicy = () => {
    setActiveTab('policies');
    setIsAddingPolicy(!isAddingPolicy);
    setEditingPolicy(null);
    setIsMobileMenuOpen(false);
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsAddingPolicy(false);
    setEditingPolicy(null);
    setIsMobileMenuOpen(false);
    if (tab !== 'analysis') {
      setAutoRunAnalysis(false);
    }
  };

  if (!user) return <LoginView onLogin={handleLogin} lang={lang} />;

  const isPro = user.role === 'Pro-Member' || user.role === 'Admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white border-r border-slate-200 flex flex-col p-4 space-y-6 transform transition-transform duration-300 md:relative md:translate-x-0 md:w-64 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex items-center space-x-3">
            <AppLogo id="sidebar-main" size={40} />
            <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-tight">{t.appName}</h1>
          </div>
          <button onClick={() => setLang(lang === 'en' ? 'th' : 'en')} className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded">
            {lang === 'en' ? 'TH' : 'EN'}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {['overview', 'policies', 'analysis', 'tax', 'underwriting', 'profile', 'vault'].map(tabId => (
            <button key={tabId} onClick={() => handleTabChange(tabId)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tabId ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              <span className="text-lg">
                {tabId === 'overview' ? '📊' : tabId === 'policies' ? '📄' : tabId === 'analysis' ? '🤖' : tabId === 'tax' ? '💰' : tabId === 'underwriting' ? '🩺' : tabId === 'profile' ? '👤' : '🛡️'}
              </span>
              <span>{t[tabId as keyof typeof t] || tabId}</span>
            </button>
          ))}
          {user.role === 'Admin' && (
            <button onClick={() => handleTabChange('admin')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
              <span className="text-lg">⚙️</span><span>{t.admin}</span>
            </button>
          )}
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-auto">
          <div className="flex items-center space-x-3">
            <img src={user.picture} className="w-8 h-8 rounded-full border" alt="" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{user.name}</p>
              <button onClick={handleLogout} className="text-[9px] font-bold text-red-500 hover:underline uppercase tracking-tighter">{t.logout}</button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 space-y-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 capitalize tracking-tight leading-tight">{t[activeTab as keyof typeof t] || activeTab}</h2>
              <p className="text-slate-500 text-sm font-medium tracking-tight">{t.welcomeBack} <b className="text-slate-800">{user.name}</b></p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {activeTab === 'overview' && policies.length > 0 && (
              <button onClick={() => setIsShareModalOpen(true)} className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50">{t.shareReport}</button>
            )}
            {(activeTab === 'overview' || activeTab === 'policies') && (
              <button onClick={toggleAddingPolicy} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all hover:bg-indigo-700">
                {(isAddingPolicy || editingPolicy) ? t.cancel : `+ ${t.addPolicy}`}
              </button>
            )}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {policies.length > 0 ? (
              <>
                <Dashboard policies={policies} onViewDetails={setViewingPolicy} lang={lang} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2"><PolicyList policies={policies} onDelete={id => setPolicyIdToDelete(id)} onEdit={handleEditPolicy} onViewDetails={setViewingPolicy} lang={lang} /></div>
                  <div className="space-y-6">
                    {/* Compact Consultant Card */}
                    <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-6 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
                       <div className="relative z-10 flex flex-col items-center text-center">
                          <div className="relative mb-3">
                             <div className="w-16 h-16 bg-white/5 rounded-full overflow-hidden border border-white/20 shadow-inner group-hover:scale-110 transition-transform">
                                <img src="profile.jpg" alt="Patrick FWD" className="w-full h-full object-cover" onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Patrick+FWD&background=4F46E5&color=fff";
                                }} />
                             </div>
                             <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                          </div>
                          
                          <div className="space-y-0.5 mb-4">
                             <h5 className="text-lg font-black text-white tracking-tight leading-none">Patrick FWD</h5>
                             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Expert Planner</p>
                          </div>

                          <div className="w-full bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 mb-4">
                             <p className="text-[10px] font-medium text-slate-300 leading-relaxed italic">
                               {lang === 'en' ? '"Sync your portfolio and get personalized renewal reminders directly via LINE."' : '"ซิงค์กรมธรรม์และรับแจ้งเตือนการชำระเบี้ยประกันผ่าน LINE ส่วนตัวของคุณ"'}
                             </p>
                          </div>

                          <button 
                             onClick={() => window.open('https://line.me/ti/p/@patrickfwd', '_blank')} 
                             className="w-full py-3 bg-[#00B900] hover:bg-[#009e00] text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 group/btn"
                          >
                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 10.304c0-5.231-5.383-9.486-12-9.486s-12 4.255-12 9.486c0 4.69 4.27 8.602 10.046 9.324.391.084.922.258 1.057.592.121.303.079.777.039 1.083l-.171 1.027c-.052.312-.252 1.22 1.085.666 1.336-.554 7.21-4.246 9.837-7.269 1.832-1.995 2.107-3.818 2.107-5.423z"/></svg>
                             <span>{t.connectLine}</span>
                          </button>
                       </div>
                       
                       <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between opacity-30">
                          <span className="text-[7px] font-black text-white uppercase tracking-[0.3em]">FWD CLINIC AGENT</span>
                          <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                             <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> Online
                          </span>
                       </div>
                    </div>

                    <ProtectionIndex score={protectionScore} onRunAnalysis={() => { handleTabChange('analysis'); setAutoRunAnalysis(true); }} lang={lang} />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-5xl">📁</span></div>
                <h3 className="text-2xl font-black text-slate-800 mb-6">{t.noPoliciesFound}</h3>
                <button onClick={toggleAddingPolicy} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 hover:bg-indigo-700">+ {t.addPolicy}</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="animate-in fade-in duration-500">
             {(isAddingPolicy || editingPolicy) && <PolicyForm initialPolicy={editingPolicy || undefined} onSubmit={handleSavePolicy} onCancel={() => { setIsAddingPolicy(false); setEditingPolicy(null); }} lang={lang} />}
             <PolicyList policies={policies} onDelete={id => setPolicyIdToDelete(id)} onEdit={handleEditPolicy} onViewDetails={setViewingPolicy} lang={lang} />
          </div>
        )}

        {activeTab === 'analysis' && (profile ? <GapAnalysisView policies={policies} profile={profile} lang={lang} onAnalysisComplete={(score) => { setProtectionScore(score); setAutoRunAnalysis(false); }} isPro={isPro} autoRun={autoRunAnalysis} /> : <ProfileRequiredView lang={lang} onUpdate={() => setActiveTab('profile')} t={t} />)}
        {activeTab === 'tax' && (profile ? <TaxOptimizationView policies={policies} profile={profile} lang={lang} isPro={isPro} /> : <ProfileRequiredView lang={lang} onUpdate={() => setActiveTab('profile')} t={t} />)}
        {activeTab === 'underwriting' && <PreUnderwritingView user={user} lang={lang} isPro={isPro} />}
        {activeTab === 'profile' && <ProfileForm initialProfile={profile || { name: user.name, sex: 'Male', birthDate: '1990-01-01', maritalStatus: 'Single', dependents: 0, annualIncome: 0, monthlyExpenses: 0, totalDebt: 0 }} onSave={setProfile} lang={lang} policies={policies} onImport={d => { setProfile(d.profile); setPolicies(d.policies); }} isPro={isPro} />}
        {activeTab === 'vault' && <VaultView policies={policies} onUpload={handleUploadDocument} onDelete={handleDeleteDocument} lang={lang} isPro={isPro} user={user} />}
        {activeTab === 'admin' && <AdminConsole currentUser={user} lang={lang} />}
      </main>

      <EmergencyContacts lang={lang} />
      <PolicyDetailsModal policy={viewingPolicy} onClose={() => setViewingPolicy(null)} onEdit={handleEditPolicy} lang={lang} />
      <ConfirmDialog isOpen={!!policyIdToDelete} title={lang === 'en' ? "Delete Policy" : "ลบกรมธรรม์"} message={t.confirmDelete} onConfirm={() => { setPolicies(p => p.filter(x => x.id !== policyIdToDelete)); setPolicyIdToDelete(null); }} onCancel={() => setPolicyIdToDelete(null)} lang={lang} />
      {profile && <ShareReportModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} policies={policies} profile={profile} user={user} lang={lang} />}
    </div>
  );
};

export default App;
