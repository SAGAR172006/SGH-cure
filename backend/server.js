// server.js
// Main entry point for the Smart GOV Health Node.js backend.

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './src/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configurations from project root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Smart GOV Health Orchestrator running on port ${PORT}`);
});
