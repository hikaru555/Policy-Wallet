
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Policy, CoverageType, PaymentFrequency, calculatePolicyStatus } from '../types';
import { translations, Language } from '../translations';

interface DashboardProps {
  policies: Policy[];
  onViewDetails: (policy: Policy) => void;
  lang: Language;
}

const getCoverageColor = (type: string): string => {
  switch (type) {
    case CoverageType.LIFE:
    case CoverageType.SAVINGS:
    case CoverageType.PENSION:
      return '#2563eb';
    case CoverageType.HOSPITAL_BENEFIT:
      return '#ec4899';
    case CoverageType.HEALTH:
      return '#059669';
    case CoverageType.ACCIDENT:
      return '#f59e0b';
    case CoverageType.CRITICAL:
      return '#f43f5e';
    default:
      return '#64748b';
  }
};

const Dashboard: React.FC<DashboardProps> = ({ policies, onViewDetails, lang }) => {
  const t = translations[lang];

  const activeAndGracePolicies = useMemo(() => 
    policies.filter(p => calculatePolicyStatus(p.dueDate) !== 'Terminated'),
  [policies]);

  const totalSumAssured = activeAndGracePolicies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => {
      const includedTypes = [CoverageType.LIFE, CoverageType.PENSION, CoverageType.SAVINGS];
      return includedTypes.includes(c.type) ? cAcc + c.sumAssured : cAcc;
    }, 0), 0);

  const totalHospitalBenefit = activeAndGracePolicies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => 
      c.type === CoverageType.HOSPITAL_BENEFIT ? cAcc + c.sumAssured : cAcc, 0), 0);

  const totalRoomRate = activeAndGracePolicies.reduce((acc, p) => 
    acc + p.coverages.reduce((cAcc, c) => cAcc + (c.roomRate || 0), 0), 0);

  const annualPremium = activeAndGracePolicies.reduce((acc, p) => {
    let multiplier = 1;
    if (p.frequency === PaymentFrequency.MONTHLY) multiplier = 12;
    if (p.frequency === PaymentFrequency.QUARTERLY) multiplier = 4;
    return acc + (p.premiumAmount * multiplier);
  }, 0);

  const coverageDataMap = new Map<CoverageType, number>();
  activeAndGracePolicies.forEach(p => {
    p.coverages.forEach(c => {
      const current = coverageDataMap.get(c.type) || 0;
      coverageDataMap.set(c.type, current + c.sumAssured);
    });
  });

  const chartData = Array.from(coverageDataMap.entries()).map(([name, value]) => ({
    name: name,
    value,
    color: getCoverageColor(name)
  })).filter(d => d.value > 0);

  const getFreqLabel = (f: PaymentFrequency) => {
    switch(f) {
      case PaymentFrequency.MONTHLY: return t.monthly;
      case PaymentFrequency.QUARTERLY: return t.quarterly;
      case PaymentFrequency.YEARLY: return t.yearly;
      default: return t.yearly;
    }
  }

  const handleSyncCalendar = () => {
    if (activeAndGracePolicies.length === 0) return;
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Policy Wallet//NONSGML v1.0//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
    activeAndGracePolicies.forEach(p => {
      const date = new Date(p.dueDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:${p.id}@policywallet.app\n`;
      icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
      icsContent += `SUMMARY:Insurance Renewal: ${p.planName}\n`;
      icsContent += `DESCRIPTION:Insurance renewal for ${p.planName} (${p.company}). Premium amount: ฿${p.premiumAmount.toLocaleString()}. Manage your policies at Policy Wallet.\n`;
      icsContent += "STATUS:CONFIRMED\n";
      icsContent += "TRANSP:TRANSPARENT\n";
      icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Insurance-Renewals.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(t.calendarSuccess);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{t.totalSumAssured}</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">฿{totalSumAssured.toLocaleString()}</h3>
          </div>
          <p className="text-[9px] text-slate-400 mt-2 italic">{t.totalSumAssuredNote}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{t.hospitalBenefit}</p>
          <h3 className="text-2xl font-black text-pink-500 mt-1">฿{totalHospitalBenefit.toLocaleString()} <span className="text-xs font-medium text-slate-400">{t.perDay}</span></h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{t.dailyRoomRate}</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">฿{totalRoomRate.toLocaleString()} <span className="text-xs font-medium text-slate-400">{t.perDay}</span></h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{t.annualPremium}</p>
          <h3 className="text-2xl font-black text-amber-500 mt-1">฿{annualPremium.toLocaleString()}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-lg">{t.coverageDist}</h4>
            <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded-full font-bold uppercase tracking-widest">{t.activeOnly}</span>
          </div>
          
          {chartData.length > 0 ? (
            <>
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
                      style={{ backgroundColor: entry.color }} 
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
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-40">
              <span className="text-6xl">🥧</span>
              <p className="text-sm font-medium">{t.addActivePolicies}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-lg">{t.upcomingRenewals}</h4>
            <button 
              onClick={handleSyncCalendar}
              disabled={activeAndGracePolicies.length === 0}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📅 {t.syncCalendar}
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {policies.length === 0 ? (
              <div className="text-center py-24 text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-2xl">
                {t.noRenewalsTrack}
              </div>
            ) : (
              policies
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 4)
                .map(p => {
                  const currentStatus = calculatePolicyStatus(p.dueDate);
                  return (
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
                            currentStatus === 'Active' ? 'bg-green-100 text-green-700' : 
                            currentStatus === 'Grace Period' ? 'bg-amber-100 text-amber-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {currentStatus === 'Active' ? t.active : 
                             currentStatus === 'Grace Period' ? t.gracePeriod : 
                             currentStatus === 'Terminated' ? t.terminated : currentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
          {activeAndGracePolicies.length > 0 && (
            <p className="text-[9px] text-slate-400 mt-4 text-center italic">
              {t.calendarDesc}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
