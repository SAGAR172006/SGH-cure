import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import departmentsData from '../data/departments.json';

const translations = {
  en: {
    title: "Appointment Booked",
    subtitle: "Your token has been successfully generated",
    btnHome: "Return to Dashboard",
    doctor: "Doctor",
    patient: "Patient Name",
    time: "Appt Time",
    symptom: "Symptom",
    dept: "Department",
    infoCard: "Please arrive 10-15 minutes prior to your time slot. Show this screen at the front reception desk.",
  },
  hi: {
    title: "अपॉइंटमेंट बुक हो गया",
    subtitle: "आपका टोकन सफलतापूर्वक तैयार किया गया है",
    btnHome: "डैशबोर्ड पर लौटें",
    doctor: "डॉक्टर",
    patient: "मरीज का नाम",
    time: "समय स्लॉट",
    symptom: "लक्षण",
    dept: "विभाग",
    infoCard: "कृपया अपने निर्धारित समय से 10-15 मिनट पहले पहुंचें। फ्रंट रिसेप्शन डेस्क पर यह रसीद दिखाएं।",
  },
  kn: {
    title: "ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕ್ ಆಗಿದೆ",
    subtitle: "ನಿಮ್ಮ ಟೋಕನ್ ಯಶಸ್ವಿಯಾಗಿ ರಚನೆಯಾಗಿದೆ",
    btnHome: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    doctor: "ವೈದ್ಯರು",
    patient: "ರೋಗಿಯ ಹೆಸರು",
    time: "ಸಮಯದ ಸ್ಲಾಟ್",
    symptom: "ರೋಗಲಕ್ಷಣ",
    dept: "ಇಲಾಖೆ",
    infoCard: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಮಯಕ್ಕಿಂತ 10-15 ನಿಮಿಷ ಮುಂಚಿತವಾಗಿ ತಲುಪಿ. ಮುಂಭಾಗದ ರಿಸೆಪ್ಷನ್ ಡೆಸ್ಕ್‌ನಲ್ಲಿ ಈ ಸ್ಕ್ರೀನ್ ತೋರಿಸಿ.",
  }
};

export default function BookingConfirmation() {
  const { language, booking, user } = useContext(AppContext);
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  // Safe fallback if accessed directly in dev
  const activeBooking = booking || {
    symptomText: "chest pain",
    matchedDepartment: "cardiology",
    doctor: { name: "Dr. Srinivas Murthy" },
    slot: "11:00 AM"
  };

  const matchedDeptInfo = departmentsData.find(d => d.id === activeBooking.matchedDepartment) || {
    name: "General Medicine"
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      {/* Empty top spacing */}
      <div />

      {/* Main Confirmation Content */}
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto space-y-6">
        {/* Pulsing checkmark */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 10 }}
            className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center text-success border border-success/30"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-text-heading">{t.title}</h2>
            <p className="text-xs text-text-muted">{t.subtitle}</p>
          </div>
        </div>

        {/* Receipt-style details card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white/60 backdrop-blur-md border border-white/20 rounded-lg shadow-md relative overflow-hidden"
        >
          {/* Top colored highlight strip */}
          <div className="bg-primary h-1.5 w-full" />
          
          <div className="p-5 space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase block">{t.patient}</span>
                <span className="font-bold text-text-heading">{user?.name || 'Ramesh Kulkarni'}</span>
              </div>
              
              <div>
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase block">{t.time}</span>
                <span className="font-bold text-text-heading">{activeBooking.slot}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase block">{t.dept}</span>
                <span className="font-bold text-text-heading">{matchedDeptInfo.name}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase block">{t.doctor}</span>
                <span className="font-bold text-text-heading">{activeBooking.doctor?.name || 'Dr. Srinivas Murthy'}</span>
              </div>
            </div>

            {/* Separator line */}
            <div className="border-t border-dashed border-black/10 my-2" />

            {/* Symptom block */}
            <div>
              <span className="text-[10px] font-bold text-primary tracking-wider uppercase block mb-1">{t.symptom}</span>
              <p className="text-xs bg-white/30 border border-white/20 p-2.5 rounded text-text-muted italic">
                "{activeBooking.symptomText}"
              </p>
            </div>
          </div>
        </motion.div>

        {/* Informational advisory box */}
        <div className="bg-primary-light/50 border border-primary/20 rounded-md p-3.5 text-center">
          <p className="text-[11px] font-semibold text-primary leading-normal">{t.infoCard}</p>
        </div>
      </div>

      {/* Return CTA */}
      <div className="mt-8 mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-primary hover:bg-primary-pressed text-white font-semibold py-4 rounded-md shadow-md transition-all active:scale-95"
        >
          {t.btnHome}
        </button>
      </div>
    </div>
  );
}
