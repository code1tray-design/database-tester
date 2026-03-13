const STORAGE_KEY = "chitkara-university-student-logins";
// PASTE YOUR GOOGLE SCRIPT URL HERE (required for data logging)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJF7MqZ4dGgf078BuUiI-EnV29Dl05dAboDYbznbmsQnkAzXuD-1Bii5T1VA7aq6fU/exec";

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
    { name: "test", roll: "TEST001" },
    { name: "demo", roll: "demo" },
    { name: "student", roll: "student" }
];

document.addEventListener("DOMContentLoaded", () => {
    console.log("Login script loaded successfully");

    const form = document.getElementById("login-form");
    const nameInput = document.getElementById("student-name");
    const rollInput = document.getElementById("roll-number");
    const formStatus = document.getElementById("error-message");
    const submitButton = form ? form.querySelector("button[type='submit']") : null;

    console.log("Form elements found:", { form: !!form, nameInput: !!nameInput, rollInput: !!rollInput, formStatus: !!formStatus, submitButton: !!submitButton });

    if (!form || !nameInput || !rollInput || !formStatus || !submitButton) {
        console.error("Critical: Login form elements not found!");
        alert("Page loading error. Please refresh the page.");
        return;
    }

    // Add loading state management
    function setLoading(isLoading) {
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? "Processing..." : "Sign In";
        if (isLoading) {
            submitButton.style.opacity = "0.7";
        } else {
            submitButton.style.opacity = "1";
        }
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
        console.log("Form submitted");

        const studentName = collapseSpaces(nameInput.value);
        const rollNumberInput = rollInput.value;

        console.log(`Form submitted: Name="${studentName}", Roll="${rollNumberInput}"`);

        if (!studentName || !rollNumberInput) {
            setStatus("Please enter both the student name and roll number.", "error");
            return;
        }

        const normalizedRoll = normalizeRollNumber(rollNumberInput);
        
        // Dummy Data Injection for Testing - removed for static hosting
        if (studentName.toLowerCase() === "test" && normalizedRoll === "TEST001") {
            console.log("Test mode triggered - dummy data injection removed");
            setStatus("Test login successful!", "success");
            setLoading(false);
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
            return;
        }

        if (!isValidRollNumber(normalizedRoll)) {
            console.log(`Invalid roll number: "${normalizedRoll}"`);
            setStatus("Please enter a valid roll number.", "error");
            rollInput.focus();
            return;
        }

        setLoading(true);

        const isValid = verifyStudent(studentName, normalizedRoll);
        if (!isValid) {
            console.log("Verification failed: Student not in database");
            setStatus("Invalid student details. Please ensure you enter the correct name and roll number as registered.", "error");
            setLoading(false);
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

        // Log to Google Sheets (essential data only)
        if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_SCRIPT")) {
            fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            }).catch(err => console.error("Login log failed:", err));
        }

        setStatus(`Welcome, ${studentName}!`, "success");
        setTimeout(() => { window.location.href = 'location-check.html'; }, 800);
    });

    // Add real-time validation
    nameInput.addEventListener('input', () => {
        const value = collapseSpaces(nameInput.value);
        if (value && !isValidName(value)) {
            nameInput.setCustomValidity("Please enter a valid name");
        } else {
            nameInput.setCustomValidity("");
        }
    });

    rollInput.addEventListener('input', () => {
        const value = rollInput.value;
        if (value && !isValidRollNumber(normalizeRollNumber(value))) {
            rollInput.setCustomValidity("Please enter a valid roll number");
        } else {
            rollInput.setCustomValidity("");
        }
    });

    // Load last login if exists (Removed pre-filling for security/clarity)
});
