
import React, { useState } from 'react';
import { GapAnalysisResult, Policy, UserProfile } from '../types';
import { analyzeCoverageGaps } from '../services/geminiService';
import { translations, Language } from '../translations';

interface GapAnalysisViewProps {
  policies: Policy[];
  profile: UserProfile;
  lang: Language;
}

const GapAnalysisView: React.FC<GapAnalysisViewProps> = ({ policies, profile, lang }) => {
  const t = translations[lang];
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapAnalysisResult | null>(null);

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const res = await analyzeCoverageGaps(policies, profile, lang);
      setResult(res);
    } catch (e) {
      alert("Failed to run analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-bold text-lg">{t.analysis}</h4>
          <p className="text-sm text-slate-500">Intelligent review based on your profile.</p>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={loading || policies.length === 0}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : t.runAnalysis}
        </button>
      </div>

      {!result && !loading && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <div className="text-4xl mb-2">🤖</div>
          <p className="text-slate-600">{t.runAnalysis} - <b>{profile.name}</b></p>
        </div>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-slate-100 rounded-xl"></div>
          <div className="h-48 bg-slate-100 rounded-xl"></div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  strokeDasharray={213.6}
                  strokeDashoffset={213.6 - (213.6 * result.score) / 100}
                  className="text-indigo-600 transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">{result.score}%</div>
            </div>
            <div>
              <p className="font-bold text-slate-800">{t.healthScore}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h5 className="font-bold text-sm text-slate-700 uppercase tracking-wider">{t.gaps}</h5>
              {result.gaps.map((gap, i) => (
                <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-xs text-red-800">{gap.category}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-200 text-red-900">{gap.priority}</span>
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed">{gap.description}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h5 className="font-bold text-sm text-slate-700 uppercase tracking-wider">{t.recommendations}</h5>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start text-xs text-slate-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <span className="mr-2 text-emerald-600">✓</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GapAnalysisView;
