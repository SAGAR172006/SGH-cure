import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';

const translations = {
  en: {
    welcome: "Welcome to",
    subtitle: "Your health, our priority",
    chooseLanguage: "Choose your language",
    speakOption: "Or tap to speak your language",
    letsGo: "Continue",
    listening: "Listening...",
    trySpeaking: "Say: 'English', 'Hindi', or 'Kannada'",
    unsupported: "Speech not supported on this browser",
  },
  hi: {
    welcome: "स्वागत है",
    subtitle: "आपका स्वास्थ्य, हमारी प्राथमिकता",
    chooseLanguage: "अपनी भाषा चुनें",
    speakOption: "या अपनी भाषा बोलने के लिए दबाएं",
    letsGo: "आगे बढ़ें",
    listening: "सुन रहे हैं...",
    trySpeaking: "बोलें: 'इंग्लिश', 'हिंदी', या 'कन्नड़'",
    unsupported: "इस ब्राउज़र में स्पीच सपोर्ट उपलब्ध नहीं है",
  },
  kn: {
    welcome: "ಸ್ವಾಗತ",
    subtitle: "ನಿಮ್ಮ ಆರೋಗ್ಯ, ನಮ್ಮ ಆದ್ಯತೆ",
    chooseLanguage: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ",
    speakOption: "ಅಥವಾ ನಿಮ್ಮ ಭಾಷೆ ಮಾತನಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ",
    letsGo: "ಮುಂದುವರಿಯಿರಿ",
    listening: "ಕೇಳಿಸಲಾಗುತ್ತಿದೆ...",
    trySpeaking: "ಹೇಳಿ: 'ಇಂಗ್ಲಿಷ್', 'ಹಿಂದಿ', ಅಥವಾ 'ಕನ್ನಡ'",
    unsupported: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಸ್ಪೀಚ್ ಸಪೋರ್ಟ್ ಇಲ್ಲ",
  }
};

export default function SplashLanguage() {
  const { 
    language, 
    setLanguage, 
    hasChosenLanguage, 
    setHasChosenLanguage, 
    isLoggedIn 
  } = useContext(AppContext);
  
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState('');
  const t = translations[language] || translations.en;

  // Auto-redirect if language choice is already set in persistent storage
  useEffect(() => {
    if (hasChosenLanguage) {
      if (isLoggedIn) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [hasChosenLanguage, isLoggedIn, navigate]);

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechFeedback(t.unsupported);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechFeedback(t.listening);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
      setSpeechFeedback('');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Voice language matched:', transcript);
      
      if (transcript.includes('english') || transcript.includes('ಇಂಗ್ಲಿಷ್')) {
        setLanguage('en');
        setSpeechFeedback('Selected: English');
      } else if (transcript.includes('hindi') || transcript.includes('हिंदी') || transcript.includes('ಹಿಂದಿ')) {
        setLanguage('hi');
        setSpeechFeedback('Selected: Hindi');
      } else if (transcript.includes('kannada') || transcript.includes('ಕನ್ನಡ')) {
        setLanguage('kn');
        setSpeechFeedback('Selected: Kannada');
      } else {
        setSpeechFeedback(`Didn't recognize: "${transcript}"`);
      }
    };

    recognition.start();
  };

  const handleContinue = () => {
    setHasChosenLanguage(true); // Persist selection
    navigate('/login'); // Move straight to Auth
  };

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col justify-between p-6 text-text-heading relative overflow-hidden page-transit-wrapper"
    >
      {/* Background Radial Glows */}
      <div className="absolute top-[-10%] left-[-15%] w-[80%] h-[50%] rounded-full glow-bg-radial opacity-60" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[80%] h-[50%] rounded-full glow-bg-radial opacity-40" />

      {/* Header / Brand */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-5 relative z-10">
        {/* Heart/Cross SVG Icon with 3D Float */}
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotateY: [0, 180, 360]
          }}
          transition={{ 
            y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
            rotateY: { repeat: Infinity, duration: 6, ease: "linear" }
          }}
          className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(6,182,212,0.15)] preserve-3d"
        >
          <svg className="w-10 h-10 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
          </svg>
        </motion.div>
        
        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-heading-style">Smart GOV Portal</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-heading font-heading-style">Smart GOV Health</h1>
          <p className="text-xs text-text-muted">{t.subtitle}</p>
        </div>
      </div>

      {/* Language Selection Card */}
      <div className="glass-panel rounded-2xl p-6 space-y-6 shadow-2xl relative z-10 border border-white/5">
        <h2 className="text-sm font-bold text-center tracking-wide uppercase text-primary font-heading-style">{t.chooseLanguage}</h2>
        
        <div className="grid grid-cols-3 gap-2.5 perspective-container">
          {languages.map((lang) => (
            <motion.button
              key={lang.code}
              whileHover={{ 
                scale: 1.05, 
                rotateY: 8, 
                rotateX: 8, 
                z: 10,
                boxShadow: "0 0 20px rgba(6, 182, 212, 0.2)"
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all preserve-3d cursor-pointer ${
                language === lang.code
                  ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5'
                  : 'border-white/5 bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-heading'
              }`}
            >
              <span className="text-sm font-bold font-heading-style">{lang.native}</span>
              <span className="text-[10px] opacity-75 mt-1">{lang.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Mic speaking interface */}
        <div className="flex flex-col items-center justify-center pt-2 space-y-3">
          <p className="text-[10px] font-semibold text-text-muted text-center tracking-wide uppercase">{t.speakOption}</p>
          
          <div className="relative">
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.6, opacity: 0.3 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute inset-0 bg-primary rounded-full"
                />
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleVoiceInput}
              disabled={isListening}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg relative z-10 transition-all cursor-pointer ${
                isListening ? 'bg-primary text-white neon-glow' : 'bg-white/5 border border-white/10 text-primary hover:bg-white/10'
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 14H5c0 3.41 2.72 6.23 6 6.72V24h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            </motion.button>
          </div>

          <p className="text-[10px] font-bold text-primary min-h-[16px] uppercase tracking-wider">
            {speechFeedback || (isListening ? t.trySpeaking : '')}
          </p>
        </div>
      </div>

      {/* Continue CTA */}
      <div className="mt-6 mb-2 relative z-10">
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(6, 182, 212, 0.4)" }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          className="w-full bg-primary hover:bg-primary-pressed text-white font-bold py-4 rounded-xl shadow-lg transition-all text-sm tracking-wide uppercase font-heading-style cursor-pointer"
        >
          {t.letsGo} →
        </motion.button>
      </div>
    </motion.div>
  );
}
