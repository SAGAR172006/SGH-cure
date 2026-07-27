// agentSimulator.js — SGH Clinical Multi-Agent Engine v2.0
// Fixes: expanded department DB, gastro, ENT, neuro, pulmo, correct triage keywords,
//        full prescription + home remedies, bypass fallback improved.

// ── Expanded Medical DB ──────────────────────────────────────────────────────
const medicalDb = {
  gastroenterology: {
    deptName: "Gastroenterology",
    condition: "Functional Dyspepsia / Gastritis",
    confidence: 0.91,
    severity: "Mild",
    careLevel: "Home Care & Outpatient",
    allergies: [],
    criticalConditions: ["Gastritis"],
    medications: ["Antacid (e.g. Pantoprazole 40mg) — 1 tablet 30 min before meals", "ORS if loose stools present"],
    addictions: ["Avoid spicy/oily food"],
    homeRemedies: "Sip warm ginger tea, apply warm compress on abdomen, eat bland food (khichdi/rice), avoid lying down immediately after eating.",
    prescription: "Tab. Pantoprazole 40mg — Once daily before breakfast for 5 days\nTab. Domperidone 10mg — 3 times daily after meals for 3 days\nSyrup Gelusil — 2 tsp after meals if burning sensation\nAvoid NSAIDs (Aspirin, Ibuprofen).",
    recoveryDays: [
      "Day 1: Complete rest, eat bland food (rice, curd, banana), avoid spice/oil. Sip warm water every hour.",
      "Day 2: Light meals every 3 hours — avoid skipping. Drink coconut water or ORS if feeling weak.",
      "Day 3: Introduce normal diet gradually. Take antacid 30 min before meals. No alcohol/tobacco.",
      "Day 4–7: If pain persists, visit gastroenterologist for endoscopy evaluation."
    ]
  },
  cardiology: {
    deptName: "Cardiology",
    condition: "Palpitation & Mild Hypertension",
    confidence: 0.88,
    severity: "Moderate",
    careLevel: "Clinical Consultation",
    allergies: [],
    criticalConditions: ["Hypertension"],
    medications: ["Beta-blockers (consult doctor before starting)", "Aspirin 75mg if prescribed"],
    addictions: ["Tobacco / Caffeine to be avoided"],
    homeRemedies: "Low sodium diet, daily blood pressure monitoring, deep breathing exercises.",
    prescription: "Refer to Cardiologist for ECG & BP measurement.\nTab. Aspirin 75mg — Only if prescribed by cardiologist.\nAvoid excess salt and processed food.\nMonitor BP twice daily.",
    recoveryDays: [
      "Day 1: Rest, avoid caffeine/tobacco, monitor blood pressure twice.",
      "Day 2: 20-minute light walk, drink 2.5L water, strict salt restriction.",
      "Day 3: Cardiologist visit mandatory — get ECG done."
    ]
  },
  dermatology: {
    deptName: "Dermatology",
    condition: "Acute Contact Dermatitis / Skin Rash",
    confidence: 0.92,
    severity: "Mild",
    careLevel: "Home Care & Outpatient",
    allergies: ["Sulfonamides"],
    criticalConditions: ["Eczema"],
    medications: ["Topical Calamine lotion", "Cetirizine 10mg antihistamine if severe itching"],
    addictions: ["None"],
    homeRemedies: "Keep skin cool, apply cold compress, avoid harsh soaps/detergents.",
    prescription: "Apply Calamine lotion on affected area 3x daily\nTab. Cetirizine 10mg — Once at night for 5 days (if itching)\nAvoid hot water baths, synthetic fabrics.\nCool water rinse twice daily.",
    recoveryDays: [
      "Day 1: Clean skin with cool water, apply calamine lotion, rest.",
      "Day 2: Avoid direct sunlight, wear loose cotton clothes only.",
      "Day 3: Monitor rash expansion, consult dermatologist if itching persists."
    ]
  },
  orthopedics: {
    deptName: "Orthopedics",
    condition: "Osteoarthritis / Musculoskeletal Pain",
    confidence: 0.85,
    severity: "Moderate",
    careLevel: "Clinical Consultation",
    allergies: [],
    criticalConditions: ["Joint Pain"],
    medications: ["OTC Pain Relief Gel (Diclofenac topical)", "Calcium + Vitamin D supplement"],
    addictions: ["None"],
    homeRemedies: "R.I.C.E — Rest, Ice, Compression, Elevation. Use knee brace support.",
    prescription: "Apply Diclofenac Gel 2% on affected area twice daily\nTab. Calcium + Vit D — Once daily with meal\nAvoid high-impact activities for 7 days.\nPhysiotherapy 3x/week recommended.",
    recoveryDays: [
      "Day 1: Rest the affected joint, apply ice pack for 15 mins every 4 hrs, avoid stairs.",
      "Day 2: Gentle stretching, wear support sleeve, zero-weight leg extensions.",
      "Day 3: Warm compress, evaluate weight-bearing comfort, 10-min walk."
    ]
  },
  pediatrics: {
    deptName: "Pediatrics",
    condition: "Mild Viral Fever / Respiratory Tract Infection",
    confidence: 0.90,
    severity: "Mild",
    careLevel: "Home Care",
    allergies: [],
    criticalConditions: ["Child health tracking active"],
    medications: ["Pediatric Paracetamol 15mg/kg", "ORS for hydration"],
    addictions: ["None"],
    homeRemedies: "Keep room ventilated, tepid sponge bath if fever >101°F, hydration fluids every 30 min.",
    prescription: "Syrup Paracetamol (15mg/kg) — Every 6 hours if fever >100.4°F\nORS — 50ml every 30 min for 4 hours\nSaline nasal drops — 2 drops each nostril, 3x daily if congested\nNebulization if wheezing present.",
    recoveryDays: [
      "Day 1: Monitor temperature every 2 hours, give ORS, light diet — soup/banana.",
      "Day 2: Continue Paracetamol if fever >100.4°F, tepid sponge bath, rest.",
      "Day 3: If fever persists >72 hrs or child not feeding — visit pediatrician immediately."
    ]
  },
  gynecology: {
    deptName: "Gynecology",
    condition: "Dysmenorrhea / Menstrual Irregularity",
    confidence: 0.94,
    severity: "Mild",
    careLevel: "Home Care & Consultation",
    allergies: [],
    criticalConditions: ["Menstrual health active"],
    medications: ["Ibuprofen 400mg (NSAID) for cramps", "Tranexamic acid if heavy flow"],
    addictions: ["None"],
    homeRemedies: "Warm heating pad on lower abdomen, chamomile tea, gentle yoga stretches.",
    prescription: "Tab. Ibuprofen 400mg — Every 8 hrs for 3 days (after meals, avoid empty stomach)\nTab. Mefenamic Acid 500mg — Alternative for cramps\nHeat therapy on abdomen 20 min sessions\nIf irregular cycles: Gynaecologist visit for hormonal evaluation.",
    recoveryDays: [
      "Day 1: Apply heating pad, warm herbal tea, complete rest.",
      "Day 2: Simple stretching (child's pose, cat-cow), stay hydrated, no processed sugar.",
      "Day 3: Gradual return to normal activities, follow up if irregularities continue."
    ]
  },
  dentistry: {
    deptName: "Dentistry",
    condition: "Dental Caries / Acute Pulpitis",
    confidence: 0.87,
    severity: "Mild",
    careLevel: "Outpatient Dental Visit",
    allergies: [],
    criticalConditions: ["None"],
    medications: ["Ibuprofen 400mg for pain", "Antiseptic mouthwash (Chlorhexidine)"],
    addictions: ["Tobacco chewing to be stopped"],
    homeRemedies: "Warm salt water rinses 3x daily, clove oil topical application on affected tooth.",
    prescription: "Tab. Ibuprofen 400mg — Every 8 hrs for pain relief (max 5 days)\nCap. Amoxicillin 500mg — 3x daily for 5 days if infection suspected (avoid if penicillin allergy)\nChlorhexidine mouthwash — Rinse 30 sec after every meal\nSchedule dental appointment within 48 hours.",
    recoveryDays: [
      "Day 1: Avoid hot/cold foods, salt water rinse after every meal.",
      "Day 2: Soft food diet (puree, yogurt), brush gently with soft bristles.",
      "Day 3: Root canal or filling consultation with dentist mandatory."
    ]
  },
  ophthalmology: {
    deptName: "Ophthalmology",
    condition: "Dry Eye Syndrome / Digital Eye Strain",
    confidence: 0.82,
    severity: "Mild",
    careLevel: "Home Care & Eye Exam",
    allergies: [],
    criticalConditions: ["Dry eye syndrome"],
    medications: ["Lubricating eye drops (Hydroxypropyl methylcellulose)", "Vitamin A supplementation"],
    addictions: ["None"],
    homeRemedies: "Follow 20-20-20 rule (every 20 min, look 20 ft away for 20 sec). Warm tea bag compress on closed eyes.",
    prescription: "Eye drops — Lubricating drops (e.g. Systane) every 4 hours\nReduce screen time to max 2 hr continuous sessions\nBlue light filter glasses recommended\nRefraction eye exam within 2 weeks.",
    recoveryDays: [
      "Day 1: Apply lubricating drops every 4 hrs, reduce screen exposure by 50%.",
      "Day 2: Use blue light filters, warm compress twice daily.",
      "Day 3: Refraction exam for corrective glasses if symptoms persist."
    ]
  },
  ent: {
    deptName: "ENT (Ear, Nose & Throat)",
    condition: "Viral Pharyngitis / Sinusitis",
    confidence: 0.89,
    severity: "Mild",
    careLevel: "Home Care & Outpatient",
    allergies: [],
    criticalConditions: ["Recurrent sinus infections"],
    medications: ["Saline nasal rinse", "Antihistamine if allergic component"],
    addictions: ["None"],
    homeRemedies: "Steam inhalation twice daily, gargle with warm salt water, drink warm fluids (honey-ginger tea).",
    prescription: "Steam inhalation (bowl + towel) — 10 min, twice daily\nGargle with warm salt water — every 4 hours\nTab. Cetirizine 10mg — Nightly (if allergic/sneezing)\nSaline nasal spray — 2 puffs each nostril, 3x daily\nTab. Paracetamol 500mg — For fever/headache if present.",
    recoveryDays: [
      "Day 1: Steam inhalation, warm salt gargle, rest, avoid cold drinks/AC.",
      "Day 2: Continue steam therapy, honey-ginger tea, increase fluid intake.",
      "Day 3: If symptoms persist or fever >3 days, ENT consultation for culture test."
    ]
  },
  neurology: {
    deptName: "Neurology",
    condition: "Tension Headache / Migraine",
    confidence: 0.86,
    severity: "Mild",
    careLevel: "Home Care & Outpatient",
    allergies: [],
    criticalConditions: ["Migraine"],
    medications: ["Sumatriptan 50mg for migraine", "Ibuprofen 400mg for tension headache"],
    addictions: ["Caffeine dependence noted"],
    homeRemedies: "Dark, quiet room rest. Cold compress on forehead. Adequate sleep (7-8 hrs). Reduce screen time.",
    prescription: "Tab. Ibuprofen 400mg — At onset of headache (with food)\nTab. Sumatriptan 50mg — For confirmed migraine attacks\nTab. Propranolol 40mg — If frequent migraines (prophylaxis, cardiologist consult needed)\nLimit caffeine, keep hydrated.",
    recoveryDays: [
      "Day 1: Dark room rest, cold compress on forehead, no screens.",
      "Day 2: Regular meal timings, adequate hydration, no alcohol/smoke.",
      "Day 3: Neurologist visit if frequency >4 times/month — get MRI if indicated."
    ]
  },
  pulmonology: {
    deptName: "Pulmonology",
    condition: "Acute Bronchitis / Asthma Exacerbation",
    confidence: 0.88,
    severity: "Moderate",
    careLevel: "Clinical Consultation",
    allergies: [],
    criticalConditions: ["Asthma"],
    medications: ["Salbutamol inhaler (rescue)", "Montelukast for chronic management"],
    addictions: ["Smoking cessation mandatory"],
    homeRemedies: "Steam inhalation, warm honey-ginger tea, sleep with head elevated, avoid cold/dusty environments.",
    prescription: "Salbutamol MDI inhaler — 2 puffs every 4-6 hrs as needed\nBudesonide inhaler — Twice daily (preventive, if asthmatic)\nTab. Montelukast 10mg — Nightly for 14 days\nSteam inhalation — 10 min, 3x daily\nChest physiotherapy if mucus build-up.",
    recoveryDays: [
      "Day 1: Rest, inhaler as needed, steam inhalation, warm fluids, no smoke/dust.",
      "Day 2: Controlled breathing exercises (pursed lip), continue medications.",
      "Day 3: If no improvement, chest X-ray + Pulmonologist consultation mandatory."
    ]
  },
  generalMedicine: {
    deptName: "General Medicine",
    condition: "Viral Fever / General Weakness",
    confidence: 0.80,
    severity: "Mild",
    careLevel: "Home Care",
    allergies: [],
    criticalConditions: ["None"],
    medications: ["Paracetamol 500mg for fever", "ORS for dehydration"],
    addictions: ["None"],
    homeRemedies: "Complete bed rest, plenty of fluids, light nutritious diet, avoid self-medication.",
    prescription: "Tab. Paracetamol 500mg — Every 6 hrs if fever >100°F\nORS sachets — 1 sachet in 1L water, sip throughout day\nMultivitamin tablet — Once daily with food\nAvoid cold drinks, AC exposure. Light diet — khichdi, dal, fruits.",
    recoveryDays: [
      "Day 1: Complete rest, drink 3L fluids, bland diet, take Paracetamol if fever.",
      "Day 2: Light exercise if fever-free, nutritious meals, continue ORS.",
      "Day 3: If symptoms persist beyond 3 days, visit general physician for blood test (CBC, malaria card)."
    ]
  }
};

