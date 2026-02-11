// submitComplaint.js (React Component Logic)
import React, { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs'; // Common library for device IDs

const SubmitComplaint = () => {
  const [deviceID, setDeviceID] = useState('');

  // 1. Generate/Retrieve a Stable Device ID on Mount
  useEffect(() => {
    const getFingerprint = async () => {
      // We use a browser fingerprint as the "Device ID" mentioned in the slides
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setDeviceID(result.visitorId);
    };
    getFingerprint();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch('http://localhost:5500/api/complaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // The middleware hashes this. The server never stores this raw value.
          'x-device-fingerprint': deviceID 
        },
        body: JSON.stringify({
          category: formData.category, // e.g., "Infrastructure"
          description: formData.text,
          locationData: {
            lat: formData.gps.latitude,
            lng: formData.gps.longitude
          },
          // Page 10: Metadata-Locked Evidence
          imageMetadata: {
             timestamp: Date.now(),
             integrityCheck: "sha256-of-image-content" 
          }
        }),
      });

      const data = await response.json();
      alert(`Success! Complaint ID: ${data.complaintId}`);
    } catch (error) {
      console.error("Submission failed", error);
    }
  };

  return (
    <button onClick={() => handleSubmit({ category: 'Safety', text: 'Broken light', gps: { latitude: 0, longitude: 0 } })}>
      Submit Anonymous Report
    </button>
  );
};

export default SubmitComplaint;