import React, { useState, useRef } from 'react';

const SOSButton = () => {
  const [status, setStatus] = useState("idle"); // idle, active, sent
  const [audioStatus, setAudioStatus] = useState("ready");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // --- FEATURE 3: MENTAL HEALTH ROUTING (India Context) ---
  const helpLines = [
    { name: "Tele MANAS (Govt of India)", number: "14416" },
    { name: "Vandrevala Foundation", number: "9999666555" },
    { name: "Kiran (Mental Health)", number: "1800-599-0019" },
    { name: "Campus Counselor", number: "+91-98765-43210" } // Mock
  ];

  // --- CORE FUNCTION: ACTIVATE SOS ---
  const handleSOS = async () => {
    setStatus("active");
    
    // 1. Get Location (One-Tap SOS)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendEmergencyAlert({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString()
          });
        },
        (error) => alert("GPS Error: " + error.message),
        { enableHighAccuracy: true } // Critical for safety
      );
    }

    // 2. Trigger Silent Witness (10s Audio)
    startSilentRecording();
  };

  const sendEmergencyAlert = async (locationData) => {
    try {
      await fetch('http://localhost:5500/api/sos/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData)
      });
      setStatus("sent");
    } catch (err) {
      console.error("Failed to send SOS signal", err);
    }
  };

  // --- FEATURE 2: SILENT WITNESS RECORDING ---
  const startSilentRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStatus("recording");
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = uploadAudioEvidence;
      
      mediaRecorderRef.current.start();

      // STOP AUTOMATICALLY AFTER 10 SECONDS (Per Page 11 of PDF)
      setTimeout(() => {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          stream.getTracks().forEach(track => track.stop()); // Turn off mic
          setAudioStatus("uploaded");
        }
      }, 10000); 

    } catch (err) {
      console.error("Mic permission denied", err);
    }
  };

  const uploadAudioEvidence = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'evidence.webm');
    formData.append('timestamp', new Date().toISOString());

    await fetch('http://localhost:5500/api/sos/audio', {
      method: 'POST',
      body: formData
    });
    console.log("Silent witness evidence uploaded.");
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-8 bg-gray-50 min-h-screen">
      
      {/* --- FEATURE 1: ONE-TAP SOS BUTTON --- */}
      <div className="relative group">
        <div className={`absolute inset-0 rounded-full blur opacity-75 animate-ping bg-red-600 ${status === 'active' ? 'block' : 'hidden'}`}></div>
        <button 
          onClick={handleSOS}
          className="relative w-48 h-48 rounded-full bg-red-600 text-white text-3xl font-bold shadow-2xl border-4 border-red-800 active:scale-95 transition-transform"
        >
          {status === "sent" ? "HELP SENT" : "SOS"}
        </button>
      </div>

      <div className="text-center text-gray-600">
        {status === "active" && <p>🚀 Dispatching Security...</p>}
        {audioStatus === "recording" && <p className="text-xs text-red-400">● Securely Recording Environment...</p>}
      </div>

      {/* --- FEATURE 3: MENTAL HEALTH ROUTING --- */}
      <div className="w-full max-w-md bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">💚 Mental Health Support</h3>
        <div className="grid grid-cols-1 gap-2">
          {helpLines.map((line, idx) => (
            <a 
              key={idx} 
              href={`tel:${line.number}`} 
              className="flex justify-between items-center p-3 bg-green-50 rounded hover:bg-green-100 transition"
            >
              <span className="font-medium text-green-900">{line.name}</span>
              <span className="text-green-700">📞 {line.number}</span>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
};

export default SOSButton;