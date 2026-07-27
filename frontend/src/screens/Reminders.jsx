import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';

const DAYS_LIST = ['Everyday', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FREQ_OPTIONS = ['Daily', 'Twice a day', 'Thrice a day', 'Weekly', 'As needed'];

export default function Reminders() {
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    language
  } = useContext(AppContext);

  const navigate = useNavigate();

  const [selectedProfileId, setSelectedProfileId] = useState(activeProfileId);
  const [toastMsg, setToastMsg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRemId, setEditingRemId] = useState(null);

  const activeProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0] || { name: 'Patient' };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'Medicine', // Medicine, Exercise, Test, Checkup
    days: ['Everyday'],
    time: '08:00 AM',
    frequency: 'Daily',
    subDetails: ''
  });

  const showToast = (actionText) => {
    const msg = `reminder for ${activeProfile.name} was ${actionText}`;
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingRemId(null);
    setFormData({
      name: '',
      type: 'Medicine',
      days: ['Everyday'],
      time: '09:00 AM',
      frequency: 'Daily',
      subDetails: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rem) => {
    setEditingRemId(rem.id);
    setFormData({
      name: rem.name,
      type: rem.type || 'Medicine',
      days: rem.days || ['Everyday'],
      time: rem.time || '09:00 AM',
      frequency: rem.frequency || 'Daily',
      subDetails: rem.subDetails || ''
    });
    setIsModalOpen(true);
  };

  const handleDayToggle = (day) => {
    if (day === 'Everyday') {
      setFormData(prev => ({ ...prev, days: ['Everyday'] }));
      return;
    }
    setFormData(prev => {
      let filtered = prev.days.filter(d => d !== 'Everyday');
      if (filtered.includes(day)) {
        filtered = filtered.filter(d => d !== day);
      } else {
        filtered.push(day);
      }
      if (filtered.length === 0) filtered = ['Everyday'];
      return { ...prev, days: filtered };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingRemId) {
      updateReminder(editingRemId, {
        patientId: selectedProfileId,
        ...formData
      });
      showToast('edited');
    } else {
      addReminder({
        patientId: selectedProfileId,
        ...formData
      });
      showToast('created');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    deleteReminder(id);
    showToast('deleted');
  };

  const profileReminders = reminders.filter(r => r.patientId === selectedProfileId);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col p-5 relative overflow-hidden page-transit-wrapper"
      style={{ paddingBottom: '90px' }}
    >
      {/* Background glow */}
      <div className="absolute top-[5%] left-[-20%] w-[90%] h-[40%] rounded-full glow-bg-radial opacity-50 pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-20%] w-[90%] h-[40%] rounded-full glow-bg-radial opacity-30 pointer-events-none" />

      {/* Top Bar */}
      <div className="flex items-center justify-between z-20 relative">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-primary flex items-center space-x-1 cursor-pointer"
        >
          <span>← Dashboard</span>
        </button>
        <h2 className="text-sm font-bold text-text-heading font-heading-style uppercase tracking-wider">
          Reminders
        </h2>
        <div className="w-8" />
      </div>

      {/* Toast Popup Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-xs w-[90%] bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 text-xs font-semibold"
          >
            <span className="text-base">🔔</span>
            <span className="flex-1 capitalize">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col space-y-4 mt-4 overflow-y-auto max-w-sm w-full mx-auto scrollbar-none relative z-10">

        {/* Patient Profile Picker */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-100 p-4 rounded-2xl shadow-sm space-y-2">
          <label className="text-[10px] font-bold text-primary tracking-widest uppercase block font-heading-style">
            Select Patient Profile
          </label>
          <select
            value={selectedProfileId}
            onChange={(e) => {
              setSelectedProfileId(e.target.value);
              setActiveProfileId(e.target.value);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-text-heading outline-none focus:border-primary font-bold cursor-pointer"
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id === 'self' ? 'Self' : p.relation || 'Family'})
              </option>
            ))}
          </select>
        </div>

        {/* Add Reminder CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenAddModal}
          className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer font-heading-style"
        >
          <span>⏰</span> + Create New Reminder
        </motion.button>

        {/* Reminders List */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-heading-style">
            Active Reminders ({profileReminders.length})
          </h3>

          {profileReminders.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-sm border border-slate-100 rounded-2xl p-6 text-center space-y-2">
              <p className="text-2xl">💊</p>
              <p className="text-xs text-text-muted font-medium">
                No active reminders set for {activeProfile.name}. Tap "+ Create New Reminder" above to add one.
              </p>
            </div>
          ) : (
            profileReminders.map(rem => (
              <motion.div
                key={rem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 shadow-sm space-y-2.5 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 text-primary border border-cyan-100 flex items-center justify-center text-base">
                      {rem.type === 'Exercise' ? '🏃‍♂️' : rem.type === 'Test' ? '🩸' : '💊'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-heading">{rem.name}</h4>
                      <p className="text-[10px] font-medium text-primary uppercase tracking-wider">{rem.frequency} • {rem.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(rem)}
                      className="p-1.5 text-slate-400 hover:text-primary transition-colors text-xs cursor-pointer"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(rem.id)}
                      className="p-1.5 text-slate-400 hover:text-danger transition-colors text-xs cursor-pointer"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Days badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {rem.days?.map(d => (
                    <span key={d} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-semibold rounded-md">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Sub details */}
                {rem.subDetails && (
                  <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
                    Note: {rem.subDetails}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </div>

      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl p-5 w-full max-w-sm relative z-10 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-primary uppercase font-heading-style tracking-wider">
                  {editingRemId ? 'Edit Reminder' : 'Set New Reminder'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 text-base font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Type */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400">Category</label>
                  <div className="grid grid-cols-4 gap-1">
                    {['Medicine', 'Exercise', 'Test', 'Checkup'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t })}
                        className={`py-1.5 rounded-xl text-[9px] font-bold text-center border cursor-pointer transition-all ${
                          formData.type === t
                            ? 'bg-primary text-white border-primary'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400">Reminder Name / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 500mg or 30-min Walk"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                  />
                </div>

                {/* Time & Frequency */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Time</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 08:00 AM"
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Frequency</label>
                    <select
                      value={formData.frequency}
                      onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm text-slate-800 outline-none focus:border-primary font-semibold"
                    >
                      {FREQ_OPTIONS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Days */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400">Days</label>
                  <div className="flex flex-wrap gap-1">
                    {DAYS_LIST.map(day => {
                      const selected = formData.days.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                            selected
                              ? 'bg-primary text-white border-primary'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sub details */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-slate-400">Sub Details / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Take after meals with warm water"
                    value={formData.subDetails}
                    onChange={e => setFormData({ ...formData, subDetails: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-primary resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer"
                >
                  Save Reminder
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
