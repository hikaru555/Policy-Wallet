
import React, { useState, useEffect } from 'react';
import { CoverageType, Policy, PaymentFrequency, PolicyCoverage } from '../types';
import { INSURANCE_COMPANIES } from '../constants';
import { translations, Language } from '../translations';

interface PolicyFormProps {
  initialPolicy?: Policy;
  onSubmit: (policy: Policy) => void;
  onCancel: () => void;
  lang: Language;
}

const PolicyForm: React.FC<PolicyFormProps> = ({ initialPolicy, onSubmit, onCancel, lang }) => {
  const t = translations[lang];
  
  const [basicInfo, setBasicInfo] = useState({
    company: INSURANCE_COMPANIES[0],
    planName: '',
    premiumAmount: '',
    dueDate: '',
    frequency: PaymentFrequency.YEARLY,
  });

  const [coverages, setCoverages] = useState<PolicyCoverage[]>([
    { type: CoverageType.LIFE, sumAssured: 0 }
  ]);

  useEffect(() => {
    if (initialPolicy) {
      setBasicInfo({
        company: initialPolicy.company,
        planName: initialPolicy.planName,
        premiumAmount: initialPolicy.premiumAmount.toString(),
        dueDate: initialPolicy.dueDate,
        frequency: initialPolicy.frequency || PaymentFrequency.YEARLY,
      });
      setCoverages(initialPolicy.coverages);
    }
  }, [initialPolicy]);

  const addCoverage = () => {
    setCoverages([...coverages, { type: CoverageType.HEALTH, sumAssured: 0 }]);
  };

  const removeCoverage = (index: number) => {
    if (coverages.length > 1) {
      setCoverages(coverages.filter((_, i) => i !== index));
    }
  };

  const updateCoverage = (index: number, field: keyof PolicyCoverage, value: any) => {
    const updated = [...coverages];
    updated[index] = { ...updated[index], [field]: value };
    setCoverages(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const policy: Policy = {
      id: initialPolicy?.id || Math.random().toString(36).substr(2, 9),
      company: basicInfo.company,
      planName: basicInfo.planName,
      premiumAmount: Number(basicInfo.premiumAmount),
      dueDate: basicInfo.dueDate,
      frequency: basicInfo.frequency,
      coverages: coverages.map(c => ({
        ...c,
        sumAssured: Number(c.sumAssured),
        roomRate: c.roomRate ? Number(c.roomRate) : undefined
      })),
      status: initialPolicy?.status || 'Active',
    };
    onSubmit(policy);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 animate-in slide-in-from-top-2">
      <h4 className="font-bold text-lg mb-4">{initialPolicy ? t.edit : `+ ${t.addPolicy}`}</h4>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Company</label>
            <select 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
              value={basicInfo.company} 
              onChange={(e) => setBasicInfo({ ...basicInfo, company: e.target.value })}
            >
              {INSURANCE_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Plan Name</label>
            <input 
              type="text" 
              placeholder="Gold Plan, Plus, etc."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
              value={basicInfo.planName} 
              onChange={(e) => setBasicInfo({ ...basicInfo, planName: e.target.value })} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Premium</label>
            <input 
              type="number" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
              value={basicInfo.premiumAmount} 
              onChange={(e) => setBasicInfo({ ...basicInfo, premiumAmount: e.target.value })} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.frequency}</label>
            <select 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
              value={basicInfo.frequency} 
              onChange={(e) => setBasicInfo({ ...basicInfo, frequency: e.target.value as PaymentFrequency })}
            >
              <option value={PaymentFrequency.MONTHLY}>{t.monthly}</option>
              <option value={PaymentFrequency.QUARTERLY}>{t.quarterly}</option>
              <option value={PaymentFrequency.YEARLY}>{t.yearly}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
            <input 
              type="date" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
              value={basicInfo.dueDate} 
              onChange={(e) => setBasicInfo({ ...basicInfo, dueDate: e.target.value })} 
            />
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Coverages Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t.details}</label>
            <button 
              type="button" 
              onClick={addCoverage}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              + Add Coverage Item
            </button>
          </div>
          
          <div className="space-y-3">
            {coverages.map((c, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.coverageType}</label>
                    <select 
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs" 
                      value={c.type} 
                      onChange={(e) => updateCoverage(idx, 'type', e.target.value as CoverageType)}
                    >
                      {Object.values(CoverageType).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.sumAssured}</label>
                    <input 
                      type="number" 
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs" 
                      value={c.sumAssured} 
                      onChange={(e) => updateCoverage(idx, 'sumAssured', e.target.value)} 
                    />
                  </div>
                  {c.type === CoverageType.HEALTH && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.dailyRoomRate}</label>
                      <input 
                        type="number" 
                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs" 
                        value={c.roomRate || ''} 
                        onChange={(e) => updateCoverage(idx, 'roomRate', e.target.value)} 
                        placeholder="Optional"
                      />
                    </div>
                  )}
                </div>
                {coverages.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeCoverage(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 text-sm font-bold text-slate-500">{t.cancel}</button>
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">{t.save}</button>
        </div>
      </form>
    </div>
  );
};

export default PolicyForm;