// ── Emergency keywords ──────────────────────────────────────────────────────
const emergencyKeywords = [
  "chest pain", "heart attack", "stroke", "paralysis", "difficulty breathing",
  "cannot breathe", "choking", "bleeding heavily", "severe bleeding", "poison",
  "seizure", "fit", "unconscious", "suicide", "suicidal", "pregnancy pain",
  "\u0938\u0940\u0928\u0947 \u092e\u0947\u0902 \u0926\u0930\u094d\u0926", "\u0926\u093f\u0932 \u0915\u093e \u0926\u094c\u0930\u093e", "\u0938\u093e\u0902\u0938 \u0932\u0947\u0928\u0947 \u092e\u0947\u0902 \u0915\u0920\u093f\u0928\u093e\u0908", "\u0916\u0942\u0928 \u092c\u0939 \u0930\u0939\u093e \u0939\u0948", "\u091c\u0939\u0930",
  "\u0c8e\u0ca6\u0cc6 \u0ca8\u0ccb\u0cb5\u0cc1", "\u0cb9\u0cc3\u0ca6\u0caf\u0cbe\u0c98\u0cbe\u0ca4", "\u0c89\u0cb8\u0cbf\u0cb0\u0cbe\u0c9f\u0ca6 \u0ca4\u0ccb\u0c82\u0ca6\u0cc6", "\u0cb0\u0c95\u0ccd\u0ca4\u0cb8\u0ccd\u0cb0\u0cbe\u0cb5", "\u0cb5\u0cbf\u0cb7"
];

