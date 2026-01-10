
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
import PremiumTimeline from './components/PremiumTimeline';
import AppLogo from './components/AppLogo';
import { CardSkeleton, TableSkeleton } from './components/Skeleton';
import { storageManager, STORAGE_KEYS } from './services/storageManager';

storageManager.init();

const ProfileRequiredView: React.FC<{ lang: Language, onUpdate: () => void, t: any }> = ({ lang, onUpdate, t }) => (
  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-6">
    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl">👤</div>
    <div className="max-w-md space-y-2">
      <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t.profileRequiredTitle}</h3>
      <p className="text-slate-500 text-sm font-medium">
        {t.profileRequiredDesc}
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

  // Global UI States
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

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

  // Simulation of initial app load for skeleton showcase
  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { storageManager.save(STORAGE_KEYS.POLICIES, policies); }, [policies]);
  useEffect(() => { if (profile) storageManager.save(STORAGE_KEYS.PROFILE, profile); }, [profile]);
  useEffect(() => { if (protectionScore !== null) storageManager.save(STORAGE_KEYS.SCORE, protectionScore); }, [protectionScore]);

  const handleLogin = (newUser: User) => {
    const allUsers = storageManager.load<User[]>(STORAGE_KEYS.USERS, []);
    const existingIdx = allUsers.findIndex(u => u.email === newUser.email);
    let updatedUser: User = { ...newUser, lastLogin: new Date().toISOString(), loginCount: 1 };
    if (existingIdx > -1) {
      updatedUser = { 
        ...allUsers[existingIdx], 
        ...newUser, 
        lastLogin: new Date().toISOString(),
        loginCount: (allUsers[existingIdx].loginCount || 0) + 1 
      };
      allUsers[existingIdx] = updatedUser;
    } else {
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
  };

  const handleUploadDocument = (policyId: string, doc: PolicyDocument) => {
    setPolicies(prev => prev.map(p => p.id === policyId ? { ...p, documents: [...(p.documents || []), doc] } : p));
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setIsAddingPolicy(false);
    setEditingPolicy(null);
    setIsMobileMenuOpen(false);
    if (tab !== 'analysis') setAutoRunAnalysis(false);
  };

  const handleContactAgent = () => {
    window.open('https://line.me/ti/p/@patrickfwd', '_blank');
  };

  if (!user) return <LoginView onLogin={handleLogin} lang={lang} />;

  const isPro = user.role === 'Pro-Member' || user.role === 'Admin';
  
  // Define visible navigation items based on role
  const navItems = ['overview', 'policies', 'analysis', 'tax', 'underwriting', 'profile', 'vault'];
  if (user.role === 'Admin') navItems.push('admin');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden relative">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar logic with hide/show toggle */}
      <aside 
        className={`fixed md:sticky top-0 h-screen z-[60] bg-white border-r border-slate-200 flex flex-col transition-all duration-500 ease-in-out overflow-hidden flex-shrink-0
          ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
          ${isSidebarVisible ? 'md:w-72 opacity-100' : 'md:w-0 md:opacity-0 md:border-r-0'}
        `}
      >
        <div className="flex flex-col h-full p-4 space-y-6 w-72">
          <div className="flex items-start justify-between px-2 pt-2 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <AppLogo id="sidebar-main" size={40} className="flex-shrink-0" />
              <h1 className="text-lg font-black text-slate-800 tracking-tighter leading-tight break-words">
                {t.appName}
              </h1>
            </div>
            <button 
              onClick={() => setLang(lang === 'en' ? 'th' : 'en')} 
              className="flex-shrink-0 text-[10px] font-black bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors shadow-sm"
            >
              {lang === 'en' ? 'TH' : 'EN'}
            </button>
          </div>
          
          <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
            {navItems.map(tabId => (
              <button 
                key={tabId} 
                onClick={() => handleTabChange(tabId as any)} 
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tabId ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <span className="text-lg leading-none">
                  {tabId === 'overview' ? '📊' : 
                   tabId === 'policies' ? '📄' : 
                   tabId === 'analysis' ? '🤖' : 
                   tabId === 'tax' ? '💰' : 
                   tabId === 'underwriting' ? '🩺' : 
                   tabId === 'profile' ? '👤' : 
                   tabId === 'admin' ? '⚙️' : '🛡️'}
                </span>
                <span>{(t as any)[tabId] || tabId}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-auto">
            <div className="flex items-center space-x-3">
              <img src={user.picture} className="w-8 h-8 rounded-full border bg-white" alt="" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{user.name}</p>
                <button onClick={handleLogout} className="text-[9px] font-bold text-red-500 hover:underline uppercase tracking-tighter">{t.logout}</button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-500 min-w-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle Button (Menu) */}
              <button 
                onClick={() => {
                  if (window.innerWidth < 768) setIsMobileMenuOpen(true);
                  else setIsSidebarVisible(!isSidebarVisible);
                }} 
                className="p-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl shadow-sm transition-all active:scale-95 group focus:ring-2 focus:ring-indigo-100 outline-none"
              >
                <svg className={`w-6 h-6 transition-transform duration-500 ${!isSidebarVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-16 6h11" />
                </svg>
              </button>
              <div>
                <h2 className="text-2xl font-black text-slate-900 capitalize tracking-tight leading-tight">{(t as any)[activeTab] || activeTab}</h2>
                <p className="text-slate-500 text-sm font-medium tracking-tight">{t.welcomeBack} <b className="text-slate-800">{user.name}</b></p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {activeTab === 'overview' && policies.length > 0 && (
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-6 py-5 bg-white border border-slate-200 text-slate-700 rounded-[2rem] text-[13px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 flex items-center gap-2.5 shadow-sm hover:shadow-md"
                >
                  <span className="text-lg leading-none">📤</span>
                  <span>{t.shareReport}</span>
                </button>
              )}
              {(activeTab === 'overview' || activeTab === 'policies') && (
                <button 
                  onClick={() => { setActiveTab('policies'); setIsAddingPolicy(!isAddingPolicy); setEditingPolicy(null); }} 
                  className={`px-6 py-5 rounded-[2rem] text-[13px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2.5 shadow-[0_20px_50px_-12px_rgba(79,70,229,0.3)] hover:shadow-[0_20px_50px_-10px_rgba(79,70,229,0.5)] hover:-translate-y-1 ${
                    (isAddingPolicy || editingPolicy) 
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 shadow-slate-200/50 border border-slate-200' 
                      : 'bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white border border-white/10'
                  }`}
                >
                  {(isAddingPolicy || editingPolicy) ? (
                    <>
                      <span className="text-lg leading-none">✕</span>
                      <span>{t.cancel}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-medium leading-none">+</span>
                      <span>{t.addPolicy}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </header>

          {isAppLoading ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
              <TableSkeleton />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  {policies.length > 0 ? (
                    <>
                      <Dashboard policies={policies} onViewDetails={setViewingPolicy} lang={lang} />
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                          <PremiumTimeline policies={policies} lang={lang} />
                        </div>
                        <div className="space-y-6">
                          <ProtectionIndex score={protectionScore} onRunAnalysis={() => { handleTabChange('analysis'); setAutoRunAnalysis(true); }} lang={lang} />
                          
                          {/* Connect with Patrick Card */}
                          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-5 group transition-all hover:shadow-xl">
                            <div className="relative">
                              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-4xl shadow-inner border border-indigo-100 group-hover:scale-110 transition-transform overflow-hidden">
                                <img src="profile.jpg" alt="Patrick FWD" className="w-full h-full object-cover" onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Patrick+FWD&background=4F46E5&color=fff";
                                }} />
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00B900] border-2 border-white rounded-full flex items-center justify-center text-[10px]">✅</div>
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-800 tracking-tight leading-tight">{t.connectWithPatrick}</h4>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">@patrickfwd</p>
                            </div>
                            <button 
                              onClick={handleContactAgent}
                              className="w-full py-3.5 bg-[#00B900] hover:bg-[#00a300] text-white rounded-2xl font-black text-xs shadow-lg shadow-green-100/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-5.231-5.383-9.486-12-9.486s-12 4.255-12 9.486c0 4.69 4.27 8.602 10.046 9.324.391.084.922.258 1.057.592.121.303.079.777.039 1.083l-.171 1.027c-.052.312-.252 1.22 1.085.666 1.336-.554 7.21-4.246 9.837-7.269 1.832-1.995 2.107-3.818 2.107-5.423z"/></svg>
                              <span>{t.connectLine}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500"></div>
                      <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><span className="text-5xl leading-none">📁</span></div>
                      <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">{t.noPoliciesFound}</h3>
                      <p className="text-slate-400 font-medium mb-10 max-w-sm mx-auto">{lang === 'en' ? 'Start your digital insurance journey by adding your first policy.' : 'เริ่มต้นจัดการประกันดิจิทัลของคุณด้วยการเพิ่มกรมธรรม์ฉบับแรก'}</p>
                      <button 
                        onClick={() => { setActiveTab('policies'); setIsAddingPolicy(true); }} 
                        className="px-14 py-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white rounded-[2.5rem] font-black text-lg uppercase tracking-[0.2em] shadow-[0_25px_60px_-15px_rgba(79,70,229,0.5)] hover:shadow-[0_30px_70px_-10px_rgba(79,70,229,0.7)] transition-all hover:-translate-y-1.5 active:scale-95 flex items-center gap-5 mx-auto group border border-white/10"
                      >
                        <span className="text-3xl font-light group-hover:rotate-90 transition-transform duration-500 leading-none">+</span>
                        <span>{t.addPolicy}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'policies' && (
                <div className="animate-in fade-in duration-500">
                   {(isAddingPolicy || editingPolicy) && <PolicyForm initialPolicy={editingPolicy || undefined} onSubmit={handleSavePolicy} onCancel={() => { setIsAddingPolicy(false); setEditingPolicy(null); }} lang={lang} />}
                   <PolicyList 
                     policies={policies} 
                     onDelete={id => setPolicyIdToDelete(id)} 
                     onEdit={handleEditPolicy} 
                     onViewDetails={setViewingPolicy} 
                     onAddNew={() => setIsAddingPolicy(true)}
                     lang={lang} 
                   />
                </div>
              )}

              {activeTab === 'analysis' && (profile ? <GapAnalysisView policies={policies} profile={profile} lang={lang} onAnalysisComplete={(score) => { setProtectionScore(score); setAutoRunAnalysis(false); }} isPro={isPro} autoRun={autoRunAnalysis} /> : <ProfileRequiredView lang={lang} onUpdate={() => setActiveTab('profile')} t={t} />)}
              {activeTab === 'tax' && (profile ? <TaxOptimizationView policies={policies} profile={profile} lang={lang} isPro={isPro} /> : <ProfileRequiredView lang={lang} onUpdate={() => setActiveTab('profile')} t={t} />)}
              {activeTab === 'underwriting' && <PreUnderwritingView user={user} lang={lang} isPro={isPro} />}
              {activeTab === 'profile' && <ProfileForm initialProfile={profile || { name: user.name, sex: 'Male', birthDate: '1990-01-01', maritalStatus: 'Single', dependents: 0, annualIncome: 0, monthlyExpenses: 0, totalDebt: 0 }} onSave={(p) => { setProfile(p); }} lang={lang} policies={policies} onImport={d => { setProfile(d.profile); setPolicies(d.policies); }} isPro={isPro} />}
              {activeTab === 'vault' && <VaultView policies={policies} onUpload={handleUploadDocument} onDelete={(p, d) => setPolicies(prev => prev.map(pol => pol.id === p ? { ...pol, documents: (pol.documents || []).filter(doc => doc.id !== d) } : pol))} lang={lang} isPro={isPro} user={user} />}
              {activeTab === 'admin' && <AdminConsole currentUser={user} lang={lang} />}
            </>
          )}
        </div>
      </main>

      <EmergencyContacts lang={lang} />
      <PolicyDetailsModal policy={viewingPolicy} onClose={() => setViewingPolicy(null)} onEdit={handleEditPolicy} lang={lang} />
      <ConfirmDialog isOpen={!!policyIdToDelete} title={lang === 'en' ? "Delete Policy" : "ลบกรมธรรม์"} message={t.confirmDelete} onConfirm={() => { setPolicies(p => p.filter(x => x.id !== policyIdToDelete)); setPolicyIdToDelete(null); }} onCancel={() => setPolicyIdToDelete(null)} lang={lang} />
      {profile && <ShareReportModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} policies={policies} profile={profile} user={user} lang={lang} />}
    </div>
  );
};

export default App;
