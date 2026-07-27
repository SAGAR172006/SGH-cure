// reasoning.agent.js
// Evaluates patient symptom context to construct structured profile logs via Gemini LLM.

import { callGemini } from '../../utils/gemini.js';

export async function runReasoningEvaluation(inputText, profile, history) {
  const baseProfile = {
    patientId: profile.id || 'generic',
    name: profile.name || 'Anonymous',
    age: profile.age || null,
    sex: profile.sex || 'Female',
    height: profile.height || null,
    weight: profile.weight || null,
    symptoms: inputText,
    knownAllergies: history?.patient_profile?.knownAllergies || profile.knownAllergies || [],
    existingConditions: history?.patient_profile?.existingConditions || profile.existingConditions || [],
    activeMedications: history?.patient_profile?.activeMedications || profile.activeMedications || [],
    hasHistoricalRecords: !!history,
    missingFields: []
  };

  try {
    const prompt = `Analyze this clinical symptom description: "${inputText}".
Cross-reference with patient's basic info:
Name: ${baseProfile.name}
Age: ${baseProfile.age}
Sex: ${baseProfile.sex}
Current allergies: ${baseProfile.knownAllergies.join(', ') || 'None'}
Current chronic conditions: ${baseProfile.existingConditions.join(', ') || 'None'}
Current medications: ${baseProfile.activeMedications.join(', ') || 'None'}

Extract and infer updated profile facts. Return ONLY a JSON object matching this schema exactly:
{
  "age": number_or_null,
  "sex": "string (Male/Female/Other)",
  "height": "string_or_null (e.g. 165 cm)",
  "weight": "string_or_null (e.g. 60 kg)",
  "extractedAllergies": ["string"],
  "extractedConditions": ["string"],
  "extractedMedications": ["string"]
}`;

    const res = await callGemini(prompt, "You are a clinical reasoning assistant. Extract patient facts accurately.");
    if (res) {
      baseProfile.age = res.age || baseProfile.age;
      baseProfile.sex = res.sex || baseProfile.sex;
      baseProfile.height = res.height || baseProfile.height;
      baseProfile.weight = res.weight || baseProfile.weight;
      if (res.extractedAllergies?.length) {
        baseProfile.knownAllergies = Array.from(new Set([...baseProfile.knownAllergies, ...res.extractedAllergies]));
      }
      if (res.extractedConditions?.length) {
        baseProfile.existingConditions = Array.from(new Set([...baseProfile.existingConditions, ...res.extractedConditions]));
      }
      if (res.extractedMedications?.length) {
        baseProfile.activeMedications = Array.from(new Set([...baseProfile.activeMedications, ...res.extractedMedications]));
      }
    }
  } catch (err) {
    console.warn("Reasoning Agent LLM failed, using rules-based extraction:", err);
  }

  // Calculate missing fields
  const missing = [];
  if (!baseProfile.age) missing.push('age');
  if (!baseProfile.height) missing.push('height');
  if (!baseProfile.weight) missing.push('weight');
  baseProfile.missingFields = missing;

  return baseProfile;
}
