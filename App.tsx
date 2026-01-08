
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

  // State managed via persistence logic
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [protectionScore, setProtectionScore] = useState<number | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'analysis' | 'tax' | 'vault' | 'profile' | 'admin'>('overview');
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null);
  const [policyIdToDelete, setPolicyIdToDelete] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Initial Data Load
  useEffect(() => {
    // Session load
    const savedUser = localStorage.getItem('pw_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Database load (Local Database)
    const savedPolicies = localStorage.getItem('pw_policies');
    const savedProfile = localStorage.getItem('pw_profile');
    const savedScore = localStorage.getItem('pw_protection_score');
    
    if (savedPolicies) setPolicies(JSON.parse(savedPolicies));
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedScore) setProtectionScore(Number(savedScore));
    
    setDataLoaded(true);
  }, []);

  // Database Auto-Save
  useEffect(() => {
    if (dataLoaded) {
      localStorage.setItem('pw_policies', JSON.stringify(policies));
    }
  }, [policies, dataLoaded]);

  useEffect(() => {
    if (dataLoaded && profile) {
      localStorage.setItem('pw_profile', JSON.stringify(profile));
    }
  }, [profile, dataLoaded]);

  useEffect(() => {
    if (dataLoaded && protectionScore !== null) {
      localStorage.setItem('pw_protection_score', protectionScore.toString());
    }
  }, [protectionScore, dataLoaded]);

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

  if (!user) {
    return <LoginView onLogin={handleLogin} lang={lang} />;
  }

  const isPro = user.role === 'Pro-Member' || user.role === 'Admin';

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

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
            {activeTab === 'overview' && policies.length > 0 && (
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
            {policies.length > 0 ? (
              <>
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
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                          <h5 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">{t.healthIndex}</h5>
                          <div className={`w-2 h-2 rounded-full ${protectionScore !== null ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        </div>
                        
                        <div className="flex items-end justify-between mb-4">
                          <div>
                            <p className="text-4xl font-black text-slate-900 tabular-nums">
                              {protectionScore !== null ? `${protectionScore}%` : '--%'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                              {protectionScore !== null ? 'AI Evaluated' : 'Pending Analysis'}
                            </p>
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
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${protectionScore !== null ? getScoreColor(protectionScore) : 'bg-slate-200'}`} 
                              style={{ width: `${protectionScore !== null ? protectionScore : 0}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => setActiveTab('analysis')}
                          className="w-full mt-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-slate-100 transition-all active:scale-95"
                        >
                          {protectionScore !== null ? 'Re-run Analysis →' : 'View AI Breakdown →'}
                        </button>
                     </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-sm">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-5xl">📁</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">No policies yet</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-8">Start building your secure insurance portfolio to unlock AI analysis and tax optimization.</p>
                <button 
                  onClick={toggleAddingPolicy}
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                >
                  + Add Your First Policy
                </button>
              </div>
            )}
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
            {profile ? (
              <GapAnalysisView 
                policies={policies} 
                profile={profile} 
                lang={lang} 
                onAnalysisComplete={(score) => setProtectionScore(score)}
              />
            ) : (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <span className="text-5xl block mb-4">👤</span>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Complete Your Profile</h3>
                <p className="text-slate-500 max-w-xs mx-auto mb-8 text-sm">We need your age, income, and family context to perform an accurate protection gap analysis.</p>
                <button onClick={() => setActiveTab('profile')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100">Setup Profile Now</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="animate-in fade-in duration-500">
            {profile ? (
              <TaxOptimizationView policies={policies} profile={profile} lang={lang} isPro={isPro} />
            ) : (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <span className="text-5xl block mb-4">💰</span>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Tax Planning Restricted</h3>
                <p className="text-slate-500 max-w-xs mx-auto mb-8 text-sm">Please update your annual income in the Profile tab to calculate your potential tax savings.</p>
                <button onClick={() => setActiveTab('profile')} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100">Enter Income Details</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in duration-500">
            <ProfileForm 
              initialProfile={profile || {
                name: user.name,
                sex: 'Male',
                birthDate: '1990-01-01',
                maritalStatus: 'Single',
                dependents: 0,
                annualIncome: 0,
                monthlyExpenses: 0,
                totalDebt: 0
              }} 
              onSave={setProfile} 
              lang={lang} 
            />
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

      {profile && (
        <ShareReportModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          policies={policies}
          profile={profile}
          lang={lang}
        />
      )}
    </div>
  );
};

export default App;
