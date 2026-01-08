
import { GoogleGenAI, Type } from "@google/genai";
import { Policy, GapAnalysisResult, UserProfile, CoverageType, PaymentFrequency } from "../types";
import { Language } from "../translations";

/**
 * Analyzes insurance coverage gaps using gemini-3-pro-preview for complex reasoning.
 */
export const analyzeCoverageGaps = async (policies: Policy[], profile: UserProfile, lang: Language): Promise<GapAnalysisResult> => {
  // Always create a fresh instance to get the latest process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const policySummary = policies.map(p => {
    const coverageDetails = p.coverages.map(c => 
      `${c.type}: Sum Assured ฿${c.sumAssured.toLocaleString()}${c.roomRate ? `, Room Rate ฿${c.roomRate.toLocaleString()}` : ''}`
    ).join(", ");
    return `Policy [${p.planName}] from [${p.company}]: ${coverageDetails}`;
  }).join("; ");

  const age = new Date().getFullYear() - new Date(profile.birthDate).getFullYear();

  const prompt = `
    Act as an expert Thai Financial Planner and Insurance Consultant. 
    Perform a comprehensive Gap Analysis for a client based on their profile and existing insurance portfolio.

    Client Profile:
    - Name: ${profile.name}
    - Age: ${age} (Birthdate: ${profile.birthDate})
    - Sex: ${profile.sex}
    - Marital Status: ${profile.maritalStatus}
    - Dependents: ${profile.dependents}
    - Annual Income: ฿${profile.annualIncome.toLocaleString()}
    - Monthly Expenses: ฿${profile.monthlyExpenses.toLocaleString()}
    - Total Debt/Liabilities (Loans, Mortgage, etc.): ฿${profile.totalDebt.toLocaleString()}
    - Family Notes/Context: ${profile.familyNotes || "None provided"}

    Current Insurance Portfolio: 
    ${policySummary || "The client currently has NO insurance policies."}
    
    Analysis Requirements (Based on Thai Industry Standards):
    1. Life Protection Gap: Total sum assured across all policies should cover at least (Total Debt + (Annual Income * Dependents / 2)). Ideally 5-10x annual income.
    2. Health Room Rate Gap: Evaluate if the daily room rate is sufficient for standard private hospitals in Thailand (Standard: ฿4,000+, Premium: ฿10,000+).
    3. Critical Illness Gap: Should ideally be 2-3x annual income to cover loss of income and specialized care.
    4. Hospital Benefit Gap: Check if daily cash compensation for hospital stays is adequate.
    5. Retirement/Savings Gap: If applicable, suggest if the current portfolio lacks endowment or pension features relative to age/income.
    6. Cross-sell Opportunities: Identify specific insurance products that would solve the identified gaps.

    Output Language: ${lang === 'th' ? 'Thai' : 'English'}
    
    Return a JSON object containing:
    - score: A protection index from 0 to 100.
    - gaps: An array of specific gaps found, each with 'category', 'description', and 'priority' (High, Medium, Low).
    - recommendations: An array of strings representing actionable advice and product suggestions.
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
            score: { type: Type.NUMBER, description: "Safety/Protection score from 0-100" },
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
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["score", "gaps", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error: any) {
    console.error("AI analysis failed", error);
    
    // Check for "Requested entity was not found" error globally in service calls
    if (error?.message?.includes("Requested entity was not found")) {
      // Re-trigger auth if possible or return a specific message
      return {
        score: 0,
        gaps: [{ 
          category: lang === 'en' ? "Auth Expired" : "การยืนยันตัวตนหมดอายุ", 
          description: lang === 'en' ? "Your Google Cloud project connection has expired or is invalid. Please sign out and sign in again to re-select your key." : "การเชื่อมต่อโปรเจกต์ Google Cloud หมดอายุหรือเลือกไม่ถูกต้อง โปรดออกจากระบบและเข้าใหม่เพื่อเลือกคีย์อีกครั้ง", 
          priority: "High" 
        }],
        recommendations: [lang === 'en' ? "Refresh your session by logging out and back in." : "รีเฟรชเซสชันของคุณโดยการออกจากระบบและเข้าสู่ระบบใหม่"]
      };
    }

    return {
      score: 0,
      gaps: [{ 
        category: lang === 'en' ? "System Error" : "ข้อผิดพลาดระบบ", 
        description: lang === 'en' ? "Unable to process AI analysis. Please check your internet connection or API key." : "ไม่สามารถประมวลผลการวิเคราะห์ด้วย AI ได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต", 
        priority: "High" 
      }],
      recommendations: [lang === 'en' ? "Contact your agent for a manual gap analysis review." : "โปรดติดต่อตัวแทนของคุณเพื่อขอรับการวิเคราะห์ช่องว่างความคุ้มครองด้วยตนเอง"]
    };
  }
};

/**
 * Expert tax planning using gemini-3-pro-preview for complex reasoning.
 */
export const analyzeTaxOptimization = async (policies: Policy[], profile: UserProfile, lang: Language): Promise<{
  advice: string[];
  suggestedProducts: string[];
  estimatedTotalBenefit: number;
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const policySummary = policies.map(p => {
    return `Plan: ${p.planName}, Company: ${p.company}, Annual Premium: ฿${p.premiumAmount.toLocaleString()}, Frequency: ${p.frequency}, Types: ${p.coverages.map(c => c.type).join(", ")}`;
  }).join("; ");

  const prompt = `
    Act as a Thai Tax Planning Expert. Review the client's insurance portfolio for tax optimization.
    
    Thai Revenue Department Rules (STRICTLY ADHERE TO THESE):
    1. Life Insurance: Deduction up to ฿100,000.
    2. Health Insurance: Deduction up to ฿25,000 (Note: Combined with Life must not exceed ฿100,000).
    3. Pension Insurance: Deduction up to ฿200,000. 
       CRITICAL RULE: The pension deduction MUST NOT exceed 15% of the annual income, even if the premium paid is higher. 
       If 15% of income is less than ฿200,000, then the 15% value is the ceiling.
    
    The TOTAL insurance deduction can reach ฿300,000 (100k Life/Health + 200k Pension).

    Client Context:
    - Name: ${profile.name}
    - Annual Income: ฿${profile.annualIncome.toLocaleString()}
    - Policies: ${policySummary || "No existing policies."}
    
    Task:
    1. Identify if the client is missing out on tax benefits.
    2. Suggest specific ways to fill the tax deduction gaps (e.g., "Increase pension premium by ฿50k, keeping it under your 15% income cap of ฿X").
    3. Calculate estimated total tax benefit based on Thai tax brackets.

    Output Language: ${lang === 'th' ? 'Thai' : 'English'}
    
    Return a JSON object:
    - advice: Array of strings (Strategic tax planning advice).
    - suggestedProducts: Array of strings (Types of insurance to consider for tax saving).
    - estimatedTotalBenefit: Number (Total tax deduction amount used).
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
    console.error("Tax analysis failed", error);
    return {
      advice: ["Unable to load AI tax advice at this time."],
      suggestedProducts: [],
      estimatedTotalBenefit: 0
    };
  }
};

