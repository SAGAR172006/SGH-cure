// diagnostic.agent.js
// Clinically classifies symptoms to route appropriate medical departments using Gemini LLM.

import { callGemini } from '../../utils/gemini.js';

const medicalDb = {
  gastroenterology: {
    deptName: "Gastroenterology",
    condition: "Functional Dyspepsia / Gastritis",
    confidence: 0.91,
    severity: "Mild",
    careLevel: "Home Care & Outpatient",
    allergies: [],
    criticalConditions: ["Gastritis"],
    medications: ["Tab. Pantoprazole 40mg before meals"],
    addictions: ["None"],
    homeRemedies: "Sip warm ginger tea, eat bland food, avoid spicy/oily food.",
    recoveryDays: [
      "Day 1: Rest, bland diet (rice, curd), warm water hydration.",
      "Day 2: Avoid spices/oils, take Pantoprazole 30 min before meals.",
      "Day 3: Gradually resume regular non-spicy meals."
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
    medications: ["Beta-blockers advisory"],
    addictions: ["None"],
    homeRemedies: "Low sodium food intake, daily blood pressure monitoring.",
    recoveryDays: [
      "Day 1: Rest, avoid caffeine, check blood pressure twice.",
      "Day 2: 20-minute light walk, stay hydrated (2.5L water).",
      "Day 3: Maintain salt restriction, consult cardiologist."
    ]
  },
  dermatology: {
    deptName: "Dermatology",
    condition: "Acute Contact Dermatitis (Skin Rash)",
    confidence: 0.92,
    severity: "Mild",
    careLevel: "Home Care & Outpatient",
    allergies: ["Sulfonamides"],
    criticalConditions: ["Eczema"],
    medications: ["Topic Calamine lotion application"],
    addictions: ["None"],
    homeRemedies: "Keep skin cool, apply cold compress, avoid harsh soaps.",
    recoveryDays: [
      "Day 1: Clean skin with cool water, apply calamine lotion, rest.",
      "Day 2: Avoid direct sunlight, wear loose cotton clothes.",
      "Day 3: Monitor rash expansion, consult dermatologist if itching persists."
    ]
  },
  orthopedics: {
    deptName: "Orthopedics",
    condition: "Osteoarthritis / Patellar Strain (Knee Pain)",
    confidence: 0.85,
    severity: "Moderate",
    careLevel: "Clinical Consultation",
    allergies: [],
    criticalConditions: ["Joint Pain history"],
    medications: ["OTC Pain Relief Gel advisory"],
    addictions: ["None"],
    homeRemedies: "R.I.C.E (Rest, Ice, Compression, Elevation), knee brace support.",
    recoveryDays: [
      "Day 1: Rest knee, apply ice packs for 15 mins, avoid stairs.",
      "Day 2: Wear support sleeve, engage in zero-weight leg extensions.",
      "Day 3: Warm compress, evaluate weight-bearing comfort, walk 10 mins."
    ]
  },
  pediatrics: {
    deptName: "Pediatrics",
    condition: "Mild Viral Fever in Child",
    confidence: 0.90,
    severity: "Mild",
    careLevel: "Home Care",
    allergies: [],
    criticalConditions: ["Child health tracking active"],
    medications: ["Pediatric Paracetamol suspension advisory"],
    addictions: ["None"],
    homeRemedies: "Keep room ventilated, tepid sponge bath, hydration fluids.",
    recoveryDays: [
      "Day 1: Monitor temperature hourly, provide electrolytes, rest.",
      "Day 2: Light diet (soup, porridge), watch activity levels.",
      "Day 3: Confirm fever break (under 99F), check for skin rashes."
    ]
  },
  gynecology: {
    deptName: "Gynecology",
    condition: "Dysmenorrhea (Severe Period Pain)",
    confidence: 0.94,
    severity: "Mild",
    careLevel: "Home Care & Consultation",
    allergies: [],
    criticalConditions: ["Menstrual health active"],
    medications: ["NSAID categories advisory"],
    addictions: ["None"],
    homeRemedies: "Warm heating pad on abdomen, herbal chamomile tea, hydration.",
    recoveryDays: [
      "Day 1: Apply heating pad, drink warm fluids, complete rest.",
      "Day 2: Simple stretching, stay hydrated, avoid processed sugar.",
      "Day 3: Return to normal activities, follow up if cycle irregularities continue."
    ]
  },
  dentistry: {
    deptName: "Dentistry",
    condition: "Dental Caries / Acute Pulpitis (Toothache)",
    confidence: 0.87,
    severity: "Mild",
    careLevel: "Outpatient Dental Visit",
    allergies: [],
    criticalConditions: ["None"],
    medications: ["NSAIDs, antiseptic mouthwash advisory"],
    addictions: ["Tobacco chewing (noted)"],
    homeRemedies: "Warm salt water rinses, clove oil topical dab on tooth.",
    recoveryDays: [
      "Day 1: Avoid hot/cold foods, salt water rinse after every meal.",
      "Day 2: Soft food diet (puree, yogurt), brush gently with soft bristles.",
      "Day 3: Schedule root canal or filling consultation with dentist."
    ]
  },
  ophthalmology: {
    deptName: "Ophthalmology",
    condition: "Dry Eye Syndrome / Astigmatism Strain",
    confidence: 0.82,
    severity: "Mild",
    careLevel: "Home Care & Eye Exam",
    allergies: [],
    criticalConditions: ["Dry eye"],
    medications: ["Lubricating eye drops advisory"],
    addictions: ["None"],
    homeRemedies: "Limit screen time, 20-20-20 rule, warm compress.",
    recoveryDays: [
      "Day 1: Apply lubricating eye drops every 4 hours, reduce screens.",
      "Day 2: Use blue light filters, apply warm tea bag compress.",
      "Day 3: Undergo clinical refraction exam for corrective glasses."
    ]
  },
  ent: {
    deptName: "ENT (Ear, Nose & Throat)",
    condition: "Viral Pharyngitis / Sinusitis",
    confidence: 0.89,
    severity: "Mild",
    careLevel: "Home Care & Outpatient",
    allergies: [],
    criticalConditions: ["Sinus congestion"],
    medications: ["Saline nasal rinse, antihistamines"],
    addictions: ["None"],
    homeRemedies: "Steam inhalation, salt water gargles, warm honey fluids.",
    recoveryDays: [
      "Day 1: Steam inhalation, salt gargle, avoid cold beverages.",
      "Day 2: Hydrate with warm tea, continue throat soothing rinses.",
      "Day 3: Gentle work, ENT consult if fever persists."
    ]
  },
  neurology: {
    deptName: "Neurology",
    condition: "Tension Headache / Migraine Trigger",
    confidence: 0.88,
    severity: "Mild",
    careLevel: "Home Care & Clinical Consult",
    allergies: [],
    criticalConditions: ["Migraine history"],
    medications: ["OTC pain relief (Ibuprofen / Acetaminophen)"],
    addictions: ["None"],
    homeRemedies: "Rest in a quiet, dark room, stay hydrated, reduce screen usage.",
    recoveryDays: [
      "Day 1: Dark room rest, cold forehead compress, sleep 8 hours.",
      "Day 2: Maintain regular meal timings, light walking.",
      "Day 3: Monitor trigger factors, consult neurology if recurrent."
    ]
  },
  pulmonology: {
    deptName: "Pulmonology",
    condition: "Acute Bronchitis / Cough Irritation",
    confidence: 0.86,
    severity: "Moderate",
    careLevel: "Clinical Consultation",
    allergies: [],
    criticalConditions: ["Coughing / Asthma history"],
    medications: ["Bronchodilators advisory, cough suppressant"],
    addictions: ["None"],
    homeRemedies: "Steam inhalation, warm honey liquids, elevate head during sleep.",
    recoveryDays: [
      "Day 1: Rest, avoid dusty spaces, take steam inhalation thrice daily.",
      "Day 2: Drink warm herbal infusions, continue prescribed nebulization.",
      "Day 3: Chest check-up, seek specialist review if breathing heavy."
    ]
  },
  generalMedicine: {
    deptName: "General Medicine",
    condition: "Acute Viral Illness / Body Ache",
    confidence: 0.85,
    severity: "Mild",
    careLevel: "Home Care",
    allergies: [],
    criticalConditions: ["None"],
    medications: ["Paracetamol 500mg"],
    addictions: ["None"],
    homeRemedies: "Bed rest, drink plenty of fluids (water, soups), warm sponging.",
    recoveryDays: [
      "Day 1: Strict bed rest, drink 3L fluids, Paracetamol if fever.",
      "Day 2: Soft bland foods, rest, monitor body temperature.",
      "Day 3: Transition to normal food, follow up if weak."
    ]
  }
};

export async function runDiagnosticTriage(inputText, profileData = {}) {
  try {
    const prompt = `Classify this clinical symptom report: "${inputText}".
Patient profile: Age ${profileData.age || 'unknown'}, Sex ${profileData.sex || 'unknown'}.

Identify the single most appropriate clinical department from the following exact list:
[gastroenterology, cardiology, dermatology, orthopedics, pediatrics, gynecology, dentistry, ophthalmology, ent, neurology, pulmonology, generalMedicine].

Return ONLY a JSON object matching this schema exactly:
{
  "department": "string (one of the exact choices above, in lowercase)",
  "condition": "string (specific clinical diagnosis name, e.g. 'Tension Headache' or 'Acute Sinusitis')",
  "confidence": number_between_0_and_1,
  "severity": "string (Mild/Moderate/Critical)",
  "careLevel": "string (clinical advice regarding care level needed)"
}`;

    const res = await callGemini(prompt, "You are an expert clinical triage system. Classify symptoms accurately.");
    if (res && res.department && medicalDb[res.department]) {
      const dbInfo = medicalDb[res.department];
      return {
        department: res.department,
        possible_conditions: [{ condition: res.condition || dbInfo.condition, confidence: res.confidence || dbInfo.confidence }],
        severity: res.severity || dbInfo.severity,
        care_level: res.careLevel || dbInfo.careLevel,
        red_flags: [],
        dbRecords: { ...dbInfo, condition: res.condition || dbInfo.condition, severity: res.severity || dbInfo.severity, careLevel: res.careLevel || dbInfo.careLevel }
      };
    }
  } catch (err) {
    console.warn("Diagnostic Agent LLM triage failed, using fallback rules:", err);
  }

  // Fallback Rules-based classification
  const text = inputText.toLowerCase();
  let matchedKey = "generalMedicine"; // default fallback is now generalMedicine instead of cardiology!

  if (text.includes("eye") || text.includes("vision") || text.includes("blurry") || text.includes("ಕಣ್ಣು") || text.includes("ದೃಷ್ಟಿ") || text.includes("आँख") || text.includes("नज़र") || text.includes("आंखों")) {
    matchedKey = "ophthalmology";
  } else if (text.includes("tooth") || text.includes("teeth") || text.includes("gum") || text.includes("cavity") || text.includes("toothache") || text.includes("ಹಲ್ಲು") || text.includes("ದಾಂತ") || text.includes("ಹಲ್ಲಿನ") || text.includes("ಒಸಡುಗಳಿಂದ") || text.includes("दांत") || text.includes("मसूड़ों")) {
    matchedKey = "dentistry";
  } else if (text.includes("women") || text.includes("pregnancy") || text.includes("period") || text.includes("menstrual") || text.includes("cramps") || text.includes("ಗರ್ಭಿಣಿ") || text.includes("ಋತುಚಕ್ರ") || text.includes("गर्भवती") || text.includes("महिला") || text.includes("गर्भावस्था")) {
    matchedKey = "gynecology";
  } else if (text.includes("child") || text.includes("baby") || text.includes("toddler") || text.includes("ಮಗು") || text.includes("बच्चा")) {
    matchedKey = "pediatrics";
  } else if (text.includes("skin") || text.includes("rash") || text.includes("itch") || text.includes("eczema") || text.includes("patches") || text.includes("ಚರ್ಮ") || text.includes("ತುರಿಕೆ") || text.includes("त्वचा") || text.includes("खुजली")) {
    matchedKey = "dermatology";
  } else if (text.includes("leg") || text.includes("knee") || text.includes("joint") || text.includes("bone") || text.includes("wrist") || text.includes("stiffness") || text.includes("strain") || text.includes("ಕಾಲು") || text.includes("ಮೊಣಕಾಲು") || text.includes("ಮೂಳೆ") || text.includes("पैर") || text.includes("घुटने") || text.includes("हड्डी")) {
    matchedKey = "orthopedics";
  } else if (text.includes("heart") || text.includes("chest") || text.includes("bp") || text.includes("cardiac") || text.includes("pressure") || text.includes("धड़कन") || text.includes("भारीपन") || text.includes("ದಡದಡ") || text.includes("ಎದೆ")) {
    matchedKey = "cardiology";
  } else if (text.includes("head") || text.includes("migraine") || text.includes("headache") || text.includes("ತಲೆನೋವು") || text.includes("सिरदर्द") || text.includes("सिर दर्द")) {
    matchedKey = "neurology";
  } else if (text.includes("stomach") || text.includes("belly") || text.includes("vomit") || text.includes("nausea") || text.includes("gastric") || text.includes("पेट") || text.includes("ಹೊಟ್ಟೆ") || text.includes("digest")) {
    matchedKey = "gastroenterology";
  } else if (text.includes("cough") || text.includes("cold") || text.includes("throat") || text.includes("congestion") || text.includes("ಗಂಟಲು") || text.includes("खांसी") || text.includes("गला")) {
    matchedKey = "ent";
  } else if (text.includes("breath") || text.includes("wheez") || text.includes("lung") || text.includes("asthma") || text.includes("ಶ್ವಾಸಕೋಶ") || text.includes("फेफड़े")) {
    matchedKey = "pulmonology";
  }

  const deptData = medicalDb[matchedKey];
  return {
    department: matchedKey,
    possible_conditions: [{ condition: deptData.condition, confidence: deptData.confidence }],
    severity: deptData.severity,
    care_level: deptData.careLevel,
    red_flags: [],
    dbRecords: deptData
  };
}
