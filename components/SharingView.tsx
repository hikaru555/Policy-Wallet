
import React, { useState } from 'react';
import { translations, Language } from '../translations';
import { User, UserProfile } from '../types';

interface SharingViewProps {
  user: User;
  profile: UserProfile | null;
  onUpdateProfile: (p: UserProfile) => void;
  lang: Language;
  isPro: boolean;
}

const SharingView: React.FC<SharingViewProps> = ({ user, profile, onUpdateProfile, lang, isPro }) => {
  const t = translations[lang];
  const [newContact, setNewContact] = useState('');
  const [showToast, setShowToast] = useState(false);

  if (!profile) return null;

  // Simulation of public link based on user ID
  const publicLink = `${window.location.origin}/share/${user.id}`;

  const togglePublic = () => {
    onUpdateProfile({ ...profile, isPublicProfile: !profile.isPublicProfile });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicLink);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContact && !profile.sharedWithEmails?.includes(newContact)) {
      onUpdateProfile({
        ...profile,
        sharedWithEmails: [...(profile.sharedWithEmails || []), newContact]
      });
      setNewContact('');
    }
  };

  const removeContact = (email: string) => {
    onUpdateProfile({
      ...profile,
      sharedWithEmails: profile.sharedWithEmails?.filter(e => e !== email)
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Visual Header */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-40 -mt-40"></div>
         <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl -ml-40 -mb-40"></div>
         
         <div className="relative z-10">
           <div className="flex items-center gap-5 mb-8">
             <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/20">🔗</div>
             <div>
               <h3 className="text-3xl font-black tracking-tight">{t.sharing}</h3>
               <p className="text-indigo-100 text-[15px] font-medium mt-1 max-w-lg leading-relaxed">{t.shareDesc}</p>
             </div>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Public Sharing Control */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
           <div className="flex items-center justify-between mb-10 border-b border-slate-50 pb-6">
             <div>
                <h4 className="text-xl font-black text-slate-800 tracking-tight">{t.publicProfile}</h4>
                <p className="text-sm text-slate-400 font-medium mt-1">Make your portfolio summary accessible via link</p>
             </div>
             <button 
               onClick={togglePublic}
               className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none ring-offset-2 focus:ring-2 focus:ring-indigo-500 ${profile.isPublicProfile ? 'bg-indigo-600' : 'bg-slate-200'}`}
             >
               <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${profile.isPublicProfile ? 'translate-x-8' : 'translate-x-1'}`} />
             </button>
           </div>

           {profile.isPublicProfile ? (
             <div className="space-y-8 animate-in zoom-in-95 duration-300">
               <div className="p-6 bg-slate-50 rounded-[1.75rem] border border-slate-200 break-all relative group">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 px-1">Portfolio Access URL</p>
                 <p className="text-[15px] font-bold text-indigo-600 leading-relaxed underline decoration-indigo-200 underline-offset-4">{publicLink}</p>
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                    onClick={copyToClipboard}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                   <span className="text-lg">📋</span> {t.copyLink}
                 </button>
                 <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
                   <span className="text-lg">📱</span> {t.qrCode}
                 </button>
               </div>
               
               {showToast && (
                 <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 inline-block px-4 py-1.5 rounded-full border border-emerald-100">{t.linkCopied}</p>
                 </div>
               )}
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner">🔏</div>
                <p className="text-base font-bold text-slate-500 leading-relaxed max-w-[280px]">Public profile is currently disabled. Only you can view your detailed dashboard.</p>
             </div>
           )}
        </div>

        {/* Trusted Contacts */}
        <div className={`bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative ${!isPro ? 'overflow-hidden' : ''} min-h-[400px]`}>
           {!isPro && (
             <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[3px] flex items-center justify-center p-10 text-center">
                <div className="max-w-xs animate-in slide-in-from-bottom-4">
                  <span className="text-5xl mb-6 block">🔒</span>
                  <h5 className="text-xl font-black text-slate-800 mb-2 leading-tight">{t.proFeature}</h5>
                  <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">Upgrade to Pro to share specific document access with trusted emails (Family, Beneficiaries or Agents).</p>
                  <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black tracking-widest uppercase text-xs shadow-xl shadow-indigo-100 active:scale-95 transition-all">Upgrade Now</button>
                </div>
             </div>
           )}

           <h4 className="text-xl font-black text-slate-800 tracking-tight mb-8 border-b border-slate-50 pb-6">{t.trustedContacts}</h4>
           
           <form onSubmit={addContact} className="flex gap-3 mb-10">
             <input 
               type="email" 
               placeholder="contact@email.com"
               className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[15px] focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
               value={newContact}
               onChange={(e) => setNewContact(e.target.value)}
             />
             <button type="submit" className="px-8 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all">Add</button>
           </form>

           <div className="space-y-4">
             {profile.sharedWithEmails?.length ? profile.sharedWithEmails.map(email => (
               <div key={email} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white rounded-[1.5rem] border border-slate-100 hover:shadow-md transition-all group">
                 <div className="flex items-center gap-4">
                   <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-100 transition-transform group-hover:scale-110">👤</div>
                   <span className="text-[15px] font-bold text-slate-700">{email}</span>
                 </div>
                 <button onClick={() => removeContact(email)} className="text-slate-300 hover:text-rose-500 p-2 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               </div>
             )) : (
               <div className="text-center py-16 opacity-30">
                 <p className="text-xs font-black uppercase tracking-[0.3em]">No trusted contacts yet</p>
               </div>
             )}
           </div>
        </div>
      </div>

      <div className="p-10 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex items-start gap-6">
         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-sm border border-blue-50">🛡️</div>
         <div>
           <h5 className="text-base font-black text-blue-900 uppercase tracking-tight mb-1.5">Security & Privacy Guarantee</h5>
           <p className="text-blue-800 text-[14px] font-medium leading-relaxed opacity-80">
             When sharing, you only provide a summary of your insurance coverages. Personal identifiable documents in your Doc Vault remain private unless you explicitly grant access to a Trusted Contact. All data shared through public links is read-only and cannot be modified.
           </p>
         </div>
      </div>
    </div>
  );
};

export default SharingView;
