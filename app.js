const STORAGE_KEY = "chitkara-university-student-logins";

const form = document.getElementById("login-form");
const submitButton = document.getElementById("submitButton");
const nameInput = document.getElementById("studentName");
const rollInput = document.getElementById("rollNumber");
const formStatus = document.getElementById("formStatus");
const previewName = document.getElementById("previewName");
const previewRoll = document.getElementById("previewRoll");
const previewTime = document.getElementById("previewTime");
const previewStatus = document.getElementById("previewStatus");
const storageMode = document.getElementById("storageMode");

function collapseSpaces(value) {
    return value.replace(/\s+/g, " ").trim();
}

function normalizeRollNumber(value) {
    return value.replace(/\s+/g, "").trim().toUpperCase();
}

function isValidName(value) {
    return /^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/.test(value);
}

function isValidRollNumber(value) {
    return /^[A-Z0-9-]{4,20}$/.test(value);
}

function setStatus(message, tone) {
    formStatus.textContent = message;
    formStatus.className = "status";

    if (tone) {
        formStatus.classList.add(tone);
    }
}

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Unknown time";
    }

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

function updatePreview(record) {
    previewName.textContent = record.studentName;
    previewRoll.textContent = record.rollNumber;
    previewTime.textContent = formatDate(record.submittedAt);
    previewStatus.textContent = record.statusText;
    storageMode.textContent = record.storageMode;
}

function showSavedPreview() {
    const [latestRecord] = readSavedLogins();

    if (!latestRecord) {
        return;
    }

    updatePreview(latestRecord);
    nameInput.value = latestRecord.studentName;
    rollInput.value = latestRecord.rollNumber;
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const studentName = collapseSpaces(nameInput.value);
    const rollNumber = normalizeRollNumber(rollInput.value);

    if (!studentName || !rollNumber) {
        setStatus("Please enter both the student name and roll number.", "error");
        return;
    }

    if (!isValidName(studentName)) {
        setStatus("Please enter a valid student name using letters and spaces only.", "error");
        nameInput.focus();
        return;
    }

    if (!isValidRollNumber(rollNumber)) {
        setStatus("Please enter a valid roll number using letters, numbers, or hyphens.", "error");
        rollInput.focus();
        return;
    }

    const record = {
        studentName,
        rollNumber,
        submittedAt: new Date().toISOString(),
        storageMode: "Static mode",
        statusText: "Login captured successfully in this browser."
    };

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    saveLoginLocally(record);
    updatePreview(record);
    setStatus(`Welcome, ${studentName}. Your login has been saved in this static page.`, "success");

    submitButton.disabled = false;
    submitButton.textContent = "Access portal";
});

showSavedPreview();
