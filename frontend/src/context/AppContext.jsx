import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AppContext = createContext();

// ─── Phone-namespaced localStorage helpers ────────────────────────────────────
const userKey = (phone, suffix) => `sgh_u_${phone}_${suffix}`;

// Unique self-profile ID per phone so Supabase rows never collide between users
export const selfIdForPhone = (phone) => `self_${phone}`;

const loadUserData = (phone) => {
  const safe = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  };
  const selfId = selfIdForPhone(phone);
  return {
    profiles: safe(userKey(phone, 'profiles'), null),
    reminders: safe(userKey(phone, 'reminders'), []),
    contacts: safe(userKey(phone, 'contacts'), []),
    activeProfileId: localStorage.getItem(userKey(phone, 'active_profile_id')) || selfId,
  };
};

const saveUserField = (phone, suffix, value) => {
  if (!phone) return;
  localStorage.setItem(userKey(phone, suffix), JSON.stringify(value));
};

// Build a fresh self-profile object for a user
const buildSelfProfile = (userData) => ({
  id: selfIdForPhone(userData.phone),
  name: userData.name,
  age: userData.age,
  sex: userData.sex,
  phone: userData.phone,
  avatarUrl: '/assets/avatar_self.png',
  diagnosticData: null,
  bookings: []
});

// ─────────────────────────────────────────────────────────────────────────────

