# SMS.md — DIY Android SMS Gateway for Medicure

## Overview
This document outlines the architecture, implementation plan, and integration strategy for a **100% free DIY Android SMS Gateway** to enable automated SMS notifications (OTP, appointment reminders, confirmations) for the Medicure healthcare booking application.

**Core Principle:** Use a spare Android phone running 24/7 as a dedicated SMS server, eliminating recurring costs from commercial SMS APIs (Twilio, Fast2SMS, etc.) while maintaining reliability for a government healthcare deployment.

---

## Why DIY SMS Gateway?

### Commercial SMS API Limitations
- **Cost at scale:** ₹0.15-0.30 per SMS × thousands of daily bookings = significant recurring cost
- **Rate limits:** Free tiers (1,000-10,000 msgs/month) insufficient for multi-hospital deployment
- **Dependency risk:** Service outages or pricing changes impact critical healthcare communications

### DIY Gateway Benefits
- **Zero recurring cost:** One-time hardware (spare Android phone, ₹3,000-5,000 used)
- **Unlimited SMS:** Limited only by carrier plan (typically unlimited SMS in Indian prepaid/postpaid)
- **Full control:** No external dependencies, works with any carrier (Jio, Airtel, Vi)
- **Privacy:** Patient data never leaves your infrastructure
- **Offline-first:** SMS delivery works even when internet is down (phone uses cellular network)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Medicure Backend                         │
│  (Node.js/Express or Firebase Functions)                        │
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │ Booking Service  │─────▶│  SMS Queue       │                │
│  │ (creates appt)   │      │  (Redis/SQLite)  │                │
│  └──────────────────┘      └────────┬─────────┘                │
│                                      │                           │
│                                      │ REST/WebSocket            │
└──────────────────────────────────────┼───────────────────────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │  SMS Gateway Server  │
                            │  (Node.js/Express)   │
                            │  Port: 8080          │
                            └──────────┬───────────┘
                                       │
                                       │ HTTP POST to local webhook
                                       ▼
                            ┌──────────────────────┐
                            │   Android Phone      │
                            │   (SMS Gateway App)  │
                            │                      │
                            │  • SIM card inserted │
                            │  • Wi-Fi connected   │
                            │  • Always plugged in │
                            │  • Battery optimized │
                            └──────────────────────┘
                                       │
                                       │ Cellular network (SMS)
                                       ▼
                            ┌──────────────────────┐
                            │    Patient Phone     │
                            │  Receives SMS:       │
                            │  • OTP codes         │
                            │  • Appt confirmations│
                            │  • Reminders         │
                            └──────────────────────┘
```

---

## Components Breakdown

### 1. Android SMS Gateway App
**Options (Recommended → Fallback):**

#### Option A: SMS Gateway for Android (Recommended)
- **App:** [SMS Gateway for Android](https://smsgateway.me/) or [HTTP SMS Gateway](https://github.com/bogkonstantin/android_income_sms_gateway_webhook)
- **Features:**
  - Exposes HTTP webhook endpoint (e.g., `http://192.168.1.100:8080/send`)
  - Accepts JSON: `{ "phone": "+919876543210", "message": "Your OTP is 123456" }`
  - Returns delivery status
  - Queue management for bulk sends
  - Delivery reports via callback
- **Setup:**
  1. Install app on spare Android phone
  2. Grant SMS permissions
  3. Enable webhook listener (app generates local IP + port)
  4. Configure static IP on router or use mDNS/Tailscale for reliability
  5. Keep phone plugged in with battery optimization disabled for the app

