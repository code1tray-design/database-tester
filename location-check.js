// Geolocation Verification Logic for Chitkara University
// PASTE YOUR GOOGLE SCRIPT URL HERE (required for data logging)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJF7MqZ4dGgf078BuUiI-EnV29Dl05dAboDYbznbmsQnkAzXuD-1Bii5T1VA7aq6fU/exec";

// 📌 Campus Coordinates (Chanarthal Kalan, Fatehgarh Sahib)
const CAMPUS_LAT = 30.6333; 
const CAMPUS_LNG = 76.3833;
const ALLOWED_RADIUS_KM = 0.5; // 500 meters radius (flexible for indoor GPS drift)

// UI Elements
const statusIcon = document.getElementById('status-icon');
const statusTitle = document.getElementById('status-title');
const statusMsg = document.getElementById('status-msg');
const distanceInfo = document.getElementById('distance-info');
const retryBtn = document.getElementById('retry-btn');
const continueBtn = document.getElementById('continue-btn');

// 📏 Haversine Formula for distance calculation
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function verifyLocation() {
    // For static demo, simulate location verification
    console.log("Simulating location verification for demo...");
    statusTitle.textContent = "Verifying Location...";
    statusMsg.textContent = "Checking your location...";
    statusIcon.className = 'status-icon status-loading';
    retryBtn.style.display = 'none';
    continueBtn.style.display = 'none';

    // Simulate delay
    setTimeout(() => {
        // Always pass for demo
        showSuccess(0.1);
        logLocation(CAMPUS_LAT + 0.001, CAMPUS_LNG + 0.001, 0.1, "Verified (Demo)");
    }, 2000);
}

function showSuccess(distance) {
    console.log("Showing success UI");
    statusIcon.classList.remove('status-loading');
    statusIcon.classList.add('status-success-icon');
    statusIcon.innerHTML = '<i data-feather="check-circle" style="color:#27ae60"></i>';
    statusTitle.textContent = "Location Verified";
    statusMsg.textContent = "Welcome to the activity! Your presence in the classroom has been confirmed.";
    distanceInfo.textContent = `Distance: ${(distance * 1000).toFixed(0)} meters from center`;
    distanceInfo.style.display = 'inline-block';
    continueBtn.style.display = 'block';
    retryBtn.style.display = 'none';
    feather.replace();
}

function showError(title, msg) {
    console.log(`Showing error UI: ${title}`);
    statusIcon.classList.remove('status-loading');
    statusIcon.classList.add('status-error-icon');
    statusIcon.innerHTML = '<i data-feather="alert-triangle" style="color:#d12026"></i>';
    statusTitle.textContent = title;
    statusMsg.textContent = msg;
    retryBtn.style.display = 'block';
    continueBtn.style.display = 'none';
    distanceInfo.style.display = 'none';
    feather.replace();
}

function logLocation(lat, lng, dist, status) {
    const studentName = localStorage.getItem('studentName');
    const rollNumber = localStorage.getItem('rollNumber');

    if (!studentName || !rollNumber) return;

    const record = {
        type: "location_log",
        studentName,
        rollNumber,
        latitude: lat,
        longitude: lng,
        distanceKm: dist.toFixed(3),
        status: status,
        submittedAt: new Date().toISOString()
    };

    // Log essential location data to Google Sheets
    if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_SCRIPT")) {
        fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        }).catch(err => console.error("Location log failed:", err));
    }
}

retryBtn.addEventListener('click', verifyLocation);
continueBtn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
});

// Start verification on load
function initLocationCheck() {
    const studentName = localStorage.getItem('studentName');
    const rollNumber = localStorage.getItem('rollNumber');

    console.log(`Initializing location check for: ${studentName} (${rollNumber})`);

    // 🛡️ Admin Bypass: Always allow Admin to proceed
    if (rollNumber === 'ADMIN001' || studentName?.toLowerCase() === 'admin') {
        console.log("Admin bypass triggered.");
        showSuccess(0);
        statusMsg.textContent = "Admin bypass active. Redirecting to dashboard...";
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
        return;
    }

    // For static demo, always proceed
    console.log("Proceeding to verifyLocation()...");
    verifyLocation();
}

window.onload = initLocationCheck;