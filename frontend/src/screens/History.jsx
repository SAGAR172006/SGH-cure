import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const translations = {
  en: {
    title: "Appointment History",
    noHistory: "No appointments scheduled.",
    patient: "Patient",
    doctor: "Doctor",
    date: "Date",
    time: "Time",
    dept: "Department",
    btnBack: "← Dashboard",
  },
  hi: {
    title: "अपॉइंटमेंट इतिहास",
    noHistory: "कोई अपॉइंटमेंट निर्धारित नहीं है।",
    patient: "मरीज",
    doctor: "डॉक्टर",
    date: "तारीख",
    time: "समय",
    dept: "विभाग",
    btnBack: "← डैशबोर्ड",
  },
  kn: {
    title: "ಬುಕಿಂಗ್ ಇತಿಹಾಸ",
    noHistory: "ಯಾವುದೇ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ನಿಗದಿಯಾಗಿಲ್ಲ.",
    patient: "ರೋಗಿ",
    doctor: "ವೈದ್ಯರು",
    date: "ದಿನಾಂಕ",
    time: "ಸಮಯ",
    dept: "ಇಲಾಖೆ",
    btnBack: "← ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
  }
};

export default function History() {
  const { language, profiles } = useContext(AppContext);
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  // Flatten and compile all bookings from all family profiles
  const allBookings = [];
  profiles.forEach(p => {
    if (p.bookings && p.bookings.length > 0) {
      p.bookings.forEach(b => {
        allBookings.push({
          ...b,
          patientName: p.name,
          relation: p.id === 'self' ? 'Self' : p.relation || 'Family'
        });
      });
    }
  });

  // Sort bookings by date in ASCENDING order
  const sortedBookings = allBookings.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      {/* Top Header */}
      <div className="flex items-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-primary flex items-center space-x-1"
        >
          <span>{t.btnBack}</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-start max-w-sm w-full mx-auto space-y-4 my-4 overflow-y-auto">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-text-heading">{t.title}</h2>
          <p className="text-xs text-text-muted">All active slots listed in chronological order</p>
        </div>

        {sortedBookings.length === 0 ? (
          <div className="bg-white/40 backdrop-blur-md border border-white/20 p-8 rounded-lg text-center text-xs text-text-muted shadow-sm">
            {t.noHistory}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedBookings.map((b, idx) => (
              <div key={idx} className="bg-white/60 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-sm relative overflow-hidden">
                {/* Left colored highlight line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                
                <div className="pl-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-primary tracking-wider uppercase bg-primary-light px-2 py-0.5 rounded">
                      {b.department}
                    </span>
                    <span className="text-[10px] text-text-muted font-semibold">
                      {b.date}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1.5 text-xs text-text-heading">
                    <div>
                      <span className="text-[9px] text-text-muted block uppercase">{t.patient}</span>
                      <span className="font-bold">{b.patientName} ({b.relation})</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-text-muted block uppercase">{t.doctor}</span>
                      <span className="font-bold">{b.doctor}</span>
                    </div>

                    <div className="col-span-2 border-t border-black/5 pt-1.5 mt-0.5 flex justify-between items-center">
                      <span className="text-[9px] text-text-muted uppercase">{t.time}</span>
                      <span className="font-bold text-primary">{b.timeSlot}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* spacer */}
      <div />
    </div>
  );
}
