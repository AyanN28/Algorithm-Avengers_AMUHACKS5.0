function captureAndSendLocation() {
    
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            console.log(`Location captured: ${userLat}, ${userLng}`);

            
            fetch('/report_complaint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lat: userLat,
                    lng: userLng,
                    weight: 1 // You can increase this for "High Complaint" areas
                }),
            })
            .then(response => {
                if (response.ok) {
                    alert("Location successfully reported to the Heat Map!");
                    // Optional: Reload the iframe or page to show the new point
                    location.reload(); 
                } else {
                    alert("Server error. Could not save location.");
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Failed to connect to the server.");
            });
        },
        (error) => {
            // Handle cases where user denies permission or GPS is off
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    alert("Please allow location access to report a zone.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    alert("Location information is unavailable.");
                    break;
                case error.TIMEOUT:
                    alert("The request to get user location timed out.");
                    break;
            }
        }
    );
}