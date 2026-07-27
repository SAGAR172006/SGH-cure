import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';
import BottomNav from './components/BottomNav';
import SplashLanguage from './screens/SplashLanguage';
import Hero from './screens/Hero';
import Login from './screens/Login';
import OtpVerify from './screens/OtpVerify';
import Dashboard from './screens/Dashboard';
import Emergency from './screens/Emergency';
import VoiceBooking from './screens/VoiceBooking';
import BookingResults from './screens/BookingResults';
import BookingConfirmation from './screens/BookingConfirmation';
import Settings from './screens/Settings';
import BookAppointment from './screens/BookAppointment';
import History from './screens/History';
import Reminders from './screens/Reminders';
import PatientCardView from './screens/PatientCardView';
import './App.css';

function App() {
  useEffect(() => {
    // 1. Request microphone permission
    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(err => console.warn("Microphone permission denied:", err));
      }
    } catch (e) {
      console.warn("Microphone permission request failed:", e);
    }

    // 2. Request Location permission
    try {
      if (navigator.geolocation && typeof navigator.geolocation.getCurrentPosition === 'function') {
        navigator.geolocation.getCurrentPosition(
          () => {},
          (err) => console.warn("Location permission denied:", err),
          { enableHighAccuracy: false, timeout: 5000 }
        );
      }
    } catch (e) {
      console.warn("Location permission request failed:", e);
    }

    // 3. Request Notification permission
    try {
      if (window.Notification && typeof Notification.requestPermission === 'function' && Notification.permission !== 'granted') {
        Notification.requestPermission().catch(err => console.warn("Notification permission blocked:", err));
      }
    } catch (e) {
      console.warn("Notification permission request failed:", e);
    }
  }, []);

  return (
    <AppContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SplashLanguage />} />
          <Route path="/hero" element={<Hero />} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp" element={<OtpVerify />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/voice-booking" element={<VoiceBooking />} />
          <Route path="/booking-results" element={<BookingResults />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/book-appointment" element={<BookAppointment />} />
          <Route path="/history" element={<History />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/patient-card" element={<PatientCardView />} />
        </Routes>
        <BottomNav />
      </Router>
    </AppContextProvider>
  );
}

export default App;
