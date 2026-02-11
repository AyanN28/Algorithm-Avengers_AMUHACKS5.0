import express, { json } from 'express';
import { createServer } from 'http';
import { Server } from "socket.io";
import cors from 'cors';

const app = express();
app.use(cors());
app.use(json());

const server = createServer(app);

// Initialize Socket.io (The Real-Time Engine)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5500", // Allow the React frontend
    methods: ["GET", "POST"]
  }
});

// Mock Database (In production, this would be PostgreSQL)
let complaints = {
  "123": { id: "123", status: "Open", issue: "Broken Streetlight Zone A" }
};

// --- SOCKET CONNECTION HANDLER ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. Client joins a "room" specific to a complaint ID
  // This ensures they only get updates for the complaint they are viewing
  socket.on('track_complaint', (complaintId) => {
    socket.join(complaintId);
    console.log(`Socket ${socket.id} is tracking complaint ${complaintId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// --- ADMIN API TO UPDATE STATUS ---
// This simulates an Admin changing the status in their dashboard
app.put('/api/complaint/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // e.g., "In-Progress" or "Resolved"

  if (!complaints[id]) {
    return res.status(404).json({ error: "Complaint not found" });
  }

  // 2. Update Database
  complaints[id].status = status;

  // 3. REAL-TIME TRIGGER: Emit event to the specific room
  // This pushes the data immediately to the frontend
  io.to(id).emit('status_update', {
    complaintId: id,
    newStatus: status,
    timestamp: new Date().toISOString()
  });

  res.json({ message: "Status updated and notification sent", currentData: complaints[id] });
});

server.listen(3001, () => {
  console.log('REAL-TIME SERVER running on port 3001');
});