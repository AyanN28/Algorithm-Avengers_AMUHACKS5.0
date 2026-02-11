import express, { json } from 'express';
import multer, { diskStorage } from 'multer'; // Middleware for handling audio files
import cors from 'cors';
import { existsSync, mkdirSync } from 'fs';

const app = express();
app.use(cors());
app.use(json());

// Configure Multer for Audio Storage
const storage = diskStorage({
  destination: (req, file, cb) => {
    const dir = './evidence_vault';
    if (!existsSync(dir)) mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Save with timestamp to ensure uniqueness
    cb(null, `SOS-AUDIO-${Date.now()}.webm`);
  }
});
const upload = multer({ storage: storage });

// --- ENDPOINT 1: HANDLE LOCATION DISPATCH ---
app.post('/api/sos/alert', (req, res) => {
  const { lat, lng, timestamp } = req.body;

  // SIMULATION: In a real app, this connects to CCTNS or Campus Security SMS Gateway
  console.log("!!! CRITICAL ALERT RECEIVED !!!");
  console.log(`📍 Location: https://maps.google.com/?q=${lat},${lng}`);
  console.log(`🕒 Time: ${timestamp}`);
  
  // Logic: Trigger WebSocket to Security Dashboard (from previous Tracking code)
  // io.emit('emergency_alert', { lat, lng });

  res.json({ status: "Security Dispatched", eta: "2 mins" });
});

// --- ENDPOINT 2: HANDLE SILENT WITNESS AUDIO ---
app.post('/api/sos/audio', upload.single('audio'), (req, res) => {
  if (req.file) {
    console.log(`🎙️ Silent Witness Audio Saved: ${req.file.path}`);
    console.log(`📁 Size: ${req.file.size} bytes`);
    res.json({ success: true, message: "Evidence Secured" });
  } else {
    res.status(400).json({ success: false });
  }
});

app.listen(5500, () => console.log("🚑 SOS Emergency Server Online on Port 5500"));