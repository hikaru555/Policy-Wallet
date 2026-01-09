
export enum CoverageType {
  LIFE = 'Life Insurance',
  HEALTH = 'Health Insurance',
  ACCIDENT = 'Personal Accident',
  CRITICAL = 'Critical Illness',
  SAVINGS = 'Savings/Endowment',
  PENSION = 'Pension/Retirement',
  HOSPITAL_BENEFIT = 'Hospital Benefit'
}

export enum PaymentFrequency {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  YEARLY = 'Yearly'
}

export type UserRole = 'Admin' | 'Member' | 'Pro-Member';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
}

export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';

export interface PolicyCoverage {
  type: CoverageType;
  sumAssured: number;
  roomRate?: number;
}

export interface PolicyDocument {
  id: string;
  name: string;
  category: 'Policy' | 'Receipt' | 'Medical' | 'Other';
  mimeType: string;
  url: string; // Base64 or Blob URL for local session
  uploadDate: string;
}

export interface Policy {
  id: string;
  company: string;
  planName: string;
  coverages: PolicyCoverage[];
  premiumAmount: number;
  dueDate: string; // This is the next due date
  frequency: PaymentFrequency;
  status: 'Active' | 'Terminated' | 'Grace Period';
  documentUrl?: string;
  documents?: PolicyDocument[];
}

export interface TaxDeductions {
  socialSecurity: number;
  homeLoanInterest: number;
  ssf: number;
  rmf: number;
  pvd: number; // Provident Fund / GPF
  thaiEsg: number;
  fatherCare: boolean; // 30,000 THB
  motherCare: boolean; // 30,000 THB
  parentHealthInsurance: number; // Max 15,000 THB
  childAllowance: number; // 30,000 per child
  spouseDeduction: boolean; // 60,000 THB (Only if spouse has no income)
  disabledCareCount: number; // 60,000 per person
  prenatalExpenses: number; // Actual max 60,000
  donations: number;
  donationsEducation: number; // 2x actual
  otherDeductions: number;
  taxWithheld: number; // ภาษีที่ชำระไว้แล้วหรือโดนหัก ณ ที่จ่าย
}

export interface UserProfile {
  name: string;
  sex: 'Male' | 'Female' | 'Other';
  birthDate: string;
  maritalStatus: MaritalStatus;
  dependents: number;
  annualIncome: number;
  monthlyExpenses: number;
  totalDebt: number;
  familyNotes?: string;
  taxDeductions?: TaxDeductions;
  // Added properties for sharing functionality
  isPublicProfile?: boolean;
  sharedWithEmails?: string[];
}

export interface GapAnalysisResult {
  score: number;
  gaps: {
    category: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
  }[];
  recommendations: string[];
}

export interface UnderwritingResult {
  riskLevel: 'Standard' | 'Sub-standard' | 'Postpone' | 'Decline';
  assessment: string;
  reasons: string[];
  additionalRequirements: string[];
}

export interface UsageStats {
  date: string;
  count: number;
}

export const calculatePolicyStatus = (dueDate: string): Policy['status'] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (today <= due) {
    return 'Active';
  }

  const diffTime = Math.abs(today.getTime() - due.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) {
    return 'Grace Period';
  }

  return 'Terminated';
};
