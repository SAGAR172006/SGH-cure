import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Geolocation } from '@capacitor/geolocation';
import { AppContext } from '../context/AppContext';

const translations = {
  en: {
    title: "Emergency Response",
    subtitle: "No internet or login required for emergency access",
    addTitle: "Emergency Setup",
    addSubtitle: "Add at least 1 family emergency contact before proceeding",
    nameLabel: "Contact Name",
    phoneLabel: "Phone Number",
    btnAdd: "Save Contact",
    btnBack: "← Dashboard",
    callAmbulance: "🚨 Ambulance (108)",
    callPolice: "👮 Police (100)",
    callFire: "🔥 Fire Station (101)",
    familyContacts: "Family Emergency Contacts",
    callContact: "Call",
    sendSms: "✉️ Send SMS",
    shareLocation: "📍 Share GPS Location",
    addMore: "+ Add Contact",
    locationFeedback: "Fetching GPS location...",
  },
  hi: {
    title: "आपातकालीन प्रतिक्रिया",
    subtitle: "आपातकालीन सेवाओं के लिए इंटरनेट या लॉगिन की आवश्यकता नहीं है",
    addTitle: "आपातकालीन सेटअप",
    addSubtitle: "आगे बढ़ने से पहले कम से कम 1 पारिवारिक आपातकालीन संपर्क जोड़ें",
    nameLabel: "संपर्क का नाम",
    phoneLabel: "फ़ोन नंबर",
    btnAdd: "संपर्क सहेजें",
    btnBack: "← डैशबोर्ड",
    callAmbulance: "🚨 एम्बुलेंस (108)",
    callPolice: "👮 पुलिस (100)",
    callFire: "🔥 फायर स्टेशन (101)",
    familyContacts: "पारिवारिक आपातकालीन संपर्क",
    callContact: "कॉल",
    sendSms: "✉️ एसएमएस भेजें",
    shareLocation: "📍 स्थान साझा करें",
    addMore: "+ संपर्क जोड़ें",
    locationFeedback: "जीपीएस स्थान प्राप्त किया जा रहा है...",
  },
  kn: {
    title: "ತುರ್ತು ಪ್ರತಿಕ್ರಿಯೆ",
    subtitle: "ತುರ್ತು ಸೇವೆಗಳಿಗೆ ಇಂಟರ್ನೆಟ್ ಅಥವಾ ಲಾಗಿನ್ ಅಗತ್ಯವಿಲ್ಲ",
    addTitle: "ತುರ್ತು ಸಂಪರ್ಕ ಸೆಟಪ್",
    addSubtitle: "ಮುಂದುವರಿಯುವ ಮುನ್ನ ಕನಿಷ್ಠ 1ಕುಟುಂಬದ ತುರ್ತು ಸಂಪರ್ಕವನ್ನು ಸೇರಿಸಿ",
    nameLabel: "ಸಂಪರ್ಕದ ಹೆಸರು",
    phoneLabel: "ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    btnAdd: "ಸಂಪರ್ಕ ಉಳಿಸಿ",
    btnBack: "← ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    callAmbulance: "🚨 ಆಂಬ್ಯುಲೆನ್ಸ್ (108)",
    callPolice: "👮 ಪೊಲೀಸ್ (100)",
    callFire: "🔥 ಅಗ್ನಿಶಾಮಕ ಠಾಣೆ (101)",
    familyContacts: "ಕುಟುಂಬದ ತುರ್ತು ಸಂಪರ್ಕಗಳು",
    callContact: "ಕರೆ",
    sendSms: "✉️ ಎಸ್‌ಎಂಎಸ್ ಕಳುಹಿಸಿ",
    shareLocation: "📍 ಲೈವ್ ಸ್ಥಳ ಹಂಚಿಕೊಳ್ಳಿ",
    addMore: "+ ಸಂಪರ್ಕ ಸೇರಿಸಿ",
    locationFeedback: "GPS ಸ್ಥಳ ಪಡೆಯಲಾಗುತ್ತಿದೆ...",
  }
};

