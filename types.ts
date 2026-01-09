
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
  lastLogin?: string;
  loginCount?: number;
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
  url: string; 
  uploadDate: string;
}

export interface Policy {
  id: string;
  policyNumber?: string;
  company: string;
  planName: string;
  coverages: PolicyCoverage[];
  premiumAmount: number;
  dueDate: string;
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
  pvd: number;
  thaiEsg: number;
  fatherCare: boolean;
  motherCare: boolean;
  parentHealthInsurance: number;
  childAllowance: number;
  spouseDeduction: boolean;
  disabledCareCount: number;
  prenatalExpenses: number;
  donations: number;
  donationsEducation: number;
  otherDeductions: number;
  taxWithheld: number;
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
  // Added for sharing features
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

  if (today <= due) return 'Active';
  const diffDays = Math.ceil(Math.abs(today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 30 ? 'Grace Period' : 'Terminated';
};
