
import React, { useState, useEffect } from 'react';
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

const MOCK_POLICIES: Policy[] = [
  {
    id: '1',
    company: 'AIA Thailand',
    planName: 'Health First Gold',
    coverages: [
      { type: CoverageType.HEALTH, sumAssured: 1000000, roomRate: 4000 },
      { type: CoverageType.LIFE, sumAssured: 500000 }
    ],
    premiumAmount: 25000,
    frequency: PaymentFrequency.YEARLY,
    dueDate: '2025-05-15',
    status: 'Active',
    documents: []
  },
  {
    id: '2',
    company: 'FWD Life Insurance',
    planName: 'Life Shield Plus',
    coverages: [
      { type: CoverageType.LIFE, sumAssured: 2000000 }
    ],
    premiumAmount: 12000,
    frequency: PaymentFrequency.MONTHLY,
    dueDate: '2025-08-20',
    status: 'Grace Period',
    documents: []
  },
  {
    id: '3',
    company: 'Thai Life Insurance',
    planName: 'Critical Care 50',
    coverages: [
      { type: CoverageType.CRITICAL, sumAssured: 500000 },
      { type: CoverageType.ACCIDENT, sumAssured: 300000 }
    ],
    premiumAmount: 8500,
    frequency: PaymentFrequency.QUARTERLY,
    dueDate: '2025-11-01',
    status: 'Active',
    documents: []
  }
];

const DEFAULT_PROFILE: UserProfile = {
  name: 'Tanawat R.',
  sex: 'Male',
  birthDate: '1992-06-12',
  maritalStatus: 'Married',
  dependents: 2,
  annualIncome: 1200000,
  monthlyExpenses: 45000,
  totalDebt: 3500000
};

const AppLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="shadow-lg rounded-xl flex-shrink-0">
    <rect width="40" height="40" rx="12" fill="url(#logo_gradient)" />
    <path d="M20 10C20 10 12 13 12 19V25C12 28 16 31 20 32C24 31 28 28 28 25V19C28 13 20 10 20 10Z" fill="white" fillOpacity="0.2" />
    <path fillRule="evenodd" clipRule="evenodd" d="M16 18H24V26C24 26.5523 23.5523 27 23 27H17C16.4477 27 16 26.5523 16 26V18ZM18 20V25H22V20H18Z" fill="white" />
    <path d="M19 13L13 15V19C13 23 17 26 19 27L19 13Z" fill="white" fillOpacity="0.5" />
    <defs>
      <linearGradient id="logo_gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
  </svg>
);

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [user, setUser] = useState<User | null>(null);
  
  const t = translations[lang];

  const [policies, setPolicies] = useState<Policy[]>(MOCK_POLICIES);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'analysis' | 'tax' | 'vault' | 'profile' | 'admin'>('overview');
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null);
  const [policyIdToDelete, setPolicyIdToDelete] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Check for stored session (simulated)
  useEffect(() => {
    const savedUser = localStorage.getItem('pw_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('pw_session', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pw_session');
    setActiveTab('overview');
  };

  const handleDeletePolicy = (id: string) => {
    setPolicyIdToDelete(id);
  };

  const confirmDeletePolicy = () => {
    if (policyIdToDelete) {
      setPolicies(prev => prev.filter(p => p.id !== policyIdToDelete));
      setPolicyIdToDelete(null);
    }
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
  };

  const toggleAddingPolicy = () => {
    setActiveTab('policies');
    setIsAddingPolicy(!isAddingPolicy);
    setEditingPolicy(null);
  };

  const handleUploadDocument = (policyId: string, doc: PolicyDocument) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === policyId) {
        return {
          ...p,
          documents: [...(p.documents || []), doc]
        };
      }
      return p;
    }));
  };

  const handleDeleteDocument = (policyId: string, docId: string) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === policyId) {
        return {
          ...p,
          documents: (p.documents || []).filter(d => d.id !== docId)
        };
      }
      return p;
    }));
  };

  const handleConnectLine = () => {
    window.open('https://line.me/ti/p/@patrickfwd', '_blank');
  };

  // Guard: If not logged in, show Login View
  if (!user) {
    return <LoginView onLogin={handleLogin} lang={lang} />;
  }

  const isPro = user.role === 'Pro-Member' || user.role === 'Admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col p-4 space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-3">
            <AppLogo />
            <h1 className="text-xl font-bold tracking-tight text-slate-800">{t.appName}</h1>
          </div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
            className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 uppercase tracking-widest text-slate-600 transition-colors"
          >
            {lang === 'en' ? 'TH' : 'EN'}
          </button>
        </div>

        {/* User Card */}
        <div className="px-2">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 relative group transition-all hover:bg-slate-100/50">
            <div className="flex items-center space-x-3">
              <img src={user.picture} className="w-10 h-10 rounded-full border border-white shadow-sm" alt={user.name} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                <div className="flex items-center space-x-1">
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                    user.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' :
                    user.role === 'Pro-Member' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-600 transition-colors"
              title={t.logout}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'overview', label: t.overview, icon: '📊' },
            { id: 'policies', label: t.policies, icon: '📄' },
            { id: 'analysis', label: t.analysis, icon: '🤖' },
            { id: 'tax', label: t.tax, icon: '💰' },
            { id: 'profile', label: t.profile, icon: '👤' },
            { id: 'vault', label: t.vault, icon: '🛡️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setIsAddingPolicy(false); setEditingPolicy(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg opacity-80">{tab.icon}</span>
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
          {user.role === 'Admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-800'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg opacity-80">⚙️</span>
                <span>{t.admin}</span>
              </span>
            </button>
          )}

          {/* Explicit Logout Button in Sidebar */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-all duration-200"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">🚪</span>
                <span>{t.logout}</span>
              </span>
            </button>
          </div>
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-auto space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Consultant</p>
            <div className="flex items-center space-x-3">
              <img src="https://picsum.photos/seed/agent-pat/40/40" className="w-8 h-8 rounded-full border border-white shadow-sm" alt="agent" />
              <div>
                <p className="text-xs font-bold text-slate-800">Patrick</p>
                <p className="text-[10px] text-slate-500 font-medium">คลินิกประกัน FWD</p>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200">
             <a 
              href="https://line.me/ti/p/@patrickfwd" 
              target="_blank" 
              rel="noreferrer"
              className="text-[10px] text-blue-600 font-bold leading-tight hover:underline flex items-center"
             >
               {t.creatorCredit} <span className="ml-1 text-[8px]">↗</span>
             </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 capitalize tracking-tight">
              {activeTab === 'overview' ? t.overview : 
               activeTab === 'policies' ? t.policies : 
               activeTab === 'analysis' ? t.analysis : 
               activeTab === 'tax' ? t.tax : 
               activeTab === 'vault' ? t.vault : 
               activeTab === 'profile' ? t.profile : 
               activeTab === 'admin' ? t.admin : activeTab}
            </h2>
            <p className="text-slate-500 text-sm font-medium">{t.welcomeBack} <b className="text-slate-800">{user.name}</b></p>
          </div>
          <div className="flex items-center space-x-3">
            {activeTab === 'overview' && (
              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
              >
                {t.shareReport}
              </button>
            )}
            {(activeTab === 'overview' || activeTab === 'policies') && (
              <button 
                onClick={toggleAddingPolicy}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95"
              >
                {(isAddingPolicy || editingPolicy) ? t.cancel : `+ ${t.addPolicy}`}
              </button>
            )}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Dashboard policies={policies} onViewDetails={setViewingPolicy} lang={lang} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <PolicyList policies={policies} onDelete={handleDeletePolicy} onEdit={handleEditPolicy} onViewDetails={setViewingPolicy} lang={lang} />
              </div>
              <div className="space-y-6">
                 <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden group transition-all duration-300 hover:shadow-2xl">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
                    <h5 className="font-bold text-lg mb-2 relative z-10">{t.lineSync}</h5>
                    <p className="text-blue-100 text-sm mb-4 relative z-10 leading-relaxed font-medium">{t.lineDesc}</p>
                    <button 
                      onClick={handleConnectLine}
                      className="w-full py-2.5 bg-white text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-all relative z-10 shadow-lg active:scale-95"
                    >
                      {t.connectLine}
                    </button>
                 </div>
                 {/* Re-designed Protection Index (Wisely Displayed) */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <h5 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">{t.healthIndex}</h5>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>
                    
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className="text-4xl font-black text-slate-900 tabular-nums">75%</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">Status: Stable</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl">🛡️</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>POOR</span>
                        <span>EXCELLENT</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex p-0.5">
                        <div className="h-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-500 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setActiveTab('analysis')}
                      className="w-full mt-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-slate-100 transition-all active:scale-95"
                    >
                      View AI Breakdown →
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="animate-in fade-in duration-500">
             {(isAddingPolicy || editingPolicy) && (
               <PolicyForm 
                 initialPolicy={editingPolicy || undefined}
                 onSubmit={handleSavePolicy} 
                 onCancel={() => { setIsAddingPolicy(false); setEditingPolicy(null); }} 
                 lang={lang}
               />
             )}
             <PolicyList policies={policies} onDelete={handleDeletePolicy} onEdit={handleEditPolicy} onViewDetails={setViewingPolicy} lang={lang} />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="animate-in fade-in duration-500">
            <GapAnalysisView policies={policies} profile={profile} lang={lang} />
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="animate-in fade-in duration-500">
            <TaxOptimizationView policies={policies} profile={profile} lang={lang} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in duration-500">
            <ProfileForm initialProfile={profile} onSave={setProfile} lang={lang} />
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="animate-in fade-in duration-500">
            <VaultView 
              policies={policies} 
              onUpload={handleUploadDocument} 
              onDelete={handleDeleteDocument}
              lang={lang}
              isPro={isPro}
            />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="animate-in fade-in duration-500">
            <AdminConsole currentUser={user} lang={lang} />
          </div>
        )}
      </main>

      <EmergencyContacts lang={lang} />
      <PolicyDetailsModal policy={viewingPolicy} onClose={() => setViewingPolicy(null)} onEdit={handleEditPolicy} lang={lang} />
      
      <ConfirmDialog 
        isOpen={!!policyIdToDelete}
        title={lang === 'en' ? "Delete Policy" : "ลบกรมธรรม์"}
        message={t.confirmDelete}
        onConfirm={confirmDeletePolicy}
        onCancel={() => setPolicyIdToDelete(null)}
        lang={lang}
      />

      <ShareReportModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        policies={policies}
        profile={profile}
        lang={lang}
      />
    </div>
  );
};

export default App;
