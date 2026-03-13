const STORAGE_KEY = "chitkara-university-student-logins";
// PASTE YOUR GOOGLE SCRIPT URL HERE
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxSc1O09OfhNkYU96lS2MwLv_9uueGkBGM-iq015LppNxFmhj8C0aVmIUN51_Ev0rjO/exec";

/**
 * STUDENT DATABASE (INLINE)
 * Add student names and roll numbers here for manual verification.
 */
const STUDENT_DATABASE = [
    { name: "j", roll: "1" },
    { name: "testuser", roll: "123" },
    { name: "John Smith", roll: "2024001" },
    { name: "jjjj", roll: "111111" },
    { name: "Jane Smith", roll: "2210995678" },
    { name: "Admin", roll: "ADMIN001" },
    { name: "test", roll: "TEST001" }
];

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    const nameInput = document.getElementById("student-name");
    const rollInput = document.getElementById("roll-number");
    const formStatus = document.getElementById("error-message");
    const submitButton = form ? form.querySelector("button[type='submit']") : null;

    if (!form || !nameInput || !rollInput || !formStatus || !submitButton) {
        console.error("Critical: Login form elements not found!");
        return;
    }

    function collapseSpaces(value) {
        return value.replace(/\s+/g, " ").trim();
    }

    function normalizeRollNumber(value) {
        return value.replace(/\s+/g, "").trim().toUpperCase();
    }

    function isValidName(value) {
        // Very permissive name check
        return value.trim().length >= 1;
    }

    function isValidRollNumber(value) {
        // Very permissive roll check
        return value.trim().length >= 1;
    }

    function setStatus(message, tone) {
        console.log(`Status set: [${tone}] ${message}`);
        formStatus.textContent = message;
        formStatus.className = "error"; 
        formStatus.style.color = tone === "success" ? "#27ae60" : "#d12026";
    }

    function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Unknown time";
        return new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
        }).format(date);
    }

    function readSavedLogins() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            return [];
        }
    }

    function saveLoginLocally(record) {
        const savedLogins = readSavedLogins();
        const nextLogins = [record, ...savedLogins].slice(0, 25);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLogins));
    }

    function verifyStudent(studentName, rollNumber) {
        const inputName = collapseSpaces(studentName).toLowerCase();
        const inputRoll = normalizeRollNumber(rollNumber);
        
        console.log(`Verifying: Name="${inputName}", Roll="${inputRoll}"`);
        
        const found = STUDENT_DATABASE.find(s => {
            const dbName = collapseSpaces(s.name).toLowerCase();
            const dbRoll = normalizeRollNumber(s.roll);
            const match = dbName === inputName && dbRoll === inputRoll;
            if (match) console.log(`Matched with: Name="${dbName}", Roll="${dbRoll}"`);
            return match;
        });

        return !!found;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const studentName = collapseSpaces(nameInput.value);
        const rollNumberInput = rollInput.value;

        console.log(`Form submitted: Name="${studentName}", Roll="${rollNumberInput}"`);

        if (!studentName || !rollNumberInput) {
            setStatus("Please enter both the student name and roll number.", "error");
            return;
        }

        const normalizedRoll = normalizeRollNumber(rollNumberInput);
        
        // Dummy Data Injection for Testing
        if (studentName.toLowerCase() === "test" && normalizedRoll === "TEST001") {
            console.log("Test mode triggered");
            injectDummyData();
            setStatus("Dummy data injected into Google Sheets!", "success");
            submitButton.disabled = false;
            submitButton.textContent = "Sign In";
            return;
        }

        if (!isValidRollNumber(normalizedRoll)) {
            console.log(`Invalid roll number: "${normalizedRoll}"`);
            setStatus("Please enter a valid roll number.", "error");
            rollInput.focus();
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Checking...";

        const isValid = verifyStudent(studentName, normalizedRoll);
        if (!isValid) {
            console.log("Verification failed: Student not in database");
            setStatus("Invalid student details. Please ensure you enter the correct name and roll number as registered.", "error");
            submitButton.disabled = false;
            submitButton.textContent = "Sign In";
            return;
        }

        console.log("Verification successful");
        const record = {
            type: "login",
            studentName,
            rollNumber: normalizedRoll,
            submittedAt: new Date().toISOString(),
            statusText: "Login successful"
        };

        submitButton.textContent = "Redirecting...";

        // Save locally and in session
        saveLoginLocally(record);
        localStorage.setItem('studentName', studentName);
        localStorage.setItem('rollNumber', normalizedRoll);

        // Save to Google Sheets (Fire and Forget)
        if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_SCRIPT")) {
            fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            }).catch(err => console.error("Cloud save failed:", err));
        }

        setStatus(`Welcome, ${studentName}!`, "success");
        setTimeout(() => { window.location.href = 'location-check.html'; }, 800);
    });

    async function injectDummyData() {
        const dummyRecords = [
            { type: "login", studentName: "Test Admin", rollNumber: "TEST001", statusText: "Login successful", selfie: "No Selfie" },
            { type: "location_log", studentName: "Test Admin", rollNumber: "TEST001", latitude: 30.5161, longitude: 76.6592, distanceKm: "0.005", status: "Verified" },
            { type: "test", studentName: "Test Admin", rollNumber: "TEST001", testName: "General Test", score: 85, total: 100, percentage: 85, answers: [] },
            { type: "test", studentName: "Test Admin", rollNumber: "TEST001", testName: "CaseStudy_Test1", score: 92, percentage: "Strategic Advisor", duration: "8m 45s", finance: 95, strategy: 90, esg: 85, risk: 98, answers: [] },
            { type: "test", studentName: "Test Admin", rollNumber: "TEST001", testName: "Startup Simulator", score: 620, profit: 2500000, duration: "12m 30s", marketShare: 15, esgScore: "8.2", reputation: "Excellent", investor: "Very High", percentage: "Unicorn Founder", answers: [] },
            
            { type: "login", studentName: "Alice Smith", rollNumber: "ALICE001", statusText: "Login successful", selfie: "No Selfie" },
            { type: "location_log", studentName: "Alice Smith", rollNumber: "ALICE001", latitude: 30.5165, longitude: 76.6595, distanceKm: "0.045", status: "Verified" },
            { type: "test", studentName: "Alice Smith", rollNumber: "ALICE001", testName: "CaseStudy_Test1", score: 78, percentage: "Corporate Analyst", duration: "11m 20s", finance: 70, strategy: 85, esg: 80, risk: 75, answers: [] }
        ];

        for (const record of dummyRecords) {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
        }
        console.log("Comprehensive dummy data injected.");
    }

    // Load last login if exists (Removed pre-filling for security/clarity)
});
