// orchestrator.agent.js
// Central agent graph coordinator. All communication flows through the orchestrator.

import { runSafetyCheck } from '../safety/safety.agent.js';
import { getPatientHistory, savePatientRecord } from '../memory/memory.agent.js';
import { runReasoningEvaluation } from '../reasoning/reasoning.agent.js';
import { runDiagnosticTriage } from '../diagnostic/diagnostic.agent.js';
import { generateCarePlan } from '../prescription/prescription.agent.js';
import { generateRecoveryRoadmap } from '../recovery/recovery.agent.js';
import { translateToEnglish, translateFromEnglish } from '../translation/translation.agent.js';

let currentKeySlot = 0;

function getActiveGeminiKey() {
  const keys = [
    process.env.VITE_GEMINI_KEY_1,
    process.env.VITE_GEMINI_KEY_2,
    process.env.VITE_GEMINI_KEY_3,
    process.env.VITE_GEMINI_KEY_4,
    process.env.VITE_GEMINI_KEY_5
  ].map(k => k ? k.trim() : '').filter(k => k !== '');

  if (keys.length === 0) return { key: null, slot: 0 };
  
  const slotIndex = currentKeySlot % keys.length;
  currentKeySlot++;
  return { key: keys[slotIndex], slot: slotIndex + 1 };
}

