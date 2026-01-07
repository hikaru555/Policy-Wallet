
import { GoogleGenAI, Type } from "@google/genai";
import { Policy, GapAnalysisResult, UserProfile } from "../types";
import { Language } from "../translations";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeCoverageGaps = async (policies: Policy[], profile: UserProfile, lang: Language): Promise<GapAnalysisResult> => {
  const policySummary = policies.map(p => {
    const coverageDetails = p.coverages.map(c => 
      `${c.type}: Sum Assured ฿${c.sumAssured.toLocaleString()}${c.roomRate ? `, Room Rate ฿${c.roomRate.toLocaleString()}` : ''}`
    ).join(", ");
    return `Policy [${p.planName}]: ${coverageDetails}`;
  }).join("; ");

  const age = new Date().getFullYear() - new Date(profile.birthDate).getFullYear();

  const prompt = `
    Analyze the following insurance portfolio for a Thai resident.
    User Profile:
    - Age: ${age} (${profile.birthDate})
    - Sex: ${profile.sex}
    - Marital Status: ${profile.maritalStatus}
    - Dependents: ${profile.dependents}
    - Annual Income: ฿${profile.annualIncome.toLocaleString()}
    - Monthly Expenses: ฿${profile.monthlyExpenses.toLocaleString()}
    - Total Debt/Liabilities: ฿${profile.totalDebt.toLocaleString()}

    Current Portfolio: ${policySummary || "No active policies"}
    
    Instructions:
    Identify coverage gaps based on Thai financial planning standards:
    1. Life coverage (Sum Assured) should be at least (Total Debt + (Annual Income * Dependents / 2)) OR 5-10x annual income.
    2. Health room rate should be appropriate for private hospitals (฿4,000-฿8,000 for standard, ฿10,000+ for premium).
    3. Critical illness coverage should be 2-3x annual income to cover lost income and rehabilitation.
    4. Accident coverage is high priority if the user is the main breadwinner or has significant debts.
    5. Take marital status and number of dependents into account for priority.

    Output Language: ${lang === 'th' ? 'Thai' : 'English'}
    Provide a safety score (0-100), specific gaps with priority, and recommendations.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Safety score from 0-100" },
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

  try {
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return {
      score: 50,
      gaps: [{ category: "Analysis Error", description: "Could not perform detailed analysis.", priority: "Low" }],
      recommendations: ["Consult with your agent for manual review."]
    };
  }
};