/**
 * Extracting policy details from image/PDF documents.
 * Uses gemini-3-flash-preview for general vision-to-text tasks.
 */
export const parsePolicyDocument = async (base64Data: string, mimeType: string): Promise<Partial<Policy> | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze this insurance policy document and extract the key information into a structured format.
    Return only a JSON object with these keys:
    - company: (string, e.g. "AIA Thailand", "FWD Life Insurance", etc.)
    - planName: (string)
    - premiumAmount: (number)
    - frequency: (one of: "Monthly", "Quarterly", "Yearly")
    - dueDate: (string as YYYY-MM-DD)
    - coverages: (array of objects with keys: type [one of: "Life Insurance", "Health Insurance", "Personal Accident", "Critical Illness", "Savings/Endowment", "Pension/Retirement", "Hospital Benefit"], sumAssured [number], roomRate [number or null])
    
    Important: If multiple coverages exist (e.g. Life + Health Rider), include all.
  `;

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
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company: { type: Type.STRING },
            planName: { type: Type.STRING },
            premiumAmount: { type: Type.NUMBER },
            frequency: { type: Type.STRING, enum: ["Monthly", "Quarterly", "Yearly"] },
            dueDate: { type: Type.STRING },
            coverages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["Life Insurance", "Health Insurance", "Personal Accident", "Critical Illness", "Savings/Endowment", "Pension/Retirement", "Hospital Benefit"] },
                  sumAssured: { type: Type.NUMBER },
                  roomRate: { type: Type.NUMBER, nullable: true }
                },
                required: ["type", "sumAssured"]
              }
            }
          },
          required: ["company", "planName", "premiumAmount", "frequency", "dueDate", "coverages"]
        }
      }
    });

    const result = JSON.parse(response.text.trim());
    return result;
  } catch (err) {
    console.error("AI Policy parsing failed", err);
    return null;
  }
};