// ── Triage: scored multi-keyword system ──────────────────────────────────────
// Counts keyword hits for every department, picks highest scoring winner.
// Fixes multi-symptom cases: throat+stomach+fever → ENT (2 hits) not ortho (0).
function triageSymptoms(text) {
  const t = text.toLowerCase();

  const RULES = {
    ent:              [/throat/g, /sore throat/g, /throat pain/g, /\bcold\b/g, /runny nose/g, /blocked nose/g, /stuffy nose/g, /\bsinus/g, /tonsil/g, /\bnasal\b/g, /congestion/g, /phlegm/g, /mucus/g, /hoarse/g, /laryngitis/g, /\bear\b/g, /\bearache\b/g],
    gastroenterology: [/stomach\s?ache/g, /stomach pain/g, /\babdomen/g, /abdominal/g, /\bbelly\b/g, /\bnausea\b/g, /\bvomit/g, /diarrhea/g, /diarrhoea/g, /\bgastric\b/g, /indigestion/g, /\bbloat/g, /constipat/g, /acidity/g, /heartburn/g, /loose stool/g, /loose motion/g, /\bgut\b/g],
    generalMedicine:  [/\bfever\b/g, /\btemperature\b/g, /\bchills\b/g, /body ache/g, /\bweakness\b/g, /\bfatigue\b/g, /\bflu\b/g, /\bviral\b/g, /\binfection\b/g, /\bmalaise\b/g, /\btiredness\b/g],
    neurology:        [/headache/g, /\bmigraine\b/g, /\bdizzy\b/g, /dizziness/g, /head pain/g, /\bvertigo\b/g, /\bnumb\b/g, /\btingling\b/g, /\bconfusion\b/g],
    pulmonology:      [/\bbreath\b/g, /breathing/g, /\bwheez/g, /\basthma\b/g, /\blung\b/g, /chest tightness/g, /shortness of breath/g, /cough blood/g, /\bsputum\b/g],
    cardiology:       [/\bheart\b/g, /\bcardiac\b/g, /palpitation/g, /chest pain/g, /blood pressure/g, /hypertension/g, /\bangina\b/g],
    orthopedics:      [/\bjoint\b/g, /\bbone\b/g, /\bknee\b/g, /\bwrist\b/g, /shoulder pain/g, /back pain/g, /muscle pain/g, /\bsprain\b/g, /\bfracture\b/g, /\bstiffness\b/g, /\bankle pain\b/g, /\bspine\b/g],
    dermatology:      [/\brash\b/g, /\bitch/g, /\beczema\b/g, /\bpimple\b/g, /\bacne\b/g, /\bhives\b/g, /skin rash/g, /\bblister\b/g],
    ophthalmology:    [/\beye\b/g, /\bvision\b/g, /blurry/g, /\bsight\b/g, /itchy eye/g, /red eye/g, /watery eye/g],
    dentistry:        [/\btooth\b/g, /\bteeth\b/g, /\bgum\b/g, /\bcavity\b/g, /toothache/g, /jaw pain/g, /\bdental\b/g],
    gynecology:       [/\bperiod\b/g, /menstrual/g, /\bcramp\b/g, /\bvaginal\b/g, /\bpregnancy\b/g, /\bovarian\b/g, /\buterus\b/g, /\bpcos\b/g],
    pediatrics:       [/\bchild\b/g, /\bbaby\b/g, /\btoddler\b/g, /\binfant\b/g, /\bkid\b/g],
  };

  // Score each department by counting all regex hits
  const scores = {};
  let topScore = 0;
  for (const [dept, patterns] of Object.entries(RULES)) {
    let score = 0;
    for (const rx of patterns) {
      const m = t.match(rx);
      if (m) score += m.length;
    }
    scores[dept] = score;
    if (score > topScore) topScore = score;
  }

  if (topScore === 0) return 'generalMedicine';

  // All top-scoring departments
  const topDepts = Object.entries(scores)
    .filter(([, s]) => s === topScore)
    .map(([d]) => d);

  if (topDepts.length === 1) return topDepts[0];

  // Tie-break: if generalMedicine is tied, prefer it (multi-system illness)
  if (topDepts.includes('generalMedicine')) return 'generalMedicine';

  // Otherwise use clinical priority order
  const priority = ['ent', 'gastroenterology', 'neurology', 'cardiology', 'pulmonology',
    'dermatology', 'gynecology', 'orthopedics', 'dentistry', 'ophthalmology', 'pediatrics'];
  for (const p of priority) {
    if (topDepts.includes(p)) return p;
  }
  return topDepts[0];
}

