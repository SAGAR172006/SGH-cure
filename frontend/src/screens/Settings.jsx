import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const translations = {
  en: {
    title: "Settings",
    personalTitle: "Personal Details",
    nameLabel: "Name",
    phoneLabel: "Phone Number",
    btnSave: "Save Changes",
    contactsTitle: "Emergency Contacts",
    addContact: "+ Add Contact",
    langLabel: "App Language",
    logout: "Log Out",
    btnBack: "← Back",
    savedMsg: "Changes saved successfully!"
  },
  hi: {
    title: "सेटिंग्स",
    personalTitle: "व्यक्तिगत विवरण",
    nameLabel: "नाम",
    phoneLabel: "फ़ोन नंबर",
    btnSave: "बदलाव सहेजें",
    contactsTitle: "आपातकालीन संपर्क",
    addContact: "+ संपर्क जोड़ें",
    langLabel: "ऐप की भाषा",
    logout: "लॉग आउट",
    btnBack: "← पीछे",
    savedMsg: "बदलाव सफलतापूर्वक सहेज लिए गए हैं!"
  },
  kn: {
    title: "ಸಂಯೋಜನೆಗಳು",
    personalTitle: "ವೈಯಕ್ತಿಕ ವಿವರಗಳು",
    nameLabel: "ಹೆಸರು",
    phoneLabel: "ಫೋನ್ ಸಂಖ್ಯೆ",
    btnSave: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
    contactsTitle: "ತುರ್ತು ಸಂಪರ್ಕಗಳು",
    addContact: "+ ಸಂಪರ್ಕ ಸೇರಿಸಿ",
    langLabel: "ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ",
    logout: "ಲಾಗ್ ಔಟ್",
    btnBack: "← ಹಿಂದೆ",
    savedMsg: "ಬದಲಾವಣೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!"
  }
};

