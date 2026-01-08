
import React from 'react';
import { Policy, UserProfile, CoverageType, calculatePolicyStatus } from '../types';
import { translations, Language } from '../translations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface GuestViewProps {
  policies: Policy[];
  profile: UserProfile;
  lang: Language;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const GuestView: React.FC<GuestViewProps> = ({ policies, profile, lang }) => {
  const t = translations[lang];

  const activePolicies = policies.filter(p => calculatePolicyStatus(p.dueDate) !== 'Terminated');

  const totalSumAssured = activePolicies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => {
      const includedTypes = [CoverageType.LIFE, CoverageType.PENSION, CoverageType.SAVINGS];
      return includedTypes.includes(c.type) ? cAcc + c.sumAssured : cAcc;
    }, 0), 0);

  const totalRoomRate = activePolicies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => cAcc + (c.roomRate || 0), 0), 0);

  const coverageDataMap = new Map<CoverageType, number>();
  activePolicies.forEach(p => {
    p.coverages.forEach(c => {
      const current = coverageDataMap.get(c.type) || 0;
      coverageDataMap.set(c.type, current + c.sumAssured);
    });
  });

  const chartData = Array.from(coverageDataMap.entries()).map(([name, value]) => ({
    name,
    value
  })).filter(d => d.value > 0);

  const handleCreateOwn = () => {
    window.location.href = window.location.origin;
  };

  const handleContactAgent = () => {
    window.open('https://line.me/ti/p/@patrickfwd', '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Luxury Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <span className="text-3xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">{t.publicViewTitle}</h1>
              <p className="text-slate-400 text-sm font-medium mt-1">
                {t.publicViewDesc} <span className="text-indigo-400 font-bold">{profile.name}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={handleCreateOwn}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold transition-all text-white backdrop-blur-md"
          >
            {t.viewPersonalWallet}
          </button>
        </header>

        {/* Hero Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#1E293B] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden">
             {/* Background glows */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

             <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2 block">{t.protectionSummary}</span>
                    <h2 className="text-5xl font-black text-white tracking-tighter">
                      ฿{totalSumAssured.toLocaleString()}
                    </h2>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">{t.totalSumAssuredNote}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                       <span className="text-[9px] font-bold uppercase text-slate-500 block mb-1">{t.dailyRoomRate}</span>
                       <span className="text-xl font-bold text-emerald-400">฿{totalRoomRate.toLocaleString()}</span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                       <span className="text-[9px] font-bold uppercase text-slate-500 block mb-1">{t.active}</span>
                       <span className="text-xl font-bold text-blue-400">{activePolicies.length} {t.policies}</span>
                    </div>
                  </div>
                </div>

                <div className="h-[280px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={chartData} 
                          cx="50%" cy="50%" 
                          innerRadius={65} outerRadius={95} 
                          paddingAngle={8} 
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E293B', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                       <span className="text-6xl mb-4">📊</span>
                       <p className="text-sm font-bold">No data available</p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>

        {/* Policy Breakdown */}
        <div className="space-y-6">
           <div className="flex items-center gap-3">
             <div className="h-px flex-1 bg-white/10"></div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">{t.policySummary}</h3>
             <div className="h-px flex-1 bg-white/10"></div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePolicies.map(p => (
                <div key={p.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-white text-sm">{p.planName}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{p.company}</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-black border border-blue-500/20 uppercase tracking-tighter">Active</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.coverages.map((c, idx) => (
                      <div key={idx} className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-bold text-slate-400">
                        {c.type}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Consultant CTA */}
        <footer className="pt-12 border-t border-white/5 flex flex-col items-center text-center space-y-8">
           <div className="space-y-2">
             <h4 className="text-xl font-bold text-white">{t.contactConsultant}</h4>
             <p className="text-slate-500 text-sm">Expert guidance for insurance and financial planning.</p>
           </div>
           
           <button 
             onClick={handleContactAgent}
             className="px-10 py-4 bg-[#00B900] hover:bg-[#00a300] text-white rounded-3xl font-black text-lg shadow-2xl shadow-green-500/20 transition-all flex items-center gap-4 active:scale-95 group"
           >
             <span className="text-3xl">🧔</span>
             <span>LINE: @patrickfwd</span>
           </button>

           <div className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
             {t.creatorCredit}
           </div>
        </footer>
      </div>
    </div>
  );
};

export default GuestView;
