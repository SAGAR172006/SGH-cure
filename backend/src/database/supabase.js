// supabase.js
// Supabase database client module with auto-fallback to offline memory storage.

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export let supabase = null;
export let isOffline = true;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    isOffline = false;
    console.log("Supabase Client initialized successfully.");
  } catch (err) {
    console.warn("Failed to initialize Supabase client, running in offline mode:", err);
  }
} else {
  console.log("Supabase keys missing. SGH running in local-only filesystem simulation mode.");
}

// Local mock database tables for runtime fallbacks
const localDb = {
  patients: [],
  diagnostics: [],
  bookings: [],
  emergency_contacts: []
};

// High-fidelity fallback client mock mimicking Supabase API syntax
export const db = {
  patients: {
    async upsert(data) {
      if (!isOffline) {
        const { error } = await supabase.from('patients').upsert(data);
        if (!error) return { data, error: null };
      }
      const existingIdx = localDb.patients.findIndex(p => p.id === data.id);
      if (existingIdx >= 0) {
        localDb.patients[existingIdx] = { ...localDb.patients[existingIdx], ...data };
      } else {
        localDb.patients.push(data);
      }
      return { data, error: null };
    },
    async select(patientId) {
      if (!isOffline) {
        const { data, error } = await supabase.from('patients').select('*').eq('id', patientId).single();
        if (!error) return { data, error: null };
      }
      const patient = localDb.patients.find(p => p.id === patientId) || null;
      return { data: patient, error: null };
    },
    async listAll() {
      if (!isOffline) {
        const { data, error } = await supabase.from('patients').select('*');
        if (!error) return { data, error: null };
      }
      return { data: localDb.patients, error: null };
    }
  },
  diagnostics: {
    async insert(record) {
      if (!isOffline) {
        const { data, error } = await supabase.from('diagnostics').insert(record).select().single();
        if (!error) return { data, error: null };
      }
      const newRecord = { id: Math.random().toString(36).substring(7), created_at: new Date().toISOString(), ...record };
      localDb.diagnostics.push(newRecord);
      return { data: newRecord, error: null };
    },
    async fetchLatest(patientId) {
      if (!isOffline) {
        const { data, error } = await supabase
          .from('diagnostics')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (!error && data.length > 0) return { data: data[0], error: null };
      }
      const matches = localDb.diagnostics.filter(d => d.patient_id === patientId);
      if (matches.length === 0) return { data: null, error: null };
      const sorted = matches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { data: sorted[0], error: null };
    }
  },
  bookings: {
    async insert(booking) {
      if (!isOffline) {
        const { data, error } = await supabase.from('bookings').insert(booking).select().single();
        if (!error) return { data, error: null };
      }
      const newBooking = { id: Math.random().toString(36).substring(7), created_at: new Date().toISOString(), ...booking };
      localDb.bookings.push(newBooking);
      return { data: newBooking, error: null };
    },
    async list(patientId) {
      if (!isOffline) {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('patient_id', patientId)
          .order('booking_date', { ascending: true });
        if (!error) return { data, error: null };
      }
      const matches = localDb.bookings.filter(b => b.patient_id === patientId);
      const sorted = matches.sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));
      return { data: sorted, error: null };
    }
  }
};
