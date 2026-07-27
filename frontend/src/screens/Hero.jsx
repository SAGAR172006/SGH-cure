import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';

const translations = {
  en: {
    welcome: "Healthcare Access",
    bookBtn: "Book Clinic Appointment",
    emergencyBtn: "🚨 EMERGENCY PATH",
    tagline: "Quick access to government healthcare services, built for everyone.",
    floatingInfo1: "⚡ Local AI Triage",
    floatingInfo2: "📍 GPS Location Sharing",
    floatingInfo3: "🏥 Nearby Health Centres",
    loginPrompt: "Please verify identity to book",
    btnBack: "← Change Language",
    signedInAs: "Signed in as"
  },
  hi: {
    welcome: "स्वास्थ्य सेवा पहुँच",
    bookBtn: "क्लीनिक अपॉइंटमेंट बुक करें",
    emergencyBtn: "🚨 आपातकालीन सेवा",
    tagline: "सरकारी स्वास्थ्य सेवाओं तक त्वरित पहुँच, सभी के लिए निर्मित।",
    floatingInfo1: "⚡ स्थानीय एआई वर्गीकरण",
    floatingInfo2: "📍 जीपीएस स्थान साझाकरण",
    floatingInfo3: "🏥 पास के स्वास्थ्य केंद्र",
    loginPrompt: "बुक करने के लिए कृपया पहचान सत्यापित करें",
    btnBack: "← भाषा बदलें",
    signedInAs: "सत्यापित उपयोगकर्ता"
  },
  kn: {
    welcome: "ಆರೋಗ್ಯ ಸೇವೆಗಳ ಪ್ರವೇಶ",
    bookBtn: "ಕ್ಲಿನಿಕ್ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ",
    emergencyBtn: "🚨 ತುರ್ತು ಸೇವೆ",
    tagline: "ಸರ್ಕಾರಿ ಆರೋಗ್ಯ ಸೇವೆಗಳಿಗೆ ತ್ವರಿತ ಪ್ರವೇಶ, ಎಲ್ಲರಿಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ.",
    floatingInfo1: "⚡ ಸ್ಥಳೀಯ ಎಐ ವರ್ಗೀಕರಣ",
    floatingInfo2: "📍 ಜಿಪಿಎಸ್ ಸ್ಥಳ ಹಂಚಿಕೆ",
    floatingInfo3: "🏥 ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು",
    loginPrompt: "ಬುಕ್ ಮಾಡಲು ದಯವಿಟ್ಟು ಗುರುತನ್ನು ದೃಢೀಕರಿಸಿ",
    btnBack: "← ಭಾಷೆ ಬದಲಿಸಿ",
    signedInAs: "ದೃಢೀಕೃತ ಬಳಕೆದಾರ"
  }
};

export default function Hero() {
  const { language, user } = useContext(AppContext);
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  const handleBookAppointment = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleEmergency = () => {
    navigate('/emergency');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col justify-between p-6 relative overflow-hidden page-transit-wrapper"
    >
      {/* Background Radial Glows */}
      <div className="absolute top-[20%] left-[-20%] w-[90%] h-[50%] rounded-full glow-bg-radial opacity-60" />
      <div className="absolute bottom-[20%] right-[-20%] w-[90%] h-[50%] rounded-full glow-bg-radial opacity-40" />

      {/* Top Bar with Language Back Button & Auth info */}
      <div className="flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate('/')}
          className="text-xs font-semibold text-primary hover:text-primary-pressed flex items-center space-x-1 cursor-pointer"
        >
          <span>{t.btnBack}</span>
        </button>

        {user && (
          <div className="text-right text-[10px] bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-xl text-text-heading font-bold shadow-sm">
            <span className="opacity-75">{t.signedInAs}: </span>
            <span className="text-primary">{user.name}</span>
          </div>
        )}
      </div>

      {/* Hero Body */}
      <div className="flex-1 flex flex-col justify-center items-center space-y-8 my-4 relative z-10 perspective-container">
        {/* Brand */}
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-extrabold tracking-tight text-text-heading font-heading-style leading-none">Smart GOV<br /><span className="text-primary font-heading-style">Health</span></h2>
          <p className="text-xs text-text-muted px-4 mt-2 leading-relaxed">{t.tagline}</p>
        </div>

        {/* Center Big CTAs */}
        <div className="w-full space-y-4 pt-4 preserve-3d">
          {/* Main Book Appointment Pill Button */}
          <motion.button
            whileHover={{ 
              scale: 1.03, 
              rotateY: 5, 
              rotateX: -5,
              z: 20,
              boxShadow: "0 0 30px rgba(6, 182, 212, 0.45)"
            }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBookAppointment}
            className="w-full bg-primary hover:bg-primary-pressed text-white text-lg font-bold py-6 px-4 rounded-full shadow-lg transition-all font-heading-style cursor-pointer"
          >
            {t.bookBtn}
          </motion.button>

          {/* Red Emergency Button */}
          <motion.button
            whileHover={{ 
              scale: 1.03,
              rotateY: -5,
              rotateX: 5,
              z: 20,
              boxShadow: "0 0 30px rgba(239, 68, 68, 0.35)"
            }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEmergency}
            className="w-full bg-danger hover:bg-red-600 text-white text-xs font-bold py-4 px-4 rounded-xl shadow-lg transition-all border border-red-500/10 font-heading-style tracking-wider cursor-pointer"
          >
            {t.emergencyBtn}
          </motion.button>
        </div>
      </div>

      {/* Floating Info Cards */}
      <div className="space-y-3 mt-4 mb-2 relative z-10">
        <div className="grid grid-cols-3 gap-2">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-3 rounded-xl text-center shadow-md border border-white/5"
          >
            <span className="text-[9px] font-bold text-text-heading block uppercase tracking-wide leading-tight">{t.floatingInfo1}</span>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-3 rounded-xl text-center shadow-md border border-white/5"
          >
            <span className="text-[9px] font-bold text-text-heading block uppercase tracking-wide leading-tight">{t.floatingInfo2}</span>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-3 rounded-xl text-center shadow-md border border-white/5"
          >
            <span className="text-[9px] font-bold text-text-heading block uppercase tracking-wide leading-tight">{t.floatingInfo3}</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
