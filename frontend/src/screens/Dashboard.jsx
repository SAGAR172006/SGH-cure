import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL, safeFetch } from '../config';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import { simulateWorkflow, stopSpeaking } from '../utils/agentSimulator';

// ── Best-voice picker ─────────────────────────────────────────────────────────
function getBestVoice(lang) {
  const voices = window.speechSynthesis?.getVoices() || [];
  const prefs = {
    en: ['Rishi', 'Veena', 'Karen', 'Moira', 'Daniel', 'Google UK English Female', 'Google UK English Male', 'en-IN', 'en-GB', 'en-AU'],
    hi: ['Lekha', 'Google हिन्दी', 'hi-IN', 'Hindi'],
    kn: ['Google ಕನ್ನಡ', 'kn-IN', 'Kannada'],
  };
  for (const pref of (prefs[lang] || prefs.en)) {
    const v = voices.find(v => v.name.includes(pref) || v.lang.startsWith(pref));
    if (v) return v;
  }
  return null;
}

// ── Multi-Agent Reasoning & Fact Inference Helpers ────────────────────────────
function inferSymptomFacts(text, existingAns = {}) {
  const t = (text || '').toLowerCase();
  const inferred = { ...existingAns };

  if (!inferred.location && !inferred.inferredLocation) {
    if (t.match(/head|headache|migraine|temple|scalp/)) { inferred.location = 'Head'; inferred.inferredLocation = true; }
    else if (t.match(/stomach|belly|abdomen|gastric|acidity|bellyache|indigestion/)) { inferred.location = 'Stomach / Abdomen'; inferred.inferredLocation = true; }
    else if (t.match(/throat|sore throat|tonsil|cough|cold|nasal|nose|runny/)) { inferred.location = 'Throat & Nasal passage'; inferred.inferredLocation = true; }
    else if (t.match(/chest|breath|lung|heart|wheez/)) { inferred.location = 'Chest'; inferred.inferredLocation = true; }
    else if (t.match(/back|spine|lumbar/)) { inferred.location = 'Back'; inferred.inferredLocation = true; }
    else if (t.match(/knee|leg|joint|ankle|elbow|shoulder/)) { inferred.location = 'Joints'; inferred.inferredLocation = true; }
    else if (t.match(/tooth|teeth|gum|molar/)) { inferred.location = 'Teeth / Mouth'; inferred.inferredLocation = true; }
    else if (t.match(/eye|vision|cornea/)) { inferred.location = 'Eye'; inferred.inferredLocation = true; }
  }

  if (!inferred.fever && !inferred.inferredFever && t.match(/fever|temperature|chills|shivering|high temp|hot/)) {
    inferred.fever = 'Yes, reported in initial complaint';
    inferred.inferredFever = true;
  }

  return inferred;
}

function calculateDifferentials(ans) {
  const loc = (ans.location || '').toLowerCase();
  const sym = (ans.symptoms || '').toLowerCase();

  if (loc.includes('head') || sym.includes('head') || sym.includes('migraine')) {
    return [
      { name: 'Tension Headache', prob: '58%' },
      { name: 'Migraine', prob: '32%' },
      { name: 'Sinusitis', prob: '10%' }
    ];
  }
  if (loc.includes('stomach') || loc.includes('abdomen') || sym.includes('stomach') || sym.includes('acidity')) {
    return [
      { name: 'Gastritis / Acidity', prob: '62%' },
      { name: 'Acute Gastroenteritis', prob: '28%' },
      { name: 'Food Poisoning', prob: '10%' }
    ];
  }
  if (loc.includes('throat') || sym.includes('throat') || sym.includes('cold')) {
    return [
      { name: 'Upper Respiratory Infection', prob: '68%' },
      { name: 'Acute Tonsillitis', prob: '22%' },
      { name: 'Pharyngitis', prob: '10%' }
    ];
  }
  if (loc.includes('chest') || sym.includes('chest')) {
    return [
      { name: 'Costochondritis / Muscle Strain', prob: '52%' },
      { name: 'Acid Reflux (GERD)', prob: '33%' },
      { name: 'Cardiovascular Evaluation Required', prob: '15%' }
    ];
  }
  return [
    { name: 'General Clinical Assessment', prob: '55%' },
    { name: 'Viral Illness', prob: '35%' },
    { name: 'Physical Fatigue', prob: '10%' }
  ];
}

