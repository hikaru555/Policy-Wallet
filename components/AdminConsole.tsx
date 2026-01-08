
import React, { useState, useEffect } from 'react';
import { translations, Language } from '../translations';
import { User } from '../types';

interface AdminConsoleProps {
  currentUser: User;
  lang: Language;
}

const AdminConsole: React.FC<AdminConsoleProps> = ({ currentUser, lang }) => {
  const t = translations[lang];
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'deploy' | 'schema'>('users');
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pw_users');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const projectId = "gen-lang-client-0928682283";
  const sqlConnection = "gen-lang-client-0928682283:us-central1:tiered-web-app-db-bbbd";
  const bucketName = "policywallet";
  const dbUser = "policywallet";
  const dbName = "policywallet";
  const dbPass = ".E9iAtlC[I5;g&<3";

  const sqlSchema = `-- Policy Wallet Database Schema
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    policies JSONB DEFAULT '[]'::jsonb,
    profile JSONB DEFAULT '{}'::jsonb,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);`;

  useEffect(() => {
    setUsers(prev => {
      if (!prev.find(u => u.email === currentUser.email)) {
        const newList = [currentUser, ...prev];
        localStorage.setItem('pw_users', JSON.stringify(newList));
        return newList;
      }
      return prev;
    });
  }, [currentUser]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deploymentSteps = [
    {
      id: 'proj',
      title: "1. Login & Set Project",
      command: `gcloud auth login\ngcloud config set project ${projectId}\ngcloud services enable cloudrun.googleapis.com sqladmin.googleapis.com storage.googleapis.com artifactregistry.googleapis.com`,
      icon: '🆔'
    },
    {
      id: 'db',
      title: "2. Database Initialization",
      command: `gcloud sql databases create ${dbName} --instance=tiered-web-app-db-bbbd\n# Next: Click "SQL Schema" tab to get the setup code.`,
      icon: '🐘'
    },
    {
      id: 'run',
      title: "3. Direct Deploy (No Dockerfile needed)",
      command: `gcloud run deploy policy-bridge \\
  --source . \\
  --region us-central1 \\
  --add-cloudsql-instances ${sqlConnection} \\
  --set-env-vars="DB_USER=${dbUser},DB_NAME=${dbName},DB_PASSWORD='${dbPass}',CLOUD_SQL_CONNECTION_NAME=${sqlConnection},BUCKET_NAME=${bucketName}" \\
  --allow-unauthenticated`,
      icon: '🚀'
    }
  ];

  if (currentUser.role !== 'Admin') {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-10 text-center">
        <span className="text-5xl mb-4 block">🚫</span>
        <h3 className="text-2xl font-bold text-rose-800 mb-2">{t.adminOnly}</h3>
        <p className="text-rose-600">Unauthorized access detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit overflow-x-auto">
        {['users', 'deploy', 'schema'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveSubTab(tab as any)}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 ${activeSubTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab === 'users' ? t.manageUsers : tab === 'deploy' ? 'Deployment' : 'SQL Schema'}
          </button>
        ))}
      </div>

      {activeSubTab === 'users' && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8">{t.manageUsers}</h3>
          <div className="overflow-x-auto border border-slate-100 rounded-3xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">{t.userName}</th>
                  <th className="px-6 py-4">{t.userEmail}</th>
                  <th className="px-6 py-4">{t.userRole}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={user.picture} className="w-8 h-8 rounded-full border border-slate-200" alt="" />
                      <span className="text-sm font-bold text-slate-800">{user.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${user.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>{user.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'deploy' && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
           <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Google Cloud Console</h3>
           <p className="text-slate-500 text-sm mb-10">Use Google Cloud Buildpacks for direct deployment. No Dockerfile required.</p>
           <div className="space-y-6">
             {deploymentSteps.map((step) => (
               <div key={step.id}>
                 <div className="flex items-center gap-3 mb-3">
                   <span className="text-xl">{step.icon}</span>
                   <h4 className="font-bold text-slate-800 text-sm">{step.title}</h4>
                 </div>
                 <div className="relative">
                   <pre className="p-4 bg-slate-900 text-blue-400 rounded-2xl overflow-x-auto text-xs font-mono border border-slate-800 shadow-lg">
                     <code>{step.command}</code>
                   </pre>
                   <button 
                     onClick={() => handleCopy(step.command, step.id)}
                     className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                       copiedId === step.id ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                     }`}
                   >
                     {copiedId === step.id ? 'Copied!' : 'Copy'}
                   </button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {activeSubTab === 'schema' && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
           <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">PostgreSQL Schema</h3>
           <p className="text-slate-500 text-sm mb-10">Execute this SQL in your Cloud SQL instance to create the necessary tables.</p>
           <div className="relative">
             <pre className="p-6 bg-slate-900 text-emerald-400 rounded-3xl overflow-x-auto text-xs font-mono border border-slate-800 shadow-xl">
               <code>{sqlSchema}</code>
             </pre>
             <button 
               onClick={() => handleCopy(sqlSchema, 'schema-copy')}
               className={`absolute top-6 right-6 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                 copiedId === 'schema-copy' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
               }`}
             >
               {copiedId === 'schema-copy' ? 'Copied!' : 'Copy SQL'}
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
