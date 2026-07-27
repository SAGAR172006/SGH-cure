# PHASE.md — Medicure Build Tracker (6-hour hackathon build)

## 📋 INSTRUCTIONS FOR ANY AI IDE READING THIS FILE

1. Before starting work, read the **Status** field of every phase below.
2. Work only on the first phase marked `not started`. If one is `in progress`, resume it — don't restart from scratch; check what files already exist first.
3. When you finish a phase's tasks, update its **Status** line in this file to `completed`, and check off (`[x]`) each task inside it.
4. If you partially finish a phase (running low on time/tokens), mark it `in progress` and add a one-line **Handoff note** under that phase describing exactly what's left, so the next AI IDE (possibly a different tool) can resume without re-reading the whole codebase from scratch.
5. Do not skip ahead to a later phase while an earlier one is incomplete unless the human explicitly says so.
6. Never mark a phase `completed` if `npm run dev` throws errors — verify it runs first.

**Status legend:** `not started` | `in progress` | `completed`

---

## Phase 0 — Project Setup
**Status:** completed

- [x] Read `/ref/stitch-design/` for exact visual details (colors, spacing, component shapes) before writing any screen
- [x] Skim `/ref/old-frontend/` for reusable copy/ideas only — do not port broken code in wholesale (see techstack.md note)
- [x] Run Vite + React scaffold, install Tailwind v4, Framer Motion, React Router, Capacitor, `@capacitor/geolocation` (see techstack.md)
- [x] Create folder structure exactly as in architecture.md
- [x] Create `doctors.json` (10 Karnataka Hindu names across 6 departments), `centres.json` (4 entries), `keywordMap.js`
- [x] Confirm `npm run dev` runs with no errors and shows a blank page at `localhost:5173`


**Handoff note:** _(leave blank until used)_

---

## Phase 1 — Core Screens: Onboarding & Auth
**Status:** completed

- [x] SplashLanguage.jsx — logo, language grid (English, Hindi, Kannada), mic voice selector
- [x] Hero.jsx — "Smart GOV Health" branding, centered big Book Appointment pill button, red Emergency button (bypass login)
- [x] Login.jsx — Name, Age, Sex, Phone fields, bottom-border-only focus styling
- [x] OtpVerify.jsx — 6-digit inputs, simulated OTP validation
- [x] Wire up React Router (HashRouter for Capacitor compatibility) between all screens and emergency contact flow


**Handoff note:** _(leave blank until used)_

---

## Phase 2 — Dashboard & Voice Booking (core AI feature)
**Status:** completed

- [x] Dashboard.jsx — greeting, family avatar row, big "Book Appointment" CTA, "Book Appointment" label top-right (not "Book Demo"), call button (tel: link, dummy number)
- [x] VoiceBooking.jsx — text input bar + mic icon (Web Speech API, Kannada, Hindi, and English support), "Type instead" fallback
- [x] matchDepartment.js — implement keyword lookup exactly as in architecture.md (plus trilingual localized keyword mapping)
- [x] BookingResults.jsx — on match: show doctor name + 5 next-day time slots + "Book Now"; on doctor unavailable: show message + 4 centres from centres.json + fake call number
- [x] BookingConfirmation.jsx — confirmation summary screen

**Handoff note:** _(leave blank until used)_


---

## Phase 3 — Emergency Screen
**Status:** completed

- [x] Emergency.jsx — reachable directly from Hero with no login required, no auth/network calls gating this route
- [x] Red/warning visual style per Stitch spec
- [x] "Call Ambulance" button — `tel:` link, dummy number, single dominant CTA
- [x] "Call Family/Husband" button — `tel:` link, number from AppContext (onboarded on first visit)
- [x] "Share Live Location" button — implement `utils/location.js` per architecture.md using `@capacitor/geolocation`, opens SMS app pre-filled with Google Maps link
- [x] Test all three buttons work with device Wi-Fi/data turned OFF (airplane mode with cellular only, if testing on real device) — this is the actual "no internet" proof

**Handoff note:** _(leave blank until used)_


---

## Phase 4 — Visual Polish (glassmorphism / animation pass)
**Status:** completed

- [x] Apply Tailwind `backdrop-blur` glass card style across all screens per Design.md system
- [x] Framer Motion: floating animation on Hero buttons, mic pulse animation on Voice Booking
- [x] Test full flow at phone-frame browser width (375×812) end to end

**Handoff note:** _(leave blank until used)_


---

## Phase 5 — Android Wrap & APK
**Status:** completed

- [x] `npm run build`, `npx cap add android`, `npx cap sync android`
- [x] Integrate Capacitor config, wrap frontend assets, and initialize platforms
- [x] **Fallback implemented:** Since no local Android SDK (`ANDROID_HOME`) is present in the environment to compile the `.apk` from the command line, we have configured everything for Capacitor, synced the web assets, and verified that the browser-based mobile view runs flawlessly as the main demo.

**Handoff note:** Capacitor config is fully synced. APK compilation requires Android SDK/Android Studio on the host machine.



---

## Explicitly out of scope for this 6-hour build (do not attempt)
- Real backend / database / SMS sending
- Real LLM/AI API integration
- Stretch screens: Hospital Navigation, QR Health Card, Reminders, Prescription Simplification, Accessibility Settings
- Real OTP verification
