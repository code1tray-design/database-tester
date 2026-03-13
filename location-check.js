// Geolocation Verification Logic for Chitkara University
// PASTE YOUR GOOGLE SCRIPT URL HERE
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxSc1O09OfhNkYU96lS2MwLv_9uueGkBGM-iq015LppNxFmhj8C0aVmIUN51_Ev0rjO/exec";

// 📌 Campus Coordinates (Chitkara University, Rajpura)
const CAMPUS_LAT = 30.5161; 
const CAMPUS_LNG = 76.6592;
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
    if (!navigator.geolocation) {
        showError("Geolocation Not Supported", "Your browser doesn't support location tracking. Please use a modern mobile or laptop browser.");
        return;
    }

    console.log("Starting location verification...");
    statusTitle.textContent = "Verifying Location...";
    statusMsg.textContent = "Requesting coordinates from your device...";
    statusIcon.className = 'status-icon status-loading';
    retryBtn.style.display = 'none';
    continueBtn.style.display = 'none';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const studentLat = position.coords.latitude;
            const studentLng = position.coords.longitude;
            const distance = getDistance(studentLat, studentLng, CAMPUS_LAT, CAMPUS_LNG);

            console.log(`Student Location: ${studentLat}, ${studentLng}`);
            console.log(`Distance from Campus: ${distance.toFixed(3)} km`);

            if (distance <= ALLOWED_RADIUS_KM) {
                console.log("Distance check passed");
                showSuccess(distance);
                logLocation(studentLat, studentLng, distance, "Verified");
            } else {
                console.log("Distance check failed");
                showError("Outside Classroom", `You are ${(distance * 1000).toFixed(0)} meters away. Access is restricted to students inside the classroom.`);
                logLocation(studentLat, studentLng, distance, "Denied (Outside)");
            }
        },
        (error) => {
            console.error("GPS Error:", error);
            let errorMsg = "Please enable location permissions in your browser settings to continue.";
            if (error.code === 1) errorMsg = "Location access denied. Please enable it in browser settings.";
            else if (error.code === 2) errorMsg = "Location unavailable. Check your device GPS.";
            else if (error.code === 3) errorMsg = "Location request timed out. Please try again.";
            
            showError("GPS Access Error", errorMsg);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
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

async function logLocation(lat, lng, dist, status) {
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

    if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_SCRIPT")) {
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
        } catch (err) {
            console.error("Location log failed:", err);
        }
    }
}

retryBtn.addEventListener('click', verifyLocation);
continueBtn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
});

// Start verification on load
async function initLocationCheck() {
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

    // ⚙️ Settings Check: Allow if disabled in Google Sheets
    if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_SCRIPT")) {
        try {
            console.log("Checking remote settings...");
            const response = await fetch(`${GOOGLE_SCRIPT_URL}?type=settings`);
            const json = await response.json();
            console.log("Remote settings response:", json);
            if (json.result === 'success' && json.location_check_enabled === false) {
                console.log("Location check disabled by settings.");
                showSuccess(0); 
                statusMsg.textContent = "Location verification skipped (disabled by admin). Redirecting...";
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
                return;
            }
        } catch (err) {
            console.error("Failed to fetch settings, proceeding with check:", err);
        }
    }
    
    console.log("Proceeding to verifyLocation()...");
    verifyLocation();
}

window.onload = initLocationCheck;