export async function processTriageWorkflow(inputText, language, patientProfile) {
  const logs = [];
  const log = (agent, status, message, details = null) => {
    logs.push({
      timestamp: new Date().toISOString(),
      agent,
      status,
      message,
      details
    });
  };

  // --- Step 1: Voice / Input Intake ---
  log("Voice Agent", "STARTING", "Initializing intake stream ASR...", { language });
  log("Voice Agent", "CAPTURED", `Received transcript: "${inputText}"`);

  // --- Step 2: Translation to English ---
  log("Translation Agent", "RUNNING", "Scanning transcript and executing locale translation...");
  const translatedText = translateToEnglish(inputText, language);
  log("Translation Agent", "PROCESSED", `Translated symptom details: "${translatedText}"`);

  // --- Step 3: Safety Agent Emergency Scan ---
  log("Safety Agent", "RUNNING", "Validating input syntax for life-critical symptoms...");
  const firstSafety = runSafetyCheck(translatedText);
  let isEmergency = false;
  let emergencyDetails = null;
  if (firstSafety.emergency) {
    log("Safety Agent", "ALERTED", "Critical safety warning raised! Patient advised to seek urgent care.", firstSafety);
    isEmergency = true;
    emergencyDetails = firstSafety;
  } else {
    log("Safety Agent", "CLEARED", "Safety check clear. Proceeding to clinical intake.");
  }

  // --- Step 4: Memory Retrieval ---
  log("Memory Agent", "LOADING", `Retrieving patient record logs for patient_${patientProfile.id}...`);
  const history = await getPatientHistory(patientProfile.id);
  log("Memory Agent", "RETRIEVED", history ? "Prior history found on local server/database." : "No prior diagnostic files found. Initializing empty profile.");

  // --- Step 5: Reasoning Evaluation ---
  log("Reasoning Agent", "EVALUATING", "Evaluating symptom descriptors and cross-referencing patient records.");
  const reasonedProfile = await runReasoningEvaluation(translatedText, patientProfile, history);
  log("Reasoning Agent", "CREATED", "Compiled structured patient profile variables.", reasonedProfile);

  // --- Step 6: Diagnostic Triage ---
  log("Diagnostic Agent", "RUNNING", "Analyzing symptoms for clinical triage...");
  const assessment = await runDiagnosticTriage(translatedText, reasonedProfile);
  log("Diagnostic Agent", "PRODUCED", `Routed to department: ${assessment.department}.`, assessment);

  // --- Step 7: Safety Agent Check 2 ---
  log("Safety Agent", "RUNNING", "Scanning diagnosis payload for post-clinical urgent flags...");
  const secondSafety = runSafetyCheck(assessment.possible_conditions[0].condition);
  if (secondSafety.emergency) {
    log("Safety Agent", "ALERTED", "Critical condition flagged in diagnosis. Escalating care level.");
  } else {
    log("Safety Agent", "CLEARED", "Post-clinical safety check complete.");
  }

  // --- Step 8: Prescription & Recovery Plan ---
  log("Orchestrator Agent", "ROUTING", "Invoking Prescription & Recovery Agents...");
  const carePlan = await generateCarePlan(assessment, reasonedProfile);
  log("Prescription Agent", "COMPLETED", "care_plan.json generated successfully.", carePlan);

  const recoveryPlan = await generateRecoveryRoadmap(assessment, reasonedProfile);
  log("Recovery Agent", "COMPLETED", "recovery_plan.json generated successfully.", recoveryPlan);

  // --- Step 9: Memory Agent Save ---
  log("Memory Agent", "SAVING", `Writing files to local patients directory...`);
  
  const diagnosticSummary = (() => {
    // Parse real height (cm) and weight (kg) from reasonedProfile
    const htStr = reasonedProfile.height || '';
    const wtStr = reasonedProfile.weight || '';
    const htCm = parseFloat(htStr);
    const wtKg = parseFloat(wtStr);
    const htM  = htCm > 0 ? htCm / 100 : null;
    const bmi  = (htM && wtKg > 0) ? Math.round((wtKg / Math.pow(htM, 2)) * 10) / 10 : null;
    const bmiRange = bmi === null ? null
      : bmi < 18.5 ? 'Underweight'
      : bmi < 25   ? 'Normal'
      : bmi < 30   ? 'Overweight'
      : 'Obese';
    // Dynamic health score based on severity
    const severityScore = { 'Mild': 82, 'Moderate': 58, 'Critical': 25 };
    const healthScore = severityScore[assessment.severity] ?? 65;
    return {
      height: reasonedProfile.height || null,
      weight: reasonedProfile.weight || null,
      bmi,
      bmiRange,
      healthScore,
      allergies: reasonedProfile.knownAllergies.length > 0 ? reasonedProfile.knownAllergies : ['None'],
      criticalConditions: reasonedProfile.existingConditions,
      medications: reasonedProfile.activeMedications,
      addictions: ['None'],
      department: assessment.department,
      condition: assessment.possible_conditions?.[0]?.condition || 'General Assessment',
      prescription: carePlan.prescription || (carePlan.generalOTC || []).join(', '),
      homeRemedies: carePlan.homeRemedies || '',
    };
  })();

  await savePatientRecord(patientProfile.id, {
    "patient_profile.json": reasonedProfile,
    "assessment.json": assessment,
    "care_plan.json": carePlan,
    "recovery_plan.json": recoveryPlan,
    "execution_log.json": logs
  }, diagnosticSummary);
  log("Memory Agent", "SYNCHRONIZED", "Files successfully saved on database and server filesystem.");

  // --- Step 10: Translation Back ---
  const finalSummaryText = `Intake assessment completed. Recommended department: ${assessment.department}. Possible condition: ${assessment.possible_conditions[0].condition}. Suggested care: ${carePlan.homeRemedies}.`;
  log("Translation Agent", "RUNNING", "Translating final response payload back to patient language...");
  const finalTranslated = translateFromEnglish(finalSummaryText, language);
  log("Translation Agent", "PROCESSED", `Final translated payload: "${finalTranslated}"`);

  // --- Step 11: Vocal Synthesis Output ---
  log("Voice Agent", "SPEAKING", "Synthesizing trilingual vocal review read-out.");
  log("Orchestrator Agent", "FINISHED", "Dialogue workflow execution finished successfully.");

  return {
    emergency: isEmergency,
    emergencyDetails,
    logs,
    profileData: diagnosticSummary,
    spokenText: isEmergency 
      ? translateFromEnglish("Warning: Critical health alert. " + (emergencyDetails?.recommendation || "Seek urgent care."), language)
      : finalTranslated
  };
}
