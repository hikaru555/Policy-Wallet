
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
  const checkboxClasses = "w-5 h-5 text-indigo-600 border-slate-300 rounded-lg focus:ring-indigo-500 transition-all cursor-pointer shadow-sm";

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

          <div className="space-y-10">
             <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
               <span className="text-2xl">💰</span>
               <h4 className="font-black text-xs text-slate-800 uppercase tracking-[0.25em]">{t.taxDeductions}</h4>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2rem] space-y-6">
                   <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2.5">
                     <span className="text-xl">🏠</span> {t.taxFamily}
                   </h5>
                   <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <span className="text-[13px] font-bold text-slate-700">{t.fatherCare}</span>
                          <input type="checkbox" className={checkboxClasses} checked={fatherCare} onChange={(e) => setFatherCare(e.target.checked)} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <span className="text-[13px] font-bold text-slate-700">{t.motherCare}</span>
                          <input type="checkbox" className={checkboxClasses} checked={motherCare} onChange={(e) => setMotherCare(e.target.checked)} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex flex-col">
                           <span className="text-[13px] font-bold text-slate-700">{t.spouseNoIncome}</span>
                        </div>
                        <input type="checkbox" className={checkboxClasses} checked={spouseDeduction} onChange={(e) => setSpouseDeduction(e.target.checked)} />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className={labelClasses}>{t.childAllowance}</label>
                          <input 
                            type="number" 
                            min="0" 
                            className={inputClasses} 
                            value={childAllowance === 0 ? '' : childAllowance} 
                            onChange={(e) => setChildAllowance(Math.max(0, parseInt(e.target.value) || 0))}
                            onFocus={(e) => { if (e.target.value === '0') setChildAllowance('' as any); }}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className={labelClasses}>{t.disabledCare}</label>
                          <input 
                            type="number" 
                            min="0" 
                            className={inputClasses} 
                            value={disabledCount === 0 ? '' : disabledCount} 
                            onChange={(e) => setDisabledCount(Math.max(0, parseInt(e.target.value) || 0))}
                            onFocus={(e) => { if (e.target.value === '0') setDisabledCount('' as any); }}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>{t.parentHealth}</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">฿</span>
                          <input 
                            type="text" 
                            inputMode="decimal" 
                            className={`${inputClasses} pl-9 text-[14px]`} 
                            value={parentHealthStr} 
                            onChange={handleNumericChange(setParentHealthStr)}
                            onFocus={() => handleFocus(parentHealthStr, setParentHealthStr)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2rem] space-y-6">
                   <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2.5">
                     <span className="text-xl">📈</span> {t.taxInvest}
                   </h5>
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className={labelClasses}>{t.socialSecurity}</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">฿</span>
                          <input 
                            type="text" 
                            inputMode="decimal" 
                            className={`${inputClasses} pl-9 text-[14px]`} 
                            value={ssStr} 
                            onChange={handleNumericChange(setSsStr)}
                            onFocus={() => handleFocus(ssStr, setSsStr)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>{t.pvd}</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">฿</span>
                          <input 
                            type="text" 
                            inputMode="decimal" 
                            className={`${inputClasses} pl-9 text-[14px]`} 
                            value={pvdStr} 
                            onChange={handleNumericChange(setPvdStr)}
                            onFocus={() => handleFocus(pvdStr, setPvdStr)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>{t.ssf}</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">฿</span>
                          <input 
                            type="text" 
                            inputMode="decimal" 
                            className={`${inputClasses} pl-9 text-[14px]`} 
                            value={ssfStr} 
                            onChange={handleNumericChange(setSsfStr)}
                            onFocus={() => handleFocus(ssfStr, setSsfStr)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>{t.rmf}</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">฿</span>
                          <input 
                            type="text" 
                            inputMode="decimal" 
                            className={`${inputClasses} pl-9 text-[14px]`} 
                            value={rmfStr} 
                            onChange={handleNumericChange(setRmfStr)}
                            onFocus={() => handleFocus(rmfStr, setRmfStr)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className={labelClasses}>{t.thaiEsg}</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">฿</span>
                          <input 
                            type="text" 
                            inputMode="decimal" 
                            className={`${inputClasses} pl-9 text-[14px]`} 
                            value={esgStr} 
                            onChange={handleNumericChange(setEsgStr)}
                            onFocus={() => handleFocus(esgStr, setEsgStr)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Smaller & Compact Actual Tax Payments Section */}
             <div className="pt-4">
                <div className="p-4 md:p-6 bg-indigo-950 rounded-[1.5rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
                   <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
                   <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none"></div>

                   <div className="relative z-10 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                             <span className="text-xl bg-white/10 p-1.5 rounded-lg">🧾</span>
                             <h5 className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-200">{t.actualTaxPayments}</h5>
                          </div>
                          <h4 className="text-lg font-black tracking-tight mb-1">{t.taxWithheld}</h4>
                          <p className="text-indigo-200/60 text-[10px] max-w-md font-medium leading-tight">
                            {lang === 'en' 
                              ? "Tax already deducted from income or paid as prepayments."
                              : "ยอดเงินภาษีที่ท่านได้ชำระไปแล้วในระหว่างปี (เช่น ภาษีหัก ณ ที่จ่าย)"}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-center md:text-right">
                           <span className="text-[8px] font-black uppercase text-indigo-300 tracking-[0.15em] block mb-0.5 opacity-50">{t.alreadySettledThb}</span>
                           <span className="text-2xl font-black tabular-nums tracking-tighter">฿{taxWithheldStr || '0'}</span>
                        </div>
                      </div>

                      <div className="max-w-md">
                         <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-lg font-black">฿</span>
                            <input 
                               type="text" 
                               inputMode="decimal" 
                               placeholder={lang === 'en' ? "Total tax paid..." : "ยอดรวมภาษีที่จ่ายแล้ว..."}
                               className="w-full p-2.5 pl-8 bg-white/10 border border-white/10 rounded-lg text-base font-black text-white placeholder:text-white/20 focus:ring-2 focus:ring-white/5 focus:border-white/20 outline-none transition-all shadow-inner" 
                               value={taxWithheldStr} 
                               onChange={handleNumericChange(setTaxWithheldStr)} 
                               onFocus={() => handleFocus(taxWithheldStr, setTaxWithheldStr)}
                            />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="pt-10 border-t border-slate-100 flex justify-end">
            <button type="submit" className="px-14 py-5 bg-indigo-600 text-white rounded-[2rem] font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all active:scale-95 text-xl tracking-tight">
              {t.updateProfile}
            </button>
          </div>
        </form>
      </div>

      {/* Premium Data Management Card - Compacted */}
      <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-6 md:p-8 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px] -ml-40 -mb-40 pointer-events-none"></div>

        {!isPro && (
          <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-[4px] flex items-center justify-center">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 text-center max-w-sm">
              <span className="text-4xl mb-4 block">🔒</span>
              <p className="text-slate-900 font-black text-lg mb-2 leading-tight">{t.proFeature}</p>
              <p className="text-slate-500 text-xs mb-6 font-medium leading-relaxed">{t.proDesc}</p>
              <button className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">{t.upgradeNow}</button>
            </div>
          </div>
        )}

        <div className="relative z-10 flex flex-col space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl border border-white/20 shadow-inner">📂</div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">{t.dataManagement}</h3>
                <p className="text-indigo-300/60 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">Encrypted JSON Portability</p>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">VERSION: {storageStats.version}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={handleExport} 
              disabled={!isPro} 
              className="group/btn p-6 bg-white/5 border border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-all active:scale-95 hover:border-indigo-500/30"
            >
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-3xl group-hover/btn:scale-110 transition-transform">⬇️</div>
              <div className="text-center">
                <span className="block text-white font-black text-base mb-0.5">{t.exportData}</span>
                <span className="block text-indigo-300/40 text-[9px] font-black uppercase tracking-widest">Generate Backup</span>
              </div>
            </button>

            <button 
              onClick={handleImportClick} 
              disabled={!isPro} 
              className="group/btn p-6 bg-white/5 border border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-all active:scale-95 hover:border-emerald-500/30"
            >
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl group-hover/btn:scale-110 transition-transform">⬆️</div>
              <div className="text-center">
                <span className="block text-white font-black text-base mb-0.5">{t.importData}</span>
                <span className="block text-emerald-300/40 text-[9px] font-black uppercase tracking-widest">Restore Backup</span>
              </div>
            </button>
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em]">{t.localStorage}</span>
             </div>
             <div className="flex items-center gap-5">
                <div className="text-right">
                   <p className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none mb-0.5">Size</p>
                   <p className="text-[10px] font-black text-indigo-300 tabular-nums">{storageStats.size}</p>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none mb-0.5">Migration</p>
                   <p className="text-[10px] font-black text-indigo-300 tabular-nums">{storageStats.lastUpdate}</p>
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
