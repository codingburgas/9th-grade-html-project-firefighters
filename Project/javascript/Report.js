// Function to toggle dark mode
function toggleColorMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('colorMode', isDark ? 'dark' : 'light');
}

// Apply saved mode on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedMode = localStorage.getItem('colorMode');
    if (savedMode === 'dark') {
        document.body.classList.add('dark-mode');
    }
});

// Initialize map with 'mapid'
var map = L.map('mapid'); // Changed from 'map' to 'mapid'

// Add an OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variables to manage map features and report data
var currentCircle = null; // Holds the last drawn circle
var lastClickedLatLng = null; // Stores the coordinates of the last click for reporting
const MAX_RADIUS = 1000; // 1 kilometer in meters

// Get references to report elements
const reportButton = document.getElementById('reportButton');
const lastClickedLocationText = document.getElementById('lastClickedLocation');
const messageArea = document.getElementById('messageArea');

// Helper function to get HSL color for Leaflet circles
// Leaflet.js expects colors in hex or predefined names, not HSL directly.
// We'll use static hex values from the HSL variables for simplicity and compatibility.
// For dynamic HSL, you'd need a JS HSL to Hex converter.
const getCssVarHsl = (varName) => {
    const rootStyles = getComputedStyle(document.documentElement);
    const hslString = rootStyles.getPropertyValue(varName).trim();
    // Assuming hslString is "H, S%, L%"
    const parts = hslString.split(',').map(s => parseFloat(s.trim()));
    // This is a simplified direct conversion, for real dynamic HSL, a more robust function is needed.
    // For now, let's use fixed hex values matching the theme.
    if (varName === '--map-circle-color') return '#E74C3C'; // Red
    if (varName === '--map-accuracy-color') return '#3498DB'; // Blue
    return '#808080'; // Default gray if not found
};


// --- Geolocation Logic ---
// Attempts to get user's current location when the page loads
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            var accuracy = position.coords.accuracy; // Accuracy in meters

            // Set map view to user's location
            map.setView([lat, lng], 13); // Zoom level 13 is a good default

            // Optionally, add a marker for the current location and a circle for accuracy
            L.marker([lat, lng]).addTo(map)
                .bindPopup("You are here (approx. accuracy: " + accuracy.toFixed(0) + "m)").openPopup();

            L.circle([lat, lng], {
                color: getCssVarHsl('--map-accuracy-color'), // Use themed blue
                fillColor: getCssVarHsl('--map-accuracy-color'),
                fillOpacity: 0.1,
                radius: accuracy
            }).addTo(map);

            messageArea.innerHTML = `Current Location: Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)} (Accuracy: ${accuracy.toFixed(0)}m)`;
        },
        function(error) {
            console.error("Geolocation error:", error);
            let errorMessage = "Geolocation failed: ";
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += "User denied the request for Geolocation.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += "Location information is unavailable.";
                    break;
                case error.TIMEOUT:
                    errorMessage += "The request to get user location timed out.";
                    break;
                case error.UNKNOWN_ERROR:
                    errorMessage += "An unknown error occurred.";
                    break;
            }
            messageArea.innerHTML = `${errorMessage}<br>Defaulting to London.`;
            // Fallback to a default view (London)
            map.setView([51.505, -0.09], 13);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Geolocation options
    );
} else {
    // Geolocation is not supported by this browser
    messageArea.innerHTML = "Geolocation is not supported by your browser.<br>Defaulting to London.";
    map.setView([51.505, -0.09], 13); // Fallback to a default view (London)
}
// --- End Geolocation Logic ---

// --- Map Click Event ---
// Handles clicks on the map to draw the report circle
map.on('click', function(e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    lastClickedLatLng = { lat: lat, lng: lng }; // Store the clicked coordinates

    var radius = parseFloat(document.getElementById('radiusInput').value);

    if (isNaN(radius) || radius <= 0) {
        alert("Please enter a valid positive number for the radius.");
        return;
    }

    if (radius > MAX_RADIUS) {
        alert("Radius cannot be larger than " + MAX_RADIUS + " meters (1 km). Setting to " + MAX_RADIUS + " meters.");
        radius = MAX_RADIUS;
        document.getElementById('radiusInput').value = MAX_RADIUS;
    }

    // Remove the previous circle if it exists
    if (currentCircle !== null) {
        map.removeLayer(currentCircle);
    }

    lastClickedLocationText.innerHTML = `Selected Location: Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
    
    // Create and add the new red circle at the clicked location
    var newCircle = L.circle([lat, lng], {
        color: getCssVarHsl('--map-circle-color'), // Use themed red
        fillColor: getCssVarHsl('--map-circle-color'),
        fillOpacity: 0.5,
        radius: radius
    }).addTo(map);

    newCircle.bindPopup(`Circle Center: <br>${lat.toFixed(6)}, ${lng.toFixed(6)}<br>Radius: ${radius}m`).openPopup();

    currentCircle = newCircle; // Store the reference to this new circle

    // Enable the report button now that a location is selected
    reportButton.disabled = false;
});

// --- Report Button Logic ---
// Handles the submission of the report
reportButton.addEventListener('click', function() {
    if (lastClickedLatLng === null) {
        alert("Please click on the map to select a location before reporting.");
        return;
    }

    const eventType = document.getElementById('eventType').value;
    const description = document.getElementById('description').value.trim();
    const radius = parseFloat(document.getElementById('radiusInput').value); // Get the radius again for reporting
    const reportDateTime = new Date(); // Get the current date and time

    if (description === "") {
        alert("Please provide a brief description of the event.");
        return;
    }

    // In a real application, you would send this 'reportData' object to a server
    // via an API call (e.g., using fetch() or XMLHttpRequest).
    // For this example, we'll just log it to the console and show an alert.
    const reportData = {
        eventType: eventType,
        description: description,
        location: lastClickedLatLng,
        radius: radius,
        reportTime: reportDateTime.toLocaleString() // Formatted date and time
    };

    console.log("Report Data:", reportData);
    alert(
        `Report Submitted!\n\n` +
        `Event Type: ${reportData.eventType.charAt(0).toUpperCase() + reportData.eventType.slice(1)}\n` +
        `Description: ${reportData.description}\n` +
        `Location: Lat ${reportData.location.lat.toFixed(6)}, Lng ${reportData.location.lng.toFixed(6)}\n` +
        `Affected Radius: ${reportData.radius}m\n` +
        `Report Time: ${reportData.reportTime}`
    );

    // Reset the map and form after reporting
    if (currentCircle !== null) {
        map.removeLayer(currentCircle);
        currentCircle = null;
    }
    lastClickedLatLng = null; // Clear the stored location
    reportButton.disabled = true; // Disable button again
    lastClickedLocationText.innerHTML = "Click on the map to select the event location.";
    document.getElementById('description').value = ""; // Clear description
    document.getElementById('eventType').value = "earthquake"; // Reset event type to default
    document.getElementById('radiusInput').value = 10; // Reset radius to default
});