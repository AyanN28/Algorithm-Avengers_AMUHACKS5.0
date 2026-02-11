// components/EvidenceUpload.jsx
import React, { useState, useEffect } from 'react';
import { validateImageMetadata } from '../utils/metadataValidator';

const EvidenceUpload = ({ onVerificationSuccess }) => {
  const [status, setStatus] = useState("idle"); // idle, verifying, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  // 1. Get Live User Location on Mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => setErrorMessage("Please enable GPS permission to verify evidence.")
      );
    }
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!userLocation) {
      setErrorMessage("Waiting for your GPS location...");
      return;
    }

    setStatus("verifying");
    setErrorMessage("");

    try {
      // 2. Run the "Metadata Lock" Validation
      const result = await validateImageMetadata(file, userLocation.lat, userLocation.lng);
      
      setStatus("success");
      // Pass the valid file and extracted meta back to the main form
      onVerificationSuccess(file, result.meta);
      
    } catch (error) {
      setStatus("error");
      setErrorMessage(error); // e.g., "Location Mismatch"
    }
  };

  return (
    <div className="p-4 border rounded shadow-sm">
      <h3 className="font-bold mb-2">Visual Evidence (Metadata Locked)</h3>
      
      <input 
        type="file" 
        accept="image/jpeg, image/png" 
        onChange={handleFileChange}
        disabled={!userLocation}
      />
      
      {status === "verifying" && <p className="text-blue-500">Analyzing Metadata...</p>}
      
      {status === "success" && (
        <div className="text-green-600 mt-2">
          ✓ Verified: Photo matches your location and time.
        </div>
      )}
      
      {status === "error" && (
        <div className="text-red-600 mt-2 font-semibold">
          ⚠ Upload Rejected: {errorMessage}
        </div>
      )}
    </div>
  );
};

export default EvidenceUpload;