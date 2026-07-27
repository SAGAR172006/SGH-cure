import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import departmentsData from '../data/departments.json';
import doctorsData from '../data/doctors.json';

const translations = {
  en: {
    title: "Book Appointment",
    profileLabel: "Patient Profile",
    dateLabel: "Select Date",
    slotLabel: "Select Time Slot",
    btnConfirm: "Confirm & Register Booking",
    staleMsg: "⚠️ Diagnostic report is missing or more than 3 days old. You are being redirected to the dashboard to run a voice diagnostic first.",
    deptLabel: "Recommended Department",
    btnBack: "← Dashboard",
    alreadyBooked: "⚠️ This profile already has a booking scheduled for this date.",
    successMsg: "Booking completed successfully!"
  },
  hi: {
    title: "अपॉइंटमेंट बुक करें",
    profileLabel: "मरीज की प्रोफाइल",
    dateLabel: "तारीख चुनें",
    slotLabel: "समय स्लॉट चुनें",
    btnConfirm: "पुष्टि करें और बुक करें",
    staleMsg: "⚠️ डायग्नोस्टिक रिपोर्ट अनुपस्थित है या 3 दिन से अधिक पुरानी है। डायग्नोस्टिक रन करने के लिए आपको डैशबोर्ड पर भेजा जा रहा है।",
    deptLabel: "अनुशंसित विभाग",
    btnBack: "← डैशबोर्ड",
    alreadyBooked: "⚠️ इस प्रोफाइल के पास पहले से ही इस तारीख के लिए बुकिंग है।",
    successMsg: "बुकिंग सफलतापूर्वक पूरी हुई!"
  },
  kn: {
    title: "ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಬುಕಿಂಗ್",
    profileLabel: "ರೋಗಿಯ ಪ್ರೊಫೈಲ್",
    dateLabel: "ದಿನಾಂಕ ಆಯ್ಕೆಮಾಡಿ",
    slotLabel: "ಸಮಯದ ಸ್ಲಾಟ್ ಆಯ್ಕೆಮಾಡಿ",
    btnConfirm: "ಖಚಿತಪಡಿಸಿ ಮತ್ತು ಬುಕ್ ಮಾಡಿ",
    staleMsg: "⚠️ ಡಯಾಗ್ನೋಸ್ಟಿಕ್ ವರದಿ ಇಲ್ಲ ಅಥವಾ ೩ ದಿನಗಳಿಗಿಂತ ಹಳೆಯದಾಗಿದೆ. ಹೊಸ ಡಯಾಗ್ನೋಸ್ಟಿಕ್ ಮಾಡಲು ನಿಮ್ಮನ್ನು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ.",
    deptLabel: "ಶಿಫಾರಸು ಮಾಡಲಾದ ಇಲಾಖೆ",
    btnBack: "← ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    alreadyBooked: "⚠️ ಈ ಪ್ರೊಫೈಲ್ ಈಗಾಗಲೇ ಈ ದಿನಾಂಕದಂದು ಬುಕಿಂಗ್ ಹೊಂದಿದೆ.",
    successMsg: "ಬುಕಿಂಗ್ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ!"
  }
};

