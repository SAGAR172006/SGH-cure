// app.js
// Express application configuration module.

import express from 'express';
import cors from 'cors';
import routes from './routes/triage.routes.js';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));

// API Base Routes
app.use('/api', routes);

// Fallback status checks
app.get('/status', (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

export default app;
