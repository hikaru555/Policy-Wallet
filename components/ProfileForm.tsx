
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Policy } from '../types';
import { translations, Language } from '../translations';
import { storageManager } from '../services/storageManager';

interface ProfileFormProps {
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  lang: Language;
  policies: Policy[];
  onImport: (data: { profile: UserProfile, policies: Policy[] }) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ initialProfile, onSave, lang, policies, onImport }) => {
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

  const [formData, setFormData] = useState<UserProfile>(initialProfile);
  const [incomeStr, setIncomeStr] = useState(formatWithCommas(initialProfile.annualIncome));
  const [expenseStr, setExpenseStr] = useState(formatWithCommas(initialProfile.monthlyExpenses));
  const [debtStr, setDebtStr] = useState(formatWithCommas(initialProfile.totalDebt));
  const [storageStats, setStorageStats] = useState(storageManager.getStats());

  useEffect(() => {
    setFormData(initialProfile);
    setIncomeStr(formatWithCommas(initialProfile.annualIncome));
    setExpenseStr(formatWithCommas(initialProfile.monthlyExpenses));
    setDebtStr(formatWithCommas(initialProfile.totalDebt));
  }, [initialProfile]);

  const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseCommas(e.target.value);
    if (rawValue === '' || !isNaN(Number(rawValue))) {
      setter(formatWithCommas(rawValue));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalProfile: UserProfile = {
      ...formData,
      annualIncome: parseInt(parseCommas(incomeStr)) || 0,
      monthlyExpenses: parseInt(parseCommas(expenseStr)) || 0,
      totalDebt: parseInt(parseCommas(debtStr)) || 0
    };
    
    onSave(finalProfile);
    setStorageStats(storageManager.getStats());
    alert(lang === 'en' ? "Profile saved!" : "บันทึกข้อมูลแล้ว!");
  };

  const handleExport = () => {
    const dataToExport = {
      version: storageStats.version,
      timestamp: new Date().toISOString(),
      profile: {
        ...formData,
        annualIncome: parseInt(parseCommas(incomeStr)) || 0,
        monthlyExpenses: parseInt(parseCommas(expenseStr)) || 0,
        totalDebt: parseInt(parseCommas(debtStr)) || 0
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

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
        {/* AI Accuracy Notice */}
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
            <h3 className="text-xl font-bold text-slate-900">{t.personalInfo}</h3>
            <p className="text-xs text-slate-400 font-medium">Keep your profile updated for better insights</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Identity Section */}
            <div className="space-y-6">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">{t.identity}</h4>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.fullName}</label>
                <input 
                  type="text" 
                  className={inputClasses} 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                />
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
                  <input 
                    type="number" 
                    min="0" 
                    className={inputClasses} 
                    value={formData.dependents} 
                    onChange={(e) => setFormData({ ...formData, dependents: Math.max(0, parseInt(e.target.value) || 0) })} 
                  />
                </div>
              </div>
            </div>

            {/* Financial Section */}
            <div className="space-y-6">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">{t.financial}</h4>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.income} (Yearly)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">฿</span>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    className={`${inputClasses} pl-8`} 
                    value={incomeStr} 
                    onChange={handleNumericChange(setIncomeStr)} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.expenses} (Monthly)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">฿</span>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    className={`${inputClasses} pl-8`} 
                    value={expenseStr} 
                    onChange={handleNumericChange(setExpenseStr)} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t.totalDebt}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">฿</span>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    className={`${inputClasses} pl-8 text-rose-600 font-bold`} 
                    value={debtStr} 
                    onChange={handleNumericChange(setDebtStr)} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-end">
            <button type="submit" className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
              {t.updateProfile}
            </button>
          </div>
        </form>
      </div>

      {/* Data Management Section */}
      <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-100">📂</div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{t.dataManagement}</h3>
            <p className="text-xs text-slate-500 font-medium">Transfer your portfolio data between devices manually.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div className="mb-4">
              <h5 className="font-bold text-slate-800 text-sm mb-1">{t.exportData}</h5>
              <p className="text-[10px] text-slate-500 leading-relaxed">Save your current profile and all added policies to a JSON file. Use this to backup or move to another device.</p>
            </div>
            <button 
              onClick={handleExport}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
            >
              ⬇️ {t.exportData}
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div className="mb-4">
              <h5 className="font-bold text-slate-800 text-sm mb-1">{t.importData}</h5>
              <p className="text-[10px] text-slate-500 leading-relaxed">Upload a previously exported JSON file to restore your portfolio on this device. <b>Warning: This replaces existing data.</b></p>
            </div>
            <button 
              onClick={handleImportClick}
              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-all border border-indigo-100"
            >
              ⬆️ {t.importData}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileImport} 
              className="hidden" 
              accept=".json"
            />
          </div>
        </div>

        {/* Persistence Health Section */}
        <div className="mt-6 p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
           <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">🛡️</div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Persistence Health</p>
               <p className="text-xs font-bold text-slate-700">Storage Version: <span className="text-emerald-600">{storageStats.version}</span></p>
             </div>
           </div>
           <div className="text-right">
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Usage: {storageStats.size}</p>
             <p className="text-[9px] text-slate-300 italic">Last sync: {storageStats.lastUpdate}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