// ── Adaptive Question Pool ────────────────────────────────────────────────────
const QUESTION_POOL = {
  en: {
    symptoms:    (p)       => `Hello ${p?.name || 'there'}! Please describe your symptoms or how you are feeling in as much detail as you can.`,
    duration:    ()        => `Thank you. How long have you been experiencing these symptoms — since this morning, a few days, or longer?`,
    severity:    ()        => `On a scale of one to ten — one being very mild and ten being unbearable — how would you rate your discomfort right now?`,
    location:    (_, ans)  => (ans?.location || ans?.inferredLocation) ? null : `Can you tell me exactly where you feel it? For example, upper abdomen, lower belly, chest, head, or somewhere else?`,
    nature:      ()        => `How would you describe the sensation — is it sharp, dull, burning, cramping, or throbbing?`,
    triggers:    ()        => `Does anything make it better or worse? For example, eating food, lying down, movement, or stress?`,
    associated:  (_, ans)  => {
      const s = (ans?.symptoms || '').toLowerCase();
      if (s.match(/stomach|abdomen|belly|nausea|gastric|indigestion/))
        return `Along with the stomach discomfort, are you also experiencing nausea, vomiting, loose stools, or loss of appetite?`;
      if (s.match(/throat|cold|blocked nose|runny nose|sinus/))
        return `Along with the throat and nose symptoms, do you also have fever, body aches, or difficulty swallowing?`;
      if (s.match(/head|migraine|dizzy/))
        return `Along with the headache, do you have any nausea, sensitivity to light, blurred vision, or neck stiffness?`;
      if (s.match(/chest|breath|lung|wheez/))
        return `Along with that, are you experiencing shortness of breath, sweating, palpitations, or dizziness?`;
      return `Are there any other symptoms alongside this — fever, fatigue, nausea, or anything else unusual?`;
    },
    fever:       (_, ans)  => {
      const s = (ans?.symptoms || '' + (ans?.associated || '')).toLowerCase();
      return (ans?.fever || ans?.inferredFever || s.match(/fever|temperature|hot|chills/)) ? null : `Do you have any fever or chills? If yes, do you know your temperature reading?`;
    },
    history:     ()        => `Do you have any existing medical conditions or chronic illnesses — for example, diabetes, hypertension, asthma, or thyroid?`,
    medications: ()        => `Are you currently taking any medicines, or have you taken anything for this problem in the last 24 hours?`,
    allergies:   ()        => `Do you have any known allergies — to medicines like penicillin or aspirin, or any foods?`,
    lifestyle:   ()        => `How is your diet and lifestyle? Do you eat regular meals, and do you smoke or consume alcohol?`,
    family:      ()        => `Has anyone in your family had a similar condition, or a history of serious illness like heart disease, diabetes, or cancer?`,
    age:         (p)       => p?.age ? null : `Could you please confirm your age in years?`,
    height:      (p)       => p?.diagnosticData?.height ? null : `What is your height? You can say it in centimetres, for example one-sixty-five.`,
    weight:      (p)       => p?.diagnosticData?.weight ? null : `And your current weight? For example, sixty kilograms.`,
  },
  hi: {
    symptoms:    (p)       => `नमस्ते ${p?.name || ''}! कृपया अपने लक्षण बताएं या आप कैसा महसूस कर रहे हैं।`,
    duration:    ()        => `धन्यवाद। ये तकलीफ आपको कितने समय से है?`,
    severity:    ()        => `एक से दस के पैमाने पर अपनी तकलीफ की गंभीरता बताएं।`,
    location:    (_, ans)  => (ans?.location || ans?.inferredLocation) ? null : `दर्द ठीक कहाँ है — पेट में, सीने में, सिर में?`,
    nature:      ()        => `दर्द कैसा है — तेज, हल्का, जलन, या ऐंठन?`,
    triggers:    ()        => `क्या कुछ खाने या हरकत से दर्द बढ़ता या घटता है?`,
    associated:  (_, ans)  => {
      const s = (ans?.symptoms || '').toLowerCase();
      if (s.match(/पेट|उल्टी|मतली/)) return `इसके साथ मतली, उल्टी, दस्त, या भूख न लगना भी है?`;
      if (s.match(/गला|नाक|सर्दी/)) return `इसके साथ बुखार या शरीर दर्द भी है?`;
      return `इसके अलावा कोई और लक्षण हैं — बुखार, थकान, मतली?`;
    },
    fever:       (_, ans)  => {
      const s = (ans?.symptoms || '').toLowerCase();
      return (ans?.fever || ans?.inferredFever || s.match(/बुखार|तापमान/)) ? null : `क्या बुखार या ठंड लग रही है?`;
    },
    history:     ()        => `क्या पहले से कोई बीमारी है — शुगर, बीपी, अस्थमा?`,
    medications: ()        => `अभी कोई दवाई ले रहे हैं?`,
    allergies:   ()        => `किसी दवाई से एलर्जी है?`,
    lifestyle:   ()        => `आपका खान-पान और जीवनशैली कैसी है?`,
    family:      ()        => `परिवार में कोई गंभीर बीमारी का इतिहास है?`,
    age:         (p)       => p?.age ? null : `आपकी उम्र बताएं।`,
    height:      (p)       => p?.diagnosticData?.height ? null : `आपकी लंबाई क्या है?`,
    weight:      (p)       => p?.diagnosticData?.weight ? null : `आपका वजन क्या है?`,
  },
  kn: {
    symptoms:    (p)       => `ನಮಸ್ಕಾರ ${p?.name || ''}! ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ ಅಥವಾ ನಿಮಗೆ ಹೇಗೆ ಅನಿಸುತ್ತಿದೆ ಎಂದು ತಿಳಿಸಿ.`,
    duration:    ()        => `ಧನ್ಯವಾದ. ಇದು ಎಷ್ಟು ದಿನದಿಂದ ಇದೆ?`,
    severity:    ()        => `1 ರಿಂದ 10ರಲ್ಲಿ ನೋವಿನ ತೀವ್ರತೆ ಎಷ್ಟು?`,
    location:    (_, ans)  => (ans?.location || ans?.inferredLocation) ? null : `ನೋವು ಎಲ್ಲಿದೆ?`,
    nature:      ()        => `ನೋವು ಹೇಗಿದೆ — ತೀಕ್ಷ್ಣ, ಮಂದ, ಉರಿ?`,
    triggers:    ()        => `ಯಾವಾಗ ಹೆಚ್ಚಾಗುತ್ತದೆ?`,
    associated:  ()        => `ಇತರ ಲಕ್ಷಣಗಳು ಏನಾದರೂ ಇವೆಯೇ?`,
    fever:       (_, ans)  => (ans?.fever || ans?.inferredFever) ? null : `ಜ್ವರ ಅಥವಾ ಚಳಿ ಇದೆಯೇ?`,
    history:     ()        => `ಮೊದಲೇ ಯಾವ ಕಾಯಿಲೆ ಇದೆಯೇ?`,
    medications: ()        => `ಈಗ ಯಾವ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ?`,
    allergies:   ()        => `ಯಾವ ಔಷಧಿಯಿಂದ ಅಲರ್ಜಿ ಇದೆಯೇ?`,
    lifestyle:   ()        => `ನಿಮ್ಮ ಆಹಾರ ಮತ್ತು ಜೀವನಶೈಲಿ ಹೇಗಿದೆ?`,
    family:      ()        => `ಕುಟುಂಬದಲ್ಲಿ ಗಂಭೀರ ಕಾಯಿಲೆ ಇದೆಯೇ?`,
    age:         (p)       => p?.age ? null : `ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?`,
    height:      (p)       => p?.diagnosticData?.height ? null : `ನಿಮ್ಮ ಎತ್ತರ ಎಷ್ಟು?`,
    weight:      (p)       => p?.diagnosticData?.weight ? null : `ನಿಮ್ಮ ತೂಕ ಎಷ್ಟು?`,
  }
};

const QUESTION_ORDER = ['symptoms','duration','severity','location','nature','triggers','associated','fever','history','medications','allergies','lifestyle','family','age','height','weight'];

function buildQueue(lang, profile, answers = {}) {
  const pool = QUESTION_POOL[lang] || QUESTION_POOL.en;
  const presentKeys = new Set();
  let rawList = QUESTION_ORDER
    .map(key => { 
      const fn = pool[key]; 
      if (!fn) return null; 
      const text = fn(profile, answers); 
      if (text) { presentKeys.add(key); return { key, text }; }
      return null;
    })
    .filter(Boolean);

  // Guarantee at least 6 questions — re-insert skipped high-value ones in correct clinical order
  const fallbackKeys = ['nature', 'triggers', 'associated', 'history', 'medications', 'allergies', 'lifestyle', 'family'];
  for (const k of fallbackKeys) {
    if (rawList.length >= 6) break;
    if (!presentKeys.has(k) && pool[k]) {
      const text = pool[k](profile, answers);
      if (text) {
        // Insert in correct QUESTION_ORDER position, not appended to end
        const insertAt = QUESTION_ORDER.indexOf(k);
        const spliceIdx = rawList.findIndex(q => QUESTION_ORDER.indexOf(q.key) > insertAt);
        if (spliceIdx === -1) rawList.push({ key: k, text });
        else rawList.splice(spliceIdx, 0, { key: k, text });
        presentKeys.add(k);
      }
    }
  }

  // Cap at 10 max
  return rawList.slice(0, 10);
}