export default function Emergency() {
  const { language, emergencyContacts, addEmergencyContact, removeEmergencyContact } = useContext(AppContext);
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  const [form, setForm] = useState({ name: '', phone: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [coordinates, setCoordinates] = useState(null); // GPS Coordinates state

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || form.phone.length < 10) {
      setError('Please enter a valid name and phone number');
      return;
    }
    addEmergencyContact(form);
    setForm({ name: '', phone: '' });
    setIsAdding(false);
    setError('');
  };

  const handleShareLocation = async (contactPhone) => {
    setLocationStatus(t.locationFeedback);
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      const { latitude, longitude } = pos.coords;
      setCoordinates({ lat: latitude, lng: longitude });

      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      const body = encodeURIComponent(`Emergency! I need help. My current GPS location: ${mapsLink}`);
      
      setLocationStatus('');
      window.location.href = `sms:${contactPhone}?body=${body}`;
    } catch (err) {
      console.error(err);
      setLocationStatus('Failed to read GPS coordinates.');
      alert('Could not retrieve GPS coordinates. Please ensure location services are enabled on your device.');
    }
  };

  const showSetup = emergencyContacts.length === 0 || isAdding;

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

      {/* Top Navigation */}
      <div className="flex items-center justify-between relative z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-primary hover:text-primary-pressed flex items-center space-x-1 cursor-pointer"
        >
          <span>{t.btnBack}</span>
        </button>

        {!showSetup && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)}
            className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 border border-primary/20 px-3 py-2 rounded-xl cursor-pointer"
          >
            {t.addMore}
          </motion.button>
        )}
      </div>

      {/* Conditional Rendering: Setup Form vs Active Contacts Dashboard */}
      {showSetup ? (
        /* EMERGENCY CONTACT SETUP FORM */
        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto space-y-6 relative z-10">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-danger font-heading-style">{t.addTitle}</h2>
            <p className="text-xs text-text-muted">{t.addSubtitle}</p>
          </div>

          <form onSubmit={handleAdd} className="glass-panel rounded-2xl p-6 space-y-4 shadow-2xl border border-white/5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-primary uppercase font-heading-style">{t.nameLabel}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border-b-2 border-white/10 focus:border-primary bg-transparent text-text-heading outline-none py-1.5 px-1 transition-colors w-full text-sm font-medium"
                placeholder="e.g. Spouse / Son / Friend"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-primary uppercase font-heading-style">{t.phoneLabel}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="border-b-2 border-white/10 focus:border-primary bg-transparent text-text-heading outline-none py-1.5 px-1 transition-colors w-full text-sm font-medium"
                placeholder="e.g. 9900088888"
                required
              />
            </div>

            {error && <p className="text-xs text-danger font-semibold text-center mt-2">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-primary hover:bg-primary-pressed text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs tracking-wider uppercase font-heading-style cursor-pointer"
            >
              {t.btnAdd}
            </motion.button>

            {emergencyContacts.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setIsAdding(false)}
                className="w-full bg-white/5 hover:bg-white/10 text-text-heading border border-white/10 font-bold py-2.5 rounded-xl shadow-sm transition-all text-xs uppercase tracking-wider font-heading-style cursor-pointer"
              >
                Cancel
              </motion.button>
            )}
          </form>
        </div>
      ) : (
        /* ACTIVE EMERGENCY VIEW */
        <div className="flex-1 flex flex-col justify-center space-y-4 my-4 overflow-y-auto max-w-sm w-full mx-auto pb-4 scrollbar-none relative z-10">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-danger font-heading-style">{t.title}</h2>
            <p className="text-xs text-text-muted">{t.subtitle}</p>
          </div>

          {/* Emergency CTAs */}
          <div className="space-y-2.5">
            {/* Dominant CTA: Ambulance */}
            <motion.a
              whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(239, 68, 68, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              href="tel:108"
              className="w-full bg-danger text-white text-base font-extrabold py-4 rounded-xl shadow-lg flex items-center justify-center border border-red-500/10 text-center font-heading-style tracking-wider cursor-pointer"
            >
              {t.callAmbulance}
            </motion.a>

            {/* Sub-CTAs: Police & Fire Station */}
            <div className="grid grid-cols-2 gap-2">
              <motion.a
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(239, 68, 68, 0.25)" }}
                whileTap={{ scale: 0.98 }}
                href="tel:100"
                className="bg-danger/85 hover:bg-danger text-white text-xs font-bold py-3.5 rounded-xl flex items-center justify-center border border-red-500/10 text-center font-heading-style tracking-wider cursor-pointer"
              >
                {t.callPolice}
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(239, 68, 68, 0.25)" }}
                whileTap={{ scale: 0.98 }}
                href="tel:101"
                className="bg-danger/85 hover:bg-danger text-white text-xs font-bold py-3.5 rounded-xl flex items-center justify-center border border-red-500/10 text-center font-heading-style tracking-wider cursor-pointer"
              >
                {t.callFire}
              </motion.a>
            </div>
          </div>

          {/* Map Preview Grid */}
          {coordinates && (
            <div className="glass-panel rounded-2xl p-4 shadow-xl space-y-2 border border-white/5">
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase block font-heading-style">Location Map Preview</span>
              {import.meta.env.VITE_MAPS_API_KEY ? (
                <img 
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lng}&zoom=15&size=400x200&markers=color:red%7C${coordinates.lat},${coordinates.lng}&key=${import.meta.env.VITE_MAPS_API_KEY}`}
                  alt="GPS Static Map"
                  className="w-full h-36 object-cover rounded-xl border border-white/10"
                />
              ) : (
                /* Mock Map Preview with high visual styling */
                <div className="w-full h-36 bg-zinc-950 rounded-xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute w-24 h-24 border border-red-500/15 rounded-full animate-ping" />
                  <div className="absolute w-12 h-12 border border-red-500/30 rounded-full" />
                  <span className="text-[24px] z-10 animate-bounce">📍</span>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1 z-10">GPS Coordinates: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</p>
                  <p className="text-[9px] text-zinc-500 font-mono z-10">Static Map Loaded (No API Key Configured)</p>
                </div>
              )}
            </div>
          )}

          {/* Family contacts listings */}
          <div className="space-y-3 glass-panel rounded-2xl p-4 shadow-xl border border-white/5">
            <h3 className="text-[10px] font-bold tracking-widest text-primary uppercase mb-1 font-heading-style">{t.familyContacts}</h3>
            
            <div className="space-y-3 divide-y divide-white/5">
              {emergencyContacts.map((contact, idx) => (
                <div key={idx} className="flex flex-col pt-3 first:pt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-text-heading text-sm font-heading-style">{contact.name}</p>
                      <p className="text-xs text-text-muted font-mono">{contact.phone}</p>
                    </div>
                    <button
                      onClick={() => removeEmergencyContact(idx)}
                      className="text-danger hover:text-red-400 p-1 text-xs cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Actions Grid for Contact */}
                  <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                    {/* Call */}
                    <motion.a
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      href={`tel:${contact.phone}`}
                      className="bg-primary hover:bg-primary-pressed text-white font-bold text-[9px] py-2.5 rounded-xl text-center shadow-md cursor-pointer uppercase tracking-wider font-heading-style"
                    >
                      {t.callContact}
                    </motion.a>
                    
                    {/* Send SMS */}
                    <motion.a
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      href={`sms:${contact.phone}?body=Emergency! Please help me immediately!`}
                      className="bg-white/5 hover:bg-white/10 border border-white/5 text-text-heading font-bold text-[9px] py-2.5 rounded-xl text-center cursor-pointer uppercase tracking-wider font-heading-style"
                    >
                      {t.sendSms}
                    </motion.a>

                    {/* Share GPS Location */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleShareLocation(contact.phone)}
                      className="bg-white/5 hover:bg-white/10 border border-white/5 text-text-heading font-bold text-[9px] py-2.5 rounded-xl text-center cursor-pointer uppercase tracking-wider font-heading-style"
                    >
                      {t.shareLocation}
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {locationStatus && (
            <p className="text-xs text-primary font-bold text-center animate-pulse mt-2 uppercase tracking-wide font-heading-style">{locationStatus}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
