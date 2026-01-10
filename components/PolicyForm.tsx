
import React, { useState, useEffect, useRef } from 'react';
import { CoverageType, Policy, PaymentFrequency, PolicyCoverage, calculatePolicyStatus } from '../types';
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
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  
  const [basicInfo, setBasicInfo] = useState({
    company: INSURANCE_COMPANIES[0],
    planName: '',
    policyNumber: '',
    premiumAmount: '',
    dueDate: '',
    frequency: PaymentFrequency.YEARLY,
  });

  const [coverages, setCoverages] = useState<any[]>([
    { type: CoverageType.LIFE, sumAssured: '' }
  ]);

  const formatWithCommas = (value: string | number) => {
    if (value === undefined || value === null || value === '' || value === 0 || value === '0') return '';
    const stringValue = value.toString().replace(/,/g, '');
    if (isNaN(Number(stringValue))) return stringValue;
    const parts = stringValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const parseCommas = (value: string) => {
    return value.replace(/,/g, '');
  };

  const handleFocus = (currentValue: string, setter: (val: string) => void) => {
    if (currentValue === '0' || currentValue === '') {
      setter('');
    }
  };

  useEffect(() => {
    if (initialPolicy) {
      setBasicInfo({
        company: initialPolicy.company,
        planName: initialPolicy.planName,
        policyNumber: initialPolicy.policyNumber || '',
        premiumAmount: formatWithCommas(initialPolicy.premiumAmount.toString()),
        dueDate: initialPolicy.dueDate,
        frequency: initialPolicy.frequency || PaymentFrequency.YEARLY,
      });
      setCoverages(initialPolicy.coverages.map(c => ({
        ...c,
        sumAssured: formatWithCommas(c.sumAssured),
        roomRate: c.roomRate ? formatWithCommas(c.roomRate) : ''
      })));
    }
  }, [initialPolicy]);

  const addCoverage = () => {
    setCoverages([...coverages, { type: CoverageType.HEALTH, sumAssured: '', roomRate: '' }]);
  };

  const removeCoverage = (index: number) => {
    if (coverages.length > 1) {
      setCoverages(coverages.filter((_, i) => i !== index));
    }
  };

  const updateCoverage = (index: number, field: string, value: string) => {
    const updated = [...coverages];
    if (field === 'sumAssured' || field === 'roomRate') {
      const rawValue = parseCommas(value);
      if (rawValue === '' || !isNaN(Number(rawValue))) {
        updated[index] = { ...updated[index], [field]: formatWithCommas(rawValue) };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setCoverages(updated);
  };

  const handlePremiumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseCommas(e.target.value);
    if (rawValue === '' || !isNaN(Number(rawValue))) {
      setBasicInfo({ ...basicInfo, premiumAmount: formatWithCommas(rawValue) });
    }
  };

  const handleAiScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Save the manually selected company to ensure it isn't overwritten by AI guess
    const selectedCompany = basicInfo.company;
    
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const extractedData = await parsePolicyDocument(base64, file.type);
      if (extractedData) {
        setBasicInfo({
          company: selectedCompany, // STRICT: Keep user's chosen provider
          planName: extractedData.planName || '',
          policyNumber: extractedData.policyNumber || '',
          premiumAmount: formatWithCommas(extractedData.premiumAmount?.toString() || ''),
          dueDate: extractedData.dueDate || '',
          frequency: (extractedData.frequency as PaymentFrequency) || PaymentFrequency.YEARLY,
        });
        if (extractedData.coverages && extractedData.coverages.length > 0) {
          setCoverages(extractedData.coverages.map((c: any) => ({
            ...c,
            sumAssured: formatWithCommas(c.sumAssured),
            roomRate: c.roomRate ? formatWithCommas(c.roomRate) : ''
          })));
        }
      } else {
        alert(lang === 'en' ? "Failed to scan policy. Please try again or enter manually." : "การสแกนล้มเหลว โปรดลองอีกครั้งหรือกรอกข้อมูลด้วยตนเอง");
      }
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const triggerScanWorkflow = () => {
    setShowCompanyPicker(true);
  };

  const proceedToUpload = () => {
    setShowCompanyPicker(false);
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const premiumRaw = parseCommas(basicInfo.premiumAmount);
    if (!basicInfo.planName.trim() || !basicInfo.dueDate || !premiumRaw) {
      alert(lang === 'en' ? "Plan Name, Premium, and Due Date are required fields." : "กรุณากรอกชื่อแผน, เบี้ยประกัน และวันครบกำหนด ให้ครบถ้วน");
      return;
    }
    const premium = Number(premiumRaw);
    if (isNaN(premium) || premium < 0) {
      alert(lang === 'en' ? "Invalid premium amount." : "จำนวนเบี้ยประกันไม่ถูกต้อง");
      return;
    }
    const policy: Policy = {
      id: initialPolicy?.id || Math.random().toString(36).substr(2, 9),
      company: basicInfo.company,
      planName: basicInfo.planName,
      policyNumber: basicInfo.policyNumber,
      premiumAmount: premium,
      dueDate: basicInfo.dueDate,
      frequency: basicInfo.frequency,
      coverages: coverages.map(c => ({
        type: c.type,
        sumAssured: Number(parseCommas(c.sumAssured)) || 0,
        roomRate: c.roomRate ? Number(parseCommas(c.roomRate)) : undefined
      })),
      status: calculatePolicyStatus(basicInfo.dueDate),
    };
    onSubmit(policy);
  };

  const inputClasses = "w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 animate-in slide-in-from-top-2 relative overflow-hidden">
      
      {/* Step 1: Company Selector Modal Overlay */}
      {showCompanyPicker && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl mb-6 shadow-inner">🏢</div>
          <h4 className="text-xl font-black text-slate-800 mb-2 leading-tight">{t.step1Provider}</h4>
          <p className="text-sm text-slate-500 mb-8 max-w-xs font-medium">{t.step1ProviderDesc}</p>
          
          <div className="w-full max-w-sm space-y-6">
            <select 
              className={`${inputClasses} py-4 px-6 text-base font-bold shadow-xl border-slate-200`} 
              value={basicInfo.company} 
              onChange={(e) => setBasicInfo({ ...basicInfo, company: e.target.value })}
            >
              {INSURANCE_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={proceedToUpload}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all active:scale-95"
              >
                {t.startScan}
              </button>
              <button 
                type="button"
                onClick={() => setShowCompanyPicker(false)}
                className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="font-bold text-blue-600 animate-pulse">{t.scanningPolicy}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h4 className="font-bold text-lg">{initialPolicy ? t.edit : `+ ${t.addPolicy}`}</h4>
        {!initialPolicy && (
          <button 
            type="button" 
            onClick={triggerScanWorkflow} 
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all font-bold text-xs"
          >
            <span className="text-lg">✨</span>
            <span>AI Auto-fill from Scan</span>
          </button>
        )}
        <input type="file" ref={fileInputRef} onChange={handleAiScan} className="hidden" accept="image/*,application/pdf" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.company}</label>
            <select className={inputClasses} value={basicInfo.company} onChange={(e) => setBasicInfo({ ...basicInfo, company: e.target.value })}>
              {INSURANCE_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.planName} *</label>
            <input type="text" placeholder="Gold Plan, Plus, etc." className={inputClasses} value={basicInfo.planName} onChange={(e) => setBasicInfo({ ...basicInfo, planName: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.policyNumber}</label>
            <input type="text" placeholder="XXXXXXXXX" className={inputClasses} value={basicInfo.policyNumber} onChange={(e) => setBasicInfo({ ...basicInfo, policyNumber: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.premium} *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">฿</span>
              <input 
                type="text" 
                inputMode="decimal" 
                className={`${inputClasses} pl-8`} 
                value={basicInfo.premiumAmount} 
                onChange={handlePremiumChange} 
                onFocus={() => handleFocus(basicInfo.premiumAmount, (v) => setBasicInfo({...basicInfo, premiumAmount: v}))}
                required 
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.frequency}</label>
            <select className={inputClasses} value={basicInfo.frequency} onChange={(e) => setBasicInfo({ ...basicInfo, frequency: e.target.value as PaymentFrequency })}>
              <option value={PaymentFrequency.MONTHLY}>{t.monthly}</option>
              <option value={PaymentFrequency.QUARTERLY}>{t.quarterly}</option>
              <option value={PaymentFrequency.YEARLY}>{t.yearly}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.dueDateLabel} *</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <input type="date" className={`${inputClasses} pl-10 appearance-none`} value={basicInfo.dueDate} onChange={(e) => setBasicInfo({ ...basicInfo, dueDate: e.target.value })} required />
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-100" />
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t.details}</label>
            <button type="button" onClick={addCoverage} className="text-xs font-bold text-blue-600 hover:text-blue-800">+ Add Coverage Item</button>
          </div>
          <div className="space-y-3">
            {coverages.map((c, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.coverageType}</label>
                    <select className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" value={c.type} onChange={(e) => updateCoverage(idx, 'type', e.target.value as CoverageType)}>
                      {Object.values(CoverageType).map(v => (
                        <option key={v} value={v}>
                          {(t.coverageTypeLabels as any)[v] || v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.sumAssured}</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">฿</span>
                      <input 
                        type="text" 
                        inputMode="decimal" 
                        className="w-full p-2 pl-5 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={c.sumAssured} 
                        onChange={(e) => updateCoverage(idx, 'sumAssured', e.target.value)} 
                        onFocus={() => { if (c.sumAssured === '0' || c.sumAssured === '') updateCoverage(idx, 'sumAssured', ''); }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {(c.type === CoverageType.HEALTH || (c.type as any) === 'Health Insurance') && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.dailyRoomRate}</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">฿</span>
                        <input 
                          type="text" 
                          inputMode="decimal" 
                          className="w-full p-2 pl-5 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                          value={c.roomRate || ''} 
                          onChange={(e) => updateCoverage(idx, 'roomRate', e.target.value)} 
                          onFocus={() => { if (c.roomRate === '0' || c.roomRate === '') updateCoverage(idx, 'roomRate', ''); }}
                          placeholder="0" 
                        />
                      </div>
                    </div>
                  )}
                </div>
                {coverages.length > 1 && <button type="button" onClick={() => removeCoverage(idx)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">✕</button>}
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
