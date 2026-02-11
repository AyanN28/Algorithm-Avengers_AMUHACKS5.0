import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Connect to the backend
const socket = io.connect("http://localhost:5500");

const StatusTracker = ({ complaintId }) => {
  const [status, setStatus] = useState("Open");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // 1. Tell server we want to track this specific ID
    socket.emit('track_complaint', complaintId);

    // 2. Listen for real-time updates
    socket.on('status_update', (data) => {
      console.log("Update received!", data);
      setStatus(data.newStatus);
      
      // Add to local audit log for display
      setLogs((prev) => [...prev, `Status changed to ${data.newStatus} at ${data.timestamp}`]);
    });

    // Cleanup on unmount
    return () => {
      socket.off('status_update');
    };
  }, [complaintId]);

  // UI Helper for the Progress Bar
  const getProgressWidth = () => {
    switch (status) {
      case 'Open': return '10%';
      case 'In-Progress': return '50%';
      case 'Resolved': return '100%';
      default: return '0%';
    }
  };

  const getStepColor = (stepName) => {
    const steps = ['Open', 'In-Progress', 'Resolved'];
    const currentIndex = steps.indexOf(status);
    const stepIndex = steps.indexOf(stepName);
    return stepIndex <= currentIndex ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500';
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold">Complaint Tracking: #{complaintId}</h2>
      
      {/* Progress Bar Visual */}
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between text-xs font-semibold tracking-wide uppercase">
          <span className={`px-2 py-1 rounded-full ${getStepColor('Open')}`}>Open</span>
          <span className={`px-2 py-1 rounded-full ${getStepColor('In-Progress')}`}>In-Progress</span>
          <span className={`px-2 py-1 rounded-full ${getStepColor('Resolved')}`}>Resolved</span>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div style={{ width: getProgressWidth(), transition: "width 0.5s ease-in-out" }} 
               className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500">
          </div>
        </div>
      </div>

      {/* Real-time Logs */}
      <div className="mt-4 p-4 bg-gray-50 rounded text-sm">
        <h4 className="font-bold text-gray-700">Live Updates:</h4>
        {logs.length === 0 ? (
          <p className="text-gray-400 italic">Waiting for updates...</p>
        ) : (
          <ul className="list-disc list-inside">
            {logs.map((log, index) => <li key={index}>{log}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StatusTracker;