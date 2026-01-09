
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

  const inputClasses = "w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none";
  const checkboxClasses = "w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 transition-all cursor-pointer";

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start space-x-4">
          <div className="text-2xl mt-1">💡</div>
          <div>
            <h4 className="font-bold text-blue-900 text-sm mb-1">AI Intelligence</h4>
            <p className="text-blue-800 text-xs leading-relaxed opacity-90">{t.aiAccuracyNotice}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-xl shadow-inner">👤</div>
          <div>
            <h3 className="text-xl font-black text-slate-900">{t.personalInfo}</h3>
            <p className="text-xs text-slate-400 font-medium">Keep your profile updated for better insights</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h4 className="font-black text-xs text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">{t.identity}</h4>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.fullName}</label>
                <input type="text" className={inputClasses} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.sex}</label>
                  <select className={inputClasses} value={formData.sex} onChange={(e) => setFormData({ ...formData, sex: e.target.value as any })}>
                    <option value="Male">{t.male}</option>
                    <option value="Female">{t.female}</option>
                    <option value="Other">{t.other}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.birthDate}</label>
                  <input type="date" className={inputClasses} value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.maritalStatus}</label>
                  <select className={inputClasses} value={formData.maritalStatus} onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as any })}>
                    <option value="Single">{t.single}</option>
                    <option value="Married">{t.married}</option>
                    <option value="Divorced">{t.divorced}</option>
                    <option value="Widowed">{t.widowed}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.dependents}</label>
                  <input type="number" min="0" className={inputClasses} value={formData.dependents} onChange={(e) => setFormData({ ...formData, dependents: Math.max(0, parseInt(e.target.value) || 0) })} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-black text-xs text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">{t.financial}</h4>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.income} ({t.yearly})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">฿</span>
                  <input type="text" inputMode="decimal" className={`${inputClasses} pl-8 font-bold text-slate-800`} value={incomeStr} onChange={handleNumericChange(setIncomeStr)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.expenses} ({t.monthly})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">฿</span>
                  <input type="text" inputMode="decimal" className={`${inputClasses} pl-8`} value={expenseStr} onChange={handleNumericChange(setExpenseStr)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.totalDebt}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">฿</span>
                  <input type="text" inputMode="decimal" className={`${inputClasses} pl-8 text-rose-600 font-black`} value={debtStr} onChange={handleNumericChange(setDebtStr)} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
             <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
               <span className="text-xl">💰</span>
               <h4 className="font-black text-xs text-slate-800 uppercase tracking-[0.2em]">{t.taxDeductions}</h4>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-5">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <span className="text-sm">🏠</span> {t.taxFamily}
                   </h5>
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <span className="text-xs font-bold text-slate-700">{t.fatherCare}</span>
                          <input type="checkbox" className={checkboxClasses} checked={fatherCare} onChange={(e) => setFatherCare(e.target.checked)} />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <span className="text-xs font-bold text-slate-700">{t.motherCare}</span>
                          <input type="checkbox" className={checkboxClasses} checked={motherCare} onChange={(e) => setMotherCare(e.target.checked)} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-slate-700">{t.spouseNoIncome}</span>
                        </div>
                        <input type="checkbox" className={checkboxClasses} checked={spouseDeduction} onChange={(e) => setSpouseDeduction(e.target.checked)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.childAllowance}</label>
                          <input type="number" min="0" className={inputClasses} value={childAllowance} onChange={(e) => setChildAllowance(Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.disabledCare}</label>
                          <input type="number" min="0" className={inputClasses} value={disabledCount} onChange={(e) => setDisabledCount(Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.parentHealth}</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-7 text-xs`} value={parentHealthStr} onChange={handleNumericChange(setParentHealthStr)} />
                        </div>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-5">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <span className="text-sm">📈</span> {t.taxInvest}
                   </h5>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.socialSecurity}</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-7 text-xs`} value={ssStr} onChange={handleNumericChange(setSsStr)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.pvd}</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-7 text-xs`} value={pvdStr} onChange={handleNumericChange(setPvdStr)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.ssf}</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-7 text-xs`} value={ssfStr} onChange={handleNumericChange(setSsfStr)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.rmf}</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-7 text-xs`} value={rmfStr} onChange={handleNumericChange(setRmfStr)} />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.thaiEsg}</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-7 text-xs`} value={esgStr} onChange={handleNumericChange(setEsgStr)} />
                        </div>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-5">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <span className="text-sm">🏢</span> {t.taxProperty}
                   </h5>
                   <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.homeLoan}</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-7 text-xs`} value={homeLoanStr} onChange={handleNumericChange(setHomeLoanStr)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.prenatal}</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-7 text-xs`} value={prenatalStr} onChange={handleNumericChange(setPrenatalStr)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.otherDeductions}</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-7 text-xs`} value={otherDedStr} onChange={handleNumericChange(setOtherDedStr)} />
                        </div>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-5">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <span className="text-sm">🙏</span> {t.taxDonation}
                   </h5>
                   <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.donations}</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-7 text-xs`} value={donationsStr} onChange={handleNumericChange(setDonationsStr)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t.donationsEdu}</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold text-emerald-600">฿</span>
                          <input type="text" inputMode="decimal" className={`${inputClasses} pl-7 text-xs border-emerald-100`} value={donationsEduStr} onChange={handleNumericChange(setDonationsEduStr)} />
                        </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="pt-6">
                <div className="p-10 bg-indigo-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                   <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

                   <div className="relative z-10 space-y-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                             <span className="text-3xl bg-white/10 p-2 rounded-2xl">🧾</span>
                             <h5 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-200">{t.actualTaxPayments}</h5>
                          </div>
                          <h4 className="text-2xl font-black tracking-tight">{t.taxWithheld}</h4>
                          <p className="text-indigo-300 text-xs mt-2 max-w-md font-medium leading-relaxed">
                            {lang === 'en' 
                              ? "Total amount of tax already deducted from your income or paid as prepayments to the Revenue Department."
                              : "ยอดเงินภาษีที่ท่านได้ชำระไปแล้วในระหว่างปี (เช่น ภาษีหัก ณ ที่จ่ายจากเงินเดือน หรือยอดที่จ่ายล่วงหน้า)"}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-center md:text-right">
                           <span className="text-xs font-black uppercase text-indigo-300 tracking-widest block mb-1 opacity-60">{t.alreadySettledThb}</span>
                           <span className="text-5xl font-black tabular-nums tracking-tighter">฿{taxWithheldStr || '0'}</span>
                        </div>
                      </div>

                      <div className="max-w-2xl">
                         <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 text-2xl font-black">฿</span>
                            <input 
                               type="text" 
                               inputMode="decimal" 
                               placeholder={lang === 'en' ? "Enter total tax paid..." : "ระบุยอดรวมภาษีที่จ่ายไปแล้ว..."}
                               className="w-full p-6 pl-14 bg-white/10 border-2 border-white/10 rounded-[1.5rem] text-xl font-black text-white placeholder:text-white/20 focus:ring-4 focus:ring-white/5 focus:border-white/30 outline-none transition-all shadow-inner" 
                               value={taxWithheldStr} 
                               onChange={handleNumericChange(setTaxWithheldStr)} 
                            />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-end">
            <button type="submit" className="px-12 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all active:scale-95 text-lg">
              {t.updateProfile}
            </button>
          </div>
        </form>
      </div>

      <div className={`p-6 md:p-8 rounded-[2.5rem] border border-slate-200 space-y-6 transition-all relative overflow-hidden ${isPro ? 'bg-slate-50' : 'bg-slate-100 filter grayscale-[0.2]'}`}>
        {!isPro && (
          <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 text-center max-w-xs">
              <span className="text-4xl mb-3 block">🔒</span>
              <p className="text-slate-800 font-bold mb-1">{t.proFeature}</p>
              <button className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">{t.upgradeNow}</button>
            </div>
          </div>
        )}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-100">📂</div>
          <div><h3 className="text-xl font-bold text-slate-900">{t.dataManagement}</h3></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={handleExport} disabled={!isPro} className={`py-4 rounded-xl font-bold text-xs ${isPro ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-300'}`}>⬇️ {t.exportData}</button>
          <button onClick={handleImportClick} disabled={!isPro} className={`py-4 rounded-xl font-bold text-xs border ${isPro ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>⬆️ {t.importData}</button>
          <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".json" />
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
