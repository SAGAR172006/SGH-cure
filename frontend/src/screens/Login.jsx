import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';

const translations = {
  en: {
    title: "Onboard Portal",
    subtitle: "Enter details to continue booking",
    nameLabel: "Full Name",
    ageLabel: "Age (Years)",
    sexLabel: "Gender",
    phoneLabel: "Phone Number",
    btnSubmit: "Verify Phone Number",
    btnBack: "← Back",
    validationError: "Please fill in all fields correctly",
    male: "Male",
    female: "Female",
    other: "Other"
  },
  hi: {
    title: "पंजीकरण पोर्टल",
    subtitle: "बुकिंग जारी रखने के लिए विवरण दर्ज करें",
    nameLabel: "पूरा नाम",
    ageLabel: "आयु (वर्ष)",
    sexLabel: "लिंग",
    phoneLabel: "फ़ोन नंबर",
    btnSubmit: "फ़ोन नंबर सत्यापित करें",
    btnBack: "← पीछे",
    validationError: "कृपया सभी फ़ील्ड सही ढंग से भरें",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य"
  },
  kn: {
    title: "ನೋಂದಣಿ ಪೋರ್ಟಲ್",
    subtitle: "ಬುಕಿಂಗ್ ಮುಂದುವರಿಸಲು ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ",
    nameLabel: "ಪೂರ್ಣ ಹೆಸರು",
    ageLabel: "ವಯಸ್ಸು (ವರ್ಷಗಳು)",
    sexLabel: "ಲಿಂಗ",
    phoneLabel: "ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    btnSubmit: "ದೂರವಾಣಿ ಸಂಖ್ಯೆ ದೃಢೀಕರಿಸಿ",
    btnBack: "← ಹಿಂದೆ",
    validationError: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಸರಿಯಾಗಿ ಭರ್ತಿ ಮಾಡಿ",
    male: "ಪುರುಷ",
    female: "ಮಹಿಳೆ",
    other: "ಇತರೆ"
  }
};

export default function Login() {
  const { language, setHasChosenLanguage } = useContext(AppContext);
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  const [form, setForm] = useState({
    name: '',
    age: '',
    sex: 'male',
    phone: ''
  });
  const [error, setError] = useState('');

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.phone || form.phone.length < 10) {
      setError(t.validationError);
      return;
    }
    
    // Pass user details to the OTP Verification screen
    navigate('/otp', { state: { tempUser: form } });
  };

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

      {/* Top bar */}
      <div className="flex items-center relative z-10">
        <button
          onClick={() => {
            setHasChosenLanguage(false);
            navigate('/');
          }}
          className="text-xs font-semibold text-primary hover:text-primary-pressed flex items-center space-x-1 cursor-pointer"
        >
          <span>{t.btnBack}</span>
        </button>
      </div>

      {/* Main Login Form */}
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto space-y-6 relative z-10">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-text-heading font-heading-style">{t.title}</h2>
          <p className="text-xs text-text-muted">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 space-y-5 shadow-2xl border border-white/5">
          {/* Name Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-primary uppercase font-heading-style">{t.nameLabel}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="border-b-2 border-white/10 focus:border-primary bg-transparent text-text-heading outline-none py-1.5 px-1 transition-colors w-full text-sm font-medium"
              placeholder="e.g. Ramesh Kulkarni"
            />
          </div>

          {/* Grid for Age & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-primary uppercase font-heading-style">{t.ageLabel}</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => handleChange('age', e.target.value)}
                className="border-b-2 border-white/10 focus:border-primary bg-transparent text-text-heading outline-none py-1.5 px-1 transition-colors w-full text-sm font-medium"
                placeholder="e.g. 45"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-primary uppercase font-heading-style">{t.sexLabel}</label>
              <select
                value={form.sex}
                onChange={(e) => handleChange('sex', e.target.value)}
                className="border-b-2 border-white/10 focus:border-primary bg-transparent text-text-heading outline-none py-1.5 px-1 transition-colors w-full text-sm font-medium cursor-pointer"
              >
                <option value="male" className="bg-slate-950 text-white">{t.male}</option>
                <option value="female" className="bg-slate-950 text-white">{t.female}</option>
                <option value="other" className="bg-slate-950 text-white">{t.other}</option>
              </select>
            </div>
          </div>

          {/* Phone Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-primary uppercase font-heading-style">{t.phoneLabel}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="border-b-2 border-white/10 focus:border-primary bg-transparent text-text-heading outline-none py-1.5 px-1 transition-colors w-full text-sm font-medium"
              placeholder="e.g. 9900088888"
            />
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
            {t.btnSubmit}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
