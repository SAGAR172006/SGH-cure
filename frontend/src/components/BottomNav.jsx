import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const tabs = [
  {
    path: '/dashboard',
    label: 'Home',
    activeColor: '#2563EB',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke={active ? '#2563EB' : '#6B7280'} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
      </svg>
    )
  },
  {
    path: '/book-appointment',
    label: 'Appointments',
    activeColor: '#2563EB',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke={active ? '#2563EB' : '#6B7280'} className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l2 2 4-4" />
      </svg>
    )
  },
  {
    path: '/history',
    label: 'History',
    activeColor: '#2563EB',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke={active ? '#2563EB' : '#6B7280'} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 12A8.5 8.5 0 1021 12 8.5 8.5 0 003.5 12z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 12A8.5 8.5 0 014.8 7.2L3 5.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5.5l2.5.8-.8-2.5" />
      </svg>
    )
  },
  {
    path: '/emergency',
    label: 'Emergency',
    activeColor: '#EF4444',
    isEmergency: true,
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-1 9h-4v4h-4v-4H6v-4h4V4h4v4h4v4z"/>
      </svg>
    )
  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on auth/splash screens
  const hiddenPaths = ['/', '/hero', '/login', '/otp'];
  if (hiddenPaths.includes(location.pathname)) return null;

  return (
    <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div
        className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-[32px]"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 1.5px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
          border: '1px solid rgba(255,255,255,0.55)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path ||
            (tab.path === '/book-appointment' && location.pathname === '/voice-booking') ||
            (tab.path === '/book-appointment' && location.pathname === '/booking-results') ||
            (tab.path === '/book-appointment' && location.pathname === '/booking-confirmation');

          if (tab.isEmergency) {
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center justify-center px-4 py-1 cursor-pointer gap-0.5"
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    background: isActive
                      ? 'radial-gradient(circle, #ff6b6b, #EF4444)'
                      : 'radial-gradient(circle, #ff6b6b, #EF4444)',
                    boxShadow: '0 0 0 4px rgba(239,68,68,0.15), 0 4px 12px rgba(239,68,68,0.35)'
                  }}
                >
                  {tab.icon(isActive)}
                </motion.div>
                <span className="text-[10px] font-semibold" style={{ color: '#EF4444' }}>{tab.label}</span>
                <div className="w-1 h-1 rounded-full" style={{ background: '#EF4444' }} />
              </button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center cursor-pointer"
            >
              <motion.div
                whileTap={{ scale: 0.88 }}
                className="flex flex-col items-center justify-center px-4 py-2 rounded-[22px] gap-0.5 transition-all duration-200"
                style={isActive ? {
                  background: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                } : {}}
              >
                {tab.icon(isActive)}
                <span
                  className="text-[10px] font-semibold leading-none"
                  style={{ color: isActive ? tab.activeColor : '#6B7280' }}
                >
                  {tab.label}
                </span>
                <div
                  className="w-1 h-1 rounded-full transition-all duration-200"
                  style={{ background: isActive ? tab.activeColor : 'rgba(107,114,128,0.3)' }}
                />
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
