
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Policy, CoverageType, PaymentFrequency } from '../types';
import { translations, Language } from '../translations';

interface DashboardProps {
  policies: Policy[];
  onViewDetails: (policy: Policy) => void;
  lang: Language;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC<DashboardProps> = ({ policies, onViewDetails, lang }) => {
  const t = translations[lang];

  // Total sum of all sumAssured across all policies and coverages
  const totalSumAssured = policies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => cAcc + c.sumAssured, 0), 0);

  // Total daily room rate across all health coverages
  const totalRoomRate = policies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => cAcc + (c.roomRate || 0), 0), 0);

  // Total annual premium
  const annualPremium = policies.reduce((acc, p) => {
    let multiplier = 1;
    if (p.frequency === PaymentFrequency.MONTHLY) multiplier = 12;
    if (p.frequency === PaymentFrequency.QUARTERLY) multiplier = 4;
    return acc + (p.premiumAmount * multiplier);
  }, 0);

  // Group sum assured by coverage type
  const coverageDataMap = new Map<CoverageType, number>();
  policies.forEach(p => {
    p.coverages.forEach(c => {
      const current = coverageDataMap.get(c.type) || 0;
      coverageDataMap.set(c.type, current + c.sumAssured);
    });
  });

  const chartData = Array.from(coverageDataMap.entries()).map(([name, value]) => ({
    name,
    value
  })).filter(d => d.value > 0);

  const getFreqLabel = (f: PaymentFrequency) => {
    switch(f) {
      case PaymentFrequency.MONTHLY: return t.monthly;
      case PaymentFrequency.QUARTERLY: return t.quarterly;
      case PaymentFrequency.YEARLY: return t.yearly;
      default: return t.yearly;
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">{t.totalSumAssured}</p>
          <h3 className="text-3xl font-bold text-blue-600 mt-1">฿{totalSumAssured.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">{t.dailyRoomRate}</p>
          <h3 className="text-3xl font-bold text-emerald-600 mt-1">฿{totalRoomRate.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">{t.annualPremium}</p>
          <h3 className="text-3xl font-bold text-amber-500 mt-1">฿{annualPremium.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
          <h4 className="font-bold text-lg mb-2">{t.coverageDist}</h4>
          <div className="flex-1 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={90} 
                  paddingAngle={5} 
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`฿${value.toLocaleString()}`, t.sumAssured]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-50">
            {chartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-700 truncate">{entry.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {((entry.value / (totalSumAssured || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="font-bold text-lg mb-4">{t.upcomingRenewals}</h4>
          <div className="space-y-4">
            {policies.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic text-sm">No policies found</div>
            ) : (
              policies
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 4)
                .map(p => (
                  <div key={p.id} onClick={() => onViewDetails(p)} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer group transition-all border border-transparent hover:border-slate-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-[10px] text-blue-600 shadow-sm group-hover:scale-105 transition-transform">
                        {p.company.substring(0, 3).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{p.planName}</p>
                        <p className="text-xs text-slate-500">{t.due}: {new Date(p.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm">฿{p.premiumAmount.toLocaleString()}</p>
                      <div className="flex flex-col items-end space-y-1 mt-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold uppercase tracking-tight">
                          {getFreqLabel(p.frequency)}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'Active' ? 'bg-green-100 text-green-700' : 
                          p.status === 'Grace Period' ? 'bg-amber-100 text-amber-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {p.status === 'Active' ? t.active : 
                           p.status === 'Grace Period' ? t.gracePeriod : 
                           p.status === 'Lapsed' ? t.lapsed : p.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
