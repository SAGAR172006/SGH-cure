import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';

const translations = {
  en: {
    title: "Verify Phone",
    subtitle: "Enter the code sent to",
    demoBadge: "DEMO MODE: Any 6 digits work",
    btnVerify: "Confirm & Continue",
    btnBack: "← Back",
    invalidOtp: "Please fill in all 6 digit slots",
  },
  hi: {
    title: "फ़ोन सत्यापित करें",
    subtitle: "भेजा गया कोड दर्ज करें",
    demoBadge: "डेमो मोड: कोई भी 6 अंक चलेंगे",
    btnVerify: "सत्यापित करें और आगे बढ़ें",
    btnBack: "← पीछे",
    invalidOtp: "कृपया सभी 6 अंक स्लॉट भरें",
  },
  kn: {
    title: "ದೂರವಾಣಿ ದೃಢೀಕರಿಸಿ",
    subtitle: "ಕಳುಹಿಸಲಾದ ಕೋಡ್ ನಮೂದಿಸಿ",
    demoBadge: "ಡೆಮೊ ಮೋಡ್: ಯಾವುದೇ 6 ಅಂಕೆಗಳು ನಡೆಯುತ್ತವೆ",
    btnVerify: "ಖಚಿತಪಡಿಸಿ ಮತ್ತು ಮುಂದುವರಿಯಿರಿ",
    btnBack: "← ಹಿಂದೆ",
    invalidOtp: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ 6 ಅಂಕಿಯ ಸ್ಲಾಟ್‌ಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ",
  }
};

export default function OtpVerify() {
  const { language, completeOnboarding } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[language] || translations.en;

  const tempUser = location.state?.tempUser || {
    name: 'Ramesh Kulkarni',
    age: '45',
    sex: 'male',
    phone: '9900088888'
  };

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = [
    useRef(), useRef(), useRef(), useRef(), useRef(), useRef()
  ];

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError('');

    // Move to next input if filled
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.some(digit => digit === '')) {
      setError(t.invalidOtp);
      return;
    }

    // Success simulation
    completeOnboarding(tempUser);
    navigate('/dashboard');
  };

  // Focus first digit on load
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col justify-between p-6 relative overflow-hidden page-transit-wrapper"
    >
      {/* Background Radial Glows */}
      <div className="absolute top-[-10%] right-[-15%] w-[80%] h-[50%] rounded-full glow-bg-radial opacity-60" />
      <div className="absolute bottom-[-10%] left-[-15%] w-[80%] h-[50%] rounded-full glow-bg-radial opacity-40" />

      {/* Back button */}
      <div className="flex items-center relative z-10">
        <button
          onClick={() => navigate('/login')}
          className="text-xs font-semibold text-primary hover:text-primary-pressed flex items-center space-x-1 cursor-pointer"
        >
          <span>{t.btnBack}</span>
        </button>
      </div>

      {/* Main OTP Panel */}
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto space-y-6 relative z-10">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-text-heading font-heading-style">{t.title}</h2>
          <p className="text-xs text-text-muted">
            {t.subtitle} <span className="font-semibold text-primary">{tempUser.phone}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-6 shadow-2xl border border-white/5">
          {/* Demo Mode indicator */}
          <div className="bg-primary-light border border-primary/10 px-3 py-2 rounded-xl text-center shadow-inner">
            <span className="text-[11px] font-bold text-primary font-heading-style">{t.demoBadge}</span>
          </div>

          {/* Code input grid */}
          <div className="flex justify-between gap-1.5">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                ref={inputRefs[index]}
                value={digit}
                maxLength={1}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-12 text-center text-xl font-bold border-b-2 border-white/10 focus:border-primary bg-white/5 rounded-xl outline-none transition-colors text-text-heading focus:bg-white/10"
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-danger font-semibold text-center mt-2">{error}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-primary hover:bg-primary-pressed text-white font-bold py-3.5 rounded-xl shadow-lg transition-all text-xs tracking-wider uppercase font-heading-style mt-4 cursor-pointer"
          >
            {t.btnVerify}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
