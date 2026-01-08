
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

  const projectId = "gen-lang-client-0928682283";
  const sqlConnection = "gen-lang-client-0928682283:us-central1:tiered-web-app-db-bbbd";
  const bucketName = "policywallet";
  const dbUser = "policywallet";
  const dbName = "policywallet";
  const dbPass = ".E9iAtlC[I5;g&<3";

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
    
    // Attempt multiple possible URL patterns for dev vs prod
    const urlPatterns = [
      '/api', // Relative (Production)
      'http://localhost:8080/api', // Local Dev Backend
      window.location.origin + '/api' // Absolute Same Origin
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
          } catch (jsonErr: any) {
            // If it's valid ping but invalid health JSON, we show the raw text
            setInfraStatus(prev => ({
              ...prev,
              status: 'offline',
              bridgeError: `Bridge returned non-JSON response: ${jsonErr.message}`,
              rawResponse: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
              activeUrl: baseUrl
            }));
            lastError = jsonErr.message;
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
        bridgeError: `Could not reach Bridge API at any known location. Last error: ${lastError}`,
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
          { id: 'infra', label: 'Infra Status' },
          { id: 'deploy', label: 'Deployment' },
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

      {activeSubTab === 'infra' && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">System Health Monitor</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time status of backend services</p>
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
              
              {infraStatus.rawResponse && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Raw Server Output:</p>
                  <pre className="p-3 bg-white/50 border border-rose-100 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">
                    {infraStatus.rawResponse}
                  </pre>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Troubleshooting Steps:</p>
                <ul className="text-xs text-rose-700 list-disc ml-4 space-y-1">
                  <li>Check if `server.js` is running (`npm start`) on port 8080</li>
                  <li>If running locally, try accessing <code>http://localhost:8080/api/ping</code> directly</li>
                  <li>Ensure your browser is not blocking cross-origin requests if using multiple ports</li>
                  {infraStatus.activeUrl && <li>Current Attempted URL: <code className="bg-white px-1 rounded">{infraStatus.activeUrl}</code></li>}
                </ul>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-3xl border transition-all ${infraStatus.status === 'online' ? 'bg-emerald-50 border-emerald-100' : infraStatus.status === 'checking' ? 'bg-slate-50 border-slate-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bridge API</span>
                <span className={`w-3 h-3 rounded-full ${infraStatus.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : infraStatus.status === 'checking' ? 'bg-slate-300' : 'bg-rose-500'}`}></span>
              </div>
              <p className="text-2xl font-black text-slate-800 mb-1">{infraStatus.status.toUpperCase()}</p>
              <p className="text-xs text-slate-500">Latency: <span className="font-bold text-slate-700">{infraStatus.latency}ms</span></p>
            </div>

            <div className={`p-6 rounded-3xl border transition-all ${infraStatus.database === 'connected' ? 'bg-emerald-50 border-emerald-100' : infraStatus.database === 'checking' ? 'bg-slate-50 border-slate-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PostgreSQL</span>
                <span className={`w-3 h-3 rounded-full ${infraStatus.database === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : infraStatus.database === 'checking' ? 'bg-slate-300' : 'bg-rose-500'}`}></span>
              </div>
              <p className="text-2xl font-black text-slate-800 mb-1">{infraStatus.database.toUpperCase().replace('_', ' ')}</p>
              <p className="text-xs text-slate-500 truncate">Instance: <span className="font-bold text-slate-700">{dbName}</span></p>
              {infraStatus.dbError && infraStatus.status === 'online' && (
                <div className="mt-2 p-2 bg-white/50 border border-rose-100 rounded-lg">
                   <p className="text-[9px] text-rose-600 font-mono break-words">{infraStatus.dbError}</p>
                </div>
              )}
            </div>

            <div className={`p-6 rounded-3xl border transition-all ${infraStatus.storage === 'connected' ? 'bg-emerald-50 border-emerald-100' : infraStatus.storage === 'checking' ? 'bg-slate-50 border-slate-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GCS Bucket</span>
                <span className={`w-3 h-3 rounded-full ${infraStatus.storage === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : infraStatus.storage === 'checking' ? 'bg-slate-300' : 'bg-rose-500'}`}></span>
              </div>
              <p className="text-2xl font-black text-slate-800 mb-1">{infraStatus.storage.toUpperCase().replace('_', ' ')}</p>
              <p className="text-xs text-slate-500">Bucket: <span className="font-bold text-slate-700">{infraStatus.bucket || 'N/A'}</span></p>
              {infraStatus.storageError && infraStatus.status === 'online' && (
                <div className="mt-2 p-2 bg-white/50 border border-rose-100 rounded-lg">
                   <p className="text-[9px] text-rose-600 font-mono break-words">{infraStatus.storageError}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
            <h4 className="font-bold text-sm mb-4 text-slate-400 uppercase tracking-widest">Active Connection Config</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-blue-400">PROJECT_ID:</span> {projectId}
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-blue-400">SQL_CONN:</span> {sqlConnection}
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-blue-400">BUCKET_NAME:</span> {infraStatus.bucket || bucketName}
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-blue-400">DB_NAME:</span> {dbName}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'deploy' && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
           <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Google Cloud Console</h3>
           <p className="text-slate-500 text-sm mb-10">Use Google Cloud Buildpacks for direct deployment. No Dockerfile required.</p>
           <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl">
              <span className="text-4xl block mb-4">🚀</span>
              <p>Deployment instructions are available in the documentation.</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