#### Option B: Termux + Custom Script (Advanced)
- **App:** [Termux](https://termux.dev/) + [termux-sms-send](https://wiki.termux.com/wiki/Termux-sms-send)
- **Features:**
  - Full Linux-like environment on Android
  - Node.js server running directly on phone
  - Shell script to send SMS via `termux-sms-send`
- **Setup:**
  ```bash
  pkg install nodejs-lts
  npm install express body-parser
  # Create server.js (see Phase 2 below)
  node server.js
  ```

### 2. SMS Gateway Server (Backend Bridge)
**Purpose:** Sits between your main Medicure backend and the Android phone, handling:
- SMS queue management (retry logic, rate limiting)
- Template rendering (OTP, appointment reminders with patient name/time/doctor)
- Delivery tracking and logging
- Fallback to commercial API if phone is offline

**Tech Stack:**
- Node.js + Express
- Redis (queue) or SQLite (lightweight alternative)
- Bull/BullMQ (job queue library)

**Endpoints:**
```javascript
POST /sms/send
{
  "to": "+919876543210",
  "template": "otp",
  "variables": { "code": "123456" }
}

POST /sms/send-bulk
{
  "recipients": ["+919876543210", "+919876543211"],
  "template": "reminder",
  "variables": { "doctor": "Dr. Suresh Rao", "time": "10:30 AM", "date": "Jan 15" }
}

GET /sms/status/:messageId
{
  "id": "msg_123",
  "status": "delivered",
  "timestamp": "2025-01-10T10:30:00Z"
}
```

### 3. SMS Templates
**Stored in:** `backend/templates/sms/`

```javascript
// templates/otp.txt
Your Medicure OTP is {{code}}. Valid for 10 minutes. Do not share.

// templates/booking_confirmation.txt
Appointment confirmed!
Dr. {{doctor}}, {{department}}
{{date}} at {{time}}
SGH Hospital, Bengaluru
Reply CANCEL to cancel

// templates/reminder.txt
Reminder: Your appointment with Dr. {{doctor}} is tomorrow at {{time}}. See you soon! - Medicure

// templates/emergency_location.txt
Emergency alert from {{name}}!
Location: https://maps.google.com/?q={{latitude}},{{longitude}}
Time: {{timestamp}}
```

---

## Implementation Phases

### Phase 0: Hardware & App Setup (1 hour)
**Status:** not started

- [ ] Acquire spare Android phone (minimum Android 7.0, functional SMS, 1GB RAM)
- [ ] Insert SIM card with unlimited SMS plan (Jio ₹199 plan, Airtel ₹155 plan, etc.)
- [ ] Install "SMS Gateway for Android" app from [GitHub](https://github.com/android-sms-gateway/client-android) or Play Store equivalent
- [ ] Configure app:
  - Enable webhook listener
  - Set port (default 8080)
  - Note phone's local IP (Settings → Wi-Fi → Advanced → IP address)
  - Generate API key in app settings
- [ ] Router configuration:
  - Assign static IP to phone via MAC address binding (e.g., 192.168.1.100)
  - Alternative: Use Tailscale for stable networking without router access
- [ ] Phone optimization:
  - Settings → Battery → Disable optimization for SMS Gateway app
  - Settings → Display → Increase screen timeout to 30 min (prevents deep sleep)
  - Keep phone plugged in 24/7 (use old charger to preserve battery health)

**Handoff note:** _Phone should respond to `curl http://192.168.1.100:8080/health` with success before proceeding_

---

### Phase 1: SMS Gateway Server Setup (2 hours)
**Status:** not started

#### 1.1: Create Node.js SMS Gateway Server

```bash
mkdir backend/sms-gateway
cd backend/sms-gateway
npm init -y
npm install express body-parser axios bull redis dotenv
```

**File:** `backend/sms-gateway/server.js`
```javascript
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const Queue = require('bull');
const app = express();

app.use(bodyParser.json());

// Redis queue (or use SQLite for simpler setup)
const smsQueue = new Queue('sms', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Android phone webhook endpoint
const ANDROID_GATEWAY_URL = process.env.ANDROID_GATEWAY_URL; // http://192.168.1.100:8080/send
const ANDROID_API_KEY = process.env.ANDROID_API_KEY;

// SMS templates
const templates = {
  otp: (vars) => `Your Medicure OTP is ${vars.code}. Valid for 10 minutes. Do not share.`,
  booking: (vars) => `Appointment confirmed!\nDr. ${vars.doctor}, ${vars.department}\n${vars.date} at ${vars.time}\nSGH Hospital, Bengaluru`,
  reminder: (vars) => `Reminder: Your appointment with Dr. ${vars.doctor} is tomorrow at ${vars.time}. - Medicure`,
};

// Endpoint to queue SMS
app.post('/sms/send', async (req, res) => {
  const { to, template, variables } = req.body;

  if (!to || !template || !templates[template]) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const message = templates[template](variables);
  
  const job = await smsQueue.add({
    phone: to,
    message,
    template,
    timestamp: new Date().toISOString(),
  });

  res.json({ messageId: job.id, status: 'queued' });
});

// Process SMS queue
smsQueue.process(async (job) => {
  const { phone, message } = job.data;

  try {
    const response = await axios.post(ANDROID_GATEWAY_URL, {
      phone_number: phone,
      message,
    }, {
      headers: { 'Authorization': `Bearer ${ANDROID_API_KEY}` },
      timeout: 10000,
    });

    console.log(`✓ SMS sent to ${phone}:`, response.data);
    return { status: 'sent', response: response.data };
  } catch (error) {
    console.error(`✗ SMS failed to ${phone}:`, error.message);
    
    // Retry logic: 3 attempts with exponential backoff
    if (job.attemptsMade < 3) {
      throw new Error('Retry sending SMS');
    }
    
    // After 3 failures, log and optionally fallback to commercial API
    // TODO: Implement Twilio/Fast2SMS fallback here
    return { status: 'failed', error: error.message };
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', queue: smsQueue.name });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SMS Gateway Server running on port ${PORT}`);
});
```

**File:** `backend/sms-gateway/.env`
```env
ANDROID_GATEWAY_URL=http://192.168.1.100:8080/send
ANDROID_API_KEY=your_api_key_from_android_app
REDIS_URL=redis://127.0.0.1:6379
PORT=3001
```

#### 1.2: Test SMS Sending

```bash
node server.js

