
import React, { useState, useEffect } from 'react';
import { translations, Language } from '../translations';
import { User } from '../types';

interface AdminConsoleProps {
  currentUser: User;
  lang: Language;
}

const AdminConsole: React.FC<AdminConsoleProps> = ({ currentUser, lang }) => {
  const t = translations[lang];
  const [activeSubTab, setActiveSubTab] = useState<'users'>('users');
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pw_users');
    return saved ? JSON.parse(saved) : [];
  });
  
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
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveSubTab('users')}
          className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeSubTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {t.manageUsers}
        </button>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8">{t.manageUsers}</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">Logged in from this browser</p>
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
    </div>
  );
};

export default AdminConsole;
