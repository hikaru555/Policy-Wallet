
import { GoogleGenAI, Type } from "@google/genai";
import { Policy, GapAnalysisResult, UserProfile } from "../types";
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
    4. Retirement/Savings Gap: If applicable, suggest if the current portfolio lacks endowment or pension features relative to age/income.
    5. Cross-sell Opportunities: Identify specific insurance products that would solve the identified gaps.

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
  } catch (error) {
    console.error("Failed to parse Gemini response or API error", error);
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
