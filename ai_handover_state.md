# AI Handover State
> Last updated: 2026-07-27 18:58

## Project Overview
Smart GOV Health is a mobile web app wrapped in Capacitor for booking clinic appointments, featuring voice booking in English, Hindi, and Kannada, and an offline emergency workflow.

## Tech Stack
- React 18 + Vite
- Tailwind CSS v4
- Framer Motion
- React Router v6
- Capacitor 6
- `@capacitor/geolocation`

## Architecture
```
SGH-cure/
├── .env.example
├── backend/
│   └── .gitkeep
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── data/
│   │   │   ├── doctors.json
│   │   │   ├── centres.json
│   │   │   └── keywordMap.js
│   │   ├── context/
│   │   │   └── AppContext.jsx
│   │   ├── screens/
│   │   │   ├── SplashLanguage.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── OtpVerify.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── VoiceBooking.jsx
│   │   │   ├── BookingResults.jsx
│   │   │   ├── BookingConfirmation.jsx
│   │   │   └── Emergency.jsx
│   │   ├── components/
│   │   │   ├── FloatingButton.jsx
│   │   │   ├── MicButton.jsx
│   │   │   ├── SlotCard.jsx
│   │   │   └── BottomNav.jsx
│   │   ├── utils/
│   │   │   └── matchDepartment.js
│   │   └── styles/
│   │       └── theme.css
```

## Environment & Setup
- **Node Backend Server:** Run `npm run start` (or `npm run dev` with nodemon) in the [backend](file:///C:/hack101/SGH-cure/backend) folder to spin up the orchestrator server on port 5000.
- **Frontend App:** Run `npm run dev` in the [frontend](file:///C:/hack101/SGH-cure/frontend) folder to host Vite client on port 5176.
- **Production Compilation:** Run `npm run build` in the `frontend` folder and sync with `npx cap sync android`.


## Current Work Focus
Finished & Ready.

## Active Task Queue
- None (All phases 0-5 successfully completed and final feature set wired)

## Known Issues
- Local APK compilation requires installing Android SDK (`ANDROID_HOME`) on the host machine. Everything is synced for local builds.

## Completed History
- 2026-07-27: Completed settings edits, chronological history list, 3-day diagnostics recency validation, multi-profile select dots, and slide-over info cards.
- 2026-07-27: Completed multi-agent loop simulation console log visualizer for trilingual voice assistant.
- 2026-07-27: Completed Phase 5 (Capacitor initialized and synced, web assets wrapped, project structured, fallback browser-based mobile demo verified)
- 2026-07-27: Completed Phase 4 (implemented visual polish, glassmorphism, Framer Motion animations for mic pulse/button transitions)
- 2026-07-27: Completed Phase 3 (developed Emergency.jsx screen with bypass logic, offline emergency contact configuration, location sharing via Capacitor GPS and native SMS pre-filled URI links)
- 2026-07-27: Completed Phase 2 (developed Dashboard.jsx, VoiceBooking.jsx with Web Speech API for en-US/hi-IN/kn-IN, matchDepartment.js with trilingual symptom mapping, BookingResults.jsx, BookingConfirmation.jsx)
- 2026-07-27: Completed Phase 1 (developed AppContext, SplashLanguage, Hero, Login, and OtpVerify screens, configured routing with HashRouter, verified layout builds cleanly)
- 2026-07-27: Completed Phase 0 Setup (scaffolded Vite React in frontend, installed Tailwind v4, Capacitor, Framer Motion, set up folders and mock JSON data, verified build compiles cleanly)








