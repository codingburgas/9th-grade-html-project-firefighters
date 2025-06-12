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

//initialize map
var map = L.map('mapid');

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var currentCircle = null;
var lastClickedLatLng = null;
const MAX_RADIUS = 1000;

//references to report elements
const reportButton = document.getElementById('reportButton');
const lastClickedLocationText = document.getElementById('lastClickedLocation');
const messageArea = document.getElementById('messageArea');
const downloadReportsButton = document.getElementById('downloadReportsButton'); // New button reference

//function to get HSL color for Leaflet circles
const getCssVarHsl = (varName) => {
    const rootStyles = getComputedStyle(document.documentElement);
    const hslString = rootStyles.getPropertyValue(varName).trim();

    // The provided CSS variables are not directly HSL, but fixed hex values.
    // Ensure these match your CSS for consistency.
    if (varName === '--map-circle-color') return '#E74C3C'; // Red (example: assuming this maps to the CSS var for incident circles)
    if (varName === '--map-accuracy-color') return '#3498DB'; // Blue (example: assuming this maps to the CSS var for accuracy circles)
    return '#808080'; // Default gray if not found
};


//get user's current location when the page loads
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            var accuracy = position.coords.accuracy; //accuracy in meters

            //sets the map view to your current location
            map.setView([lat, lng], 13);

            //add a marker for the current location and a circle for accuracy
            L.marker([lat, lng]).addTo(map)
                .bindPopup("You are here (accuracy: " + accuracy.toFixed(0) + "m)").openPopup();

            L.circle([lat, lng], {
                color: getCssVarHsl('--map-accuracy-color'),
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
            //fallback to a default view (London)
            map.setView([51.505, -0.09], 13);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } //geolocation options
    );
} else {
    //geolocation is not supported by this browser
    messageArea.innerHTML = "Geolocation is not supported by your browser.<br>Defaulting to London.";
    map.setView([51.505, -0.09], 13);
}


//clicks on the map to draw the report circle
map.on('click', function(e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    lastClickedLatLng = { lat: lat, lng: lng }; //store coordinates

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

    //remove the previous circle
    if (currentCircle !== null) {
        map.removeLayer(currentCircle);
    }

    lastClickedLocationText.innerHTML = `Selected Location: Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;

    //create new circle at the clicked location
    var newCircle = L.circle([lat, lng], {
        color: getCssVarHsl('--map-circle-color'),
        fillColor: getCssVarHsl('--map-circle-color'),
        fillOpacity: 0.5,
        radius: radius
    }).addTo(map);

    newCircle.bindPopup(`Circle Center: <br>${lat.toFixed(6)}, ${lng.toFixed(6)}<br>Radius: ${radius}m`).openPopup();

    currentCircle = newCircle;

    //enable the report button if selected location
    reportButton.disabled = false;
});

// submission of the report
reportButton.addEventListener('click', function() {
    if (lastClickedLatLng === null) {
        alert("Please click on the map to select a location before reporting.");
        return;
    }

    const eventType = document.getElementById('eventType').value;
    const description = document.getElementById('description').value.trim();
    const radius = parseFloat(document.getElementById('radiusInput').value); //get radius again for reporting
    const reportDateTime = new Date(); //get the current date and time

    if (description === "") {
        alert("Please provide a brief description of the event.");
        return;
    }

    const reportData = {
        eventType: eventType,
        description: description,
        location: lastClickedLatLng,
        radius: radius,
        reportTime: reportDateTime.toLocaleString()
    };

    // Retrieve existing reports or initialize an empty array
    let reports = JSON.parse(localStorage.getItem('disasterReports')) || [];

    // Add the new report
    reports.push(reportData);

    // Save the updated reports array to localStorage
    localStorage.setItem('disasterReports', JSON.stringify(reports));

    console.log("Report Data:", reportData);
    alert(
        `Report Submitted!\n\n` +
        `Event Type: ${reportData.eventType.charAt(0).toUpperCase() + reportData.eventType.slice(1)}\n` +
        `Description: ${reportData.description}\n` +
        `Location: Lat ${reportData.location.lat.toFixed(6)}, Lng ${reportData.location.lng.toFixed(6)}\n` +
        `Affected Radius: ${reportData.radius}m\n` +
        `Report Time: ${reportData.reportTime}`
    );

    //reset the map and form after reporting
    if (currentCircle !== null) {
        map.removeLayer(currentCircle);
        currentCircle = null;
    }
    lastClickedLatLng = null;
    reportButton.disabled = true;
    lastClickedLocationText.innerHTML = "Click on the map to select the event location.";
    document.getElementById('description').value = "";
    document.getElementById('eventType').value = "earthquake";
    document.getElementById('radiusInput').value = 10;
});


// Function to download data as a JSON file
function downloadReportsAsJson() {
    // Retrieve all reports from localStorage
    const reports = JSON.parse(localStorage.getItem('disasterReports')) || [];

    if (reports.length === 0) {
        alert("No reports to download yet!");
        return;
    }

    // Convert the reports array to a nicely formatted JSON string
    const jsonString = JSON.stringify(reports, null, 2); // 'null, 2' for pretty-printing

    // Create a Blob containing the JSON data
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a temporary anchor element
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Set the download attribute with a filename
    a.href = url;
    a.download = 'disaster_reports.json'; // Name of the downloaded file

    // Programmatically click the anchor to trigger the download
    document.body.appendChild(a); // Append to body is good practice for cross-browser compatibility
    a.click();

    // Clean up: remove the anchor and revoke the object URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("Your disaster reports have been downloaded!");
}

// Add event listener for the new download button
if (downloadReportsButton) {
    downloadReportsButton.addEventListener('click', downloadReportsAsJson);
}