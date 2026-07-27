# TECHSTACK.md — Medicure (ClinicFlow AI) — Hackathon Build

**Deadline: 6 hours. Every choice below is optimized for speed, zero cost, and demo reliability — not long-term scale.**

---

## Why this stack (in one line)
One React + Vite web codebase, styled with Tailwind, wrapped by **Capacitor** into a real installable Android `.apk`. You develop and preview 95% of the time in a normal browser tab (resized to phone dimensions) — no emulator, no Android Studio needed until the very last step.

## Core stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **React 18 + Vite** | Fastest hot-reload dev loop of any option. Any AI IDE (Cursor/Antigravity/Kiro) reads/writes plain `.jsx` files with no hidden config. |
| Styling | **Tailwind CSS v4** | Matches your existing Design.md system approach. CSS-first `@theme` config (no `tailwind.config.js`). |
| Animation | **Framer Motion** | For the floating buttons, mic pulse, screen transitions from your Stitch spec. |
| Routing | **React Router v6** | Simple screen-to-screen navigation (Splash → Login → OTP → Dashboard → Booking → Confirmation → Emergency). |
| State | **React Context + useState only** | No Redux/Zustand — for a 6-hour build, extra state libraries cost setup time for no real benefit at this scope. |
| "AI" symptom matching | **Local JS rule-based function** (`matchDepartment(text)`), keyword lookup table | Zero API cost, zero network dependency, zero risk of failing live on stage. This is the pragmatic "AI" for a demo — see architecture.md for the exact logic. |
| Voice input | **Web Speech API** (`SpeechRecognition`), browser-native, free | Works in Chrome/Android WebView without any SDK. Falls back to text input if unsupported — Stitch spec already includes a "Type instead" fallback. |
| Mock data | **Static JSON files** (`doctors.json`, `centres.json`) | 10 doctors, 6 departments, 4 fallback centres — all hardcoded, no database, no backend server needed for a working demo. |
| Mobile wrapper | **Capacitor 6** (by Ionic) | Wraps the built web app into a real Android project. You keep writing normal React code; Capacitor just packages it. |
| Dev preview ("see it like a phone") | **Browser DevTools device toolbar** (Chrome/Edge, `Ctrl+Shift+M`) pointed at `localhost:5173` | This is your primary "run it and see mobile view" loop — instant, no build step, works identically on Windows and Mac. |
| Real device / APK test | `npx cap run android` (needs Android Studio + an emulator or USB-connected phone) | Only used near the end, to produce and sideload the actual `.apk`. |
| Offline location (Emergency) | **`@capacitor/geolocation`** plugin | Reads GPS coordinates directly from hardware — no internet needed, per your reference conversation. Free, official Capacitor plugin. |
| Emergency call + location share | **`tel:` and `sms:` URI links** (no plugin needed) | `tel:` opens the dialer pre-filled (one more tap to confirm — same behavior as iOS native). `sms:` opens the SMS app pre-filled with a Google Maps link built from the GPS coords — user taps Send once. Works with zero internet, zero backend, zero cost. |

## Reference material
- `/ref/stitch-design/` — your Stitch design export. Treat as the visual source of truth; when a screen's Stitch design and this doc disagree on a detail, Stitch wins on visuals, this doc wins on logic/data.
- `/ref/old-frontend/` — your existing (partially broken) frontend code. **Do not blindly copy-paste it in.** Have your AI IDE read it only to salvage: component ideas, copy/text content, any working styling. Rebuild against the architecture.md structure rather than patching the old code — for a 6-hour build, debugging unfamiliar broken code costs more time than writing fresh files against a clear spec.

## Real OTP + SMS reminders — documented for AFTER the hackathon, not built now
You researched this separately; here's the plan preserved so it doesn't get lost, but none of it is built in the 6-hour scope (all need either internet, a backend, or paid/limited free tiers):
- **OTP:** Firebase Phone Auth (free tier, thousands of verifications/month) — but requires internet at the moment of login, which conflicts with the "no network" goal for the emergency path (booking flow already assumes the user has data, so this is fine there).
- **SMS reminders/confirmations:** either (a) DIY Android SMS gateway using a spare phone (100% free, needs a second device running 24/7), or (b) WhatsApp Business Cloud API (1,000 free conversations/month, better open rates than SMS), or (c) Email OTP/reminders via Resend/SendGrid free tier as a no-telecom fallback.
- None of these touch the Emergency screen's one-tap call/location-share — those stay 100% offline-capable via `tel:`/`sms:`/GPS regardless of which reminder system you pick later.

## Explicitly rejected (and why, for THIS deadline)
- **React Native / Expo** — would mean rewriting your Stitch-designed UI in native primitives instead of reusing Tailwind/HTML. Slower to reach a demo in 6 hours.
- **Flutter** — different language (Dart) your team doesn't know; ramp-up alone would burn your whole time budget.
- **Real backend (Node/Express + DB)** — not needed for a hardcoded-doctor MVP demo. Adds deployment risk with no time buffer. (Your "SMS reminder" feature stays a documented backend note, not built — as you specified.)
- **Real AI/LLM API call** — network + latency + rate-limit risk during a live judged demo. Rule-based matching is instant and never fails.

## One-time setup (do this first, ~10 min)
```bash
npm create vite@latest medicure -- --template react
cd medicure
npm install -D tailwindcss@latest @tailwindcss/vite
npm install framer-motion react-router-dom
npm install @capacitor/core @capacitor/cli
npx cap init Medicure com.medicure.app
```

## Daily dev loop (what "run it" means for you)
```bash
npm run dev
```
Open the printed `localhost` URL in Chrome → press `Ctrl+Shift+M` (or `Cmd+Shift+M` on Mac) → pick "iPhone 14 Pro" or "Pixel 7" from the device dropdown at the top. This is your mobile-ratio preview, refreshing live as you (or the AI IDE) edit code. **This is free and instant — use it for 95% of your 6 hours.**

## Building the real APK (last ~45 min, only once UI is done)
```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```
This opens Android Studio, where you hit ▶️ Run to install on a connected phone or emulator, producing the real `.apk`.

**Fallback if Android Studio/Gradle is slow to set up:** demo directly from the browser device-frame view — visually indistinguishable to judges — and export the APK afterward if time allows.
