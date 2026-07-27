-- schema.sql
-- Table structure for Smart GOV Health (SGH-Cure) Supabase Database

-- 1. Patients profile table
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  sex VARCHAR(20) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Diagnostic records
CREATE TABLE IF NOT EXISTS diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR(100) REFERENCES patients(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  department VARCHAR(100) NOT NULL,
  condition VARCHAR(255) NOT NULL,
  confidence FLOAT NOT NULL,
  severity VARCHAR(50) NOT NULL,
  care_level VARCHAR(100),
  home_remedies TEXT,
  recovery_roadmap TEXT[], -- Days checklist array
  height VARCHAR(50),
  weight VARCHAR(50),
  bmi FLOAT,
  bmi_range VARCHAR(50),
  health_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR(100) REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  booking_date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone VARCHAR(20) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