# In another terminal:
curl -X POST http://localhost:3001/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "template": "otp",
    "variables": { "code": "123456" }
  }'
```

**Expected:** SMS arrives on test phone within 5-10 seconds.

**Handoff note:** _Gateway server must successfully send test SMS before Phase 2_

---

### Phase 2: Medicure Backend Integration (2 hours)
**Status:** not started

#### 2.1: OTP Sending (Login Flow)

**File:** `backend/services/authService.js` (or equivalent)

```javascript
const axios = require('axios');

async function sendOTP(phoneNumber) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  
  // Store OTP in database/cache with 10-minute expiry
  await storeOTP(phoneNumber, otp, 600); // Redis: SETEX phone:otp 600 otp_value
  
  // Send via SMS Gateway
  await axios.post('http://localhost:3001/sms/send', {
    to: phoneNumber,
    template: 'otp',
    variables: { code: otp },
  });
  
  console.log(`OTP sent to ${phoneNumber}`);
}

async function verifyOTP(phoneNumber, userEnteredOTP) {
  const storedOTP = await getOTP(phoneNumber); // Redis: GET phone:otp
  
  if (storedOTP === userEnteredOTP) {
    await deleteOTP(phoneNumber); // Redis: DEL phone:otp
    return true;
  }
  return false;
}
```

**Integration Point:** Call `sendOTP()` from `Login.jsx`'s submit handler or backend `/auth/login` endpoint.

#### 2.2: Appointment Confirmation SMS

**File:** `backend/services/bookingService.js`

```javascript
async function confirmBooking(bookingData) {
  const { patientPhone, doctorName, department, date, time } = bookingData;
  
  // Save booking to database
  const booking = await saveBooking(bookingData);
  
  // Send confirmation SMS
  await axios.post('http://localhost:3001/sms/send', {
    to: patientPhone,
    template: 'booking',
    variables: {
      doctor: doctorName,
      department,
      date: formatDate(date), // "Jan 15, 2025"
      time: formatTime(time), // "10:30 AM"
    },
  });
  
  return booking;
}
```

**Integration Point:** Call `confirmBooking()` from `BookingConfirmation.jsx`'s "Confirm" button handler.

#### 2.3: Reminder SMS (Cron Job)

**File:** `backend/jobs/reminderJob.js`

```javascript
const cron = require('node-cron');

// Run daily at 6 PM to send next-day reminders
cron.schedule('0 18 * * *', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Fetch all bookings for tomorrow
  const bookings = await getBookingsForDate(tomorrow);
  
  for (const booking of bookings) {
    await axios.post('http://localhost:3001/sms/send', {
      to: booking.patientPhone,
      template: 'reminder',
      variables: {
        doctor: booking.doctorName,
        time: formatTime(booking.time),
      },
    });
  }
  
  console.log(`Sent ${bookings.length} reminder SMS`);
});
```

**Setup:** Add to main backend server startup or deploy as separate worker process.

**Handoff note:** _All three SMS integration points (OTP, confirmation, reminder) tested successfully_

---

### Phase 3: Reliability & Monitoring (1 hour)
**Status:** not started

- [ ] **Health checks:**
  - Backend pings `http://192.168.1.100:8080/health` every 5 minutes
  - If phone offline > 15 min, send alert email to admin
  - Optional: Fallback to Twilio API automatically
  
