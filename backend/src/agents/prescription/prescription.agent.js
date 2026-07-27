// prescription.agent.js
// Compiles tailored home remedies, general OTC suggestions, and clinical care plans via Gemini LLM.

import { callGemini } from '../../utils/gemini.js';

export async function generateCarePlan(assessment, profileData = {}) {
  const dbData = assessment.dbRecords || {};

  try {
    const prompt = `Based on the diagnostic assessment:
Department: ${assessment.department}
Assessed Condition: ${assessment.possible_conditions?.[0]?.condition || "Mild Illness"}
Severity Level: ${assessment.severity || "Mild"}
Patient Profile: Age ${profileData.age || 'unknown'}, Sex ${profileData.sex || 'unknown'}.

Generate a personalized Care Plan. Return ONLY a JSON object matching this schema exactly:
{
  "supportiveCare": ["string (general care instructions like rest, hydration, diet)"],
  "generalOTC": ["string (safe over-the-counter medication class advisories, e.g. 'Paracetamol 500mg as needed')"],
  "homeRemedies": "string (bullet points or a paragraph of traditional/home care practices)",
  "prescription": "string (suggested temporary relief course)",
  "followUp": "string (clinical warning check instructions)"
}`;

    const res = await callGemini(prompt, "You are a clinical prescription assistant. Recommend safe OTC care plans.");
    if (res && res.supportiveCare && res.generalOTC) {
      return {
        supportiveCare: res.supportiveCare,
        generalOTC: res.generalOTC,
        homeRemedies: res.homeRemedies || dbData.homeRemedies,
        prescription: res.prescription || dbData.prescription || "",
        followUp: res.followUp || "Consult clinical desk if symptoms do not improve within 48 hours."
      };
    }
  } catch (err) {
    console.warn("Prescription Agent LLM failed, using rules-based fallback:", err);
  }

  // Fallback care plan
  return {
    supportiveCare: ["Hydration", "Complete rest", "Targeted symptom tracking"],
    generalOTC: dbData.medications || ["General multivitamin advisory"],
    homeRemedies: dbData.homeRemedies || "Keep well rested, drink warm water, avoid heavy foods.",
    prescription: dbData.prescription || "",
    followUp: "Consult clinical desk if symptoms do not improve within 48 hours."
  };
}
