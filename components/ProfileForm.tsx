
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { translations, Language } from '../translations';

interface ProfileFormProps {
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  lang: Language;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ initialProfile, onSave, lang }) => {
  const t = translations[lang];
  
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
    alert(lang === 'en' ? "Profile saved!" : "บันทึกข้อมูลแล้ว!");
  };

  const inputClasses = "w-full p-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none";

  return (
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
  );
};

export default ProfileForm;
