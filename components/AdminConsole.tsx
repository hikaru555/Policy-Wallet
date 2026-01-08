
import React, { useState, useEffect } from 'react';
import { translations, Language } from '../translations';
import { User } from '../types';

interface AdminConsoleProps {
  currentUser: User;
  lang: Language;
}

interface InfraStatus {
  status: 'online' | 'offline' | 'checking';
  database: 'connected' | 'disconnected' | 'error' | 'checking' | 'not_configured' | 'initializing';
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
  sqlProxy?: string;
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

  const [manualUrl, setManualUrl] = useState(() => localStorage.getItem('pw_bridge_url') || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const saveManualUrl = () => {
    if (manualUrl) {
      localStorage.setItem('pw_bridge_url', manualUrl.endsWith('/') ? manualUrl.slice(0, -1) : manualUrl);
    } else {
      localStorage.removeItem('pw_bridge_url');
    }
    checkInfra();
  };

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
    
    // Increased patterns to ensure discovery, prioritizing manual override
    const urlPatterns = [
      localStorage.getItem('pw_bridge_url'),
      window.location.origin + '/api',
      '/api',
      'http://localhost:8080/api'
    ].filter(Boolean) as string[];

    let success = false;
    let errorLog = '';

    for (const baseUrl of urlPatterns) {
      if (success) break;
      
      try {
        // High timeout (15s) for Cloud Run Cold Starts
        const pingRes = await fetch(`${baseUrl}/ping`, { 
          cache: 'no-store',
          mode: 'cors',
          signal: AbortSignal.timeout(15000) 
        }).catch(e => {
          errorLog += `[${baseUrl}]: ${e.message}. `;
          return null;
        });
        
        if (pingRes && pingRes.ok) {
          const healthRes = await fetch(`${baseUrl}/admin/health`);
          const latency = Date.now() - startTime;
          const text = await healthRes.text();
          
          try {
            const data = JSON.parse(text);
            setInfraStatus({
              status: 'online',
              database: data.database,
              storage: data.storage,
              environment: data.env,
              timestamp: data.timestamp,
              dbError: data.dbError,
              storageError: data.storageError,
              bucket: data.bucket || 'policywallet',
              sqlProxy: data.sqlProxy,
              latency,
              activeUrl: baseUrl
            });
            success = true;
          } catch (jsonErr) {
            setInfraStatus(prev => ({
              ...prev,
              status: 'offline',
              bridgeError: `API at ${baseUrl} is reachable but returned non-JSON data. Check server logs.`,
              rawResponse: text.substring(0, 200),
              activeUrl: baseUrl,
              latency: Date.now() - startTime
            }));
          }
        }
      } catch (err: any) {
        errorLog += `[${baseUrl}]: unexpected failure ${err.message}. `;
      }
    }

    if (!success) {
      setInfraStatus({
        status: 'offline',
        database: 'disconnected',
        storage: 'disconnected',
        bridgeError: `Auto-discovery failed. ${errorLog}`,
        latency: Date.now() - startTime
      });
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
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
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">System Connectivity</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Cloud Run Bridge & Data Infrastructure</p>
              </div>
              <button 
                onClick={checkInfra}
                className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all border border-blue-100"
              >
                🔄 Retry Discovery
              </button>
            </div>

            {infraStatus.status === 'offline' && (
              <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3 text-rose-800 font-bold mb-2">
                  <span className="text-xl">📡</span>
                  <h4>Connectivity Diagnostic Log</h4>
                </div>
                <div className="bg-white/50 p-4 rounded-xl font-mono text-[9px] text-rose-600 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                  {infraStatus.bridgeError}
                </div>
                {infraStatus.rawResponse && (
                  <div className="mt-4 p-4 bg-slate-900 rounded-xl font-mono text-[9px] text-slate-400">
                    <p className="text-slate-500 mb-1 font-bold">RAW SERVER OUTPUT (FIRST 200 CHARS):</p>
                    {infraStatus.rawResponse}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-3xl border transition-all ${infraStatus.status === 'online' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bridge API</span>
                  <span className={`w-3 h-3 rounded-full ${infraStatus.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-rose-500'}`}></span>
                </div>
                <p className="text-2xl font-black text-slate-800 mb-1">{infraStatus.status.toUpperCase()}</p>
                <p className="text-[10px] text-slate-500">Latency: <span className="font-bold text-slate-700">{infraStatus.latency}ms</span></p>
                <p className="text-[9px] text-slate-400 truncate mt-1">Route: {infraStatus.activeUrl || 'None'}</p>
              </div>

              <div className={`p-6 rounded-3xl border transition-all ${infraStatus.database === 'connected' ? 'bg-emerald-50 border-emerald-100' : infraStatus.database === 'initializing' ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cloud SQL</span>
                  <span className={`w-3 h-3 rounded-full ${infraStatus.database === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : infraStatus.database === 'initializing' ? 'bg-blue-500 animate-spin' : 'bg-rose-500'}`}></span>
                </div>
                <p className="text-2xl font-black text-slate-800 mb-1">{infraStatus.database.toUpperCase().replace('_', ' ')}</p>
                <p className="text-[10px] text-slate-500 truncate">Pool: <span className="font-bold text-slate-700">policywallet</span></p>
                {infraStatus.dbError && <p className="mt-2 text-[9px] text-rose-500 font-mono line-clamp-2 leading-tight">{infraStatus.dbError}</p>}
              </div>

              <div className={`p-6 rounded-3xl border transition-all ${infraStatus.storage === 'connected' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GCS Bucket</span>
                  <span className={`w-3 h-3 rounded-full ${infraStatus.storage === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></span>
                </div>
                <p className="text-2xl font-black text-slate-800 mb-1">{infraStatus.storage.toUpperCase().replace('_', ' ')}</p>
                <p className="text-[10px] text-slate-500 truncate">Bucket: <span className="font-bold text-slate-700">{infraStatus.bucket}</span></p>
              </div>
            </div>

            {/* Manual Bridge Override Settings */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                ⚙️ Manual API Override (Cloud Setup)
              </h4>
              <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="text" 
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://your-cloud-run-url.a.run.app/api"
                  className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button 
                  onClick={saveManualUrl}
                  className="px-6 py-3 bg-slate-800 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-slate-200"
                >
                  Save & Apply
                </button>
              </div>
              <p className="mt-3 text-[10px] text-slate-400 leading-relaxed italic">
                *Use this if the app is OFFLINE and discovery fails. Leave blank to restore automatic relative path detection.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <h4 className="font-bold text-[10px] mb-4 text-slate-400 uppercase tracking-widest">Environment Variables</h4>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
              <p className="font-mono text-xs text-slate-300 break-all">{infraStatus.sqlProxy || 'Loading...'}</p>
              <button onClick={() => handleCopy(infraStatus.sqlProxy || '', 'sql')} className="text-[9px] font-bold text-white/50 hover:text-white uppercase tracking-widest px-3 py-1 bg-white/10 rounded-md transition-all ml-4 flex-shrink-0">
                {copiedId === 'sql' ? 'Copied!' : 'Copy ID'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Node Environment</p>
                 <p className="font-mono text-xs text-slate-300">{infraStatus.environment || 'Detecting...'}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Server Clock</p>
                 <p className="font-mono text-xs text-slate-300 truncate">{infraStatus.timestamp ? new Date(infraStatus.timestamp).toLocaleTimeString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'schema' && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
           <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">PostgreSQL Table Structure</h3>
           <p className="text-slate-500 text-sm mb-8">Table structure maintained in Cloud SQL</p>
           
           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 font-mono text-xs overflow-x-auto">
<pre className="text-slate-700 leading-relaxed">
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
