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
**Status:** not started

- [ ] Read `/ref/stitch-design/` for exact visual details (colors, spacing, component shapes) before writing any screen
- [ ] Skim `/ref/old-frontend/` for reusable copy/ideas only — do not port broken code in wholesale (see techstack.md note)
- [ ] Run Vite + React scaffold, install Tailwind v4, Framer Motion, React Router, Capacitor, `@capacitor/geolocation` (see techstack.md)
- [ ] Create folder structure exactly as in architecture.md
- [ ] Create `doctors.json` (10 Karnataka Hindu names across 6 departments), `centres.json` (4 entries), `keywordMap.js`
- [ ] Confirm `npm run dev` runs with no errors and shows a blank page at `localhost:5173`

**Handoff note:** _(leave blank until used)_

---

## Phase 1 — Core Screens: Onboarding & Auth
**Status:** not started

- [ ] SplashLanguage.jsx — logo, language grid (Kannada + English minimum for MVP), mic "speak your language" button
- [ ] Hero.jsx — "Medicure" logo, centered big "Book Appointment" pill button, floating animated secondary buttons, red Emergency button (reachable without login)
- [ ] Login.jsx — Name, Age, Sex, Phone fields only (per spec: no signup, no email)
- [ ] OtpVerify.jsx — 6-digit input, fake "any code works" verification for demo speed
- [ ] Wire up React Router between all 4 screens

**Handoff note:** _(leave blank until used)_

---

## Phase 2 — Dashboard & Voice Booking (core AI feature)
**Status:** not started

- [ ] Dashboard.jsx — greeting, family avatar row, big "Book Appointment" CTA, "Book Appointment" label top-right (not "Book Demo"), call button (tel: link, dummy number)
- [ ] VoiceBooking.jsx — text input bar + mic icon (Web Speech API, Kannada locale `kn-IN`), "Type instead" fallback
- [ ] matchDepartment.js — implement keyword lookup exactly as in architecture.md
- [ ] BookingResults.jsx — on match: show doctor name + 5 next-day time slots + "Book Now"; on doctor unavailable: show message + 4 centres from centres.json + fake call number
- [ ] BookingConfirmation.jsx — confirmation summary screen

**Handoff note:** _(leave blank until used)_

---

## Phase 3 — Emergency Screen
**Status:** not started

- [ ] Emergency.jsx — reachable directly from Hero with no login required, no auth/network calls gating this route
- [ ] Red/warning visual style per Stitch spec
- [ ] "Call Ambulance" button — `tel:` link, dummy number, single dominant CTA
- [ ] "Call Family/Husband" button — `tel:` link, number from AppContext (hardcode for demo)
- [ ] "Share Live Location" button — implement `utils/location.js` per architecture.md using `@capacitor/geolocation`, opens SMS app pre-filled with Google Maps link
- [ ] Test all three buttons work with device Wi-Fi/data turned OFF (airplane mode with cellular only, if testing on real device) — this is the actual "no internet" proof

**Handoff note:** _(leave blank until used)_

---

## Phase 4 — Visual Polish (glassmorphism / animation pass)
**Status:** not started

- [ ] Apply Tailwind `backdrop-blur` glass card style across all screens per Design.md system
- [ ] Framer Motion: floating animation on Hero buttons, mic pulse animation on Voice Booking
- [ ] Test full flow at phone-frame browser width (375×812) end to end

**Handoff note:** _(leave blank until used)_

---

## Phase 5 — Android Wrap & APK
**Status:** not started

- [ ] `npm run build`, `npx cap add android`, `npx cap sync android`
- [ ] `npx cap open android` → run on emulator/device via Android Studio
- [ ] Confirm app installs and the full flow works on an actual Android device
- [ ] **Fallback if this phase runs out of time:** demo from the browser device-frame view instead; note this clearly to the human before the deadline, don't silently skip

**Handoff note:** _(leave blank until used)_

---

## Explicitly out of scope for this 6-hour build (do not attempt)
- Real backend / database / SMS sending
- Real LLM/AI API integration
- Stretch screens: Hospital Navigation, QR Health Card, Reminders, Prescription Simplification, Accessibility Settings
- Real OTP verification
