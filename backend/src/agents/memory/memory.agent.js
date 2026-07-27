// memory.agent.js
// Handles reading and writing patient profile files on local storage and Supabase sync.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../../database/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PATIENTS_DIR = path.join(__dirname, '..', '..', '..', 'patients');

if (!fs.existsSync(PATIENTS_DIR)) {
  fs.mkdirSync(PATIENTS_DIR, { recursive: true });
}

export async function getPatientHistory(patientId) {
  // 1. Try fetching from Supabase Database
  try {
    const { data: dbPatient } = await db.patients.select(patientId);
    const { data: dbDiag } = await db.diagnostics.fetchLatest(patientId);
    const { data: dbBookings } = await db.bookings.list(patientId);

    if (dbPatient) {
      return {
        patient_profile: {
          patientId: dbPatient.id,
          name: dbPatient.name,
          age: dbPatient.age,
          sex: dbPatient.sex,
          phone: dbPatient.phone
        },
        assessment: dbDiag ? {
          department: dbDiag.department,
          possible_conditions: [{ condition: dbDiag.condition, confidence: dbDiag.confidence }],
          severity: dbDiag.severity,
          care_level: dbDiag.care_level
        } : null,
        care_plan: dbDiag ? {
          homeRemedies: dbDiag.home_remedies,
          generalOTC: dbDiag.medications
        } : null,
        recovery_plan: dbDiag ? {
          roadmap: dbDiag.recovery_roadmap
        } : null,
        bookings: dbBookings || []
      };
    }
  } catch (err) {
    console.warn("Supabase fetch failed in memory agent, falling back to local files:", err);
  }

  // 2. Fallback to Local Filesystem
  const patientPath = path.join(PATIENTS_DIR, `patient_${patientId}`);
  if (!fs.existsSync(patientPath)) return null;

  const history = {};
  const files = ['patient_profile.json', 'assessment.json', 'care_plan.json', 'recovery_plan.json'];
  
  files.forEach(file => {
    const filePath = path.join(patientPath, file);
    if (fs.existsSync(filePath)) {
      try {
        history[file.replace('.json', '')] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (err) {
        console.error(`Error reading local memory file ${file}:`, err);
      }
    }
  });

  return Object.keys(history).length > 0 ? history : null;
}

export async function savePatientRecord(patientId, filesMap, structuredDiag = null) {
  // 1. Sync to Supabase Database
  try {
    if (filesMap["patient_profile.json"]) {
      const p = filesMap["patient_profile.json"];
      await db.patients.upsert({
        id: patientId,
        name: p.name || null,
        age: p.age ? parseInt(p.age) : null,
        sex: p.sex || null,
        phone: p.phone || null
      });
    }

    if (structuredDiag && filesMap["assessment.json"]) {
      const ass = filesMap["assessment.json"];
      const care = filesMap["care_plan.json"];
      const rec = filesMap["recovery_plan.json"];

      await db.diagnostics.insert({
        patient_id: patientId,
        symptoms: filesMap["patient_profile.json"]?.symptoms || "Symptoms",
        department: ass.department,
        condition: ass.possible_conditions[0].condition,
        confidence: ass.possible_conditions[0].confidence,
        severity: ass.severity,
        care_level: ass.care_level,
        home_remedies: care?.homeRemedies || "",
        recovery_roadmap: rec?.roadmap || [],
        height: structuredDiag.height,
        weight: structuredDiag.weight,
        bmi: structuredDiag.bmi,
        bmi_range: structuredDiag.bmiRange,
        health_score: structuredDiag.healthScore
      });
    }
  } catch (err) {
    console.warn("Supabase record sync failed in memory agent, falling back to local files:", err);
  }

  // 2. Fallback to Local Filesystem
  const patientPath = path.join(PATIENTS_DIR, `patient_${patientId}`);
  if (!fs.existsSync(patientPath)) {
    fs.mkdirSync(patientPath, { recursive: true });
  }

  Object.entries(filesMap).forEach(([filename, data]) => {
    const filePath = path.join(patientPath, filename);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing local memory file ${filename}:`, err);
    }
  });
}