export default function BookAppointment() {
  const { 
    language, 
    profiles, 
    activeProfileId, 
    setActiveProfileId, 
    addProfileBooking,
    deleteProfileBooking,
    setBooking 
  } = useContext(AppContext);
  
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  const [selectedProfileId, setSelectedProfileId] = useState(activeProfileId);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [datesList, setDatesList] = useState([]);
  const [slotsList, setSlotsList] = useState([]);
  const [redirecting, setRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Get currently selected profile
  const profile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

  // Check diagnostics recency (must be < 3 days old)
  useEffect(() => {
    if (!profile) return;
    
    const diag = profile.diagnosticData;
    if (!diag || !diag.lastUpdated) {
      triggerRedirect();
      return;
    }

    const lastUpdatedDate = new Date(diag.lastUpdated);
    const diffTime = Math.abs(new Date() - lastUpdatedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 3) {
      triggerRedirect();
    } else {
      setRedirecting(false);
      setErrorMsg('');
    }
  }, [profile]);

  const triggerRedirect = () => {
    setRedirecting(true);
    setErrorMsg(t.staleMsg);
    setTimeout(() => {
      navigate('/dashboard');
    }, 4000);
  };

  // Generate 7 upcoming dates (include today only if before 5:30 PM)
  useEffect(() => {
    const list = [];
    const now = new Date();
    
    // Check if past 5:30 PM (17:30)
    const isPastCutoff = now.getHours() > 17 || (now.getHours() === 17 && now.getMinutes() >= 30);
    const startOffset = isPastCutoff ? 1 : 0;

    for (let i = startOffset; i < startOffset + 7; i++) {
      const date = new Date();
      date.setDate(now.getDate() + i);
      
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const str = `${yyyy}-${mm}-${dd}`;
      
      const displayStr = date.toLocaleDateString(language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'kn-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      list.push({ value: str, label: displayStr });
    }

    setDatesList(list);
    if (list.length > 0) {
      setSelectedDate(list[0].value);
    }
  }, [language]);

  // Generate 30-minute slots from 10:00 AM to 6:00 PM
  useEffect(() => {
    const list = [];
    let startHour = 10;
    let startMinute = 0;
    
    while (startHour < 18 || (startHour === 18 && startMinute === 0)) {
      const displayHour = startHour > 12 ? startHour - 12 : startHour;
      const ampm = startHour >= 12 ? 'PM' : 'AM';
      const mStr = String(startMinute).padStart(2, '0');
      const timeStr = `${String(displayHour).padStart(2, '0')}:${mStr} ${ampm}`;
      list.push(timeStr);
      
      startMinute += 30;
      if (startMinute === 60) {
        startHour += 1;
        startMinute = 0;
      }
    }
    setSlotsList(list);
  }, []);

  const handleProfileChange = (e) => {
    const pId = e.target.value;
    setSelectedProfileId(pId);
    setActiveProfileId(pId); // sync active selection
    setSelectedSlot('');
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedSlot || redirecting) return;

    // Check double-booking constraint: 1 slot per profile per day
    const alreadyBooked = profile.bookings.some(b => b.date === selectedDate);
    if (alreadyBooked) {
      setErrorMsg(t.alreadyBooked);
      return;
    }

    const deptInfo = departmentsData.find(d => d.id === profile.diagnosticData?.department) || { name: 'General Medicine' };
    const matchingDocs = doctorsData.filter(d => d.department === profile.diagnosticData?.department);
    const doctor = matchingDocs[0] || { name: 'Dr. Ramesh Gowda' };

    const newBookingObj = {
      date: selectedDate,
      timeSlot: selectedSlot,
      department: deptInfo.name,
      doctor: doctor.name,
      patientName: profile.name
    };

    // Save booking to profile
    addProfileBooking(profile.id, newBookingObj);
    
    // Set global context booking for confirmation display
    setBooking({
      symptomText: `Scheduled Triage Booking for ${profile.name}`,
      matchedDepartment: profile.diagnosticData?.department || 'general',
      doctor: doctor,
      slot: `${selectedDate} @ ${selectedSlot}`
    });

    setSuccessMsg(t.successMsg);
    setTimeout(() => {
      navigate('/booking-confirmation');
    }, 1500);
  };

  // Helper to calculate estimated waiting timer
  const getEstimatedWait = (b) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (b.date === todayStr) {
      const tokenStr = b.tokenNumber || 'TK7B9X';
      const hash = tokenStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const mins = (hash % 20) + 5; // 5 to 24 mins (<= 25 mins)
      return `${mins} mins`;
    }
    return "5 mins";
  };

  // Gather upcoming bookings for selected profile
  const upcomingBookings = profile?.bookings || [];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col justify-between p-6 relative overflow-hidden page-transit-wrapper"
      style={{ paddingBottom: '90px' }}
    >
      {/* Background Radial Glows */}
      <div className="absolute top-[10%] left-[-20%] w-[90%] h-[40%] rounded-full glow-bg-radial opacity-60" />
      <div className="absolute bottom-[10%] right-[-20%] w-[90%] h-[40%] rounded-full glow-bg-radial opacity-40" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-primary hover:text-primary-pressed flex items-center space-x-1 cursor-pointer"
        >
          <span>{t.btnBack}</span>
        </button>
        <h2 className="text-sm font-bold text-text-heading font-heading-style uppercase tracking-wider">
          Appointments
        </h2>
        <div className="w-8" />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col max-w-sm w-full mx-auto space-y-4 my-2 relative z-10 overflow-y-auto scrollbar-none">

        {/* ── Upcoming Appointments Header Card ── */}
        {upcomingBookings.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-primary tracking-widest uppercase font-heading-style">
              Upcoming Appointments ({upcomingBookings.length})
            </h3>
            <div className="space-y-2.5">
              {upcomingBookings.map((b, idx) => {
                const waitTime = getEstimatedWait(b);
                const token = b.tokenNumber || 'TK9B4X';
                return (
                  <div
                    key={idx}
                    className="bg-white/90 backdrop-blur-md border border-cyan-100 rounded-2xl p-4 shadow-sm space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Patient</span>
                        <h4 className="text-xs font-extrabold text-slate-800">{b.patientName || profile.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Token Badge */}
                        <div className="bg-primary/10 border border-primary/30 text-primary px-2.5 py-1 rounded-xl font-mono text-[10px] font-bold tracking-wider">
                          TOKEN: {token}
                        </div>
                        {/* Delete Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (window.confirm("Are you sure you want to cancel this appointment?")) {
                              deleteProfileBooking(profile.id, idx);
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 p-1.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                          title="Cancel Appointment"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Department & Doctor</span>
                        <p className="font-bold text-slate-700 leading-tight">{b.department}</p>
                        <p className="text-[10px] text-slate-500">{b.doctor}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Date & Slot</span>
                        <p className="font-bold text-slate-700 leading-tight">{b.date}</p>
                        <p className="text-[10px] text-primary font-bold">{b.timeSlot}</p>
                      </div>
                    </div>

                    {/* Waiting Timer Banner */}
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-2 flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="animate-pulse">⏳</span>
                        <span>Estimated Waiting Time:</span>
                      </div>
                      <span className="bg-amber-500 text-white px-2 py-0.5 rounded-lg font-mono">
                        {waitTime}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center space-y-1 pt-1">
          <h2 className="text-xl font-extrabold text-text-heading font-heading-style">{t.title}</h2>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="bg-danger-light border border-danger/10 text-danger text-xs font-semibold p-4 rounded-xl text-center leading-relaxed shadow-lg">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-success/15 border border-success/20 text-success text-xs font-bold p-3 rounded-xl text-center animate-pulse shadow-lg">
            {successMsg}
          </div>
        )}

        {!redirecting && (
          <div className="space-y-4">
            {/* Profile Dropdown */}
            <div className="glass-panel rounded-2xl p-4 shadow-xl space-y-2 border border-white/5">
              <label className="text-[10px] font-bold text-primary tracking-widest uppercase block font-heading-style">{t.profileLabel}</label>
              <select
                value={selectedProfileId}
                onChange={handleProfileChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-sm text-text-heading outline-none focus:border-primary font-bold cursor-pointer"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-950 text-white">{p.name} ({p.id.startsWith('self_') ? 'Self' : p.relation || 'Family'})</option>
                ))}
              </select>
            </div>

            {/* Department info */}
            {profile && profile.diagnosticData && (
              <div className="glass-panel p-4 rounded-2xl shadow-xl border border-white/5">
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase block font-heading-style">{t.deptLabel}</span>
                <p className="font-extrabold text-text-heading text-sm mt-1 font-heading-style capitalize">
                  {departmentsData.find(d => d.id === profile.diagnosticData?.department)?.name || 'General Medicine'}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">Reported symptoms matched cleanly to hospital department.</p>
              </div>
            )}

            {/* Date selector */}
            <div className="glass-panel rounded-2xl p-4 shadow-xl space-y-2 border border-white/5">
              <label className="text-[10px] font-bold text-primary tracking-widest uppercase block font-heading-style">{t.dateLabel}</label>
              <div className="grid grid-cols-4 gap-1.5">
                {datesList.map(d => (
                  <motion.button
                    key={d.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedDate(d.value);
                      setErrorMsg('');
                    }}
                    className={`py-2.5 rounded-xl text-[9px] font-bold text-center border transition-all cursor-pointer ${
                      selectedDate === d.value
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                        : 'bg-white/5 border-white/5 text-text-heading hover:bg-white/10'
                    }`}
                  >
                    {d.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Slot selector */}
            <div className="glass-panel rounded-2xl p-4 shadow-xl space-y-2 border border-white/5">
              <label className="text-[10px] font-bold text-primary tracking-widest uppercase block font-heading-style">{t.slotLabel}</label>
              <div className="grid grid-cols-3 gap-1.5 max-h-[130px] overflow-y-auto pr-1 scrollbar-none">
                {slotsList.map(s => (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedSlot(s)}
                    className={`py-2 rounded-lg text-[9px] font-bold text-center border transition-all cursor-pointer ${
                      selectedSlot === s
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                        : 'bg-white/5 border-white/5 text-text-heading hover:bg-white/10'
                    }`}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Confirm CTA */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(6, 182, 212, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedSlot}
              className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all active:scale-98 text-xs tracking-wider uppercase font-heading-style cursor-pointer ${
                selectedDate && selectedSlot
                  ? 'bg-primary text-white hover:bg-primary-pressed'
                  : 'bg-primary/20 text-white/50 cursor-not-allowed'
              }`}
            >
              {t.btnConfirm}
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
