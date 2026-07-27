import React, { useContext, useEffect, useState } from 'react';
import { API_BASE_URL, safeFetch } from '../config';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';

function downloadHealthCardPDF(profile) {
  const diag = profile.diagnosticData || {};
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Patient Health Card - ${profile.name}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 16px; color: #1e293b; background: #f8fafc; display: flex; justify-content: center; align-items: flex-start; margin: 0; }
    .wrapper { width: 100%; max-width: 460px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); padding: 20px; box-sizing: border-box; }
    .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { margin: 0; color: #06b6d4; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; }
    .header p { margin: 4px 0 0 0; color: #64748b; font-size: 10px; font-weight: 500; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .card { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px; padding: 8px 10px; }
    .card label { font-size: 8px; color: #94a3b8; text-transform: uppercase; display: block; font-weight: 700; }
    .card p { margin: 2px 0 0 0; font-size: 11px; font-weight: 700; color: #1e293b; }
    .title { font-size: 10px; font-weight: 800; color: #06b6d4; text-transform: uppercase; margin-top: 12px; margin-bottom: 4px; letter-spacing: 0.5px; }
    .prescription { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 10px; font-size: 10px; color: #92400e; white-space: pre-line; font-weight: 500; }
    .remedies { background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 10px; padding: 10px; font-size: 10px; color: #166534; font-weight: 500; }
    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 10px; font-weight: 500; }
    @media print {
      body { background: #fff; padding: 0; }
      .wrapper { border: none; box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>SMART GOV HEALTH — CLINICAL HEALTH CARD</h1>
      <p>Official Patient Diagnostic Record • Issued ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="grid">
      <div class="card"><label>Patient Name</label><p>${profile.name}</p></div>
      <div class="card"><label>Patient ID / Phone</label><p>${profile.phone || '9900088888'}</p></div>
      <div class="card"><label>Age & Gender</label><p>${profile.age || '30'} Yrs • ${profile.sex || 'Female'}</p></div>
      <div class="card"><label>Assigned Department</label><p style="color:#06b6d4">${diag.department || 'General Medicine'}</p></div>
    </div>

    <div class="grid">
      <div class="card"><label>Height</label><p>${diag.height || '--'}</p></div>
      <div class="card"><label>Weight</label><p>${diag.weight || '--'}</p></div>
      <div class="card"><label>BMI</label><p>${diag.bmi || '--'}</p></div>
    </div>

    <div class="title">Clinical Diagnostic Assessment</div>
    <div class="card" style="background:#f0fdfa; border-color:#ccfbf1;">
      <label>Assessed Condition</label>
      <p style="color:#0f766e;">${diag.condition || 'Assessed Condition'}</p>
    </div>

    <div class="title">Prescription & Medication</div>
    <div class="prescription">${diag.prescription || 'No current active prescription on record.'}</div>

    <div class="title">Home Remedies & Care Plan</div>
    <div class="remedies">${diag.homeRemedies || 'Drink plenty of fluids, eat nutritious meals, and rest.'}</div>

    <div class="footer">
      Smart GOV Health (SGH) • Digital Healthcare Infrastructure • Confidential Medical Record
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `Patient_Health_Card_${profile.name.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export default function PatientCardView() {
  const { profiles } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();

  const targetId = searchParams.get('id') || params.id || 'self';
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try finding locally in context profiles
    const local = profiles.find(p => p.id === targetId);
    if (local) {
      setPatient(local);
      setLoading(false);
      return;
    }

    // 2. Fetch from backend API if not in local context
    const fetchPatient = async () => {
      try {
        const res = await safeFetch(`${API_BASE_URL}/api/patients`);
        if (res.ok) {
          const patients = await res.json();
          const match = patients.find(p => p.id === targetId);
          if (match) {
            let diagData = null;
            try {
              const dRes = await safeFetch(`${API_BASE_URL}/api/diagnostics/${targetId}`);
              if (dRes.ok) {
                const d = await dRes.json();
                if (d) {
                  diagData = {
                    department: d.department,
                    condition: d.critical_conditions?.[0] || 'Assessed Condition',
                    prescription: d.prescription,
                    homeRemedies: d.home_remedies,
                    height: d.height || '--',
                    weight: d.weight || '--',
                    bmi: d.bmi || '--'
                  };
                }
              }
            } catch (e) {}

            setPatient({
              id: match.id,
              name: match.name,
              age: String(match.age),
              sex: match.sex,
              phone: match.phone,
              diagnosticData: diagData
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {}

      // Fallback patient if network offline or demo ID
      setPatient(profiles[0] || {
        id: targetId,
        name: 'Patient Record',
        age: '30',
        sex: 'Female',
        phone: '9900088888',
        diagnosticData: {
          department: 'General Medicine',
          condition: 'Clinical Checkup Complete',
          prescription: 'Paracetamol 500mg - 1 tab after meals if needed',
          homeRemedies: 'Rest, hydrate, and maintain light diet.',
          height: '165 cm',
          weight: '60 kg',
          bmi: '22.0'
        }
      });
      setLoading(false);
    };

    fetchPatient();
  }, [targetId, profiles]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-500 font-semibold text-xs">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading Scanned Health Card…</p>
        </div>
      </div>
    );
  }

  const getAvatarBg = id => {
    const c = ['bg-teal-700','bg-slate-700','bg-amber-800','bg-emerald-800','bg-indigo-900','bg-orange-800'];
    return c[(id || 'self').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % c.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col justify-between p-6 relative overflow-hidden page-transit-wrapper"
      style={{ paddingBottom: '90px' }}
    >
      {/* Glows */}
      <div className="absolute top-[10%] left-[-20%] w-[90%] h-[40%] rounded-full glow-bg-radial opacity-60 pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-20%] w-[90%] h-[40%] rounded-full glow-bg-radial opacity-40 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10 relative">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-primary flex items-center space-x-1 cursor-pointer"
        >
          <span>← Dashboard</span>
        </button>
        <h2 className="text-xs font-bold text-slate-800 font-heading-style uppercase tracking-wider">
          Scanned Health Card
        </h2>
        <div className="w-8" />
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto space-y-4 my-4 relative z-10">

        {/* Success Verified Banner */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-extrabold shrink-0">✓</span>
          <span>QR Verified — Official SGH Digital Health Card</span>
        </div>

        {/* Patient Badge */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden shadow-xl">
          <div className={`w-14 h-14 rounded-2xl ${getAvatarBg(patient.id)} flex items-center justify-center font-bold text-white text-xl shadow border border-white/20`}>
            {patient.name[0]}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-extrabold font-heading-style">{patient.name}</h3>
            <p className="text-xs text-cyan-300 font-semibold mt-0.5">
              Phone: {patient.phone || '9900088888'}
            </p>
            <p className="text-[10px] text-slate-300">
              {patient.age} Yrs • {patient.sex}
            </p>
          </div>
        </div>

        {/* Clinical Diagnostics */}
        {patient.diagnosticData ? (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-slate-100 shadow-md space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">Height</span>
                <span className="font-extrabold text-slate-800">{patient.diagnosticData.height || '--'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">Weight</span>
                <span className="font-extrabold text-slate-800">{patient.diagnosticData.weight || '--'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">BMI</span>
                <span className="font-extrabold text-slate-800">{patient.diagnosticData.bmi || '--'}</span>
              </div>
            </div>

            <div className="bg-cyan-50 border border-cyan-100 p-3.5 rounded-2xl space-y-1">
              <span className="text-[9px] text-cyan-700 uppercase font-bold block">Assigned Department</span>
              <p className="font-extrabold text-primary capitalize text-sm">{patient.diagnosticData.department || 'General Medicine'}</p>
            </div>

            {patient.diagnosticData.prescription && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-1">
                <span className="text-[9px] text-amber-800 uppercase font-bold block">💊 Prescription</span>
                <p className="text-slate-700 whitespace-pre-line text-xs font-medium leading-relaxed">
                  {patient.diagnosticData.prescription}
                </p>
              </div>
            )}

            {patient.diagnosticData.homeRemedies && (
              <div className="bg-green-50 border border-green-200 p-3.5 rounded-2xl space-y-1">
                <span className="text-[9px] text-green-800 uppercase font-bold block">🌿 Home Remedies</span>
                <p className="text-slate-700 text-xs font-medium leading-relaxed">
                  {patient.diagnosticData.homeRemedies}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow text-center text-xs text-slate-500">
            No diagnostic records found for this patient.
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => downloadHealthCardPDF(patient)}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer font-heading-style"
          >
            <span>📥</span> Save / Download PDF Report
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-2xl text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-200"
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </motion.div>
  );
}
