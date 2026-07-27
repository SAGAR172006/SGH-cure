import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import doctorsData from '../data/doctors.json';
import centresData from '../data/centres.json';
import departmentsData from '../data/departments.json';

const translations = {
  en: {
    title: "Available Doctor",
    subtitle: "Select a convenient time slot",
    deptLabel: "Matched Department",
    noDoctor: "Doctor Unavailable Today",
    fallbackSubtitle: "The doctor is currently unavailable. Please visit a nearby health centre or call:",
    btnBook: "Confirm & Book Appointment",
    btnBack: "← Back",
    experience: "yrs exp",
    rating: "rating",
    slotsTitle: "Available Time Slots",
    callDesk: "📞 Call Support Desk",
    symptomLabel: "Reported Symptom",
  },
  hi: {
    title: "उपलब्ध डॉक्टर",
    subtitle: "एक सुविधाजनक समय स्लॉट चुनें",
    deptLabel: "मैच किया गया विभाग",
    noDoctor: "डॉक्टर आज उपलब्ध नहीं हैं",
    fallbackSubtitle: "डॉक्टर वर्तमान में अनुपलब्ध हैं। कृपया पास के स्वास्थ्य केंद्र पर जाएँ या कॉल करें:",
    btnBook: "पुष्टि करें और अपॉइंटमेंट बुक करें",
    btnBack: "← पीछे",
    experience: "वर्ष अनु.",
    rating: "रेटिंग",
    slotsTitle: "उपलब्ध समय स्लॉट",
    callDesk: "📞 सहायता डेस्क कॉल करें",
    symptomLabel: "रिपोर्ट किया गया लक्षण",
  },
  kn: {
    title: "ಲಭ್ಯವಿರುವ ವೈದ್ಯರು",
    subtitle: "ಅನುಕೂಲಕರ ಸಮಯದ ಸ್ಲಾಟ್ ಆಯ್ಕೆಮಾಡಿ",
    deptLabel: "ಹೊಂದಿಕೆಯಾದ ಇಲಾಖೆ",
    noDoctor: "ವೈದ್ಯರು ಇಂದು ಲಭ್ಯವಿಲ್ಲ",
    fallbackSubtitle: "ವೈದ್ಯರು ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ ಅಥವಾ ಕರೆ ಮಾಡಿ:",
    btnBook: "ಖಚಿತಪಡಿಸಿ ಮತ್ತು ಬುಕ್ ಮಾಡಿ",
    btnBack: "← ಹಿಂದೆ",
    experience: "ವರ್ಷ ಅನುಭವ",
    rating: "ರೇಟಿಂಗ್",
    slotsTitle: "ಲಭ್ಯವಿರುವ ಸಮಯದ ಸ್ಲಾಟ್‌ಗಳು",
    callDesk: "📞 ಸಹಾಯ ಕೇಂದ್ರಕ್ಕೆ ಕರೆ ಮಾಡಿ",
    symptomLabel: "ವರದಿಯಾದ ರೋಗಲಕ್ಷಣ",
  }
};

