import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import { matchDepartment } from '../utils/matchDepartment';

const translations = {
  en: {
    title: "Voice Symptom Intake",
    subtitle: "Describe your symptoms to find the right department",
    placeholder: "Describe symptoms (e.g. I have a skin rash and itchiness)",
    micPress: "Tap mic and speak",
    micListening: "Listening... Speak now",
    btnSubmit: "Analyze Symptoms",
    typeInstead: "Type your symptoms instead",
    noMatch: "⚠️ Sorry, we couldn't match a department. Please describe the symptoms differently (e.g. 'chest pain', 'knee pain', 'toothache').",
    btnBack: "← Dashboard",
    listeningFeedback: "Hearing: ",
    unsupported: "Voice input is not supported in this browser."
  },
  hi: {
    title: "ध्वनि लक्षण इनटेक",
    subtitle: "सही विभाग खोजने के लिए अपने लक्षणों का वर्णन करें",
    placeholder: "लक्षण बताएं (जैसे: मेरे पैर में दर्द है या चेहरे पर खुजली है)",
    micPress: "माइक्रोफ़ोन दबाएं और बोलें",
    micListening: "सुन रहे हैं... अब बोलें",
    btnSubmit: "लक्षणों का विश्लेषण करें",
    typeInstead: "इसके बजाय अपने लक्षण टाइप करें",
    noMatch: "⚠️ क्षमा करें, हम विभाग का मिलान नहीं कर सके। कृपया लक्षणों को अलग तरह से बताएं (जैसे 'सीने में दर्द', 'घुटने का दर्द', 'दांत दर्द')।",
    btnBack: "← डैशबोर्ड",
    listeningFeedback: "सुनाई दे रहा है: ",
    unsupported: "इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है।"
  },
  kn: {
    title: "ಧ್ವನಿ ರೋಗಲಕ್ಷಣ ನೋಂದಣಿ",
    subtitle: "ಸರಿಯಾದ ಇಲಾಖೆಯನ್ನು ಕಂಡುಹಿಡಿಯಲು ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ",
    placeholder: "ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ (ಉದಾಹರಣೆಗೆ: ನನಗೆ ಹಲ್ಲು ನೋವು ಇದೆ)",
    micPress: "ಮೈಕ್ರೊಫೋನ್ ಟ್ಯಾಪ್ ಮಾಡಿ ಮತ್ತು ಮಾತನಾಡಿ",
    micListening: "ಕೇಳಿಸಲಾಗುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ",
    btnSubmit: "ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ",
    typeInstead: "ಬದಲಿಗೆ ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ",
    noMatch: "⚠️ ಕ್ಷಮಿಸಿ, ಇಲಾಖೆಯನ್ನು ಹೊಂದಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆ ರೀತಿಯಲ್ಲಿ ವಿವರಿಸಿ (ಉದಾಹರಣೆಗೆ 'ಎದೆ ನೋವು', 'ಕಾಲು ನೋವು', 'ಹಲ್ಲು ನೋವು').",
    btnBack: "← ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    listeningFeedback: "ಕೇಳಿಸುತ್ತಿದೆ: ",
    unsupported: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ."
  }
};

export default function VoiceBooking() {
  const { language, setBooking } = useContext(AppContext);
  const navigate = useNavigate();
  const t = translations[language] || translations.en;

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusText, setStatusText] = useState('');

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t.unsupported);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Map language code to speech locale
    const localeMap = {
      en: 'en-US',
      hi: 'hi-IN',
      kn: 'kn-IN'
    };
    recognition.lang = localeMap[language] || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage('');
      setStatusText(t.micListening);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
      setStatusText('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatusText('');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
    };

    recognition.start();
  };

  const handleAnalyze = () => {
    if (!inputText.trim()) return;

    const matchedDept = matchDepartment(inputText);
    
    if (matchedDept) {
      // Save matched department and symptom text to global context
      setBooking({
        symptomText: inputText,
        matchedDepartment: matchedDept
      });
      navigate('/booking-results');
    } else {
      setErrorMessage(t.noMatch);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      {/* Header bar */}
      <div className="flex items-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-primary flex items-center space-x-1"
        >
          <span>{t.btnBack}</span>
        </button>
      </div>

      {/* Mic Input Panel */}
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-text-heading">{t.title}</h2>
          <p className="text-xs text-text-muted">{t.subtitle}</p>
        </div>

        {/* Pulse Button Container */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.6, opacity: 0.35 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  className="absolute inset-0 bg-primary rounded-full"
                />
              )}
            </AnimatePresence>

            <button
              onClick={handleVoiceInput}
              disabled={isListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg relative z-10 transition-all ${
                isListening ? 'bg-primary text-white scale-105' : 'bg-white/80 hover:bg-white text-primary'
              }`}
            >
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 14H5c0 3.41 2.72 6.23 6 6.72V24h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
              </svg>
            </button>
          </div>

          <span className="text-xs font-semibold text-primary animate-pulse min-h-[16px]">
            {statusText || (isListening ? '' : t.micPress)}
          </span>
        </div>

        {/* Text Input area */}
        <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-lg p-5 space-y-4 shadow-sm">
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-wider text-primary uppercase">{t.typeInstead}</label>
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setErrorMessage('');
              }}
              rows={3}
              placeholder={t.placeholder}
              className="w-full bg-white/20 border border-white/20 rounded p-2 text-sm text-text-heading outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          {errorMessage && (
            <div className="bg-danger-light border border-danger/10 px-3 py-2.5 rounded text-xs font-medium text-danger text-center">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!inputText.trim()}
            className={`w-full font-semibold py-3 rounded transition-all ${
              inputText.trim()
                ? 'bg-primary hover:bg-primary-pressed text-white shadow-sm'
                : 'bg-primary/20 text-white/50 cursor-not-allowed'
            }`}
          >
            {t.btnSubmit}
          </button>
        </div>
      </div>
    </div>
  );
}