export default function Settings() {
  const { 
    language, 
    setLanguage, 
    user, 
    setUser, 
    emergencyContacts, 
    addEmergencyContact, 
    removeEmergencyContact, 
    logout 
  } = useContext(AppContext);
  
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  // Local state for profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    age: user?.age || '32',
    sex: user?.sex || 'Male'
  });

  // Local state for adding contacts
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  // Get user initials (max 2 characters)
  const getInitials = (name) => {
    if (!name) return 'SGH';
    return name.split(' ')
               .map(n => n[0])
               .join('')
               .toUpperCase()
               .slice(0, 2);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setUser({
      ...user,
      name: profileForm.name,
      phone: profileForm.phone,
      age: profileForm.age,
      sex: profileForm.sex
    });
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 3000);
  };

  const handleAddContactSubmit = (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone || newContact.phone.length < 10) {
      alert("Please enter a valid name and phone number");
      return;
    }
    addEmergencyContact(newContact);
    setNewContact({ name: '', phone: '' });
    setIsAddingContact(false);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/hero');
  };

  return (
    <div className="flex-1 flex flex-col p-6 relative overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-center mb-2 flex-shrink-0">
        <h2 className="text-sm font-bold text-text-heading font-heading-style">{t.title}</h2>
      </div>

      {/* Main Settings content - scrollable container */}
      <div 
        className="flex-1 flex flex-col space-y-5 my-2 overflow-y-auto max-w-sm w-full mx-auto scrollbar-none smooth-scroll relative z-10"
        style={{ paddingBottom: '140px' }}
      >
        {/* Profile Circle Initials Badge */}
        <div className="flex flex-col items-center justify-center space-y-2 mt-2 flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-primary-pressed flex items-center justify-center text-white text-2xl font-bold border border-white/20 shadow-md">
            {getInitials(profileForm.name)}
          </div>
          <p className="text-xs text-text-muted">{user?.phone || '9900088888'}</p>
        </div>

        {/* Saved feedback */}
        {showSavedMsg && (
          <div className="bg-success/15 border border-success/20 text-success text-xs font-bold text-center py-2.5 rounded flex-shrink-0">
            {t.savedMsg}
          </div>
        )}

        {/* Profile details form */}
        <form onSubmit={handleSaveProfile} className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-4 shadow-sm flex-shrink-0">
          <h3 className="text-xs font-bold tracking-wider text-primary uppercase font-heading-style">{t.personalTitle}</h3>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase">{t.nameLabel}</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full bg-white/25 border border-white/20 rounded-xl px-2.5 py-2 text-sm text-text-heading outline-none focus:border-primary transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase">{t.phoneLabel}</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full bg-white/25 border border-white/20 rounded-xl px-2.5 py-2 text-sm text-text-heading outline-none focus:border-primary transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Age</label>
              <input
                type="number"
                value={profileForm.age}
                onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                className="w-full bg-white/25 border border-white/20 rounded-xl px-2.5 py-2 text-sm text-text-heading outline-none focus:border-primary transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Sex</label>
              <select
                value={profileForm.sex}
                onChange={(e) => setProfileForm({ ...profileForm, sex: e.target.value })}
                className="w-full bg-white/25 border border-white/20 rounded-xl px-2.5 py-2 text-sm text-text-heading outline-none focus:border-primary transition-all cursor-pointer"
              >
                <option value="Male" className="bg-slate-900 text-white">Male</option>
                <option value="Female" className="bg-slate-900 text-white">Female</option>
                <option value="Other" className="bg-slate-900 text-white">Other</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-pressed text-white text-xs font-bold py-3 rounded-xl shadow transition-all cursor-pointer uppercase tracking-wider"
          >
            {t.btnSave}
          </button>
        </form>

        {/* Emergency Contacts Panel */}
        <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-4 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wider text-primary uppercase font-heading-style">{t.contactsTitle}</h3>
            {!isAddingContact && (
              <button
                onClick={() => setIsAddingContact(true)}
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                {t.addContact}
              </button>
            )}
          </div>

          {isAddingContact && (
            <form onSubmit={handleAddContactSubmit} className="bg-white/20 border border-white/10 p-3 rounded-xl space-y-2.5">
              <input
                type="text"
                placeholder="Name (e.g. Spouse)"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="w-full bg-white/30 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-text-heading outline-none focus:border-primary transition-all"
                required
              />
              <input
                type="tel"
                placeholder="Phone (e.g. 9876543210)"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="w-full bg-white/30 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-text-heading outline-none focus:border-primary transition-all"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="flex-1 bg-white/20 text-text-heading text-xs font-bold py-2 rounded-lg border border-white/15 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2.5 divide-y divide-white/10">
            {emergencyContacts.map((contact, idx) => (
              <div key={idx} className="flex items-center justify-between pt-2.5 first:pt-0">
                <div>
                  <p className="font-bold text-text-heading text-xs">{contact.name}</p>
                  <p className="text-[10px] text-text-muted">{contact.phone}</p>
                </div>
                <button
                  onClick={() => removeEmergencyContact(idx)}
                  className="text-danger hover:text-red-700 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 space-y-3 shadow-sm flex-shrink-0">
          <h3 className="text-xs font-bold tracking-wider text-primary uppercase font-heading-style">{t.langLabel}</h3>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-white/25 border border-white/20 rounded-xl px-2.5 py-2 text-sm text-text-heading outline-none focus:border-primary transition-all font-semibold cursor-pointer"
          >
            <option value="en" className="bg-slate-900 text-white">English</option>
            <option value="hi" className="bg-slate-900 text-white">हिन्दी (Hindi)</option>
            <option value="kn" className="bg-slate-900 text-white">ಕನ್ನಡ (Kannada)</option>
          </select>
        </div>

        {/* Logout button — now inside scroll container! */}
        <div className="w-full pt-2 flex-shrink-0">
          <button
            onClick={handleLogoutClick}
            className="w-full bg-danger/10 hover:bg-danger/25 border border-danger/25 text-danger font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-1 transition-all cursor-pointer uppercase tracking-wider text-xs font-heading-style shadow-sm"
          >
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