- [ ] **Delivery tracking:**
  - Store SMS logs in database: `{messageId, phone, status, sentAt, deliveredAt}`
  - Android app callback endpoint: `POST /sms/delivery-report` → update status
  
- [ ] **Rate limiting:**
  - Max 10 SMS/minute to same number (prevent abuse/spam)
  - Max 100 SMS/hour total (protect against runaway loops)
  
- [ ] **Phone monitoring script:**
  ```bash
  # backend/scripts/monitor-phone.sh
  #!/bin/bash
  while true; do
    if ! curl -s http://192.168.1.100:8080/health > /dev/null; then
      echo "⚠ SMS Gateway phone offline!" | mail -s "Alert" admin@medicure.gov.in
    fi
    sleep 300 # Check every 5 minutes
  done
  ```

**Handoff note:** _Health monitoring active, delivery rate >95% over 24-hour test period_

---

### Phase 4: Production Hardening (1 hour)
**Status:** not started

- [ ] **Security:**
  - Firewall: Block external access to Android phone (8080 only accessible from backend server IP)
  - API key authentication on gateway endpoints
  - Rate limiting via `express-rate-limit`
  - Input validation (phone number format, template XSS protection)
  
- [ ] **Phone longevity:**
  - Root phone and install [AccuBattery](https://play.google.com/store/apps/details?id=com.digibites.accubattery) to limit charge to 80% (extends battery life)
  - Alternative: Use power bank with pass-through charging + wall adapter
  - Temperature monitoring: Ensure phone doesn't overheat (use phone stand with ventilation)
  
- [ ] **Backup gateway:**
  - Set up second spare phone as fallback
  - Gateway server tries primary first, switches to backup if offline
  - Dual-SIM phone: Use both SIM slots for redundancy
  
- [ ] **Documentation:**
  - Document phone replacement procedure
  - Document SIM card recharge process (monthly for prepaid)
  - Create troubleshooting runbook for common issues

**Handoff note:** _Production deployment checklist completed_

---

## Cost Analysis

### DIY SMS Gateway (This Solution)
| Item | Cost | Frequency |
|---|---|---|
| Spare Android phone (used) | ₹3,000-5,000 | One-time |
| SIM card with unlimited SMS plan | ₹200/month | Monthly |
| Electricity (phone charging 24/7) | ₹30/month | Monthly |
| **Total Year 1** | **₹7,760** | - |
| **Total Year 2+** | **₹2,760/year** | - |
| **Per SMS cost** | **₹0.00** | - |

### Commercial SMS API (Comparison)
| Provider | Cost per SMS | 10,000 SMS/month | 100,000 SMS/month |
|---|---|---|---|
| Twilio | ₹0.25 | ₹2,500 | ₹25,000 |
| Fast2SMS | ₹0.15 | ₹1,500 | ₹15,000 |
| MSG91 | ₹0.18 | ₹1,800 | ₹18,000 |
| **Annual cost** | - | **₹18,000-30,000** | **₹180,000-300,000** |

**Break-even:** DIY solution pays for itself in **1 month** at 10,000 SMS/month volume.

---

## Integration with Existing Medicure App

### Frontend Changes (Minimal)
**No changes needed** if backend already has SMS endpoints. If building from scratch:

**File:** `frontend/src/utils/api.js`
```javascript
export async function requestOTP(phoneNumber) {
  const response = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phoneNumber }),
  });
  return response.json();
}

export async function verifyOTP(phoneNumber, otp) {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phoneNumber, otp }),
  });
  return response.json();
}
```

**File:** `frontend/src/screens/OtpVerify.jsx`
```jsx
import { verifyOTP } from '../utils/api';

function OtpVerify() {
  const [otp, setOtp] = useState('');
  const { phone } = useContext(AppContext);
  
  async function handleVerify() {
    const result = await verifyOTP(phone, otp);
    if (result.success) {
      navigate('/dashboard');
    } else {
      alert('Invalid OTP');
    }
  }
  
  return (
    <div>
      <input value={otp} onChange={e => setOtp(e.target.value)} />
      <button onClick={handleVerify}>Verify</button>
    </div>
  );
}
```

### Backend Changes
- Add `/api/auth/send-otp` endpoint (calls SMS Gateway)
- Add `/api/auth/verify-otp` endpoint (checks Redis cache)
- Add SMS sending to booking confirmation flow
- Add cron job for daily reminders

**All backend changes are in Phase 2 above** — no database schema changes required.

---

## Deployment Architecture

### Development/Testing
```
┌─────────────────┐
│  Your Laptop    │
│  (Backend Dev)  │──WiFi──┐
└─────────────────┘        │
                            ▼
                    ┌──────────────┐
                    │   Router     │
                    │  192.168.1.1 │
                    └──────┬───────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
    ┌─────────────┐              ┌─────────────────┐
    │ SMS Gateway │              │  Android Phone  │
    │   Server    │─HTTP─────────│  (Gateway App)  │
    │ :3001       │              │  192.168.1.100  │
    └─────────────┘              └─────────────────┘
```

### Production (Hospital Deployment)
```
                    ┌──────────────────┐
                    │  Medicure Backend│
                    │  (Cloud/VPS)     │
                    └────────┬─────────┘
                             │ VPN/Tailscale
                             ▼
┌─────────────────────────────────────────────┐
│         Hospital Server Room                │
│                                             │
│  ┌─────────────┐        ┌───────────────┐  │
│  │SMS Gateway  │─LAN───▶│Android Phone  │  │
│  │Server       │        │(Gateway App)  │  │
│  │:3001        │        │192.168.1.100  │  │
│  └─────────────┘        └───────────────┘  │
│                                             │
│  (Both plugged into UPS for power backup)  │
└─────────────────────────────────────────────┘
```

**Networking Options:**
1. **VPN (Tailscale/WireGuard):** Secure tunnel from cloud backend to hospital network
2. **Public IP + Firewall:** Gateway server has static IP, firewall blocks all except backend IP
3. **Hybrid:** Backend on-premise alongside gateway (no cloud needed)

---

## Troubleshooting Guide

### Phone Not Responding
**Symptom:** `curl http://192.168.1.100:8080` times out

**Fixes:**
1. Check phone screen is on (deep sleep may disable networking)
2. Verify app is running (not force-closed by system)
3. Ping phone IP: `ping 192.168.1.100`
4. Check router DHCP leases (IP may have changed)
5. Restart gateway app
6. Restart phone

### SMS Not Delivered
**Symptom:** Queue shows "sent" but patient doesn't receive SMS

**Fixes:**
1. Check SIM card balance (for prepaid plans)
2. Verify phone has cellular signal (Settings → About → SIM status)
3. Test manual SMS from phone's default SMS app
4. Check carrier spam filters (patient may need to whitelist sender)
5. Try different carrier (Jio vs Airtel may have different deliverability)

### High Latency (>30s per SMS)
**Symptom:** SMS takes long time to send

**Fixes:**
1. Clear phone's SMS app cache (Settings → Apps → Messages → Clear cache)
2. Delete old SMS threads (inbox >1000 messages slows sending)
3. Restart phone
4. Check for OS updates (may improve modem firmware)

### Battery Draining Fast
**Symptom:** Phone shuts down despite being plugged in

**Fixes:**
1. Replace old/degraded battery (if phone is removable)
2. Use higher-wattage charger (2A minimum)
3. Disable unnecessary background apps
4. Enable "battery saver" mode but exclude gateway app
5. Root and install battery charge limiter app

---

## Alternative Approaches (If DIY Not Feasible)

### Option 1: WhatsApp Business Cloud API
- **Cost:** 1,000 free conversations/month, then ₹0.36/conversation
- **Pros:** Higher open rates (95% vs 80% for SMS), rich media support
- **Cons:** Requires Facebook Business account verification (7-14 days), internet required
- **Best for:** Non-urgent notifications, patient engagement

### Option 2: Email OTP (SMS Fallback)
- **Cost:** Free (Resend/SendGrid 3,000 emails/day free)
- **Pros:** Zero cost, instant delivery, no phone dependency
- **Cons:** Patient needs email address (limited in rural India), lower open rates
- **Best for:** Urban patients, secondary verification method

### Option 3: Hybrid (DIY SMS + Commercial Fallback)
- **Cost:** DIY ₹200/month + Twilio ₹500/month (emergency buffer)
- **Pros:** Best reliability, automatic failover
- **Cons:** Slightly higher complexity
- **Best for:** Production deployments where uptime is critical

---

## Security Considerations

### Data Privacy
- **No patient data stored on gateway phone:** Phone only receives `{phone, message}` — no names, medical records, etc.
- **Message encryption:** Use HTTPS for backend ↔ gateway communication (self-signed cert OK for local network)
- **Access control:** Gateway API key rotated monthly, logged accesses monitored

### Regulatory Compliance
- **TRAI DLT Registration:** Required for commercial SMS senders in India
  - **Workaround:** Personal phone SIM not subject to DLT (as long as <100 SMS/day per recipient)
  - **If scaling:** Register as "Service Explicit" entity on TRAI DLT portal (₹3,000 one-time)
- **GDPR/Patient consent:** Ensure patients opt-in to SMS notifications during signup (checkbox in Login.jsx)

### Abuse Prevention
- **Rate limiting:** Enforce max 10 OTP requests/hour per phone number
- **Profanity filter:** Scan all templates for abusive content before sending (not typically needed for healthcare)
- **Opt-out:** All SMS include "Reply STOP to unsubscribe" (manual handling for now, auto-response in future)

---

## Maintenance Checklist

### Daily
- [ ] Check gateway server logs for errors (`tail -f logs/sms-gateway.log`)
- [ ] Verify phone is online (`curl http://192.168.1.100:8080/health`)

### Weekly
- [ ] Review SMS delivery rates (target >95%)
- [ ] Clear phone SMS app (delete delivered messages to free storage)
- [ ] Check SIM balance (prepaid) or bill status (postpaid)

### Monthly
- [ ] Reboot phone (prevents memory leaks)
- [ ] Update gateway app if new version available
- [ ] Rotate API keys
- [ ] Review and archive SMS logs older than 30 days

### Quarterly
- [ ] Test failover to backup phone (if configured)
- [ ] Review SMS templates for clarity (patient feedback)
- [ ] Audit delivery failures by carrier (switch SIM if one performs poorly)

---

## Future Enhancements (Post-Hackathon)

### Advanced Features
1. **Two-way SMS:** Patients reply "CANCEL" to cancel appointment
   - Requires webhook from Android app on incoming SMS
   - Parse reply, update booking status in database
   
2. **Delivery analytics dashboard:** Real-time SMS metrics
   - Sent, delivered, failed, pending counts
   - Deliverability by carrier, time of day
   - Average latency graphs
   
3. **Smart scheduling:** Send reminders at optimal times
   - ML model predicts best send time based on past engagement
   - A/B test reminder wording ("Tomorrow at 10 AM" vs "In 24 hours")
   
4. **Multi-language templates:** Auto-translate based on patient's preferred language
   - Store language preference in user profile
   - Use i18n library or Google Translate API for dynamic translation

### Scaling to Multiple Hospitals
- **Gateway server per hospital:** Each location has own phone + server
- **Centralized control panel:** Admin dashboard to monitor all gateways
- **Load balancing:** Distribute SMS across multiple phones (round-robin)

---

## Summary

This DIY SMS Gateway architecture provides:
- **100% free SMS** at scale (after one-time ₹5,000 phone cost)
- **Complete control** over delivery and patient data privacy
- **High reliability** with offline fallback and simple hardware
- **Easy integration** with existing Medicure React + Node.js stack
- **Production-ready** in ~6 hours of focused implementation

**Next Steps:**
1. Acquire spare Android phone and SIM card
2. Complete Phase 0 (hardware setup)
3. Implement Phase 1 (gateway server)
4. Integrate with Medicure backend (Phase 2)
5. Deploy to hospital server room and monitor

**Estimated Total Implementation Time:** 6-8 hours (1 full hackathon day or 2 afternoons)

---

## Additional Resources
- [SMS Gateway for Android GitHub](https://github.com/android-sms-gateway/client-android)
- [Termux SMS Documentation](https://wiki.termux.com/wiki/Termux-sms-send)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Tailscale VPN Setup](https://tailscale.com/kb/1017/install/)
- [TRAI DLT Registration Guide](https://www.trai.gov.in/notifications/press-release/trai-releases-direction-blockchain-powered-distributed-ledger)

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Maintained By:** Medicure Development Team
