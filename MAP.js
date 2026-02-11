function captureAndSendLocation() {
    if (navigator.geolocation) {
        // This triggers the "Allow" popup
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Send the real location to your Flask app
            fetch('/report_complaint', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ lat: lat, lng: lng })
            })
            .then(response => {
                if (response.ok) {
                    // Update the iframe without refreshing the whole page
                    const mapFrame = document.getElementById('mapFrame');
                    mapFrame.src = `/get_map?lat=${lat}&lng=${lng}&v=${new Date().getTime()}`;
                    alert("Location added to Heatmap!");
                }
            });
        }, (error) => {
            alert("Location access denied. Please allow location to use this feature.");
        });
    }
}