// utils/metadataValidator.js
import EXIF from 'exif-js';

// Helper: Convert DMS (Degrees Minutes Seconds) to Decimal
const convertDMSToDD = (degrees, minutes, seconds, direction) => {
  let dd = degrees + minutes / 60 + seconds / (60 * 60);
  if (direction === "S" || direction === "W") {
    dd = dd * -1;
  }
  return dd;
};

// Main function to extract and validate image
export const validateImageMetadata = (file, userCurrentLat, userCurrentLng) => {
  return new Promise((resolve, reject) => {
    EXIF.getData(file, function() {
      // 1. Extract GPS Tags
      const latData = EXIF.getTag(this, "GPSLatitude");
      const latRef = EXIF.getTag(this, "GPSLatitudeRef");
      const lngData = EXIF.getTag(this, "GPSLongitude");
      const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
      
      // 2. Extract Timestamp
      const dateTimeOriginal = EXIF.getTag(this, "DateTimeOriginal"); // Format: "2026:02:11 12:00:00"

      if (!latData || !lngData || !dateTimeOriginal) {
        reject("Metadata Missing: Photo must have GPS and Timestamp. Please use a camera photo, not a screenshot.");
        return;
      }

      // 3. Convert to Decimal Coordinates
      const imgLat = convertDMSToDD(latData[0], latData[1], latData[2], latRef);
      const imgLng = convertDMSToDD(lngData[0], lngData[1], lngData[2], lngRef);

      // 4. Verification Logic (The "Lock")
      
      // A. Time Check (e.g., Photo must be less than 24 hours old)
      // Note: Parse EXIF date string manually or use moment.js in production
      const photoDate = new Date(dateTimeOriginal.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
      const timeDiffHours = (new Date() - photoDate) / 36e5;

      if (timeDiffHours > 24) {
        reject("Stale Evidence: Photo is older than 24 hours. Please upload a recent photo.");
        return;
      }

      // B. Location Check (Geofence Validation)
      // Simple Haversine formula to check distance between User and Photo
      const distance = getDistanceFromLatLonInKm(userCurrentLat, userCurrentLng, imgLat, imgLng);
      
      // Allow a 100-meter radius variance (GPS drift)
      if (distance > 0.1) { 
        reject(`Location Mismatch: Photo was taken ${distance.toFixed(2)}km away from your current location.`);
        return;
      }

      // If all checks pass
      resolve({
        verified: true,
        meta: {
          latitude: imgLat,
          longitude: imgLng,
          timestamp: dateTimeOriginal
        }
      });
    });
  });
};

// Standard Haversine Formula for distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}