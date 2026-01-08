import React, { useState } from 'react';
import { CoverageType, Policy, PaymentFrequency } from '../types';
import { INSURANCE_COMPANIES } from '../constants';

interface AddPolicyFormProps {
  onAdd: (policy: Policy) => void;
  onCancel: () => void;
}

const AddPolicyForm: React.FC<AddPolicyFormProps> = ({ onAdd, onCancel }) => {
  const [formData, setFormData] = useState({
    company: INSURANCE_COMPANIES[0],
    planName: '',
    type: CoverageType.LIFE,
    sumAssured: '',
    roomRate: '',
    premiumAmount: '',
    dueDate: '',
    frequency: PaymentFrequency.YEARLY,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.planName || !formData.sumAssured || !formData.premiumAmount || !formData.dueDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const premium = Number(formData.premiumAmount);
    if (premium < 0) {
      alert("Premium cannot be negative.");
      return;
    }

    const newPolicy: Policy = {
      id: Math.random().toString(36).substr(2, 9),
      company: formData.company,
      planName: formData.planName,
      coverages: [
        {
          type: formData.type,
          sumAssured: Math.max(0, Number(formData.sumAssured)),
          roomRate: formData.roomRate ? Math.max(0, Number(formData.roomRate)) : undefined,
        },
      ],
      premiumAmount: premium,
      dueDate: formData.dueDate,
      frequency: formData.frequency,
      status: 'Active',
    };

    onAdd(newPolicy);
    setFormData({
      company: INSURANCE_COMPANIES[0],
      planName: '',
      type: CoverageType.LIFE,
      sumAssured: '',
      roomRate: '',
      premiumAmount: '',
      dueDate: '',
      frequency: PaymentFrequency.YEARLY,
    });
  };

  const inputClasses = "w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 animate-in slide-in-from-top-2 duration-300">
      <h4 className="font-bold text-lg mb-4">Add New Policy</h4>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Insurance Company</label>
          <select
            className={inputClasses}
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          >
            {INSURANCE_COMPANIES.map((company) => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Plan Name</label>
          <input
            type="text"
            placeholder="e.g. Life Shield Plus"
            className={inputClasses}
            value={formData.planName}
            onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Coverage Type</label>
          <select
            className={inputClasses}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as CoverageType })}
          >
            {Object.values(CoverageType).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sum Assured (฿)</label>
          <input
            type="number"
            min="0"
            placeholder="1000000"
            className={inputClasses}
            value={formData.sumAssured}
            onChange={(e) => setFormData({ ...formData, sumAssured: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Room Rate (฿) - Optional</label>
          <input
            type="number"
            min="0"
            placeholder="4000"
            className={inputClasses}
            value={formData.roomRate}
            onChange={(e) => setFormData({ ...formData, roomRate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Premium Amount (฿)</label>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="15000"
            className={inputClasses}
            value={formData.premiumAmount}
            onChange={(e) => setFormData({ ...formData, premiumAmount: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Frequency</label>
          <select
            className={inputClasses}
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value as PaymentFrequency })}
          >
            {Object.values(PaymentFrequency).map((freq) => (
              <option key={freq} value={freq}>{freq}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
          <input
            type="date"
            className={inputClasses}
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
        <div className="md:col-span-2 flex justify-end space-x-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
          >
            Save Policy
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPolicyForm;