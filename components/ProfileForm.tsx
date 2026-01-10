
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Policy, TaxDeductions } from '../types';
import { translations, Language } from '../translations';
import { storageManager } from '../services/storageManager';

interface ProfileFormProps {
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  lang: Language;
  policies: Policy[];
  onImport: (data: { profile: UserProfile, policies: Policy[] }) => void;
  isPro: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ initialProfile, onSave, lang, policies, onImport, isPro }) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const initialDeductions: TaxDeductions = initialProfile.taxDeductions || {
    socialSecurity: 0,
    homeLoanInterest: 0,
    ssf: 0,
    rmf: 0,
    pvd: 0,
    thaiEsg: 0,
    fatherCare: false,
    motherCare: false,
    parentHealthInsurance: 0,
    childAllowance: 0,
    spouseDeduction: false,
    disabledCareCount: 0,
    prenatalExpenses: 0,
    donations: 0,
    donationsEducation: 0,
    otherDeductions: 0,
    taxWithheld: 0
  };

  const [formData, setFormData] = useState<UserProfile>(initialProfile);
  const [incomeStr, setIncomeStr] = useState(formatWithCommas(initialProfile.annualIncome));
  const [expenseStr, setExpenseStr] = useState(formatWithCommas(initialProfile.monthlyExpenses));
  const [debtStr, setDebtStr] = useState(formatWithCommas(initialProfile.totalDebt));
  
  const [ssStr, setSsStr] = useState(formatWithCommas(initialDeductions.socialSecurity));
  const [homeLoanStr, setHomeLoanStr] = useState(formatWithCommas(initialDeductions.homeLoanInterest));
  const [ssfStr, setSsfStr] = useState(formatWithCommas(initialDeductions.ssf));
  const [rmfStr, setRmfStr] = useState(formatWithCommas(initialDeductions.rmf));
  const [pvdStr, setPvdStr] = useState(formatWithCommas(initialDeductions.pvd));
  const [esgStr, setEsgStr] = useState(formatWithCommas(initialDeductions.thaiEsg));
  const [parentHealthStr, setParentHealthStr] = useState(formatWithCommas(initialDeductions.parentHealthInsurance));
  const [prenatalStr, setPrenatalStr] = useState(formatWithCommas(initialDeductions.prenatalExpenses));
  const [donationsStr, setDonationsStr] = useState(formatWithCommas(initialDeductions.donations));
  const [donationsEduStr, setDonationsEduStr] = useState(formatWithCommas(initialDeductions.donationsEducation));
  const [otherDedStr, setOtherDedStr] = useState(formatWithCommas(initialDeductions.otherDeductions));
  const [taxWithheldStr, setTaxWithheldStr] = useState(formatWithCommas(initialDeductions.taxWithheld));

  const [fatherCare, setFatherCare] = useState(initialDeductions.fatherCare);
  const [motherCare, setMotherCare] = useState(initialDeductions.motherCare);
  const [spouseDeduction, setSpouseDeduction] = useState(initialDeductions.spouseDeduction);
  const [childAllowance, setChildAllowance] = useState(initialDeductions.childAllowance);
  const [disabledCount, setDisabledCount] = useState(initialDeductions.disabledCareCount);

  const [storageStats, setStorageStats] = useState(storageManager.getStats());

  useEffect(() => {
    setFormData(initialProfile);
    setIncomeStr(formatWithCommas(initialProfile.annualIncome));
    setExpenseStr(formatWithCommas(initialProfile.monthlyExpenses));
    setDebtStr(formatWithCommas(initialProfile.totalDebt));
    
    const ded = initialProfile.taxDeductions || initialDeductions;
    setSsStr(formatWithCommas(ded.socialSecurity));
    setHomeLoanStr(formatWithCommas(ded.homeLoanInterest));
    setSsfStr(formatWithCommas(ded.ssf));
    setRmfStr(formatWithCommas(ded.rmf));
    setPvdStr(formatWithCommas(ded.pvd));
    setEsgStr(formatWithCommas(ded.thaiEsg));
    setParentHealthStr(formatWithCommas(ded.parentHealthInsurance));
    setPrenatalStr(formatWithCommas(ded.prenatalExpenses));
    setDonationsStr(formatWithCommas(ded.donations));
    setDonationsEduStr(formatWithCommas(ded.donationsEducation));
    setOtherDedStr(formatWithCommas(ded.otherDeductions));
    setTaxWithheldStr(formatWithCommas(ded.taxWithheld));
    setFatherCare(ded.fatherCare);
    setMotherCare(ded.motherCare);
    setSpouseDeduction(ded.spouseDeduction);
    setChildAllowance(ded.childAllowance);
    setDisabledCount(ded.disabledCareCount);
  }, [initialProfile]);

  const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseCommas(e.target.value);
    if (rawValue === '' || !isNaN(Number(rawValue))) {
      setter(formatWithCommas(rawValue));
    }
  };

  const handleFocus = (currentValue: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (currentValue === '0') {
      setter('');
    }
  };

  const getCurrentTaxDeductions = (): TaxDeductions => ({
    socialSecurity: parseInt(parseCommas(ssStr)) || 0,
    homeLoanInterest: parseInt(parseCommas(homeLoanStr)) || 0,
    ssf: parseInt(parseCommas(ssfStr)) || 0,
    rmf: parseInt(parseCommas(rmfStr)) || 0,
    pvd: parseInt(parseCommas(pvdStr)) || 0,
    thaiEsg: parseInt(parseCommas(esgStr)) || 0,
    fatherCare,
    motherCare,
    parentHealthInsurance: parseInt(parseCommas(parentHealthStr)) || 0,
    childAllowance: childAllowance || 0,
    spouseDeduction,
    disabledCareCount: disabledCount || 0,
    prenatalExpenses: parseInt(parseCommas(prenatalStr)) || 0,
    donations: parseInt(parseCommas(donationsStr)) || 0,
    donationsEducation: parseInt(parseCommas(donationsEduStr)) || 0,
    otherDeductions: parseInt(parseCommas(otherDedStr)) || 0,
    taxWithheld: parseInt(parseCommas(taxWithheldStr)) || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProfile: UserProfile = {
      ...formData,
      annualIncome: parseInt(parseCommas(incomeStr)) || 0,
      monthlyExpenses: parseInt(parseCommas(expenseStr)) || 0,
      totalDebt: parseInt(parseCommas(debtStr)) || 0,
      taxDeductions: getCurrentTaxDeductions()
    };
    
    onSave(finalProfile);
    setStorageStats(storageManager.getStats());
    alert(lang === 'en' ? "Profile saved!" : "บันทึกข้อมูลแล้ว!");
  };

  const handleExport = () => {
    if (!isPro) return;
    const currentTaxDeductions = getCurrentTaxDeductions();
    const dataToExport = {
      version: storageStats.version,
      timestamp: new Date().toISOString(),
      profile: {
        ...formData,
        annualIncome: parseInt(parseCommas(incomeStr)) || 0,
        monthlyExpenses: parseInt(parseCommas(expenseStr)) || 0,
        totalDebt: parseInt(parseCommas(debtStr)) || 0,
        taxDeductions: currentTaxDeductions
      },
      policies: policies
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PolicyWallet_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (!isPro) return;
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.profile && Array.isArray(json.policies)) {
          onImport({ profile: json.profile, policies: json.policies });
          setStorageStats(storageManager.getStats());
          alert(t.importSuccess);
        } else {
          alert(t.importError);
        }
      } catch (err) {
        alert(t.importError);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const inputClasses = "w-full p-3.5 bg-white border border-slate-300 rounded-2xl text-[15px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-medium leading-normal placeholder:text-slate-400";
  const labelClasses = "block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 px-0.5";

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-10">
        <div className="bg-blue-50/50 border border-blue-100 rounded-[1.75rem] p-5 flex items-start space-x-5">
          <div className="text-3xl mt-1">💡</div>
          <div>
            <h4 className="font-extrabold text-blue-900 text-sm mb-1.5 uppercase tracking-tight">AI Intelligence</h4>
            <p className="text-blue-800 text-[13px] leading-relaxed font-medium opacity-90">{t.aiAccuracyNotice}</p>
          </div>
        </div>

        {/* SECTION 1: PERSONAL INFO */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-indigo-100/50">👤</div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t.personalInfo}</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-0.5">Profile Context</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <h4 className="font-black text-xs text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 pb-3">{t.identity}</h4>
              <div>
                <label className={labelClasses}>{t.fullName}</label>
                <input type="text" className={inputClasses} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>{t.sex}</label>
                  <select className={inputClasses} value={formData.sex} onChange={(e) => setFormData({ ...formData, sex: e.target.value as any })}>
                    <option value="Male">{t.male}</option>
                    <option value="Female">{t.female}</option>
                    <option value="Other">{t.other}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>{t.birthDate}</label>
                  <input type="date" className={inputClasses} value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>{t.maritalStatus}</label>
                  <select className={inputClasses} value={formData.maritalStatus} onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as any })}>
                    <option value="Single">{t.single}</option>
                    <option value="Married">{t.married}</option>
                    <option value="Divorced">{t.divorced}</option>
                    <option value="Widowed">{t.widowed}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>{t.dependents}</label>
                  <input 
                    type="number" 
                    min="0" 
                    className={inputClasses} 
                    value={formData.dependents === 0 ? '' : formData.dependents} 
                    onChange={(e) => setFormData({ ...formData, dependents: Math.max(0, parseInt(e.target.value) || 0) })} 
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="font-black text-xs text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 pb-3">{t.financial}</h4>
              <div>
                <label className={labelClasses}>{t.income} ({t.yearly})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">฿</span>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    className={`${inputClasses} pl-10 font-extrabold text-slate-800`} 
                    value={incomeStr} 
                    onChange={handleNumericChange(setIncomeStr)}
                    onFocus={() => handleFocus(incomeStr, setIncomeStr)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>{t.expenses} ({t.monthly})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">฿</span>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    className={`${inputClasses} pl-10 font-bold`} 
                    value={expenseStr} 
                    onChange={handleNumericChange(setExpenseStr)}
                    onFocus={() => handleFocus(expenseStr, setExpenseStr)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>{t.totalDebt}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">฿</span>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    className={`${inputClasses} pl-10 text-rose-600 font-black`} 
                    value={debtStr} 
                    onChange={handleNumericChange(setDebtStr)}
                    onFocus={() => handleFocus(debtStr, setDebtStr)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: TAX DEDUCTIONS - REDESIGNED TO MIRROR ABOVE SECTION */}
          <div className="flex items-center space-x-4 pt-10">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-emerald-100/50">💰</div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t.taxDeductions}</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-0.5">Optimization Hub</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <h4 className="font-black text-xs text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 pb-3">{t.taxFamily}</h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                   <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{t.fatherCare}</span>
                   <button 
                     type="button" 
                     onClick={() => setFatherCare(!fatherCare)}
                     className={`w-10 h-6 rounded-full transition-all relative ${fatherCare ? 'bg-indigo-600' : 'bg-slate-300'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${fatherCare ? 'translate-x-5' : 'translate-x-1'}`}></div>
                   </button>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                   <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{t.motherCare}</span>
                   <button 
                     type="button" 
                     onClick={() => setMotherCare(!motherCare)}
                     className={`w-10 h-6 rounded-full transition-all relative ${motherCare ? 'bg-indigo-600' : 'bg-slate-300'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${motherCare ? 'translate-x-5' : 'translate-x-1'}`}></div>
                   </button>
                </div>
              </div>
              
              <div>
                 <label className={labelClasses}>{t.spouseNoIncome}</label>
                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                   <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Enable ฿60,000 Allowance</span>
                   <button 
                     type="button" 
                     onClick={() => setSpouseDeduction(!spouseDeduction)}
                     className={`w-10 h-6 rounded-full transition-all relative ${spouseDeduction ? 'bg-indigo-600' : 'bg-slate-300'}`}
                   >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${spouseDeduction ? 'translate-x-5' : 'translate-x-1'}`}></div>
                   </button>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>{t.childAllowance}</label>
                  <input 
                    type="number" 
                    min="0" 
                    className={inputClasses} 
                    value={childAllowance || ''} 
                    onChange={(e) => setChildAllowance(Math.max(0, parseInt(e.target.value) || 0))} 
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelClasses}>{t.disabledCare}</label>
                  <input 
                    type="number" 
                    min="0" 
                    className={inputClasses} 
                    value={disabledCount || ''} 
                    onChange={(e) => setDisabledCount(Math.max(0, parseInt(e.target.value) || 0))} 
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>{t.parentHealth}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">฿</span>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    className={`${inputClasses} pl-10`} 
                    value={parentHealthStr} 
                    onChange={handleNumericChange(setParentHealthStr)}
                    onFocus={() => handleFocus(parentHealthStr, setParentHealthStr)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="font-black text-xs text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 pb-3">{t.taxInvest}</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>{t.socialSecurity}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">฿</span>
                    <input type="text" inputMode="decimal" className={`${inputClasses} pl-10`} value={ssStr} onChange={handleNumericChange(setSsStr)} onFocus={() => handleFocus(ssStr, setSsStr)} placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>{t.pvd}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">฿</span>
                    <input type="text" inputMode="decimal" className={`${inputClasses} pl-10`} value={pvdStr} onChange={handleNumericChange(setPvdStr)} onFocus={() => handleFocus(pvdStr, setPvdStr)} placeholder="0" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>{t.ssf}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">฿</span>
                    <input type="text" inputMode="decimal" className={`${inputClasses} pl-10`} value={ssfStr} onChange={handleNumericChange(setSsfStr)} onFocus={() => handleFocus(ssfStr, setSsfStr)} placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>{t.rmf}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">฿</span>
                    <input type="text" inputMode="decimal" className={`${inputClasses} pl-10`} value={rmfStr} onChange={handleNumericChange(setRmfStr)} onFocus={() => handleFocus(rmfStr, setRmfStr)} placeholder="0" />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClasses}>{t.thaiEsg}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">฿</span>
                  <input 
                    type="text" 
                    inputMode="decimal" 
                    className={`${inputClasses} pl-10 font-bold text-indigo-600`} 
                    value={esgStr} 
                    onChange={handleNumericChange(setEsgStr)}
                    onFocus={() => handleFocus(esgStr, setEsgStr)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: ACTUAL TAX PAYMENTS */}
          <div className="space-y-8 pt-10">
            <h4 className="font-black text-xs text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 pb-3">{t.actualTaxPayments}</h4>
            <div className="bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-all group-hover:scale-110"></div>
               <div className="relative z-10">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{t.taxWithheld} / PREPAYMENTS</label>
                  <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 group-focus-within:border-indigo-500 transition-colors shadow-inner">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-extrabold text-3xl">฿</span>
                    <input 
                      type="text" 
                      inputMode="decimal" 
                      className="w-full pl-12 bg-transparent border-none text-4xl font-black text-white focus:ring-0 transition-all tabular-nums tracking-tighter" 
                      value={taxWithheldStr} 
                      onChange={handleNumericChange(setTaxWithheldStr)}
                      onFocus={() => handleFocus(taxWithheldStr, setTaxWithheldStr)}
                      placeholder="0"
                    />
                  </div>
                  <p className="text-slate-500 text-[11px] mt-6 font-medium leading-relaxed italic opacity-70">
                    {lang === 'en' ? "Includes cumulative tax already withheld from salaries or early self-prepayments." : "รวมภาษีสะสมที่ถูกหัก ณ ที่จ่ายจากเงินเดือน หรือเงินที่ชำระล่วงหน้าเพื่อเครดิตภาษี"}
                  </p>
               </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-100 flex justify-end">
            <button type="submit" className="px-16 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all active:scale-95 text-xl tracking-tight uppercase tracking-widest">
              {t.updateProfile}
            </button>
          </div>
        </form>
      </div>

      {/* PREMIUM DATA MANAGEMENT CARD - STYLISTIC CONSISTENCY */}
      <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[150px] -mr-60 -mt-60 pointer-events-none"></div>

        {!isPro && (
          <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-[4px] flex items-center justify-center">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center max-w-sm mx-6">
              <span className="text-5xl mb-8 block">🔒</span>
              <p className="text-slate-900 font-black text-2xl mb-4 leading-tight">{t.proFeature}</p>
              <p className="text-slate-500 text-sm mb-10 font-medium leading-relaxed">{t.proDesc}</p>
              <button className="w-full py-5 bg-indigo-600 text-white rounded-[1.75rem] text-[13px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">{t.upgradeNow}</button>
            </div>
          </div>
        )}

        <div className="relative z-10 flex flex-col space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-4xl border border-white/20 shadow-inner">📂</div>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">{t.dataManagement}</h3>
                <p className="text-indigo-300/60 text-[12px] font-black uppercase tracking-[0.3em] mt-1.5">Encrypted Portfolio Portability</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={handleExport} 
              disabled={!isPro} 
              className="group/btn p-10 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 hover:bg-white/10 transition-all active:scale-95 hover:border-indigo-500/30"
            >
              <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-4xl group-hover/btn:scale-110 transition-transform">⬇️</div>
              <div className="text-center">
                <span className="block text-white font-black text-xl mb-1">{t.exportData}</span>
                <span className="block text-indigo-300/40 text-[10px] font-black uppercase tracking-widest">Generate Encrypted Backup</span>
              </div>
            </button>

            <button 
              onClick={handleImportClick} 
              disabled={!isPro} 
              className="group/btn p-10 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 hover:bg-white/10 transition-all active:scale-95 hover:border-emerald-500/30"
            >
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl group-hover/btn:scale-110 transition-transform">⬆️</div>
              <div className="text-center">
                <span className="block text-white font-black text-xl mb-1">{t.importData}</span>
                <span className="block text-emerald-300/40 text-[10px] font-black uppercase tracking-widest">Restore From Local File</span>
              </div>
            </button>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8">
             <div className="flex items-center gap-4">
               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
               <span className="text-[12px] font-black text-white/40 uppercase tracking-[0.3em]">{t.localStorage}</span>
             </div>
             <div className="flex items-center gap-10">
                <div className="text-right">
                   <p className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none mb-1.5">Database Size</p>
                   <p className="text-[14px] font-black text-indigo-300 tabular-nums">{storageStats.size}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none mb-1.5">Last Synced</p>
                   <p className="text-[14px] font-black text-indigo-300 tabular-nums">{storageStats.lastUpdate}</p>
                </div>
             </div>
          </div>
        </div>
        
        <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".json" />
      </div>
    </div>
  );
};

export default ProfileForm;
