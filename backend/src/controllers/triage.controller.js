// triage.controller.js
// Express Controller for routing clinical triage requests to Orchestrator.

import { processTriageWorkflow } from '../agents/orchestrator/orchestrator.agent.js';
import { generateNextQuestionWorkflow } from '../agents/reasoning/question.agent.js';
import { db } from '../database/supabase.js';

// ── Input sanitisation helpers ─────────────────────────────────────────────────────
const sanitiseStr = (v, maxLen = 200) =>
  typeof v === 'string' ? v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, maxLen) : v;
const validPhone = (v) => typeof v === 'string' && /^[0-9+\-() ]{7,20}$/.test(v.trim());

export async function triageIntakeHandler(req, res) {
  const { symptoms, language, profile } = req.body;
  
  if (!symptoms || !language || !profile) {
    return res.status(400).json({ error: "Missing required parameters: symptoms, language, or profile." });
  }

  try {
    const result = await processTriageWorkflow(symptoms, language, profile);
    res.json(result);
  } catch (error) {
    console.error("Controller error executing orchestrator:", error);
    res.status(500).json({ error: "Internal Server Error executing agent workflow." });
  }
}

export async function getPatientsHandler(req, res) {
  try {
    const { data, error } = await db.patients.listAll();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function upsertPatientHandler(req, res) {
  let { id, name, age, sex, phone } = req.body;
  // Sanitise string inputs
  id   = sanitiseStr(id,   100);
  name = sanitiseStr(name, 100);
  sex  = sanitiseStr(sex,  20);
  phone = sanitiseStr(phone, 20);
  if (!id || !name || !age || !sex || !phone) {
    return res.status(400).json({ error: "Missing required patient fields" });
  }
  if (!validPhone(phone)) {
    return res.status(400).json({ error: "Invalid phone number format" });
  }
  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
    return res.status(400).json({ error: "Invalid age value" });
  }
  try {
    const { data, error } = await db.patients.upsert({ id, name, age: ageNum, sex, phone });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error upserting patient:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getBookingsHandler(req, res) {
  const { patientId } = req.params;
  try {
    const { data, error } = await db.bookings.list(patientId);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function createBookingHandler(req, res) {
  const { patient_id, doctor_name, department, booking_date, time_slot } = req.body;
  if (!patient_id || !doctor_name || !department || !booking_date || !time_slot) {
    return res.status(400).json({ error: "Missing required booking fields" });
  }
  try {
    const { data, error } = await db.bookings.insert({
      patient_id,
      doctor_name,
      department,
      booking_date,
      time_slot
    });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getDiagnosticsHandler(req, res) {
  const { patientId } = req.params;
  try {
    const { data, error } = await db.diagnostics.fetchLatest(patientId);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching diagnostics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function nextQuestionHandler(req, res) {
  const { answers, currentStep, language, profile } = req.body;
  if (!answers || currentStep === undefined || !language || !profile) {
    return res.status(400).json({ error: "Missing required parameters: answers, currentStep, language, or profile." });
  }
  try {
    const result = await generateNextQuestionWorkflow(answers, currentStep, language, profile);
    res.json(result);
  } catch (error) {
    console.error("Controller error in nextQuestionHandler:", error);
    res.status(500).json({ error: "Internal Server Error in dynamic question generator." });
  }
}
