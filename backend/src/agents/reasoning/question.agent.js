// question.agent.js
// Handles dynamic, context-aware next question generation and differential diagnosis probabilities.

import { callGemini } from '../../utils/gemini.js';

export async function generateNextQuestionWorkflow(answers, currentStep, language, profile) {
  const timestamp = new Date().toISOString();
  const logs = [];

  // 1. Memory Agent: Read history & update clinical intake files
  logs.push({
    timestamp,
    agent: "Memory Agent",
    status: "READ",
    message: `Read patient profile for ${profile.name || 'Patient'}. Current conversation step: ${currentStep}.`
  });

  // Let's call Gemini to process the updated intake and select the next question
  const prompt = `You are a clinical multi-agent orchestrator conducting a voice-based patient intake.
Patient Info:
Name: ${profile.name || 'Anonymous'}
Age: ${profile.age || 'unknown'}
Gender: ${profile.sex || 'unknown'}
Height: ${profile.diagnosticData?.height || 'not provided'}
Weight: ${profile.diagnosticData?.weight || 'not provided'}

Answers Collected So Far:
${JSON.stringify(answers, null, 2)}

Current Intake Step (Question Count): ${currentStep}
Language: ${language} (Format the next question strictly in this language. E.g. 'en', 'hi' for Hindi, 'kn' for Kannada)

Your tasks:
1. Act as the Memory Agent: Infer any symptoms, locations, severity, or facts from the symptoms. If the patient has already described details like pain location ("feet", "head") or pain nature ("sharp", "throbbing"), mark them as inferred and DO NOT ask about them again.
2. Act as the Diagnostic Agent: Calculate the top 3 differential diagnoses and their sorted probabilities (must sum close to 100%).
3. Act as the Reasoning Agent: Decide on the most valuable next question that helps narrow down the top diagnoses.
   - The first question was already asked. We must ask at least 6 questions and at most 10 questions.
   - If currentStep >= 6 and we have enough clinical clarity to route the department, set "shouldEnd" to true.
   - If currentStep < 6, you MUST set "shouldEnd" to false and provide a highly clinical next question.
   - Do NOT ask redundant questions. If the patient said "sharp pain in feet", do NOT ask "where is the pain" or "what is the nature of the pain". Instead, ask about triggers, duration, fever, or relevant medical history.

Return ONLY a JSON object matching this schema exactly:
{
  "updatedAnswers": {
    "symptoms": "...",
    "location": "string_or_null (e.g. 'Feet', 'Head')",
    "nature": "string_or_null (e.g. 'Sharp', 'Dull')",
    "inferredLocation": true_or_false,
    "inferredNature": true_or_false
  },
  "differentials": [
    { "name": "Condition name", "prob": "Percentage (e.g. 55%)" },
    { "name": "Condition name", "prob": "Percentage (e.g. 30%)" },
    { "name": "Condition name", "prob": "Percentage (e.g. 15%)" }
  ],
  "nextQuestion": "string (The actual next question to speak to the patient in the requested language)",
  "shouldEnd": true_or_false,
  "reasoningMessage": "string (A short explanation of why this question was selected)"
}`;

  try {
    const res = await callGemini(prompt, "You are a clinical reasoning and triage assistant.");
    
    // Log Memory Agent updates
    logs.push({
      timestamp: new Date().toISOString(),
      agent: "Memory Agent",
      status: "UPDATED",
      message: `Intake file modified. Inferred location: ${res.updatedAnswers?.location || 'none'}, Inferred nature: ${res.updatedAnswers?.nature || 'none'}.`
    });

    // Log Diagnostic Agent differentials
    const diffsStr = res.differentials?.map(d => `${d.name} (${d.prob})`).join(', ') || 'none';
    logs.push({
      timestamp: new Date().toISOString(),
      agent: "Diagnostic Agent",
      status: "DIFFERENTIALS",
      message: `Sorted Probabilities: ${diffsStr}`
    });

    // Log Reasoning Agent next question decision
    logs.push({
      timestamp: new Date().toISOString(),
      agent: "Reasoning Agent",
      status: "NEXT_QUESTION",
      message: res.reasoningMessage || `Selected next clinical question for step ${currentStep}.`
    });

    return {
      updatedAnswers: { ...answers, ...res.updatedAnswers },
      differentials: res.differentials || [],
      nextQuestion: res.nextQuestion,
      shouldEnd: res.shouldEnd || currentStep >= 10,
      logs
    };
  } catch (err) {
    console.error("Gemini failed in next-question workflow:", err);
    // Graceful fallback if LLM is rate-limited or fails
    const fallbackQuestion = currentStep >= 6 ? null : "Could you describe any other symptoms or history you have?";
    return {
      updatedAnswers: answers,
      differentials: [{ name: "General Assessment", prob: "100%" }],
      nextQuestion: fallbackQuestion,
      shouldEnd: currentStep >= 6,
      logs: [
        {
          timestamp: new Date().toISOString(),
          agent: "Orchestrator Agent",
          status: "FALLBACK",
          message: "Gemini query failed. Using rules-based clinical fallback."
        }
      ]
    };
  }
}
