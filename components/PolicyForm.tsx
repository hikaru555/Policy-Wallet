
import React, { useState, useEffect, useRef } from 'react';
import { CoverageType, Policy, PaymentFrequency, PolicyCoverage } from '../types';
import { INSURANCE_COMPANIES } from '../constants';
import { translations, Language } from '../translations';
import { parsePolicyDocument } from '../services/geminiService';

interface PolicyFormProps {
  initialPolicy?: Policy;
  onSubmit: (policy: Policy) => void;
  onCancel: () => void;
  lang: Language;
}

const PolicyForm: React.FC<PolicyFormProps> = ({ initialPolicy, onSubmit, onCancel, lang }) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  
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
    let validatedValue = value;
    if ((field === 'sumAssured' || field === 'roomRate') && value !== '') {
      validatedValue = Math.max(0, Number(value));
    }
    updated[index] = { ...updated[index], [field]: validatedValue };
    setCoverages(updated);
  };

  const handlePremiumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || Number(value) >= 0) {
      setBasicInfo({ ...basicInfo, premiumAmount: value });
    }
  };

  const handleAiScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const extractedData = await parsePolicyDocument(base64, file.type);
      
      if (extractedData) {
        setBasicInfo({
          company: extractedData.company || INSURANCE_COMPANIES[0],
          planName: extractedData.planName || '',
          premiumAmount: extractedData.premiumAmount?.toString() || '',
          dueDate: extractedData.dueDate || '',
          frequency: (extractedData.frequency as PaymentFrequency) || PaymentFrequency.YEARLY,
        });
        if (extractedData.coverages && extractedData.coverages.length > 0) {
          setCoverages(extractedData.coverages as PolicyCoverage[]);
        }
      } else {
        alert(lang === 'en' ? "Failed to scan policy. Please try again or enter manually." : "การสแกนล้มเหลว โปรดลองอีกครั้งหรือกรอกข้อมูลด้วยตนเอง");
      }
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(basicInfo.premiumAmount) < 0) return;

    const policy: Policy = {
      id: initialPolicy?.id || Math.random().toString(36).substr(2, 9),
      company: basicInfo.company,
      planName: basicInfo.planName,
      premiumAmount: Math.max(0, Number(basicInfo.premiumAmount)),
      dueDate: basicInfo.dueDate,
      frequency: basicInfo.frequency,
      coverages: coverages.map(c => ({
        ...c,
        sumAssured: Math.max(0, Number(c.sumAssured)),
        roomRate: c.roomRate ? Math.max(0, Number(c.roomRate)) : undefined
      })),
      status: initialPolicy?.status || 'Active',
    };
    onSubmit(policy);
  };

  const inputClasses = "w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 animate-in slide-in-from-top-2 relative overflow-hidden">
      {isScanning && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-bold text-blue-600 animate-pulse">{lang === 'en' ? 'AI Scanning your policy...' : 'AI กำลังวิเคราะห์กรมธรรม์ของคุณ...'}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h4 className="font-bold text-lg">{initialPolicy ? t.edit : `+ ${t.addPolicy}`}</h4>
        {!initialPolicy && (
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all font-bold text-xs"
          >
            <span>✨ AI Auto-fill from Scan</span>
          </button>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleAiScan} 
          className="hidden" 
          accept="image/*,application/pdf"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Company</label>
            <select 
              className={inputClasses} 
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
              className={inputClasses} 
              value={basicInfo.planName} 
              onChange={(e) => setBasicInfo({ ...basicInfo, planName: e.target.value })} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Premium</label>
            <input 
              type="number" 
              min="0"
              step="any"
              className={inputClasses} 
              value={basicInfo.premiumAmount} 
              onChange={handlePremiumChange} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.frequency}</label>
            <select 
              className={inputClasses} 
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
              className={inputClasses} 
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
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
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
                      min="0"
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={c.sumAssured} 
                      onChange={(e) => updateCoverage(idx, 'sumAssured', e.target.value)} 
                    />
                  </div>
                  {(c.type === CoverageType.HEALTH || (c.type as any) === 'Health Insurance') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.dailyRoomRate}</label>
                      <input 
                        type="number" 
                        min="0"
                        className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
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
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
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
