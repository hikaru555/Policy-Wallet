
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
    if (value === undefined || value === null || value === '') return '';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taxDeductions: TaxDeductions = {
      socialSecurity: parseInt(parseCommas(ssStr)) || 0,
      homeLoanInterest: parseInt(parseCommas(homeLoanStr)) || 0,
      ssf: parseInt(parseCommas(ssfStr)) || 0,
      rmf: parseInt(parseCommas(rmfStr)) || 0,
      pvd: parseInt(parseCommas(pvdStr)) || 0,
      thaiEsg: parseInt(parseCommas(esgStr)) || 0,
      fatherCare: fatherCare,
      motherCare: motherCare,
      parentHealthInsurance: parseInt(parseCommas(parentHealthStr)) || 0,
      childAllowance: childAllowance,
      spouseDeduction: spouseDeduction,
      disabledCareCount: disabledCount,
      prenatalExpenses: parseInt(parseCommas(prenatalStr)) || 0,
      donations: parseInt(parseCommas(donationsStr)) || 0,
      donationsEducation: parseInt(parseCommas(donationsEduStr)) || 0,
      otherDeductions: parseInt(parseCommas(otherDedStr)) || 0,
      taxWithheld: parseInt(parseCommas(taxWithheldStr)) || 0
    };

    const finalProfile: UserProfile = {
      ...formData,
      annualIncome: parseInt(parseCommas(incomeStr)) || 0,
      monthlyExpenses: parseInt(parseCommas(expenseStr)) || 0,
      totalDebt: parseInt(parseCommas(debtStr)) || 0,
      taxDeductions
    };
    
    onSave(finalProfile);
    setStorageStats(storageManager.getStats());
    alert(lang === 'en' ? "Profile saved!" : "บันทึกข้อมูลแล้ว!");
  };

  const handleExport = () => {
    if (!isPro) return;
    const dataToExport = {
      version: storageStats.version,
      timestamp: new Date().toISOString(),
      profile: {
        ...formData,
        annualIncome: parseInt(parseCommas(incomeStr)) || 0,
        monthlyExpenses: parseInt(parseCommas(expenseStr)) || 0,
        totalDebt: parseInt(parseCommas(debtStr)) || 0,
        taxDeductions: formData.taxDeductions
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
                  <input type="number" min="0" className={inputClasses} value={formData.dependents} onChange={(e) => setFormData({ ...formData, dependents: Math.max(0, parseInt(e.target.value) || 0) })} />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="font-black text-xs text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100 pb-3">{t.financial}</h4>
              <div>
                <label className={labelClasses}>{t.income} ({t.yearly})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">฿</span>
                  <input type="text" inputMode="decimal" className={`${inputClasses} pl-10 font-extrabold text-slate-800`} value={incomeStr} onChange={handleNumericChange(setIncomeStr)} />
                </div>
              </div>
              <div>
                <label className={labelClasses}>{t.expenses} ({t.monthly})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">฿</span>
                  <input type="text" inputMode="decimal" className={`${inputClasses} pl-10 font-bold`} value={expenseStr} onChange={handleNumericChange(setExpenseStr)} />
                </div>
              </div>
              <div>
                <label className={labelClasses}>{t.totalDebt}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-lg">฿</span>
                  <input type="text" inputMode="decimal" className={`${inputClasses} pl-10 text-rose-600 font-black`} value={debtStr} onChange={handleNumericChange(setDebtStr)} />
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
                          <input type="number" min="0" className={inputClasses} value={childAllowance} onChange={(e) => setChildAllowance(Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                        <div>
                          <label className={labelClasses}>{t.disabledCare}</label>
                          <input type="number" min="0" className={inputClasses} value={disabledCount} onChange={(e) => setDisabledCount(Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>{t.parentHealth}</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-9 text-[14px]`} value={parentHealthStr} onChange={handleNumericChange(setParentHealthStr)} />
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
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-9 text-[14px]`} value={ssStr} onChange={handleNumericChange(setSsStr)} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>{t.pvd}</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-9 text-[14px]`} value={pvdStr} onChange={handleNumericChange(setPvdStr)} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>{t.ssf}</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-9 text-[14px]`} value={ssfStr} onChange={handleNumericChange(setSsfStr)} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClasses}>{t.rmf}</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-9 text-[14px]`} value={rmfStr} onChange={handleNumericChange(setRmfStr)} />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className={labelClasses}>{t.thaiEsg}</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-sm">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-9 text-[14px]`} value={esgStr} onChange={handleNumericChange(setEsgStr)} />
                        </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="pt-8">
                <div className="p-10 bg-indigo-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>
                   <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none"></div>

                   <div className="relative z-10 space-y-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                          <div className="flex items-center gap-3.5 mb-3">
                             <span className="text-4xl bg-white/10 p-2.5 rounded-2xl">🧾</span>
                             <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-200">{t.actualTaxPayments}</h5>
                          </div>
                          <h4 className="text-3xl font-black tracking-tight mb-2.5">{t.taxWithheld}</h4>
                          <p className="text-indigo-200/70 text-[14px] max-w-lg font-medium leading-relaxed">
                            {lang === 'en' 
                              ? "Total amount of tax already deducted from your income or paid as prepayments to the Revenue Department."
                              : "ยอดเงินภาษีที่ท่านได้ชำระไปแล้วในระหว่างปี (เช่น ภาษีหัก ณ ที่จ่ายจากเงินเดือน หรือยอดที่จ่ายล่วงหน้า)"}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-center md:text-right">
                           <span className="text-[10px] font-black uppercase text-indigo-300 tracking-widest block mb-1.5 opacity-60">{t.alreadySettledThb}</span>
                           <span className="text-5xl font-black tabular-nums tracking-tighter">฿{taxWithheldStr || '0'}</span>
                        </div>
                      </div>

                      <div className="max-w-2xl">
                         <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400 text-3xl font-black">฿</span>
                            <input 
                               type="text" 
                               inputMode="decimal" 
                               placeholder={lang === 'en' ? "Enter total tax paid..." : "ระบุยอดรวมภาษีที่จ่ายไปแล้ว..."}
                               className="w-full p-8 pl-16 bg-white/10 border-2 border-white/10 rounded-[2rem] text-2xl font-black text-white placeholder:text-white/20 focus:ring-4 focus:ring-white/5 focus:border-white/30 outline-none transition-all shadow-inner" 
                               value={taxWithheldStr} 
                               onChange={handleNumericChange(setTaxWithheldStr)} 
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

      <div className={`p-8 md:p-10 rounded-[2.5rem] border border-slate-200 space-y-8 transition-all relative overflow-hidden ${isPro ? 'bg-slate-50' : 'bg-slate-100 filter grayscale-[0.2]'}`}>
        {!isPro && (
          <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center max-w-sm">
              <span className="text-5xl mb-4 block">🔒</span>
              <p className="text-slate-800 font-extrabold text-lg mb-1.5 leading-tight">{t.proFeature}</p>
              <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">{t.proDesc}</p>
              <button className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-100">{t.upgradeNow}</button>
            </div>
          </div>
        )}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-100">📂</div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{t.dataManagement}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Persistence & Backups</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={handleExport} disabled={!isPro} className={`py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm ${isPro ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-300'}`}>⬇️ {t.exportData}</button>
          <button onClick={handleImportClick} disabled={!isPro} className={`py-5 rounded-2xl font-black text-xs uppercase tracking-widest border shadow-sm ${isPro ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>⬆️ {t.importData}</button>
          <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".json" />
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
