// server/controllers/complaintController.js
import { create } from 'exif-parser';
import { readFileSync, unlinkSync } from 'fs';

export function uploadEvidence(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // 1. Read the uploaded buffer
        const buffer = readFileSync(req.file.path);
        
        // 2. Parse EXIF
        const parser = create(buffer);
        const result = parser.parse();

        // 3. Server-Side "Lock" Check
        // If GPS is missing in the uploaded file, reject it immediately.
        if (!result.tags.GPSLatitude || !result.tags.GPSLongitude) {
            // Delete the invalid file to save space
            unlinkSync(req.file.path);
            return res.status(400).json({ 
                error: "Security Check Failed: Image lacks embedded GPS metadata." 
            });
        }

        // 4. Success - Proceed to store complaint
        // In a real app, you would also re-verify the timestamp/location against the request body here.
        
        res.json({
            status: "success",
            meta: {
                lat: result.tags.GPSLatitude,
                lng: result.tags.GPSLongitude,
                timestamp: result.tags.DateTimeOriginal
            }
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to process image metadata" });
    }
}