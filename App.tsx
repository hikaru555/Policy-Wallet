
import React, { useState } from 'react';
import { Policy, CoverageType, UserProfile, PaymentFrequency } from './types';
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

const MOCK_POLICIES: Policy[] = [
  {
    id: '1',
    company: 'AIA',
    planName: 'Health First Gold',
    coverages: [
      { type: CoverageType.HEALTH, sumAssured: 1000000, roomRate: 4000 },
      { type: CoverageType.LIFE, sumAssured: 500000 }
    ],
    premiumAmount: 25000,
    frequency: PaymentFrequency.YEARLY,
    dueDate: '2025-05-15',
    status: 'Active'
  },
  {
    id: '2',
    company: 'FWD',
    planName: 'Life Shield Plus',
    coverages: [
      { type: CoverageType.LIFE, sumAssured: 2000000 }
    ],
    premiumAmount: 12000,
    frequency: PaymentFrequency.MONTHLY,
    dueDate: '2025-08-20',
    status: 'Grace Period'
  },
  {
    id: '3',
    company: 'Thai Life',
    planName: 'Critical Care 50',
    coverages: [
      { type: CoverageType.CRITICAL, sumAssured: 500000 },
      { type: CoverageType.ACCIDENT, sumAssured: 300000 }
    ],
    premiumAmount: 8500,
    frequency: PaymentFrequency.QUARTERLY,
    dueDate: '2025-11-01',
    status: 'Active'
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

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  const [policies, setPolicies] = useState<Policy[]>(MOCK_POLICIES);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'analysis' | 'vault' | 'profile'>('overview');
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null);
  const [policyIdToDelete, setPolicyIdToDelete] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col p-4 space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg font-bold">PW</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">{t.appName}</h1>
          </div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
            className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 uppercase tracking-widest text-slate-600"
          >
            {lang === 'en' ? 'TH' : 'EN'}
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'overview', label: t.overview, icon: '📊' },
            { id: 'policies', label: t.policies, icon: '📄' },
            { id: 'analysis', label: t.analysis, icon: '🤖' },
            { id: 'profile', label: t.profile, icon: '👤' },
            { id: 'vault', label: t.vault, icon: '🛡️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setIsAddingPolicy(false); setEditingPolicy(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span>{tab.icon} {tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-auto space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Agent View</p>
            <div className="flex items-center space-x-3">
              <img src="https://picsum.photos/seed/agent/40/40" className="w-8 h-8 rounded-full border border-white shadow-sm" alt="agent" />
              <div>
                <p className="text-xs font-bold text-slate-800">Somchai Agent</p>
                <p className="text-[10px] text-slate-500">Premium Partner</p>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200">
             <p className="text-[9px] text-slate-400 font-medium leading-tight">
               {t.creatorCredit}
             </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 capitalize">
              {activeTab === 'overview' ? t.overview : 
               activeTab === 'policies' ? t.policies : 
               activeTab === 'analysis' ? t.analysis : 
               activeTab === 'vault' ? t.vault : 
               activeTab === 'profile' ? t.profile : activeTab}
            </h2>
            <p className="text-slate-500 text-sm">{t.welcomeBack} <b>{profile.name}</b></p>
          </div>
          <div className="flex items-center space-x-3">
            {activeTab === 'overview' && (
              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                {t.shareReport}
              </button>
            )}
            {(activeTab === 'overview' || activeTab === 'policies') && (
              <button 
                onClick={toggleAddingPolicy}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md transition-shadow"
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
                 <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl">
                    <h5 className="font-bold text-lg mb-2">{t.lineSync}</h5>
                    <p className="text-blue-100 text-sm mb-4">{t.lineDesc}</p>
                    <button className="w-full py-2 bg-white text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
                      {t.connectLine}
                    </button>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h5 className="font-bold text-sm text-slate-800 mb-4 uppercase tracking-widest">{t.healthIndex}</h5>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500">{t.healthIndex}</span>
                      <span className="text-xs font-bold text-emerald-600">Good</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="w-[75%] h-full bg-emerald-500"></div>
                    </div>
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

        {activeTab === 'profile' && (
          <div className="animate-in fade-in duration-500">
            <ProfileForm initialProfile={profile} onSave={setProfile} lang={lang} />
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="animate-in fade-in duration-500">
            <VaultView policies={policies} lang={lang} />
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
