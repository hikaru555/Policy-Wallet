
export enum CoverageType {
  LIFE = 'Life Insurance',
  HEALTH = 'Health Insurance',
  ACCIDENT = 'Personal Accident',
  CRITICAL = 'Critical Illness',
  SAVINGS = 'Savings/Endowment'
}

export enum PaymentFrequency {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  YEARLY = 'Yearly'
}

export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';

export interface PolicyCoverage {
  type: CoverageType;
  sumAssured: number;
  roomRate?: number;
}

export interface Policy {
  id: string;
  company: string;
  planName: string;
  coverages: PolicyCoverage[];
  premiumAmount: number;
  dueDate: string; // This is the next due date
  frequency: PaymentFrequency;
  status: 'Active' | 'Lapsed' | 'Grace Period';
  documentUrl?: string;
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
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  policies: Policy[];
  profile?: UserProfile;
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
