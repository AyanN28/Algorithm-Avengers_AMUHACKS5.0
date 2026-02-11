import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// --- MIDDLEWARE ---
app.use(cors()); // Allow frontend to connect
app.use(express.json()); // Built-in replacement for body-parser

// --- MOCK DATABASE ---
// Stores complaints in memory (RAM) while the server is running
const complaintsDB = [
    { lat: 22.5726, lng: 88.3639, category: "Infrastructure", description: "Broken pipe near library" },
    { lat: 22.5730, lng: 88.3640, category: "Safety", description: "Streetlight flickering" }
];

// --- API 1: Receive Complaint ---
app.post('/report_complaint', (req, res) => {
    const { lat, lng, category, description } = req.body;
    
    // Validation
    if(!lat || !lng) {
        return res.status(400).json({ status: "error", message: "Missing GPS data" });
    }

    const newComplaint = {
        id: Date.now(),
        lat, 
        lng, 
        category, 
        description,
        timestamp: new Date().toISOString()
    };

    complaintsDB.push(newComplaint);
    console.log(`📝 New Complaint: ${category} at [${lat}, ${lng}]`);

    res.json({ status: "success", id: newComplaint.id });
});

// --- API 2: Serve the Heatmap ---
app.get('/map', (req, res) => {
    // Generate HTML with the map and inject current data
    const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>body { margin: 0; } #map { height: 100vh; width: 100%; }</style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            // Initialize Map
            var map = L.map('map').setView([22.5726, 88.3639], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Inject Data from Backend
            var complaints = ${JSON.stringify(complaintsDB)};

            // Loop through complaints and add markers
            complaints.forEach(function(c) {
                // Color logic: Red for Safety, Blue for others
                var color = (c.category && c.category.includes('Safety')) ? 'red' : 'blue';
                
                L.circleMarker([c.lat, c.lng], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.6,
                    radius: 12
                }).addTo(map)
                .bindPopup("<b>" + c.category + "</b><br>" + c.description);
            });
        </script>
    </body>
    </html>
    `;

    res.send(mapHTML);
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Campus-Care Backend running on http://localhost:${PORT}`);
});