// PDF Download Helper for Health Card
function downloadHealthCardPDF(profile) {
  const diag = profile.diagnosticData || {};
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Patient Health Card - ${profile.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 16px; color: #1e293b; background: #f8fafc; display: flex; justify-content: center; align-items: flex-start; margin: 0; }
    .wrapper { width: 100%; max-width: 460px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); padding: 20px; box-sizing: border-box; }
    .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { margin: 0; color: #06b6d4; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; }
    .header p { margin: 4px 0 0 0; color: #64748b; font-size: 10px; font-weight: 500; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .card { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px; padding: 8px 10px; }
    .card label { font-size: 8px; color: #94a3b8; text-transform: uppercase; display: block; font-weight: 700; }
    .card p { margin: 2px 0 0 0; font-size: 11px; font-weight: 700; color: #1e293b; }
    .title { font-size: 10px; font-weight: 800; color: #06b6d4; text-transform: uppercase; margin-top: 12px; margin-bottom: 4px; letter-spacing: 0.5px; }
    .prescription { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 10px; font-size: 10px; color: #92400e; white-space: pre-line; font-weight: 500; }
    .remedies { background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 10px; padding: 10px; font-size: 10px; color: #166534; font-weight: 500; }
    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 10px; font-weight: 500; }
    @media print {
      body { background: #fff; padding: 0; }
      .wrapper { border: none; box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>SMART GOV HEALTH — CLINICAL HEALTH CARD</h1>
      <p>Official Patient Diagnostic Record • Issued ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="grid">
      <div class="card"><label>Patient Name</label><p>${profile.name}</p></div>
      <div class="card"><label>Patient ID / Phone</label><p>${profile.phone || '9900088888'}</p></div>
      <div class="card"><label>Age & Gender</label><p>${profile.age || '30'} Yrs • ${profile.sex || 'Female'}</p></div>
      <div class="card"><label>Assigned Department</label><p style="color:#06b6d4">${diag.department || 'General Medicine'}</p></div>
    </div>

    <div class="grid">
      <div class="card"><label>Height</label><p>${diag.height || '--'}</p></div>
      <div class="card"><label>Weight</label><p>${diag.weight || '--'}</p></div>
      <div class="card"><label>BMI</label><p>${diag.bmi || '--'}</p></div>
    </div>

    <div class="title">Clinical Diagnostic Assessment</div>
    <div class="card" style="background:#f0fdfa; border-color:#ccfbf1;">
      <label>Assessed Condition</label>
      <p style="color:#0f766e;">${diag.condition || 'Assessed Condition'}</p>
    </div>

    <div class="title">Prescription & Medication</div>
    <div class="prescription">${diag.prescription || 'No current active prescription on record.'}</div>

    <div class="title">Home Remedies & Care Plan</div>
    <div class="remedies">${diag.homeRemedies || 'Drink plenty of fluids, eat nutritious meals, and rest.'}</div>

    <div class="footer">
      Smart GOV Health (SGH) • Digital Healthcare Infrastructure • Confidential Medical Record
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `Patient_Health_Card_${profile.name.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    user,
    language,
    profiles,
    activeProfileId,
    setActiveProfileId,
    addProfile,
    updateProfileDiagnostics,
    reminders
  } = useContext(AppContext);

  const navigate = useNavigate();
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];


  // UI state
  const [selectedDetailProfile, setSelectedDetailProfile] = useState(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isHealthCardModalOpen, setIsHealthCardModalOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ name: '', age: '', sex: 'Female', relation: 'Spouse', phone: '' });

  // Instant scroll-synced Floating Mic FAB visibility state
  const [showFloatingMic, setShowFloatingMic] = useState(false);
  const mainMicCardRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Consultation state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [queue, setQueue] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [phase, setPhase] = useState('qa');
  const [agentLogs, setAgentLogs] = useState([]);
  const [finalReport, setFinalReport] = useState(null);

  const recognitionRef = useRef(null);
  const terminalEndRef = useRef(null);
  const answersRef = useRef(answers); answersRef.current = answers;
  const qIndexRef = useRef(qIndex); qIndexRef.current = qIndex;
  const queueRef = useRef(queue); queueRef.current = queue;

  // Ultra-fast real-time scroll sync listener for floating mic FAB
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Main mic card starts scrolling out around 80px
      const isPast = container.scrollTop > 80;
      setShowFloatingMic(isPast);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => {};
    return () => {
      stopSpeaking();
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [agentLogs]);

  const getInitials = n => n ? n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) : 'SGH';
  const getAvatarBg = id => {
    const safeId = String(id || 'self');
    const c = ['bg-teal-700','bg-slate-700','bg-amber-800','bg-emerald-800','bg-indigo-900','bg-orange-800'];
    return c[safeId.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % c.length];
  };

  // Helper for waiting timer
  const getEstimatedWait = (b) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (b.date === todayStr) {
      const tokenStr = b.tokenNumber || 'TK7B9X';
      const hash = tokenStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const mins = (hash % 20) + 5; // <= 25 mins
      return `${mins} mins`;
    }
    return "5 mins";
  };

  // TTS
  const agentSpeak = useCallback((text, onDone) => {
    if (!window.speechSynthesis) { onDone?.(); return; }
    window.speechSynthesis.cancel();
    setAgentSpeaking(true);
    
    let active = true;
    const fallbackTimeout = setTimeout(() => {
      if (active) {
        active = false;
        console.warn("SpeechSynthesis onend fallback timeout triggered");
        setAgentSpeaking(false);
        onDone?.();
      }
    }, Math.max(3000, text.length * 80));

    const u = new SpeechSynthesisUtterance(text);
    const voice = getBestVoice(language);
    if (voice) u.voice = voice;
    u.lang = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' }[language] || 'en-IN';
    u.rate = 0.88; u.pitch = 1.08; u.volume = 1;
    
    u.onend = () => {
      if (active) {
        active = false;
        clearTimeout(fallbackTimeout);
        setAgentSpeaking(false);
        onDone?.();
      }
    };
    
    u.onerror = (err) => {
      console.warn("SpeechSynthesis error details:", err);
      if (active) {
        active = false;
        clearTimeout(fallbackTimeout);
        setAgentSpeaking(false);
        onDone?.();
      }
    };

    setTimeout(() => {
      try {
        window.speechSynthesis.speak(u);
      } catch (err) {
        console.warn("Failsafe speak call:", err);
        if (active) {
          active = false;
          clearTimeout(fallbackTimeout);
          setAgentSpeaking(false);
          onDone?.();
        }
      }
    }, 60);
  }, [language]);

  // STT
  const startMic = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setCurrentTranscript('⚠️ Voice input is not supported in this browser. Please type your answer or use Chrome/Safari.');
      setIsListening(false);
      return;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch (err) {}
      recognitionRef.current = null;
    }
    const r = new SR();
    r.lang = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' }[language] || 'en-IN';
    r.continuous = false;
    r.interimResults = true;
    r.onresult = e => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text = e.results[i][0].transcript;
      }
      setCurrentTranscript(text);
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    try { r.start(); setIsListening(true); } catch (e) { setIsListening(false); }
  }, [language]);

  const abortMic = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch (err) {
        console.warn("Failed to abort SpeechRecognition:", err);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const stopMic = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Failed to stop SpeechRecognition:", err);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Advance with context-aware next question — instant progression with background sync
  const advanceWorkflow = useCallback(async (newAnswers) => {
    stopMic();
    setCurrentTranscript('');
    setAnswers(newAnswers);
    
    const nextStep = qIndex + 1;
    
    // 1. Immediately progress local pool question for zero user latency
    let nextLocalQuestionText = '';
    const pool = QUESTION_POOL[language] || QUESTION_POOL.en;
    const nextKey = QUESTION_ORDER[nextStep] || `q${nextStep}`;
    
    const fn = pool[nextKey];
    if (fn) {
      nextLocalQuestionText = fn(activeProfile, newAnswers);
    }
    
    if (!nextLocalQuestionText) {
      for (let i = nextStep; i < QUESTION_ORDER.length; i++) {
        const k = QUESTION_ORDER[i];
        const f = pool[k];
        const text = f ? f(activeProfile, newAnswers) : null;
        if (text) {
          nextLocalQuestionText = text;
          break;
        }
      }
    }
    
    const shouldEndLocal = nextStep >= 10 || !nextLocalQuestionText;
    
    if (shouldEndLocal) {
      setPhase('analyzing');
      runPipeline(newAnswers);
      return;
    }
    
    // Update queue state and speak instantly
    const newQueue = [...queue];
    newQueue[nextStep] = { key: nextKey, text: nextLocalQuestionText };
    setQueue(newQueue);
    setQIndex(nextStep);
    setTimeout(() => agentSpeak(nextLocalQuestionText, () => startMic()), 350);

    // 2. Concurrently fetch dynamic feedback/logs from backend in the background
    try {
      safeFetch(`${API_BASE_URL}/api/healthcare/next-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: newAnswers,
          currentStep: nextStep,
          language,
          profile: activeProfile
        })
      })
      .then(resp => {
        if (resp.ok) return resp.json();
        throw new Error('API error');
      })
      .then(data => {
        setAnswers(prev => ({ ...prev, ...data.updatedAnswers }));
        if (data.logs) {
          setAgentLogs(prev => {
            const uniqueLogs = [...prev];
            for (const log of data.logs) {
              if (!uniqueLogs.find(l => l.agent === log.agent && l.message === log.message)) {
                uniqueLogs.push(log);
              }
            }
            return uniqueLogs;
          });
        }
        
        // Pre-fill the next step's question text in the queue dynamically
        if (data.nextQuestion && !data.shouldEnd) {
          const nextNextStep = nextStep + 1;
          const nextNextKey = `q${nextNextStep}`;
          setQueue(prev => {
            const updated = [...prev];
            updated[nextNextStep] = { key: nextNextKey, text: data.nextQuestion };
            return updated;
          });
        }
      })
      .catch(err => console.warn("Background next-question update skipped:", err));
    } catch (e) {
      // Intentionally ignore sync fetch errors
    }
  }, [qIndex, queue, language, activeProfile, stopMic, startMic, agentSpeak]);

  const handleDone = useCallback(() => {
    const answer = currentTranscript.trim();
    const currentQKey = queue[qIndex]?.key || `q${qIndex}`;
    const updated = {
      ...answersRef.current,
      [currentQKey]: answer || answersRef.current[currentQKey] || '—'
    };
    advanceWorkflow(updated);
  }, [currentTranscript, qIndex, queue, advanceWorkflow]);

  const handleSkip = useCallback(() => {
    const currentQKey = queue[qIndex]?.key || `q${qIndex}`;
    const updated = {
      ...answersRef.current,
      [currentQKey]: 'Skipped'
    };
    advanceWorkflow(updated);
  }, [qIndex, queue, advanceWorkflow]);

  const handleRedo = useCallback(() => {
    abortMic();
    setCurrentTranscript('');
    setTimeout(() => {
      startMic();
    }, 150);
  }, [abortMic, startMic]);

  const startConsultation = useCallback(() => {
    stopSpeaking(); stopMic();
    const initialAnswers = {
      age: activeProfile?.age || '',
      height: activeProfile?.diagnosticData?.height || '',
      weight: activeProfile?.diagnosticData?.weight || '',
    };
    const q = buildQueue(language, activeProfile, initialAnswers);
    setQueue(q); setQIndex(0); setAnswers(initialAnswers);
    setCurrentTranscript(''); 
    
    const timestamp = new Date().toISOString();
    setAgentLogs([
      { timestamp, agent: 'Orchestrator Agent', status: 'STARTING', message: `Initializing multi-agent workflow for ${activeProfile?.name || 'Patient'}.` },
      { timestamp, agent: 'Memory Agent', status: 'LOADED', message: `Patient profile & medical history loaded.` },
      { timestamp, agent: 'Reasoning Agent', status: 'PROMPTING', message: `Asking primary complaint question.` }
    ]);
    setFinalReport(null);
    setPhase('qa'); setIsVoiceActive(true);
    setTimeout(() => agentSpeak(q[0].text, () => startMic()), 400);
  }, [language, activeProfile, agentSpeak, startMic, stopMic]);

  const runPipeline = async (ans) => {
    try {
      const a = ans || answersRef.current;
      const parts = [
        a.symptoms    && `Symptoms: ${a.symptoms}`,
        a.duration    && `Duration: ${a.duration}`,
        a.severity    && `Severity (1-10): ${a.severity}`,
        a.location    && `Location: ${a.location}`,
        a.nature      && `Nature: ${a.nature}`,
        a.triggers    && `Triggers: ${a.triggers}`,
        a.associated  && `Associated: ${a.associated}`,
        a.fever       && `Fever/Chills: ${a.fever}`,
        a.history     && `Medical history: ${a.history}`,
        a.medications && `Medications: ${a.medications}`,
        a.allergies   && `Allergies: ${a.allergies}`,
        a.lifestyle   && `Lifestyle: ${a.lifestyle}`,
        a.family      && `Family history: ${a.family}`,
      ].filter(Boolean).join('. ');

      let rawHt = a.height || activeProfile?.diagnosticData?.height || null;
      let rawWt = a.weight || activeProfile?.diagnosticData?.weight || null;
      if (rawHt && !String(rawHt).toLowerCase().includes('cm')) {
        const n = parseFloat(rawHt);
        if (!isNaN(n)) rawHt = `${n} cm`;
      }
      if (rawWt && !String(rawWt).toLowerCase().includes('kg')) {
        const n = parseFloat(rawWt);
        if (!isNaN(n)) rawWt = `${n} kg`;
      }

      const simProfile = {
        id: activeProfile.id, name: activeProfile.name,
        age: a.age || activeProfile.age, sex: activeProfile.sex, phone: activeProfile.phone,
        diagnosticData: {
          ...(activeProfile.diagnosticData || {}),
          height: rawHt,
          weight: rawWt,
        }
      };

      let result;
      try {
        setAgentLogs([{ timestamp: new Date().toISOString(), agent: 'Orchestrator Agent', status: 'CONNECTING', message: 'Contacting clinical backend…' }]);
        const ctrl = new AbortController();
        const fetchTimer = setTimeout(() => ctrl.abort(), 15000); // 15s timeout
        const resp = await safeFetch(`${API_BASE_URL}/api/healthcare/chat`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptoms: parts, language, profile: simProfile }),
          signal: ctrl.signal
        });
        clearTimeout(fetchTimer);
        if (!resp.ok) throw new Error('Backend offline');
        result = await resp.json();
        for (const log of (result.logs || [])) { setAgentLogs(prev => [...prev, log]); await new Promise(r => setTimeout(r, 350)); }
      } catch {
        setAgentLogs(prev => [...prev, { timestamp: new Date().toISOString(), agent: 'Orchestrator Agent', status: 'BYPASS', message: 'Using local fallback agents…' }]);
        await new Promise(r => setTimeout(r, 500));
        result = await simulateWorkflow(parts, language, simProfile, logs => setAgentLogs(logs));
      }

      if (result.emergency) {
        setFinalReport({ emergency: true, reason: result.emergencyDetails?.reason || 'Critical.', recommendation: result.emergencyDetails?.recommendation || 'Dial 108.' });
      } else {
        updateProfileDiagnostics(activeProfile.id, result.profileData);
        setFinalReport({
          emergency: false,
          department: result.profileData?.department || 'General Medicine',
          condition: result.profileData?.criticalConditions?.[0] || 'Assessment Complete',
          prescription: result.profileData?.prescription || result.carePlan?.prescription || '',
          homeRemedies: result.profileData?.homeRemedies || result.carePlan?.homeRemedies || '',
          roadmap: result.recoveryPlan?.roadmap || ['Day 1: Rest & hydrate', 'Day 2: Light activity', 'Day 3: Follow-up'],
        });
        const dept = result.profileData?.department || 'General Medicine';
        const med = result.profileData?.medications?.[0] || 'Please consult a specialist.';
        agentSpeak(
          language === 'hi' ? `विश्लेषण पूरा। ${dept} विभाग। ${med}` :
          language === 'kn' ? `ವಿಶ್ಲೇಷಣೆ ಮುಗಿದಿದೆ. ${dept}. ${med}` :
          `Assessment complete. You've been routed to ${dept}. ${med} Review your full care plan on screen.`,
          null
        );
      }
      setPhase('results');
    } catch (e) { console.error(e); setIsVoiceActive(false); }
  };

  const closeConsultation = () => {
    stopSpeaking();
    abortMic();
    setIsVoiceActive(false);
    setPhase('qa');
    setQIndex(0);
    setAnswers({});
    setCurrentTranscript('');
    setAgentLogs([]);
    setFinalReport(null);
  };

  const currentQ = queue[qIndex];

  const s = {
    en: { welcome: 'Welcome!', howHelp: 'How can we help you today?', familyTitle: 'Patient Profiles', self: 'Self', diagDetails: 'Clinical Records', close: 'Close', noDiag: 'No diagnostics yet.' },
    hi: { welcome: 'स्वागत है!', howHelp: 'आज हम आपकी कैसे मदद करें?', familyTitle: 'मरीज़ प्रोफ़ाइल', self: 'स्वयं', diagDetails: 'क्लिनिकल रिकॉर्ड', close: 'बंद', noDiag: 'कोई डेटा नहीं।' },
    kn: { welcome: 'ಸ್ವಾಗತ!', howHelp: 'ಇಂದು ಸಹಾಯ ಹೇಗೆ?', familyTitle: 'ರೋಗಿ ಪ್ರೊಫೈಲ್', self: 'ಸ್ವಯಂ', diagDetails: 'ದಾಖಲೆ', close: 'ಮುಚ್ಚಿ', noDiag: 'ಡೇಟಾ ಇಲ್ಲ.' },
  }[language] || { welcome: 'Welcome!', howHelp: 'How can we help you today?', familyTitle: 'Patient Profiles', self: 'Self', diagDetails: 'Clinical Records', close: 'Close', noDiag: 'No diagnostics yet.' };

  const activeRemindersCount = (reminders || []).filter(r => r.patientId === activeProfile?.id).length;
  const activeProfileBookings = activeProfile?.bookings || [];

  // Health Score Calculation — null if no diagnosis yet
  const healthScore = activeProfile?.diagnosticData?.healthScore ?? null;
  const scoreColor = healthScore === null ? '#64748B' : healthScore >= 75 ? '#10B981' : healthScore >= 50 ? '#F59E0B' : '#EF4444';
  const scoreLabel = healthScore === null ? 'Pending Diagnosis' : healthScore >= 75 ? 'Optimal' : healthScore >= 50 ? 'Moderate' : 'Needs Attention';

  // Guard: profiles not yet hydrated (placed after all hooks — safe)
  if (!activeProfile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 opacity-40">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col p-5 relative overflow-hidden h-full">

      <div className="absolute top-[5%] left-[-20%] w-[90%] h-[40%] rounded-full glow-bg-radial opacity-50 pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-20%] w-[90%] h-[40%] rounded-full glow-bg-radial opacity-30 pointer-events-none" />

      {/* Header — Brand Logo Mark on Top Left */}
      <div className="flex items-center justify-between z-20 relative flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-md shadow-cyan-500/20 text-white font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800 tracking-wider font-heading-style leading-none">
              SGH <span className="text-primary font-bold text-[10px] uppercase ml-1 bg-primary/10 px-1.5 py-0.5 rounded-full">HEALTH</span>
            </h1>
            <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Smart GOV Health</p>
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/settings')}
          className={`w-10 h-10 rounded-full ${getAvatarBg('self')} flex items-center justify-center text-white text-xs font-extrabold border border-white/20 shadow-lg cursor-pointer`}>
          {getInitials(user?.name || 'Guest')}
        </motion.button>
      </div>

      {/* Main smooth scrolling content — with ref for real-time scroll sync */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex flex-col space-y-4 mt-4 overflow-y-auto max-w-sm w-full mx-auto scrollbar-none smooth-scroll relative z-10"
        style={{ paddingBottom: '140px' }}
      >

        {/* 1. Patient profiles horizontal bar */}
        <div className="space-y-2 flex-shrink-0">
          <h3 className="text-[10px] font-bold tracking-widest text-primary uppercase font-heading-style">{s.familyTitle}</h3>
          <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 scrollbar-none">
            {profiles.map(p => (
              <motion.div key={p.id} whileHover={{ scale: 1.05, y: -3 }} className="flex flex-col items-center shrink-0 relative">
                <button onClick={() => setActiveProfileId(p.id)}
                  className={`w-3 h-3 rounded-full border border-slate-300 absolute -top-0.5 -right-0.5 z-10 cursor-pointer ${activeProfileId === p.id ? 'bg-success' : 'bg-slate-300'}`} />
                <button onClick={() => setSelectedDetailProfile(p)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white border transition-all shadow-lg cursor-pointer ${getAvatarBg(p.id)} ${activeProfileId === p.id ? 'border-primary ring-2 ring-primary/20' : 'border-white/20'}`}>
                  {p.name[0]}
                </button>
                <span className="text-[10px] font-bold text-text-heading mt-1">{p.id.startsWith('self_') ? s.self : p.name.split(' ')[0]}</span>
              </motion.div>
            ))}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddMemberOpen(true)}
              className="w-14 h-14 border border-dashed border-primary/40 rounded-2xl flex flex-col items-center justify-center text-primary text-xs shrink-0 cursor-pointer bg-white/60 hover:border-primary">
              <span className="text-base font-bold">+</span>
              <span className="text-[9px] font-bold uppercase">Add</span>
            </motion.button>
          </div>
        </div>

        {/* 2. Main Diagnosis Chatbot Mic Panel */}
        <div
          ref={mainMicCardRef}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center space-y-5 shadow-lg border border-slate-100 flex-shrink-0"
        >
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
            <AnimatePresence>
              {isVoiceActive && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1.5, opacity: 0.12 }} exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.3 }} className="absolute inset-0 bg-primary rounded-full" />
              )}
            </AnimatePresence>
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={startConsultation}
              className={`w-24 h-24 rounded-full bg-white border flex items-center justify-center shadow-lg cursor-pointer ${isVoiceActive ? 'border-primary ring-2 ring-primary/20 text-primary' : 'border-slate-200 text-primary hover:bg-cyan-50'}`}>
              <svg className="w-11 h-11" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 14H5c0 3.41 2.72 6.23 6 6.72V24h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
            </motion.button>
          </div>
          <div>
            <h4 className="text-lg font-bold text-text-heading font-heading-style">{s.welcome}</h4>
            <p className="text-xs text-text-muted">{s.howHelp}</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={startConsultation}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl text-sm shadow-md cursor-pointer font-heading-style">
            🎙 Start AI Health Consultation
          </motion.button>
        </div>

        {/* 3. Upcoming Appointments Card */}
        {activeProfileBookings.length > 0 && (
          <div className="space-y-1.5 flex-shrink-0">
            <h3 className="text-[10px] font-bold tracking-widest text-primary uppercase font-heading-style">
              Upcoming Appointment
            </h3>
            {activeProfileBookings.slice(0, 1).map((b, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate('/book-appointment')}
                className="bg-white/90 backdrop-blur-sm border border-cyan-100 rounded-2xl p-4 shadow-sm space-y-2 cursor-pointer hover:border-primary transition-all relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">Scheduled Profile</span>
                    <h4 className="text-xs font-extrabold text-slate-800">{b.patientName || activeProfile.name}</h4>
                  </div>
                  <span className="bg-primary/10 border border-primary/30 text-primary px-2.5 py-1 rounded-xl font-mono text-[10px] font-bold">
                    TOKEN: {b.tokenNumber || 'TK9B4X'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Department & Doctor</span>
                    <p className="font-bold text-slate-700 leading-tight">{b.department}</p>
                    <p className="text-[10px] text-slate-500">{b.doctor}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Date & Time</span>
                    <p className="font-bold text-slate-700 leading-tight">{b.date}</p>
                    <p className="text-[10px] text-primary font-bold">{b.timeSlot}</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-2 flex items-center justify-between text-[10px] font-bold">
                  <span className="flex items-center gap-1">⏳ Estimated Wait Time:</span>
                  <span className="bg-amber-500 text-white px-2 py-0.5 rounded-lg font-mono">
                    {getEstimatedWait(b)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 4. Reminders Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/reminders')}
          className="bg-white border border-slate-100 rounded-[28px] p-4 shadow-sm flex items-center justify-between cursor-pointer hover:border-cyan-300 transition-all flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-xl shadow-inner">
              ⏰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 font-heading-style">Medicine & Exercise Reminders</h4>
                {activeRemindersCount > 0 && (
                  <span className="bg-primary text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                    {activeRemindersCount}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Set and manage alerts for {activeProfile.name}
              </p>
            </div>
          </div>
          <span className="text-slate-400 text-sm font-bold">→</span>
        </motion.div>

        {/* 5. Health Card (Scannable QR — Expanded to match Appointment Card size) */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsHealthCardModalOpen(true)}
          className="w-full bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer relative overflow-hidden flex-shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#dbeceb] flex items-center justify-center flex-shrink-0 shadow-sm border border-[#c5e4e2]">
                <svg className="w-7 h-7 text-[#1b5e58]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v2h-3v-2zm-3 3h2v3h-2v-3zm3 0h3v5h-3v-5zm-3 3h2v2h-2v-2z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-800 font-heading-style tracking-tight">
                  Health Card
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Digital Clinical Record • {activeProfile.name}
                </p>
              </div>
            </div>
            <span className="bg-[#dbeceb] text-[#1b5e58] font-extrabold text-xs px-3.5 py-2 rounded-full shadow-sm whitespace-nowrap block hover:bg-[#c5e4e2] transition-colors">
              Scan QR
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[9px] uppercase text-slate-400 block font-bold">Height</span>
              <span className="font-extrabold text-slate-700">{activeProfile.diagnosticData?.height || '--'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[9px] uppercase text-slate-400 block font-bold">Weight</span>
              <span className="font-extrabold text-slate-700">{activeProfile.diagnosticData?.weight || '--'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-[9px] uppercase text-slate-400 block font-bold">BMI</span>
              <span className="font-extrabold text-slate-700">{activeProfile.diagnosticData?.bmi || '--'}</span>
            </div>
          </div>
        </motion.div>

        {/* 6. Health Insights Card (Clean layout with Health Score Gauge) */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="w-full bg-gradient-to-br from-[#eaf5f5] via-[#e2efef] to-[#d8ecec] border border-[#c4e3e3] rounded-[32px] p-6 shadow-sm relative overflow-hidden space-y-4 flex-shrink-0"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1 max-w-[65%]">
              <h4 className="text-base font-extrabold text-[#1b5e58] font-heading-style leading-snug">
                Health Insights
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Your wellness journey is on track.
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold shadow-sm" style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>
                  ● {scoreLabel} {healthScore !== null ? `(${healthScore}/100)` : ''}
                </span>
              </div>
            </div>

            {/* Health Score Partial Circle Arc Gauge */}
            <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Gauge Background Arc */}
                <circle
                  cx="50" cy="50" r="38"
                  fill="none"
                  stroke="#c4e3e3"
                  strokeWidth="8"
                  strokeDasharray="238"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                />
                {/* Foreground Progress Arc */}
                <circle
                  cx="50" cy="50" r="38"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeDasharray="238"
                  strokeDashoffset={healthScore !== null ? 238 - (178 * (healthScore / 100)) : 238}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-extrabold text-[#1b5e58] leading-none font-mono">
                  {healthScore !== null ? healthScore : '--'}
                </span>
                <span className="text-[8px] font-bold uppercase text-slate-400 leading-none mt-0.5">SCORE</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Extra Bottom Scroll Spacer */}
        <div className="h-16 flex-shrink-0" />

      </div>

      {/* ══ FLOATING MIC FAB ══
          Instant snappy animation & 60fps real-time scroll sync! */}
      <AnimatePresence>
        {showFloatingMic && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 10 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={startConsultation}
            className="absolute bottom-[96px] right-6 z-30 w-14 h-14 rounded-full bg-[#1b5e58] text-white flex items-center justify-center shadow-2xl border-2 border-white cursor-pointer hover:bg-[#144843] transition-all"
            title="Start Voice Consultation"
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 14H5c0 3.41 2.72 6.23 6 6.72V24h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ══ HEALTH CARD QR POP-UP MODAL ══ */}
      <AnimatePresence>
        {isHealthCardModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHealthCardModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="bg-white rounded-3xl p-5 w-full max-w-sm relative z-10 space-y-4 shadow-2xl border border-slate-100 max-h-[88vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#dbeceb] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#1b5e58]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm8-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v2h-3v-2zm-3 3h2v3h-2v-3zm3 0h3v5h-3v-5zm-3 3h2v2h-2v-2z"/>
                    </svg>
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-heading-style">
                    Clinical Health Card
                  </h3>
                </div>
                <button
                  onClick={() => setIsHealthCardModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Patient Badge */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden shadow-md">
                <div className={`w-12 h-12 rounded-xl ${getAvatarBg(activeProfile.id)} flex items-center justify-center font-bold text-white text-lg shadow border border-white/20`}>
                  {activeProfile.name[0]}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold font-heading-style">{activeProfile.name}</h4>
                  <p className="text-[10px] text-cyan-300 font-medium">
                    ID: {activeProfile.phone || '9900088888'} • {activeProfile.age} Yrs ({activeProfile.sex})
                  </p>
                </div>
              </div>

              {/* Scannable Real QR Code Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 text-center space-y-2">
                <div className="w-44 h-44 mx-auto bg-white p-2 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.protocol}//${window.location.host}${window.location.pathname}#/patient-card?id=${activeProfile.id}`)}`}
                    alt="Scannable Health QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  📱 Scan with any phone camera to open {activeProfile.name}'s card
                </p>
              </div>

              {/* Diagnostic details */}
              {activeProfile.diagnosticData ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {['height','weight','bmi'].map(k => (
                      <div key={k} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">{k}</span>
                        <span className="font-extrabold text-slate-800">{activeProfile.diagnosticData[k]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-cyan-50 border border-cyan-100 p-3 rounded-2xl space-y-1">
                    <span className="text-[9px] text-cyan-700 uppercase font-bold block">Assigned Department</span>
                    <p className="font-extrabold text-primary capitalize text-sm">{activeProfile.diagnosticData.department}</p>
                  </div>

                  {activeProfile.diagnosticData.prescription && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl space-y-1">
                      <span className="text-[9px] text-amber-800 uppercase font-bold block">💊 Prescription</span>
                      <p className="text-slate-700 whitespace-pre-line text-xs font-medium leading-relaxed">
                        {activeProfile.diagnosticData.prescription}
                      </p>
                    </div>
                  )}

                  {activeProfile.diagnosticData.homeRemedies && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-2xl space-y-1">
                      <span className="text-[9px] text-green-800 uppercase font-bold block">🌿 Home Remedies</span>
                      <p className="text-slate-700 text-xs font-medium leading-relaxed">
                        {activeProfile.diagnosticData.homeRemedies}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center text-xs text-slate-500">
                  {s.noDiag} Run a voice consultation first to generate health card data.
                </div>
              )}

              {/* Bottom Action: Save / Download PDF */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => downloadHealthCardPDF(activeProfile)}
                  className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer font-heading-style"
                >
                  <span>📥</span> Save / Download PDF Report
                </button>
                <button
                  onClick={() => setIsHealthCardModalOpen(false)}
                  className="w-full bg-slate-100 text-slate-600 font-bold py-2.5 rounded-2xl text-xs uppercase tracking-wider cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Detail Sheet */}
      <AnimatePresence>
        {selectedDetailProfile && (
          <div className="absolute inset-0 z-40 flex items-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDetailProfile(null)} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 150 }}
              className="relative w-full max-h-[80%] bg-white rounded-t-2xl shadow-xl p-5 flex flex-col overflow-y-auto space-y-4 z-10"
              style={{ marginBottom: '80px' }}>
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary uppercase font-heading-style">{s.diagDetails}</h3>
                <button onClick={() => setSelectedDetailProfile(null)} className="text-slate-400 text-sm font-bold cursor-pointer">✕</button>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-[9px] uppercase text-slate-400 block">Patient</span><span className="font-bold">{selectedDetailProfile.name}</span></div>
                <div><span className="text-[9px] uppercase text-slate-400 block">Phone</span><span className="font-bold">{selectedDetailProfile.phone}</span></div>
                <div><span className="text-[9px] uppercase text-slate-400 block">Age</span><span className="font-bold">{selectedDetailProfile.age} Yrs</span></div>
                <div><span className="text-[9px] uppercase text-slate-400 block">Gender</span><span className="font-bold">{selectedDetailProfile.sex}</span></div>
              </div>
              {selectedDetailProfile.diagnosticData ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {['height','weight','bmi'].map(k => (
                      <div key={k} className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 block capitalize">{k}</span>
                        <span className="font-bold">{selectedDetailProfile.diagnosticData[k]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-2">
                    <div><span className="text-[9px] text-slate-400 uppercase block">Department</span><p className="font-bold text-primary">{selectedDetailProfile.diagnosticData.department}</p></div>
                    {selectedDetailProfile.diagnosticData.prescription && <div><span className="text-[9px] text-slate-400 uppercase block">Prescription</span><p className="text-slate-700 whitespace-pre-line">{selectedDetailProfile.diagnosticData.prescription}</p></div>}
                    {selectedDetailProfile.diagnosticData.homeRemedies && <div><span className="text-[9px] text-slate-400 uppercase block">Home Remedies</span><p className="text-slate-600">{selectedDetailProfile.diagnosticData.homeRemedies}</p></div>}
                  </div>
                </div>
              ) : <p className="text-xs text-slate-400 text-center py-4">{s.noDiag}</p>}
              <button onClick={() => setSelectedDetailProfile(null)} className="w-full bg-primary text-white font-semibold py-3 rounded-xl cursor-pointer">{s.close}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Family Member */}
      <AnimatePresence>
        {isAddMemberOpen && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsAddMemberOpen(false)} />
            <motion.form initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={e => {
                e.preventDefault();
                if (!newMemberForm.name || !newMemberForm.age || !newMemberForm.phone) { alert('Fill all fields'); return; }
                addProfile(newMemberForm);
                setNewMemberForm({ name: '', age: '', sex: 'Female', relation: 'Spouse', phone: '' });
                setIsAddMemberOpen(false);
              }}
              className="bg-white rounded-2xl p-5 w-full max-w-sm relative z-10 space-y-4 shadow-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-primary uppercase font-heading-style">Add Family Profile</h3>
              <div className="space-y-3">
                {[{label:'Name',field:'name',type:'text'},{label:'Age',field:'age',type:'number'},{label:'Phone',field:'phone',type:'tel'},{label:'Relation',field:'relation',type:'text'}].map(({label,field,type}) => (
                  <div key={field} className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 block">{label}</label>
                    <input type={type} required value={newMemberForm[field]} onChange={e => setNewMemberForm({...newMemberForm,[field]:e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-slate-400 block">Gender</label>
                  <select value={newMemberForm.sex} onChange={e => setNewMemberForm({...newMemberForm,sex:e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary">
                    <option>Female</option><option>Male</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer">Save</button>
                <button type="button" onClick={() => setIsAddMemberOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs cursor-pointer">Cancel</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* ══ AI DOCTOR MODAL — floats above bottom nav ══ */}
      <AnimatePresence>
        {isVoiceActive && (
          <div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={closeConsultation} />

            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 130 }}
              onClick={e => e.stopPropagation()}
              className="pointer-events-auto relative w-full max-w-sm bg-white rounded-t-3xl shadow-2xl flex flex-col z-10 overflow-hidden"
              style={{ maxHeight: 'calc(88vh - 100px)', marginBottom: '100px' }}>

              {/* Pull bar */}
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-md ${agentSpeaking ? 'animate-pulse' : ''}`}>
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest font-heading-style">SGH AI Doctor</p>
                    <p className="text-[9px] text-slate-400">
                      {phase === 'analyzing' ? '⚙️ Analyzing…' : phase === 'results' ? '✓ Done' : agentSpeaking ? '🔊 Speaking…' : isListening ? '🎤 Listening…' : `Question ${qIndex + 1} of ${queue.length}`}
                    </p>
                  </div>
                </div>
                <button onClick={closeConsultation} className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer leading-none">✕</button>
              </div>

              {/* Progress */}
              {phase === 'qa' && queue.length > 0 && (
                <div className="px-5 pt-2 pb-1 flex-shrink-0">
                  <div className="flex gap-0.5">
                    {queue.map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < qIndex ? 'bg-primary' : i === qIndex ? 'bg-primary/50' : 'bg-slate-100'}`} />
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">{qIndex + 1} / {queue.length}</p>
                </div>
              )}

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 scrollbar-none min-h-0">

                {/* Q&A */}
                {phase === 'qa' && currentQ && (
                  <div className="space-y-3">
                    {/* Doctor bubble */}
                    <motion.div key={qIndex} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2.5">
                      <div className={`w-7 h-7 rounded-full bg-primary flex-shrink-0 flex items-center justify-center mt-0.5 shadow ${agentSpeaking ? 'animate-pulse' : ''}`}>
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 leading-relaxed flex-1">
                        {currentQ.text}
                        {agentSpeaking && (
                          <span className="inline-flex gap-0.5 ml-2 align-middle">
                            {[0,1,2].map(i => <motion.span key={i} className="w-1 h-1 bg-primary rounded-full inline-block" animate={{ y: [-2,2,-2] }} transition={{ repeat: Infinity, duration: 0.6, delay: i*0.15 }} />)}
                          </span>
                        )}
                      </div>
                    </motion.div>

                    {/* Patient bubble */}
                    <AnimatePresence>
                      {(isListening || currentTranscript) && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex gap-2.5 justify-end">
                          <div className={`bg-primary/10 border rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-primary max-w-[80%] leading-relaxed ${isListening ? 'border-primary/40' : 'border-primary/20'}`}>
                            {currentTranscript || '…'}
                            {isListening && (
                              <span className="inline-flex gap-0.5 ml-2 align-middle">
                                {[0,1,2].map(i => <motion.span key={i} className="w-1 h-3 bg-primary rounded-full inline-block" animate={{ scaleY: [0.3,1,0.3] }} transition={{ repeat: Infinity, duration: 0.45, delay: i*0.1 }} />)}
                              </span>
                            )}
                          </div>
                          <div className={`w-7 h-7 rounded-full flex-shrink-0 text-white text-xs font-bold flex items-center justify-center mt-0.5 shadow ${getAvatarBg(activeProfile?.id || 'self')}`}>
                            {activeProfile?.name?.[0] || 'P'}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Always-visible text input */}
                    {!agentSpeaking && (
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">Or type your answer:</p>
                        <textarea rows={2} value={currentTranscript} onChange={e => setCurrentTranscript(e.target.value)}
                          placeholder="Type here, or use the mic below…"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400 resize-none transition-colors" />
                      </div>
                    )}
                  </div>
                )}

                {/* Analyzing */}
                {phase === 'analyzing' && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Running Clinical Analysis…</p>
                    <div className="bg-slate-950 rounded-xl p-3 h-44 overflow-y-auto font-mono text-[10px] space-y-1 scrollbar-none">
                      {agentLogs.map((log, i) => (
                        <div key={i}>
                          <span className="text-slate-600">{log.timestamp.slice(11,19)} </span>
                          <span className={log.status === 'ALERTED' ? 'text-red-400' : log.status.match(/START|RUNN|CONN/) ? 'text-amber-400' : 'text-green-400'}>[{log.agent}] {log.status}</span>
                          <span className="text-slate-400"> — {log.message}</span>
                        </div>
                      ))}
                      {!agentLogs.length && <p className="text-slate-600 animate-pulse">Initializing agents…</p>}
                      <div ref={terminalEndRef} />
                    </div>
                    <p className="text-center text-[10px] text-slate-400 animate-pulse">AI doctors analysing your responses…</p>
                  </div>
                )}

                {/* Results */}
                {phase === 'results' && finalReport && (
                  <div className="space-y-3 pb-2">
                    {finalReport.emergency ? (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                        <p className="text-red-600 font-bold text-xs uppercase">🚨 Emergency Alert</p>
                        <p className="text-sm text-red-700">{finalReport.reason}</p>
                        <a href="tel:108" className="block w-full bg-red-600 text-white font-bold py-3 rounded-xl text-center">📞 Call 108 Now</a>
                      </div>
                    ) : (
                      <>
                        <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">✓</span>
                            <p className="text-xs font-bold text-slate-700 uppercase font-heading-style">Assessment Complete</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white rounded-xl p-2.5 border border-slate-100"><p className="text-[9px] text-slate-400 mb-0.5">Department</p><p className="font-bold text-primary capitalize">{finalReport.department}</p></div>
                            <div className="bg-white rounded-xl p-2.5 border border-slate-100"><p className="text-[9px] text-slate-400 mb-0.5">Condition</p><p className="font-bold text-slate-700 text-[10px]">{finalReport.condition}</p></div>
                          </div>
                          {agentSpeaking && <p className="text-xs text-primary animate-pulse">🔊 Doctor reading results…</p>}
                        </div>
                        {finalReport.prescription && (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-amber-800 uppercase mb-2">💊 Prescription</p>
                            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{finalReport.prescription}</p>
                          </div>
                        )}
                        {finalReport.homeRemedies && (
                          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-green-800 uppercase mb-2">🌿 Home Remedies</p>
                            <p className="text-xs text-slate-700 leading-relaxed">{finalReport.homeRemedies}</p>
                          </div>
                        )}
                        {finalReport.roadmap?.length > 0 && (
                          <div className="bg-white border border-slate-100 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">📋 Recovery Plan</p>
                            {finalReport.roadmap.map((d, i) => (
                              <div key={i} className="flex gap-2 items-start mb-2">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                                <p className="text-xs text-slate-600 leading-snug">{d}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-[9px] text-slate-400 text-center">⚠️ AI-assisted only. Always consult a licensed doctor.</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ── Action bar ── */}
              <div className="px-5 pt-3 pb-6 border-t border-slate-100 flex-shrink-0 space-y-2.5 bg-white">
                {phase === 'qa' && (
                  <>
                    {agentSpeaking ? (
                      <div className="w-full bg-slate-100 text-slate-400 font-bold py-3 rounded-2xl text-sm text-center animate-pulse">🔊 Doctor is speaking…</div>
                    ) : isListening ? (
                      <button onClick={handleDone} className="w-full bg-primary text-white font-bold py-3 rounded-2xl text-sm shadow cursor-pointer">
                        ✅ Done — Next Question
                      </button>
                    ) : (
                      <button onClick={startMic} className="w-full bg-primary text-white font-bold py-3 rounded-2xl text-sm shadow cursor-pointer flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 14H5c0 3.41 2.72 6.23 6 6.72V24h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
                        🎙 Tap to Speak
                      </button>
                    )}

                    {!agentSpeaking && (
                      <div className="flex gap-2 items-center">
                        <button onClick={handleRedo}
                          className="flex items-center gap-1 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-all flex-shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                          </svg>
                          Redo
                        </button>

                        {currentTranscript.trim() && !isListening && (
                          <button onClick={handleDone} className="flex-1 bg-slate-800 text-white font-bold py-2 rounded-xl text-xs cursor-pointer">
                            Submit →
                          </button>
                        )}

                        <button onClick={handleSkip} className="ml-auto text-slate-400 text-xs font-semibold cursor-pointer hover:text-slate-600 transition-colors px-1">
                          Skip →
                        </button>
                      </div>
                    )}
                  </>
                )}

                {phase === 'analyzing' && (
                  <p className="text-center text-[10px] text-slate-400 animate-pulse py-1">Multi-agent pipeline running…</p>
                )}

                {phase === 'results' && (
                  <div className="flex gap-2">
                    {!finalReport?.emergency && (
                      <button onClick={() => { closeConsultation(); navigate('/book-appointment'); }}
                        className="flex-1 bg-primary text-white font-bold py-3 rounded-2xl text-xs cursor-pointer shadow">
                        Book Appointment
                      </button>
                    )}
                    <button onClick={closeConsultation} className="flex-1 bg-slate-100 text-slate-600 border border-slate-200 font-bold py-3 rounded-2xl text-xs cursor-pointer">
                      Close
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
