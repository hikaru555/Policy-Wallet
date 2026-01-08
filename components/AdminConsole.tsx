
import React, { useState, useEffect } from 'react';
import { translations, Language } from '../translations';
import { User } from '../types';

interface AdminConsoleProps {
  currentUser: User;
  lang: Language;
}

interface InfraStatus {
  status: 'online' | 'offline' | 'checking';
  database: 'connected' | 'disconnected' | 'error' | 'checking' | 'not_configured';
  storage: 'connected' | 'disconnected' | 'error' | 'checking' | 'bucket_not_found' | 'client_not_initialized';
  environment?: string;
  timestamp?: string;
  dbError?: string;
  storageError?: string;
  latency?: number;
  bucket?: string;
  bridgeError?: string;
  rawResponse?: string;
  activeUrl?: string;
}

const AdminConsole: React.FC<AdminConsoleProps> = ({ currentUser, lang }) => {
  const t = translations[lang];
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'infra' | 'deploy' | 'schema'>('users');
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pw_users');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [infraStatus, setInfraStatus] = useState<InfraStatus>({
    status: 'checking',
    database: 'checking',
    storage: 'checking'
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sqlConnection = "gen-lang-client-0928682283:us-central1:tiered-web-app-db-bbbd";
  const bucketName = "policywallet";
  const dbName = "policywallet";

  useEffect(() => {
    setUsers(prev => {
      if (!prev.find(u => u.email === currentUser.email)) {
        const newList = [currentUser, ...prev];
        localStorage.setItem('pw_users', JSON.stringify(newList));
        return newList;
      }
      return prev;
    });
    
    checkInfra();
  }, [currentUser]);

  const checkInfra = async () => {
    setInfraStatus(prev => ({ 
      ...prev, 
      status: 'checking', 
      database: 'checking', 
      storage: 'checking', 
      bridgeError: undefined, 
      rawResponse: undefined,
      activeUrl: undefined
    }));
    
    const startTime = Date.now();
    
    // Discovery order: 1. Relative (Prod), 2. Localhost 8080 (Local Bridge)
    const urlPatterns = [
      '/api',
      'http://localhost:8080/api'
    ];

    let success = false;
    let lastError = '';

    for (const baseUrl of urlPatterns) {
      if (success) break;
      
      try {
        const pingUrl = `${baseUrl}/ping`;
        const pingRes = await fetch(pingUrl, { signal: AbortSignal.timeout(3000) }).catch(() => null);
        
        if (pingRes && pingRes.ok) {
          const response = await fetch(`${baseUrl}/admin/health`);
          const latency = Date.now() - startTime;
          const text = await response.text();
          
          try {
            const data = JSON.parse(text);
            setInfraStatus({
              status: 'online',
              database: data.database,
              storage: data.storage,
              environment: data.environment,
              timestamp: data.timestamp,
              dbError: data.dbError,
              storageError: data.storageError,
              bucket: data.bucket,
              latency,
              activeUrl: baseUrl
            });
            success = true;
          } catch (jsonErr) {
            setInfraStatus(prev => ({
              ...prev,
              status: 'offline',
              bridgeError: 'Bridge online but invalid health response.',
              rawResponse: text.substring(0, 200),
              activeUrl: baseUrl
            }));
          }
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!success) {
      setInfraStatus({
        status: 'offline',
        database: 'disconnected',
        storage: 'disconnected',
        bridgeError: `Bridge unreachable. Last error: ${lastError}`,
        latency: Date.now() - startTime
      });
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        {[
          { id: 'users', label: t.manageUsers },
          { id: 'infra', label: 'Infra Monitor' },
          { id: 'schema', label: 'SQL Schema' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex-shrink-0 ${activeSubTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'users' && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8">{t.manageUsers}</h3>
          <div className="overflow-x-auto rounded-3xl border border-slate-100">
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

      {activeSubTab === 'infra' && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">System Health</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time status of cloud components</p>
            </div>
            <button 
              onClick={checkInfra}
              className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all border border-blue-100"
            >
              🔄 Refresh Check
            </button>
          </div>

          {(infraStatus.status === 'offline' || infraStatus.rawResponse) && (
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3 text-rose-800 font-bold mb-2">
                <span className="text-xl">📡</span>
                <h4>Connectivity Issue Detected</h4>
              </div>
              <p className="text-sm text-rose-600 mb-2 font-medium">{infraStatus.bridgeError}</p>
              
              <div className="space-y-3 mt-4">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Troubleshooting Steps:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-white/50 p-4 rounded-2xl border border-rose-100 text-xs">
                      <p className="font-bold text-rose-900 mb-1">Local Environment</p>
                      <p className="text-rose-600">Ensure <code>npm start</code> is running on port 8080.</p>
                   </div>
                   <div className="bg-white/50 p-4 rounded-2xl border border-rose-100 text-xs">
                      <p className="font-bold text-rose-900 mb-1">Production (Cloud Run)</p>
                      <p className="text-rose-600">Ensure Cloud SQL Auth Proxy is enabled in Cloud Run settings.</p>
                   </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-3xl border transition-all ${infraStatus.status === 'online' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bridge API</span>
                <span className={`w-3 h-3 rounded-full ${infraStatus.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></span>
              </div>
              <p className="text-2xl font-black text-slate-800 mb-1">{infraStatus.status.toUpperCase()}</p>
              <p className="text-xs text-slate-500">Latency: <span className="font-bold text-slate-700">{infraStatus.latency}ms</span></p>
            </div>

            <div className={`p-6 rounded-3xl border transition-all ${infraStatus.database === 'connected' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cloud SQL</span>
                <span className={`w-3 h-3 rounded-full ${infraStatus.database === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></span>
              </div>
              <p className="text-2xl font-black text-slate-800 mb-1">{infraStatus.database.toUpperCase()}</p>
              <p className="text-xs text-slate-500">DB: <span className="font-bold text-slate-700">{dbName}</span></p>
              {infraStatus.dbError && <p className="mt-2 text-[9px] text-rose-500 font-mono line-clamp-2">{infraStatus.dbError}</p>}
            </div>

            <div className={`p-6 rounded-3xl border transition-all ${infraStatus.storage === 'connected' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bucket Storage</span>
                <span className={`w-3 h-3 rounded-full ${infraStatus.storage === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></span>
              </div>
              <p className="text-2xl font-black text-slate-800 mb-1">{infraStatus.storage.toUpperCase()}</p>
              <p className="text-xs text-slate-500">Bucket: <span className="font-bold text-slate-700">{infraStatus.bucket || 'policywallet'}</span></p>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'schema' && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
           <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">PostgreSQL Schema</h3>
           <p className="text-slate-500 text-sm mb-8">Table structure for high-performance JSONB storage</p>
           
           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 font-mono text-xs overflow-x-auto">
<pre className="text-slate-700">
{`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  policies JSONB DEFAULT '[]'::jsonb,
  profile JSONB DEFAULT '{}'::jsonb,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`}
</pre>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