export default function BookingResults() {
  const { language, booking, setBooking } = useContext(AppContext);
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);

  // Safety fallback if accessed directly
  const currentBooking = booking || {
    symptomText: "chest pain",
    matchedDepartment: "cardiology"
  };

  const matchedDeptInfo = departmentsData.find(d => d.id === currentBooking.matchedDepartment) || {
    name: "General Medicine"
  };

  // Find all doctors in the matched department
  const matchingDoctors = doctorsData.filter(doc => doc.department === currentBooking.matchedDepartment);
  
  // Pick the first matching doctor as "randomly chosen/preferred"
  const doctor = matchingDoctors[0] || doctorsData[0]; // fallback to first doctor if none matched

  // Generate 5 next-day slots
  useEffect(() => {
    if (doctor && doctor.available) {
      const baseSlots = [
        { id: 'slot-1', time: "09:30 AM", isAvailable: true },
        { id: 'slot-2', time: "11:00 AM", isAvailable: true },
        { id: 'slot-3', time: "12:30 PM", isAvailable: false }, // simulate taken
        { id: 'slot-4', time: "03:00 PM", isAvailable: true },
        { id: 'slot-5', time: "04:30 PM", isAvailable: true }
      ];
      setSlots(baseSlots);
    }
  }, [doctor]);

  const handleBook = () => {
    if (!selectedSlot) return;
    
    // Save confirmation details
    setBooking(prev => ({
      ...prev,
      doctor,
      slot: selectedSlot
    }));
    navigate('/booking-confirmation');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col justify-between p-6 relative overflow-hidden page-transit-wrapper"
    >
      {/* Background Radial Glows */}
      <div className="absolute top-[10%] left-[-20%] w-[90%] h-[40%] rounded-full glow-bg-radial opacity-60" />
      <div className="absolute bottom-[10%] right-[-20%] w-[90%] h-[40%] rounded-full glow-bg-radial opacity-40" />

      {/* Top Header */}
      <div className="flex items-center relative z-10">
        <button
          onClick={() => navigate('/voice-booking')}
          className="text-xs font-semibold text-primary hover:text-primary-pressed flex items-center space-x-1 cursor-pointer"
        >
          <span>{t.btnBack}</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto space-y-4 my-2 relative z-10">
        {/* Triage feedback header */}
        <div className="glass-panel p-4 rounded-2xl space-y-1 shadow-xl border border-white/5">
          <p className="text-[10px] font-bold tracking-widest text-primary uppercase font-heading-style">{t.deptLabel}</p>
          <h3 className="text-lg font-extrabold text-text-heading font-heading-style">{matchedDeptInfo.name}</h3>
          <p className="text-xs text-text-muted mt-1 italic">"{currentBooking.symptomText}"</p>
        </div>

        {/* Doctor Details (Available Flow) vs Fallback centres (Unavailable Flow) */}
        {doctor.available ? (
          /* DOCTOR AVAILABLE FLOW */
          <div className="space-y-4">
            {/* Doctor Card */}
            <div className="glass-panel rounded-2xl p-5 flex items-center space-x-4 shadow-xl border border-white/5">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center font-bold text-xl text-primary border border-primary/20 shrink-0">
                {doctor.name[4]}
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-text-heading font-heading-style">{doctor.name}</h4>
                <p className="text-xs text-text-muted">{doctor.qualification}</p>
                <div className="flex items-center gap-3 text-[10px] font-bold text-primary uppercase tracking-wider">
                  <span>★ {doctor.rating} {t.rating}</span>
                  <span>•</span>
                  <span>{doctor.experienceYears} {t.experience}</span>
                </div>
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="glass-panel rounded-2xl p-5 space-y-3 shadow-xl border border-white/5">
              <h3 className="text-[10px] font-bold tracking-widest text-primary uppercase font-heading-style">{t.slotsTitle}</h3>
              <div className="grid grid-cols-2 gap-2">
                {slots.map((s) => (
                  <motion.button
                    key={s.id}
                    disabled={!s.isAvailable}
                    whileHover={s.isAvailable ? { scale: 1.05 } : {}}
                    whileTap={s.isAvailable ? { scale: 0.95 } : {}}
                    onClick={() => setSelectedSlot(s.time)}
                    className={`py-3.5 rounded-xl text-center text-xs font-bold transition-all border cursor-pointer ${
                      !s.isAvailable
                        ? 'bg-black/10 text-white/20 border-white/5 cursor-not-allowed line-through'
                        : selectedSlot === s.time
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-98'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-text-heading'
                    }`}
                  >
                    {s.time}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(6, 182, 212, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBook}
              disabled={!selectedSlot}
              className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all text-xs tracking-wider uppercase font-heading-style cursor-pointer ${
                selectedSlot
                  ? 'bg-primary hover:bg-primary-pressed text-white'
                  : 'bg-primary/25 text-white/50 cursor-not-allowed'
              }`}
            >
              {t.btnBook}
            </motion.button>
          </div>
        ) : (
          /* DOCTOR UNAVAILABLE FLOW */
          <div className="space-y-4">
            {/* Header notification */}
            <div className="bg-danger/10 border border-danger/25 rounded-2xl p-4 text-center space-y-1 shadow-lg">
              <h4 className="text-base font-extrabold text-danger font-heading-style">{t.noDoctor}</h4>
              <p className="text-xs text-text-muted">{t.fallbackSubtitle}</p>
            </div>

            {/* List 4 Healthcare centres */}
            <div className="glass-panel rounded-2xl p-5 space-y-3 shadow-xl border border-white/5">
              <h3 className="text-[10px] font-bold tracking-widest text-primary uppercase font-heading-style mb-2">Fallback Medical Centres</h3>
              
              <div className="space-y-3 divide-y divide-white/5">
                {centresData.map((centre, idx) => (
                  <div key={idx} className="flex items-center justify-between pt-3 first:pt-0">
                    <div>
                      <p className="font-extrabold text-text-heading text-sm font-heading-style">{centre.name}</p>
                      <p className="text-[11px] text-text-muted">{centre.phone}</p>
                    </div>
                    {/* Call anchor */}
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={`tel:${centre.phone}`}
                      className="bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      Call
                    </motion.a>
                  </div>
                ))}
              </div>
            </div>

            {/* Dummy dialer support */}
            <motion.a
              whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(239, 68, 68, 0.35)" }}
              whileTap={{ scale: 0.98 }}
              href="tel:9900088888"
              className="w-full bg-danger text-white font-bold py-4 rounded-xl shadow-lg text-center flex items-center justify-center gap-1.5 transition-all border border-red-500/10 text-xs tracking-wider uppercase font-heading-style"
            >
              {t.callDesk}
            </motion.a>
          </div>
        )}
      </div>
    </motion.div>
  );
}
