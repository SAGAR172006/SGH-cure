// recovery.agent.js
// Compiles home recovery timelines via Gemini LLM.

import { callGemini } from '../../utils/gemini.js';

export async function generateRecoveryRoadmap(assessment, profileData = {}) {
  const dbData = assessment.dbRecords || {};

  try {
    const prompt = `Based on the diagnostic assessment:
Department: ${assessment.department}
Assessed Condition: ${assessment.possible_conditions?.[0]?.condition || "Mild Illness"}
Severity Level: ${assessment.severity || "Mild"}

Generate a daily home recovery roadmap. Return ONLY a JSON object matching this schema exactly:
{
  "roadmap": [
    "Day 1: string (detailed target activity/rest goal)",
    "Day 2: string (detailed progression check)",
    "Day 3: string (detailed follow-up instructions)"
  ]
}`;

    const res = await callGemini(prompt, "You are a clinical recovery planner. Formulate recovery roadmaps.");
    if (res && res.roadmap?.length) {
      return {
        roadmap: res.roadmap
      };
    }
  } catch (err) {
    console.warn("Recovery Agent LLM failed, using rules-based fallback:", err);
  }

  // Fallback recovery plan
  return {
    roadmap: dbData.recoveryDays || [
      "Day 1: Rest, stay hydrated, avoid heavy physical strain.",
      "Day 2: Engage in light inside activities only.",
      "Day 3: Monitor temperature/pain, consult doctor if no progress."
    ]
  };
}
