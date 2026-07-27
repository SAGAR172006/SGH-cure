// triage.routes.js
// Express Router definitions for SGH clinical APIs.

import { Router } from 'express';
import { 
  triageIntakeHandler,
  getPatientsHandler,
  upsertPatientHandler,
  getBookingsHandler,
  createBookingHandler,
  getDiagnosticsHandler,
  nextQuestionHandler
} from '../controllers/triage.controller.js';

const router = Router();

// Endpoint for processing healthcare chat and intakes
router.post('/healthcare/chat', triageIntakeHandler);
router.post('/healthcare/next-question', nextQuestionHandler);
router.post('/triage', triageIntakeHandler); // fallback alias

// Patients and Bookings Sync APIs
router.get('/patients', getPatientsHandler);
router.post('/patients', upsertPatientHandler);
router.get('/bookings/:patientId', getBookingsHandler);
router.post('/bookings', createBookingHandler);
router.get('/diagnostics/:patientId', getDiagnosticsHandler);

export default router;
