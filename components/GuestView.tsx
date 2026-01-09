
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
    <div className="min-h-screen bg-[#0F172A] text-slate-200 p-6 md:p-12 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Luxury Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 border border-white/10">
              <span className="text-3xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">{t.publicViewTitle}</h1>
              <p className="text-slate-400 text-[15px] font-medium mt-1">
                {t.publicViewDesc} <span className="text-indigo-400 font-extrabold">{profile.name}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={handleCreateOwn}
            className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all text-white backdrop-blur-md active:scale-95"
          >
            {t.viewPersonalWallet}
          </button>
        </header>

        {/* Hero Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#1E293B] border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl overflow-hidden">
             {/* Background glows */}
             <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none"></div>

             <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-10">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-[0.35em] text-indigo-400 mb-3 block">{t.protectionSummary}</span>
                    <h2 className="text-6xl font-black text-white tracking-tighter tabular-nums">
                      ฿{totalSumAssured.toLocaleString()}
                    </h2>
                    <p className="text-slate-400 text-sm mt-4 leading-relaxed font-medium">{t.totalSumAssuredNote}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 p-5 rounded-3xl border border-white/5 transition-colors hover:bg-white/10">
                       <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">{t.dailyRoomRate}</span>
                       <span className="text-2xl font-black text-emerald-400 tabular-nums">฿{totalRoomRate.toLocaleString()}</span>
                    </div>
                    <div className="bg-white/5 p-5 rounded-3xl border border-white/5 transition-colors hover:bg-white/10">
                       <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">{t.active}</span>
                       <span className="text-2xl font-black text-blue-400 tabular-nums">{activePolicies.length} {t.policies}</span>
                    </div>
                  </div>
                </div>

                <div className="h-[300px] w-full relative">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={chartData} 
                          cx="50%" cy="50%" 
                          innerRadius={75} outerRadius={105} 
                          paddingAngle={8} 
                          dataKey="value"
                          stroke="none"
                          animationBegin={200}
                          animationDuration={1000}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E293B', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-white/10 rounded-[2rem]">
                       <span className="text-6xl mb-4">📊</span>
                       <p className="text-sm font-black uppercase tracking-widest">No data available</p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>

        {/* Policy Breakdown */}
        <div className="space-y-8">
           <div className="flex items-center gap-4 px-4">
             <div className="h-px flex-1 bg-white/10"></div>
             <h3 className="text-[11px] font-black uppercase tracking-[0.45em] text-slate-500">{t.policySummary}</h3>
             <div className="h-px flex-1 bg-white/10"></div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activePolicies.map(p => (
                <div key={p.id} className="bg-white/5 border border-white/5 rounded-[2rem] p-6 hover:bg-white/10 transition-all group hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h4 className="font-black text-white text-[17px] group-hover:text-indigo-400 transition-colors leading-tight mb-1">{p.planName}</h4>
                      <p className="text-[11px] text-slate-500 uppercase font-black tracking-widest">{p.company}</p>
                    </div>
                    <span className="text-[10px] px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-black border border-indigo-500/20 uppercase tracking-tighter">Active</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {p.coverages.map((c, idx) => (
                      <div key={idx} className="px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 text-[11px] font-bold text-slate-400">
                        {c.type}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Consultant CTA */}
        <footer className="pt-16 border-t border-white/5 flex flex-col items-center text-center space-y-10 pb-12">
           <div className="space-y-3">
             <h4 className="text-2xl font-black text-white tracking-tight">{t.contactConsultant}</h4>
             <p className="text-slate-400 text-base font-medium leading-relaxed max-w-md">Professional guidance for insurance portfolio management and strategic financial planning.</p>
           </div>
           
           <button 
             onClick={handleContactAgent}
             className="px-12 py-5 bg-[#00B900] hover:bg-[#00a300] text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-green-500/20 transition-all flex items-center gap-5 active:scale-95 group"
           >
             <span className="text-4xl bg-white/20 p-2.5 rounded-full group-hover:rotate-12 transition-transform">🧔</span>
             <div className="text-left">
                <span className="block text-[11px] uppercase tracking-widest font-black text-white/70">Connect on LINE</span>
                <span className="block leading-tight">@patrickfwd</span>
             </div>
           </button>

           <div className="text-[11px] text-slate-600 font-black uppercase tracking-[0.3em] bg-white/5 px-6 py-2 rounded-full">
             {t.creatorCredit}
           </div>
        </footer>
      </div>
    </div>
  );
};

export default GuestView;
