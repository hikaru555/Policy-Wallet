
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Policy, PaymentFrequency, calculatePolicyStatus } from '../types';
import { translations, Language } from '../translations';

interface PremiumTimelineProps {
  policies: Policy[];
  lang: Language;
}

const PremiumTimeline: React.FC<PremiumTimelineProps> = ({ policies, lang }) => {
  const t = translations[lang];
  const months = lang === 'th' 
    ? ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const activePolicies = policies.filter(p => calculatePolicyStatus(p.dueDate) !== 'Terminated');

  const getPaymentMonths = (policy: Policy): number[] => {
    const startMonth = new Date(policy.dueDate).getMonth();
    const payMonths: number[] = [];
    
    if (policy.frequency === PaymentFrequency.YEARLY) {
      payMonths.push(startMonth);
    } else if (policy.frequency === PaymentFrequency.QUARTERLY) {
      for (let i = 0; i < 4; i++) payMonths.push((startMonth + i * 3) % 12);
    } else if (policy.frequency === PaymentFrequency.MONTHLY) {
      for (let i = 0; i < 12; i++) payMonths.push(i);
    }
    return payMonths;
  };

  const chartData = useMemo(() => {
    const data = months.map((m, i) => ({
      name: m,
      amount: 0,
      monthIndex: i
    }));

    activePolicies.forEach(p => {
      const payMonths = getPaymentMonths(p);
      payMonths.forEach(mIdx => {
        data[mIdx].amount += p.premiumAmount;
      });
    });

    return data;
  }, [activePolicies, months]);

  const maxAmount = Math.max(...chartData.map(d => d.amount), 1);

  if (activePolicies.length === 0) return null;

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden relative mb-8 border border-white/5">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 relative z-10 gap-4">
        <div>
          <h4 className="text-xl font-black tracking-tight">{lang === 'en' ? 'Cash Flow Management Hub' : 'ศูนย์จัดการกระแสเงินสด'}</h4>
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            {lang === 'en' ? 'Projected Monthly Premium Burden' : 'ประมาณการภาระชำระเบี้ยรายเดือน'}
          </p>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.peakMonth}</p>
             <p className="text-lg font-black text-white tabular-nums">฿{maxAmount.toLocaleString()}</p>
           </div>
        </div>
      </div>

      <div className="h-[280px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#475569', fontSize: 9, fontWeight: 700 }} 
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 12 }}
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)'
              }}
              itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}
              labelStyle={{ color: '#6366f1', fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
              formatter={(value: number) => [`฿${value.toLocaleString()}`, lang === 'en' ? 'Premium Total' : 'ยอดชำระเบี้ยรวม']}
            />
            <Bar 
              dataKey="amount" 
              radius={[8, 8, 4, 4]}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.amount === maxAmount ? '#6366f1' : '#312e81'}
                  style={{ filter: entry.amount === maxAmount ? 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.4))' : 'none' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-10 border-t border-white/5 pt-6">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
               <span>{lang === 'en' ? 'Active Premiums' : 'เบี้ยที่มีผลคุ้มครอง'}</span>
            </div>
         </div>
         <p className="opacity-50">{lang === 'en' ? 'Data calculated annually' : 'ข้อมูลคำนวณแบบรายปี'}</p>
      </div>
    </div>
  );
};

export default PremiumTimeline;
