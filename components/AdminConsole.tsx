
import React, { useState } from 'react';
import { translations, Language } from '../translations';
import { User, UserRole } from '../types';

interface AdminConsoleProps {
  currentUser: User;
  lang: Language;
}

// Initial mock data for user management
const INITIAL_USERS: User[] = [
  { id: '1', email: 'phattararak@gmail.com', name: 'Phattararak', role: 'Admin', picture: 'https://ui-avatars.com/api/?name=Phattararak&background=4f46e5&color=fff' },
  { id: '2', email: 'client-a@test.com', name: 'Somsak R.', role: 'Pro-Member', picture: 'https://ui-avatars.com/api/?name=Somsak&background=f59e0b&color=fff' },
  { id: '3', email: 'client-b@test.com', name: 'Wipa W.', role: 'Member', picture: 'https://ui-avatars.com/api/?name=Wipa&background=cbd5e1&color=fff' },
  { id: '4', email: 'new-user@gmail.com', name: 'Anon Y.', role: 'Member', picture: 'https://ui-avatars.com/api/?name=Anon&background=cbd5e1&color=fff' },
];

const AdminConsole: React.FC<AdminConsoleProps> = ({ currentUser, lang }) => {
  const t = translations[lang];
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  if (currentUser.role !== 'Admin') {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-3xl p-10 text-center">
        <span className="text-5xl mb-4 block">🚫</span>
        <h3 className="text-2xl font-bold text-rose-800 mb-2">{t.adminOnly}</h3>
        <p className="text-rose-600">Unauthorized access detected.</p>
      </div>
    );
  }

  const togglePro = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId && u.role !== 'Admin') {
        return { ...u, role: u.role === 'Pro-Member' ? 'Member' : 'Pro-Member' };
      }
      return u;
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
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
    </div>
  );
};

export default AdminConsole;
