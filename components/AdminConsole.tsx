
import React, { useState } from 'react';
import { translations, Language } from '../translations';
import { User, UserRole } from '../types';

interface AdminConsoleProps {
  currentUser: User;
  lang: Language;
}

const INITIAL_USERS: User[] = [
  { id: '1', email: 'phattararak@gmail.com', name: 'Phattararak', role: 'Admin', picture: 'https://ui-avatars.com/api/?name=Phattararak&background=4f46e5&color=fff' },
  { id: '2', email: 'client-a@test.com', name: 'Somsak R.', role: 'Pro-Member', picture: 'https://ui-avatars.com/api/?name=Somsak&background=f59e0b&color=fff' },
  { id: '3', email: 'client-b@test.com', name: 'Wipa W.', role: 'Member', picture: 'https://ui-avatars.com/api/?name=Wipa&background=cbd5e1&color=fff' },
  { id: '4', email: 'new-user@gmail.com', name: 'Anon Y.', role: 'Member', picture: 'https://ui-avatars.com/api/?name=Anon&background=cbd5e1&color=fff' },
];

const AdminConsole: React.FC<AdminConsoleProps> = ({ currentUser, lang }) => {
  const t = translations[lang];
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'cloud' | 'deploy'>('users');
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const projectId = "policy-wallet-4521"; // Simulated from screenshot context

  if (currentUser.role !== 'Admin') {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-10 text-center">
        <span className="text-5xl mb-4 block">🚫</span>
        <h3 className="text-2xl font-bold text-rose-800 mb-2">{t.adminOnly}</h3>
        <p className="text-rose-600">Unauthorized access detected.</p>
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePro = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId && u.role !== 'Admin') {
        return { ...u, role: u.role === 'Pro-Member' ? 'Member' : 'Pro-Member' };
      }
      return u;
    }));
  };

  const deploymentSteps = [
    {
      id: 'proj',
      title: t.setupProject,
      command: `gcloud config set project ${projectId}\ngcloud services enable cloudrun.googleapis.com firestore.googleapis.com storage.googleapis.com aiplatform.googleapis.com`,
      icon: '🆔'
    },
    {
      id: 'db',
      title: t.setupDatabase,
      command: `gcloud firestore databases create --location=asia-southeast1 --type=firestore-native`,
      icon: '🔥'
    },
    {
      id: 'store',
      title: t.setupStorage,
      command: `gsutil mb -l asia-southeast1 gs://${projectId}-vault\ngsutil iam ch allUsers:objectViewer gs://${projectId}-vault`,
      icon: '🪣'
    },
    {
      id: 'run',
      title: t.deployApp,
      command: `gcloud run deploy policy-wallet --source . --region asia-southeast1 --allow-unauthenticated`,
      icon: '🚀'
    }
  ];

  const gcpTemplates = [
    {
      name: 'Deploy a three-tier web app',
      feature: 'Core Dashboard & SaaS Logic',
      description: 'Automatically sets up Cloud Run and Firestore to host your Policy Wallet application.',
      icon: '🏗️',
      color: 'blue'
    },
    {
      name: 'Vertex AI Search & Conversation',
      feature: 'AI Gap Analysis (Phase 3)',
      description: 'Connect Gemini to your policy data store to generate human-like insurance insights.',
      icon: '🤖',
      color: 'indigo'
    },
    {
      name: 'Create a storage bucket',
      feature: 'Doc Vault & Document Storage',
      description: 'Sets up the secure cloud container for your PDFs and policy images.',
      icon: '🪣',
      color: 'emerald'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Tab Switcher */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveSubTab('users')}
          className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeSubTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {t.manageUsers}
        </button>
        <button 
          onClick={() => setActiveSubTab('cloud')}
          className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeSubTab === 'cloud' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Infrastructure
        </button>
        <button 
          onClick={() => setActiveSubTab('deploy')}
          className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeSubTab === 'deploy' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Deployment Hub
        </button>
      </div>

      {activeSubTab === 'users' && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-left-4 duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{t.manageUsers}</h3>
              <p className="text-slate-500 text-sm mt-1">Review and manage access levels for your clients.</p>
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-indigo-100">
              Total: {users.length} Users
            </div>
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-3xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">{t.userName}</th>
                  <th className="px-6 py-4">{t.userEmail}</th>
                  <th className="px-6 py-4">{t.userRole}</th>
                  <th className="px-6 py-4 text-right">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={user.picture} className="w-8 h-8 rounded-full border border-white shadow-sm" alt="" />
                        <span className="text-sm font-bold text-slate-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        user.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' :
                        user.role === 'Pro-Member' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.id !== currentUser.id && user.role !== 'Admin' && (
                        <button 
                          onClick={() => togglePro(user.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            user.role === 'Pro-Member' 
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                          }`}
                        >
                          {user.role === 'Pro-Member' ? t.demoteMember : t.makePro}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'cloud' && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Gemini AI', status: 'Healthy', icon: '🤖', color: 'emerald' },
              { label: 'Cloud Storage', status: 'Healthy', icon: '🪣', color: 'emerald' },
              { label: 'Firestore DB', status: 'Healthy', icon: '🔥', color: 'emerald' },
              { label: 'LINE API', status: 'Standby', icon: '💬', color: 'blue' }
            ].map((service, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
                <div className={`w-12 h-12 bg-${service.color}-50 text-2xl flex items-center justify-center rounded-2xl`}>
                  {service.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{service.label}</p>
                  <p className={`text-xs font-bold text-${service.color}-600`}>{service.status}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Cloud Resource Utilization</h3>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Billing Project: {projectId}</span>
             </div>

             <div className="space-y-6">
               <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700">Storage Bucket (policy-docs-vault)</span>
                    <span className="text-xs text-slate-500 font-medium">1.2 GB / 5.0 GB</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '24%' }}></div>
                  </div>
               </div>
               
               <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700">Vertex AI API Usage (Quotas)</span>
                    <span className="text-xs text-slate-500 font-medium">450 / 10,000 requests</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '4.5%' }}></div>
                  </div>
               </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.gcpTemplates}</h4>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">Recommended for your App</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {gcpTemplates.map((tmpl, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-indigo-400 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-3xl">{tmpl.icon}</span>
                       <span className={`text-[8px] font-black uppercase px-2 py-1 rounded bg-${tmpl.color}-50 text-${tmpl.color}-600`}>Official Template</span>
                    </div>
                    <h5 className="font-black text-slate-800 text-sm mb-1">{tmpl.name}</h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">{tmpl.feature}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{tmpl.description}</p>
                    <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest group-hover:underline">Learn More ↗</button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {activeSubTab === 'deploy' && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in zoom-in-95 duration-500">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-slate-50">
             <div>
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">{t.deployTitle}</h3>
               <p className="text-slate-500 text-sm mt-1">{t.deployDesc}</p>
             </div>
             <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs border border-blue-100">
               <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
               <span>Cloud SDK Recommended</span>
             </div>
           </div>

           <div className="space-y-8">
             {deploymentSteps.map((step, i) => (
               <div key={step.id} className="relative group">
                 <div className="flex items-center space-x-4 mb-3">
                   <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:bg-indigo-50 transition-colors">
                     {step.icon}
                   </div>
                   <h4 className="font-bold text-slate-800">{step.title}</h4>
                 </div>
                 
                 <div className="relative">
                   <pre className="p-5 bg-slate-900 text-blue-400 rounded-2xl overflow-x-auto text-xs font-mono border border-slate-800 shadow-xl group-hover:border-indigo-500/50 transition-all">
                     <code>{step.command}</code>
                   </pre>
                   <button 
                     onClick={() => handleCopy(step.command, step.id)}
                     className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                       copiedId === step.id ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                     }`}
                   >
                     {copiedId === step.id ? 'Copied! ✅' : 'Copy 📋'}
                   </button>
                 </div>
               </div>
             ))}
           </div>

           <div className="mt-12 p-8 bg-indigo-600 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-indigo-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
             <div className="relative z-10 text-center md:text-left">
               <h4 className="text-xl font-black mb-2">Need a Custom Cloud Solution?</h4>
               <p className="text-indigo-100 text-sm">We can assist with Terraform scripts or direct GCP console setup.</p>
             </div>
             <button className="relative z-10 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-50 transition-all active:scale-95">
               Contact Support 🧔
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