export const AppContextProvider = ({ children }) => {
  // ── Device-level (not user-scoped) ──────────────────────────────────────
  const [hasChosenLanguage, setHasChosenLanguage] = useState(() =>
    localStorage.getItem('sgh_has_chosen_lang') === 'true'
  );

  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    localStorage.getItem('sgh_logged_in') === 'true'
  );

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sgh_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [language, setLanguage] = useState(() =>
    localStorage.getItem('sgh_language') || 'en'
  );

  // ── Per-user state — initialize synchronously from phone-namespaced storage ─
  const _initPhone = (() => {
    try { const u = localStorage.getItem('sgh_user'); return u ? JSON.parse(u)?.phone : null; } catch { return null; }
  })();

  const [emergencyContacts, setEmergencyContacts] = useState(() =>
    _initPhone ? (loadUserData(_initPhone).contacts || []) : []
  );
  const [activeProfileId, setActiveProfileId] = useState(() => {
    if (!_initPhone) return `self_unknown`;
    return loadUserData(_initPhone).activeProfileId || selfIdForPhone(_initPhone);
  });
  const [profiles, setProfiles] = useState(() => {
    if (!_initPhone) return [];
    const saved = loadUserData(_initPhone);
    if (saved.profiles && saved.profiles.length > 0) return saved.profiles;
    // Build default self-profile from stored user
    try {
      const u = JSON.parse(localStorage.getItem('sgh_user') || 'null');
      if (!u) return [];
      return [buildSelfProfile(u)];
    } catch { return []; }
  });
  const [reminders, setReminders] = useState(() =>
    _initPhone ? (loadUserData(_initPhone).reminders || []) : []
  );
  const [booking, setBooking] = useState(null);

  // ── Reload per-user data when the logged-in user changes ─────────────────
  useEffect(() => {
    if (isLoggedIn && user?.phone) {
      const data = loadUserData(user.phone);
      setEmergencyContacts(data.contacts);
      setActiveProfileId(data.activeProfileId || selfIdForPhone(user.phone));
      setReminders(data.reminders);

      if (data.profiles && data.profiles.length > 0) {
        // Always ensure self profile details are up to date
        const merged = data.profiles.map(p =>
          p.id === selfIdForPhone(user.phone)
            ? { ...p, name: user.name, age: user.age, sex: user.sex, phone: user.phone }
            : p
        );
        setProfiles(merged);
      } else {
        setProfiles([buildSelfProfile(user)]);
      }
    } else if (!isLoggedIn) {
      setEmergencyContacts([]);
      setActiveProfileId('self_unknown');
      setReminders([]);
      setProfiles([]);
    }
  }, [isLoggedIn, user?.phone]);

  // ── Sync device-level keys ────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('sgh_has_chosen_lang', hasChosenLanguage ? 'true' : 'false');
  }, [hasChosenLanguage]);

  useEffect(() => {
    localStorage.setItem('sgh_logged_in', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    if (user) localStorage.setItem('sgh_user', JSON.stringify(user));
    else localStorage.removeItem('sgh_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('sgh_language', language);
  }, [language]);

  // ── Sync per-user keys (only when a user is logged in) ───────────────────
  useEffect(() => {
    if (user?.phone) saveUserField(user.phone, 'contacts', emergencyContacts);
  }, [emergencyContacts, user?.phone]);

  useEffect(() => {
    if (user?.phone) localStorage.setItem(userKey(user.phone, 'active_profile_id'), activeProfileId);
  }, [activeProfileId, user?.phone]);

  useEffect(() => {
    if (user?.phone && profiles.length > 0) saveUserField(user.phone, 'profiles', profiles);
  }, [profiles, user?.phone]);

  useEffect(() => {
    if (user?.phone) saveUserField(user.phone, 'reminders', reminders);
  }, [reminders, user?.phone]);

  // ── Auth Operations ───────────────────────────────────────────────────────
  const completeOnboarding = useCallback(async (userData) => {
    setUser(userData);
    setIsLoggedIn(true);

    const selfId = selfIdForPhone(userData.phone);
    const selfProfile = buildSelfProfile(userData);

    // Load existing data for this phone (empty for new users, populated for returning)
    const existing = loadUserData(userData.phone);

    let mergedProfiles;
    if (existing.profiles && existing.profiles.length > 0) {
      // Update self profile in existing list, keep all family profiles
      mergedProfiles = existing.profiles.map(p =>
        p.id === selfId
          ? { ...p, name: userData.name, age: userData.age, sex: userData.sex, phone: userData.phone }
          : p
      );
      if (!mergedProfiles.find(p => p.id === selfId)) {
        mergedProfiles.unshift(selfProfile);
      }
    } else {
      // Brand new user — start completely fresh
      mergedProfiles = [selfProfile];
    }

    setProfiles(mergedProfiles);
    setReminders(existing.reminders);
    setEmergencyContacts(existing.contacts);
    setActiveProfileId(existing.activeProfileId || selfId);

    // Sync self-profile to Supabase (using unique ID so users don't overwrite each other)
    try {
      await fetch('http://localhost:5000/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selfProfile.id,
          name: selfProfile.name,
          age: selfProfile.age,
          sex: selfProfile.sex,
          phone: selfProfile.phone
        })
      });
    } catch (e) {
      console.warn("Failed to sync self profile to Supabase:", e);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsLoggedIn(false);
    setActiveProfileId('self_unknown');
    setBooking(null);
    setProfiles([]);
    setReminders([]);
    setEmergencyContacts([]);
  }, []);

  // ── Contact Operations ────────────────────────────────────────────────────
  const addEmergencyContact = (contact) => {
    setEmergencyContacts(prev => [...prev, contact]);
  };

  const removeEmergencyContact = (index) => {
    setEmergencyContacts(prev => prev.filter((_, i) => i !== index));
  };

  // ── Profile Operations ────────────────────────────────────────────────────
  const addProfile = async (newProfile) => {
    // Use phone-scoped ID so family profiles are tied to the account owner
    const id = `fp_${user?.phone}_${Date.now()}`;
    const fullProfile = {
      id,
      avatarUrl: '/assets/avatar_generic.png',
      diagnosticData: null,
      bookings: [],
      ownerPhone: user?.phone, // track which account owns this profile
      ...newProfile
    };

    setProfiles(prev => [...prev, fullProfile]);

    try {
      await fetch('http://localhost:5000/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fullProfile.id,
          name: fullProfile.name,
          age: fullProfile.age,
          sex: fullProfile.sex,
          phone: user?.phone // store owner's phone for filtering
        })
      });
    } catch (e) {
      console.warn("Failed to sync new profile to Supabase:", e);
    }
  };

  const deleteProfileBooking = (profileId, bookingIndex) => {
    setProfiles(prev =>
      prev.map(p =>
        p.id === profileId
          ? { ...p, bookings: (p.bookings || []).filter((_, i) => i !== bookingIndex) }
          : p
      )
    );
  };

  const updateProfileDiagnostics = (profileId, diagData) => {
    setProfiles(prev =>
      prev.map(p =>
        p.id === profileId
          ? {
              ...p,
              diagnosticData: {
                lastUpdated: new Date().toISOString(),
                ...diagData
              }
            }
          : p
      )
    );
  };

  // ── Reminder Operations ───────────────────────────────────────────────────
  const addReminder = (newRem) => {
    const remObj = {
      id: `rem_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...newRem
    };
    setReminders(prev => [...prev, remObj]);
    return remObj;
  };

  const updateReminder = (id, updatedFields) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
  };

  const deleteReminder = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  // ── Booking Operations ────────────────────────────────────────────────────
  const generateTokenNumber = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const arr = new Uint8Array(6);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => chars[b % chars.length]).join('');
  };

  const addProfileBooking = async (profileId, newBooking) => {
    const tokenNumber = newBooking.tokenNumber || generateTokenNumber();
    // Always store the patient's name in the booking for correct display
    const profile = profiles.find(p => p.id === profileId);
    const bookingWithToken = {
      ...newBooking,
      tokenNumber,
      patientName: profile?.name || newBooking.patientName || 'Patient'
    };

    setProfiles(prev =>
      prev.map(p =>
        p.id === profileId
          ? { ...p, bookings: [...(p.bookings || []), bookingWithToken] }
          : p
      )
    );

    try {
      await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: profileId,
          doctor_name: newBooking.doctor,
          department: newBooking.department,
          booking_date: newBooking.date,
          time_slot: newBooking.timeSlot,
          token_number: tokenNumber
        })
      });
    } catch (e) {
      console.warn("Failed to sync booking to Supabase:", e);
    }
  };

  // ── Load from Supabase on login — STRICT isolation by known profile IDs ───
  useEffect(() => {
    const loadFromSupabase = async () => {
      if (!isLoggedIn || !user?.phone) return;

      // Get the IDs of profiles we already know belong to this user
      const ownData = loadUserData(user.phone);
      const ownProfileIds = (ownData.profiles || []).map(p => p.id);

      if (ownProfileIds.length === 0) return; // no profiles yet, nothing to hydrate

      try {
        // Only fetch bookings and diagnostics for profiles we already own
        const hydratedProfiles = await Promise.all(
          (ownData.profiles || []).map(async (localProfile) => {
            let bookings = localProfile.bookings || [];
            let diagnosticData = localProfile.diagnosticData || null;

            try {
              const bRes = await fetch(`http://localhost:5000/api/bookings/${localProfile.id}`);
              if (bRes.ok) {
                const bData = await bRes.json();
                if (bData && bData.length > 0) {
                  bookings = bData.map(b => ({
                    date: b.booking_date,
                    timeSlot: b.time_slot,
                    department: b.department,
                    doctor: b.doctor_name,
                    patientName: localProfile.name,
                    tokenNumber: b.token_number || generateTokenNumber()
                  }));
                }
              }
            } catch (e) {
              console.warn(`Booking fetch skipped for ${localProfile.id}:`, e);
            }

            try {
              const dRes = await fetch(`http://localhost:5000/api/diagnostics/${localProfile.id}`);
              if (dRes.ok) {
                const dData = await dRes.json();
                if (dData) {
                  diagnosticData = {
                    lastUpdated: dData.created_at,
                    height: dData.height,
                    weight: dData.weight,
                    bmi: dData.bmi,
                    bmiRange: dData.bmi_range,
                    healthScore: dData.health_score,
                    allergies: dData.allergies || [],
                    criticalConditions: dData.critical_conditions || [],
                    medications: dData.medications || [],
                    addictions: dData.addictions || [],
                    department: dData.department,
                    prescription: dData.prescription,
                    homeRemedies: dData.home_remedies
                  };
                }
              }
            } catch (e) {
              console.warn(`Diagnostics fetch skipped for ${localProfile.id}:`, e);
            }

            return { ...localProfile, bookings, diagnosticData };
          })
        );

        setProfiles(hydratedProfiles);
      } catch (err) {
        console.warn("Supabase hydration failed, using local data:", err);
      }
    };
    loadFromSupabase();
  }, [isLoggedIn, user?.phone]);

  return (
    <AppContext.Provider
      value={{
        hasChosenLanguage,
        setHasChosenLanguage,
        isLoggedIn,
        setIsLoggedIn,
        user,
        setUser,
        language,
        setLanguage,
        emergencyContacts,
        addEmergencyContact,
        removeEmergencyContact,
        activeProfileId,
        setActiveProfileId,
        profiles,
        setProfiles,
        addProfile,
        updateProfileDiagnostics,
        addProfileBooking,
        deleteProfileBooking,
        reminders,
        setReminders,
        addReminder,
        updateReminder,
        deleteReminder,
        generateTokenNumber,
        booking,
        setBooking,
        completeOnboarding,
        logout,
        selfIdForPhone
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