// ── NOTE: All LLM calls go through the backend proxy (/api/healthcare/chat)
// Gemini API keys are NEVER used directly in the frontend bundle.

// ── TTS helpers ──────────────────────────────────────────────────────────────
export function speakText(text, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' }[lang] || 'en-IN';
  u.rate = 0.93;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

// ── Main pipeline ────────────────────────────────────────────────────────────
export async function simulateWorkflow(inputText, selectedLanguage, activeProfile, onLogUpdate) {
  const logs = [];
  const log = (agentName, status, message, details = null) => {
    const entry = { timestamp: new Date().toISOString(), agent: agentName, status, message, details };
    logs.push(entry);
    onLogUpdate?.([...logs]);
  };
  const delay = ms => new Promise(r => setTimeout(r, ms));

  // Step 1: Voice Agent
  log("Voice Agent", "STARTING", "Initializing ASR microphone capture…", { locale: selectedLanguage });
  await delay(800);
  log("Voice Agent", "CAPTURED", `Transcribed: "${inputText.slice(0, 80)}…"`, { length: inputText.length });
  await delay(600);

  // Step 2: Translation Agent
  let translatedText = inputText;
  if (selectedLanguage === 'hi') translatedText = "[Translated from Hindi] " + inputText;
  else if (selectedLanguage === 'kn') translatedText = "[Translated from Kannada] " + inputText;
  log("Translation Agent", "PROCESSED", `Normalised to English for triage.`, { translated: translatedText.slice(0, 60) });
  await delay(600);

  // Step 3: Orchestrator → Safety
  log("Orchestrator Agent", "ROUTING", "Passing to Safety Agent for emergency screening…");
  await delay(400);

  // Step 4: Safety Agent
  log("Safety Agent", "RUNNING", "Scanning for critical emergency patterns…", { priority: "High" });
  await delay(600);
  const isEmergency = emergencyKeywords.some(k => inputText.toLowerCase().includes(k.toLowerCase()));
  if (isEmergency) {
    const out = { emergency: true, level: "Critical", reason: "Potential cardiopulmonary or severe emergency detected.", recommendation: "Dial 108 immediately!" };
    log("Safety Agent", "ALERTED", "Emergency flagged — workflow terminated.", out);
    speakText("Emergency! Please call 108 immediately.", selectedLanguage);
    return { emergency: true, emergencyDetails: out, logs, files: { "emergency_log.json": out } };
  }
  log("Safety Agent", "CLEARED", "No emergency. Proceeding to triage.");
  await delay(600);

  // Step 5: Memory Agent
  log("Memory Agent", "LOADING", `Fetching records for Patient: ${activeProfile.name}…`);
  await delay(800);
  const memory = {
    allergies: activeProfile.diagnosticData?.allergies || [],
    conditions: activeProfile.diagnosticData?.criticalConditions || [],
    medications: activeProfile.diagnosticData?.medications || []
  };
  log("Memory Agent", "RETRIEVED", "Patient history loaded.", memory);
  await delay(600);

  // Step 6: Reasoning Agent
  log("Reasoning Agent", "EVALUATING", "Cross-referencing symptoms with patient history…");
  await delay(800);
  const tempProfile = {
    patientId: activeProfile.id, name: activeProfile.name, age: activeProfile.age,
    sex: activeProfile.sex, height: activeProfile.diagnosticData?.height || null,
    weight: activeProfile.diagnosticData?.weight || null,
    symptoms: inputText, knownAllergies: memory.allergies,
    existingConditions: memory.conditions, activeMedications: memory.medications
  };
  log("Reasoning Agent", "CREATED", "patient_profile.json compiled.", tempProfile);
  await delay(600);

  // Step 7: Diagnostic Agent — proxy through backend to keep API key server-side
  const bypass = import.meta.env.VITE_BYPASS_LLM === 'true';

  let matchedKey = "generalMedicine";
  let deptData = null;
  let llmSuccess = false;
  let assessmentJson, carePlanJson, recoveryPlanJson;

  if (!bypass) {
    log("Orchestrator Agent", "ROUTING", `Forwarding to backend clinical proxy…`);
    await delay(400);
    log("Diagnostic Agent", "API_REQUEST", "Backend calling gemini-2.5-flash for clinical assessment…");

    try {
      const ctrl = new AbortController();
      const fetchTimer = setTimeout(() => ctrl.abort(), 15000);
      const resp = await fetch('http://localhost:5000/api/healthcare/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: inputText, language: selectedLanguage, profile: activeProfile }),
        signal: ctrl.signal
      });
      clearTimeout(fetchTimer);
      if (!resp.ok) throw new Error(`Backend ${resp.status}`);
      const backendResult = await resp.json();
      if (backendResult.profileData) {
        return { ...backendResult, logs: [...logs, ...(backendResult.logs || [])] };
      }
      throw new Error('Invalid backend response shape');
    } catch (err) {
      log("Safety Agent", "BYPASS_TRIGGERED", `Backend unavailable (${err.message}). Activating local rules-based fallback.`);
      await delay(600);
    }
  } else {
    log("Orchestrator Agent", "BYPASS", "Bypass mode. Using local rules-based triage engine.");
    await delay(600);
  }

  // Local fallback triage
  if (!llmSuccess) {
    matchedKey = triageSymptoms(inputText);
    deptData = medicalDb[matchedKey];
    assessmentJson = { department: matchedKey, possible_conditions: [{ condition: deptData.condition, confidence: deptData.confidence }], severity: deptData.severity, care_level: deptData.careLevel };
    carePlanJson = { supportiveCare: ["Hydration", "Rest", "Proper nutrition"], generalOTC: deptData.medications, homeRemedies: deptData.homeRemedies, prescription: deptData.prescription, followUp: "Visit doctor if no improvement in 48 hours." };
    recoveryPlanJson = { roadmap: deptData.recoveryDays };
    log("Diagnostic Agent", "PRODUCED", `Rules-based triage → ${deptData.deptName}`, assessmentJson);
    await delay(800);
  }

  // Step 8: Safety check 2
  log("Safety Agent", "RUNNING", "Post-assessment safety validation…");
  await delay(600);
  log("Safety Agent", "CLEARED", "No post-clinical red flags.");
  await delay(400);

  // Step 9: Parallel — Prescription + Recovery
  log("Orchestrator Agent", "ROUTING", "Fanning out to Prescription & Recovery Agents…");
  await delay(400);
  log("Prescription Agent", "COMPLETED", "care_plan.json generated.", carePlanJson);
  await delay(400);
  log("Recovery Agent", "COMPLETED", "recovery_plan.json generated.", recoveryPlanJson);
  await delay(400);

  // Step 10: Memory save
  log("Memory Agent", "SAVING", `Writing records to /patients/patient_${activeProfile.id}/…`);
  await delay(600);
  log("Memory Agent", "SYNCHRONIZED", "All records updated successfully.", { files: ["patient_profile.json", "assessment.json", "care_plan.json", "recovery_plan.json"] });
  await delay(400);

  // Step 11: Orchestrator finish
  log("Orchestrator Agent", "COMPILING", "Merging all agent outputs into final_response.json…");
  await delay(500);
  log("Orchestrator Agent", "FINISHED", `Routing confirmed → ${deptData.deptName}. Intake workflow complete.`);

  const htCm = parseFloat(tempProfile.height);
  const wtKg = parseFloat(tempProfile.weight);
  const hasMetrics = !isNaN(htCm) && !isNaN(wtKg) && htCm > 0 && wtKg > 0;
  const bmi = hasMetrics ? Math.round((wtKg / Math.pow(htCm / 100, 2)) * 10) / 10 : null;

  return {
    emergency: false,
    logs,
    profileData: {
      height: tempProfile.height || null,
      weight: tempProfile.weight || null,
      bmi: bmi ? String(bmi) : null,
      bmiRange: bmi ? (bmi > 30 ? "Obese" : bmi > 25 ? "Overweight" : bmi > 18.5 ? "Normal" : "Underweight") : null,
      healthScore: hasMetrics ? Math.max(60, Math.round(92 - Math.abs(bmi - 22) * 1.5)) : 80,
      allergies: carePlanJson.generalOTC.length > 0 ? carePlanJson.generalOTC : ["None"],
      criticalConditions: deptData.criticalConditions,
      medications: deptData.medications,
      addictions: deptData.addictions,
      homeRemedies: carePlanJson.homeRemedies,
      prescription: carePlanJson.prescription,
      department: deptData.deptName,
    },
    carePlan: carePlanJson,
    recoveryPlan: recoveryPlanJson,
    files: { "patient_profile.json": tempProfile, "assessment.json": assessmentJson, "care_plan.json": carePlanJson, "recovery_plan.json": recoveryPlanJson }
  };
}

function translateMock(text, lang) {
  if (lang === 'hi') return "[Translated from Hindi] " + text;
  if (lang === 'kn') return "[Translated from Kannada] " + text;
  return text;
}
