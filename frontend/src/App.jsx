import React from 'react';
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
