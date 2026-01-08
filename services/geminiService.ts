
import { GoogleGenAI, Type } from "@google/genai";
import { Policy, GapAnalysisResult, UserProfile, CoverageType, UnderwritingResult } from "../types";
import { Language } from "../translations";

export const analyzeCoverageGaps = async (policies: Policy[], profile: UserProfile, lang: Language): Promise<GapAnalysisResult> => {
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
    Perform a comprehensive Gap Analysis for a client.
    Client Profile: Age ${age}, Sex ${profile.sex}, Income ฿${profile.annualIncome.toLocaleString()}, Debt ฿${profile.totalDebt.toLocaleString()}.
    Current Insurance Portfolio: ${policySummary || "NONE"}.
    
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

  const prompt = `
    Act as a Thai Tax Planning Expert. 
    Income: ฿${profile.annualIncome.toLocaleString()}
    Policies: ${policySummary || "No existing policies."}
    Calculate tax optimization based on Thai Revenue rules.
    Output Language: ${lang === 'th' ? 'Thai' : 'English'}
    Return JSON: advice (array), suggestedProducts (array), estimatedTotalBenefit (number).
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
    return { advice: [], suggestedProducts: [], estimatedTotalBenefit: 0 };
  }
};

export const parsePolicyDocument = async (base64Data: string, mimeType: string): Promise<Partial<Policy> | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analyze this insurance policy and extract keys: company, planName, premiumAmount, frequency, dueDate, coverages (type, sumAssured, roomRate).`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { data: base64Data.split(',')[1], mimeType: mimeType } }, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company: { type: Type.STRING },
            planName: { type: Type.STRING },
            premiumAmount: { type: Type.NUMBER },
            frequency: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            coverages: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, sumAssured: { type: Type.NUMBER }, roomRate: { type: Type.NUMBER, nullable: true } } } }
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (err) {
    return null;
  }
};

/**
 * AI Underwriting Evaluation
 */
export const performPreUnderwriting = async (
  medicalHistory: string, 
  files: { data: string, mimeType: string }[], 
  lang: Language
): Promise<UnderwritingResult | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Act as an experienced Medical Underwriter for a major Thai insurance company.
    Evaluate the following medical history and attached records for insurance approval risk.
    
    CRITICAL: YOU MUST RESPOND ENTIRELY IN THE REQUESTED LANGUAGE: ${lang === 'th' ? 'THAI' : 'ENGLISH'}.
    Do not mix languages. If the user input is in Thai, respond in Thai.

    Medical History Provided:
    "${medicalHistory}"

    Rules:
    - Risk Levels: Standard (Normal), Sub-standard (Loading premium/Exclusion), Postpone (Wait for more records/time), Decline (Reject).
    - Provide reasoning based on medical risk factors and insurance industry standards.
    - If medical records are attached, prioritize findings in the reports.

    Return JSON:
    - riskLevel: enum ["Standard", "Sub-standard", "Postpone", "Decline"]
    - assessment: string (Detailed assessment summary in ${lang === 'th' ? 'THAI' : 'ENGLISH'})
    - reasons: array of strings (Analysis points in ${lang === 'th' ? 'THAI' : 'ENGLISH'})
    - additionalRequirements: array of strings (Specific documents or exams needed in ${lang === 'th' ? 'THAI' : 'ENGLISH'})
  `;

  const parts: any[] = [{ text: prompt }];
  files.forEach(f => {
    parts.push({ inlineData: { data: f.data.split(',')[1], mimeType: f.mimeType } });
  });

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
    console.error("AI Underwriting failed", err);
    return null;
  }
};
