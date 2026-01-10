
import { GoogleGenAI, Type } from "@google/genai";
import { Policy, GapAnalysisResult, UserProfile, CoverageType, UnderwritingResult } from "../types";
import { Language } from "../translations";

export const analyzeCoverageGaps = async (policies: Policy[], profile: UserProfile, lang: Language): Promise<GapAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const policySummary = policies.map(p => {
    const coverageDetails = p.coverages.map(c => 
      `${c.type}: Sum Assured ฿${c.sumAssured.toLocaleString()}${c.roomRate ? `, Room Rate ฿${c.roomRate.toLocaleString()}` : ''}`
    ).join(", ");
    return `Policy [${p.planName}] ${p.policyNumber ? `(#${p.policyNumber})` : ''} from [${p.company}]: ${coverageDetails}`;
  }).join("; ");

  const age = new Date().getFullYear() - new Date(profile.birthDate).getFullYear();

  const prompt = `
    Act as an expert Thai Financial Planner and Insurance Consultant. 
    Perform a comprehensive Gap Analysis for a client.
    Client Profile: Age ${age}, Sex ${profile.sex}, Income ฿${profile.annualIncome.toLocaleString()}, Debt ฿${profile.totalDebt.toLocaleString()}.
    Current Insurance Portfolio: ${policySummary || "NONE"}.
    
    CRITICAL EVALUATION CATEGORIES:
    1. Life Protection (Sum Assured should cover at least 5-10x annual income or total debt).
    2. Health Insurance (Evaluate room rate vs current Thai medical costs e.g. ฿8,000+).
    3. Critical Illness (Should cover at least 2-3 years of income for recovery).
    4. PENSION / RETIREMENT (CRITICAL): Check if the client has "Pension/Retirement" coverage. If the client is >35 years old and has no Pension policies, flag this as a HIGH priority gap. Retirement planning in Thailand requires private supplements beyond Social Security.
    
    Output Language: ${lang === 'th' ? 'Thai' : 'English'}
    Return JSON: score (0-100), gaps (category, description, priority), recommendations (string array).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            gaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                },
                required: ["category", "description", "priority"]
              }
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "gaps", "recommendations"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error: any) {
    console.error("AI analysis failed", error);
    return { score: 0, gaps: [], recommendations: [] };
  }
};

export const analyzeTaxOptimization = async (policies: Policy[], profile: UserProfile, lang: Language): Promise<{
  advice: string[];
  suggestedProducts: string[];
  estimatedTotalBenefit: number;
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const policySummary = policies.map(p => `Plan: ${p.planName}, Premium: ฿${p.premiumAmount.toLocaleString()}, Types: ${p.coverages.map(c => c.type).join(", ")}`).join("; ");

  const deductions = profile.taxDeductions || {};
  const deductionSummary = Object.entries(deductions)
    .map(([key, value]) => `${key}: ${typeof value === 'boolean' ? (value ? 'Yes' : 'No') : '฿' + (value as number).toLocaleString()}`)
    .join(", ");

  const prompt = `
    Act as a Thai Tax Planning Expert. 
    Annual Income: ฿${profile.annualIncome.toLocaleString()}
    Existing Policies: ${policySummary || "No existing policies."}
    Other Deductions (SSF, RMF, PVD, ThaiESG, Parent Health, Parent Care, Spouse, Child, Disabled, etc.): ${deductionSummary}
    
    Calculate tax optimization based on Thai Revenue Department rules for personal income tax (2025 onwards).
    - Personal Deduction: ฿60,000
    - Expense Deduction: 50% max ฿100,000
    - Life & Health: ฿100,000 (Health insurance cap ฿25,000 within this)
    - Pension Insurance: ฿200,000 (max 15% income) - This is a powerful tool.
    - Combined Group Limit (SSF + RMF + PVD + PensionInsurance): ฿500,000
    - ThaiESG Separate Limit: ฿300,000 (max 30% income) - This is separate from the ฿500,000 group.
    
    IMPORTANT BRAND RULE: 
    When suggesting insurance products to optimize tax, ONLY recommend FWD Thailand products sold via the AGENT channel.
    Examples of products to recommend:
    - Pension: FWD For Pension 85/1, 85/5, 85/7
    - Health: FWD Precious Care, FWD CI Pro, FWD CI Fixed Pay
    - Life: FWD Power Life, FWD Precious Whole Life
    - Savings: FWD Power Save 12/6, FWD Power Save 15/5
    Do NOT suggest products from other companies.

    Output Language: ${lang === 'th' ? 'Thai' : 'English'}
    Return JSON: advice (array of strings), suggestedProducts (array of strings), estimatedTotalBenefit (number).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedTotalBenefit: { type: Type.NUMBER }
          },
          required: ["advice", "suggestedProducts", "estimatedTotalBenefit"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("AI Tax Analysis failed", error);
    return { advice: [], suggestedProducts: [], estimatedTotalBenefit: 0 };
  }
};

export const parsePolicyDocument = async (base64Data: string, mimeType: string): Promise<Partial<Policy> | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `Extract insurance data from Thai policies. Map to: Life Insurance, Health Insurance, Personal Accident, Critical Illness, Savings/Endowment, Pension/Retirement, Hospital Benefit. Convert Thai years to CE.`;
  const prompt = `Extract policy info from this image.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { inlineData: { data: base64Data.split(',')[1], mimeType: mimeType } }, 
          { text: prompt }
        ] 
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company: { type: Type.STRING },
            planName: { type: Type.STRING },
            policyNumber: { type: Type.STRING },
            premiumAmount: { type: Type.NUMBER },
            frequency: { type: Type.STRING, enum: ["Monthly", "Quarterly", "Yearly"] },
            dueDate: { type: Type.STRING },
            coverages: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  type: { type: Type.STRING }, 
                  sumAssured: { type: Type.NUMBER }, 
                  roomRate: { type: Type.NUMBER, nullable: true } 
                },
                required: ["type", "sumAssured"]
              } 
            }
          },
          required: ["company", "planName", "premiumAmount", "coverages"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (err) {
    return null;
  }
};

export const performPreUnderwriting = async (
  medicalHistory: string, 
  files: { data: string, mimeType: string }[], 
  lang: Language
): Promise<UnderwritingResult | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Act as Medical Underwriter. Assessment in ${lang === 'th' ? 'Thai' : 'English'}. Risk levels: Standard, Sub-standard, Postpone, Decline.`;
  const parts: any[] = [{ text: medicalHistory + prompt }];
  files.forEach(f => parts.push({ inlineData: { data: f.data.split(',')[1], mimeType: f.mimeType } }));
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ["Standard", "Sub-standard", "Postpone", "Decline"] },
            assessment: { type: Type.STRING },
            reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
            additionalRequirements: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["riskLevel", "assessment", "reasons", "additionalRequirements"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (err) {
    return null;
  }
};
