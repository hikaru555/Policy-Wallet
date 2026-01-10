
import React, { useState, useEffect, useMemo } from 'react';
import { translations, Language } from '../translations';
import { User, UserRole } from '../types';
import { STORAGE_KEYS, storageManager } from '../services/storageManager';

interface AdminConsoleProps {
  currentUser: User;
  lang: Language;
}

const AdminConsole: React.FC<AdminConsoleProps> = ({ currentUser, lang }) => {
  const t = translations[lang];
  const [activeSubTab, setActiveSubTab] = useState<'users'>('users');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load users from the storage registry
  const [users, setUsers] = useState<User[]>(() => {
    return storageManager.load<User[]>(STORAGE_KEYS.USERS, []);
  });
  
  // Refresh user list if registry changes in storage
  useEffect(() => {
    const handleStorageChange = () => {
      setUsers(storageManager.load<User[]>(STORAGE_KEYS.USERS, []));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      pro: users.filter(u => u.role === 'Pro-Member').length,
      admin: users.filter(u => u.role === 'Admin').length,
    };
  }, [users]);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, role: newRole };
      }
      return u;
    });
    
    setUsers(updatedUsers);
    storageManager.save(STORAGE_KEYS.USERS, updatedUsers);
    
    setNotification({
      message: lang === 'en' ? `Role updated to ${newRole === 'Member' ? 'Normal User' : newRole === 'Pro-Member' ? 'Pro User' : newRole}` : `อัปเดตบทความเป็น ${newRole === 'Member' ? 'ผู้ใช้ทั่วไป' : newRole === 'Pro-Member' ? 'ผู้ใช้ระดับ Pro' : newRole} สำเร็จ`,
      type: 'success'
    });

    setTimeout(() => setNotification(null), 3000);
  };

  // STRICT ACCESS CONTROL: Only phattararak@gmail.com is allowed.
  if (currentUser.role !== 'Admin' || currentUser.email !== 'phattararak@gmail.com') {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-12 text-center max-w-2xl mx-auto mt-10">
        <span className="text-6xl mb-6 block">🚫</span>
        <h3 className="text-2xl font-black text-rose-800 mb-2">{t.adminOnly}</h3>
        <p className="text-rose-600 font-medium opacity-80">
          Unauthorized access detected. This console is restricted to the platform owner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${notification.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-rose-500/90 text-white border-rose-400'}`}>
            <span className="text-xl">{notification.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-black text-sm uppercase tracking-wider">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Admin Header Section */}
      <div className="bg-slate-900 rounded-[3rem] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -ml-32 -mb-32"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Command Center</h2>
              <p className="text-slate-400 font-medium text-sm md:text-base max-w-lg">
                Manage system access, oversee user permissions, and track global platform health.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Total Users</p>
                <p className="text-xl font-black tabular-nums">{stats.total}</p>
              </div>
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-1">Pro Status</p>
                <p className="text-xl font-black tabular-nums">{stats.pro}</p>
              </div>
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Admins</p>
                <p className="text-xl font-black tabular-nums">{stats.admin}</p>
              </div>
            </div>
          </div>
          <div className="flex p-1.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 self-start md:self-center">
            <button 
              onClick={() => setActiveSubTab('users')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all ${activeSubTab === 'users' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
            >
              {t.manageUsers}
            </button>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{t.manageUsers}</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{filteredUsers.length} Results Found</p>
          </div>
          <div className="relative">
             <input 
               type="text" 
               placeholder="Search by name or email..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-80 transition-all"
             />
             <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">User Profile</th>
                <th className="px-8 py-5">Email Address</th>
                <th className="px-8 py-5">Stats & Activity</th>
                <th className="px-8 py-5">Permissions</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <span className="text-5xl mb-4">👥</span>
                      <p className="text-xs font-black uppercase tracking-widest">No matching users found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} className="w-10 h-10 rounded-full border-2 border-slate-100 shadow-sm transition-transform group-hover:scale-110" alt="" />
                          {user.role === 'Admin' && <span className="absolute -top-1 -right-1 bg-indigo-600 text-[8px] p-0.5 rounded-full border border-white">⚙️</span>}
                          {user.role === 'Pro-Member' && <span className="absolute -top-1 -right-1 bg-amber-500 text-[8px] p-0.5 rounded-full border border-white">⭐</span>}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 leading-none">{user.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">ID: {user.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-medium text-slate-500">{user.email}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Login:</span>
                          <span className="text-[10px] font-bold text-slate-600">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessions:</span>
                          <span className="text-[10px] font-bold text-slate-600">{user.loginCount || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                          user.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                          user.role === 'Pro-Member' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {user.role === 'Admin' ? 'Admin' : user.role === 'Pro-Member' ? 'Pro User' : 'Normal User'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {user.email === currentUser.email ? (
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic px-3 py-1.5 border border-dashed border-slate-100 rounded-xl">Protected Session</span>
                        ) : (
                          <select 
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition-all hover:border-indigo-300"
                          >
                            <option value="Member">Normal User</option>
                            <option value="Pro-Member">Pro User</option>
                            <option value="Admin">Admin</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Registry is synced with local browser database</span>
           </div>
           <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-500/50"></span>
              <span className="w-2 h-2 rounded-full bg-indigo-500/20"></span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConsole;
