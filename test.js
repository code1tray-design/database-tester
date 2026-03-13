// Initialize Feather Icons
feather.replace();

// PASTE YOUR GOOGLE SCRIPT URL HERE
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJF7MqZ4dGgf078BuUiI-EnV29Dl05dAboDYbznbmsQnkAzXuD-1Bii5T1VA7aq6fU/exec";

// Sample Question Database
const testQuestions = [
    {
        id: 1,
        question: "What is the primary goal of business ethics?",
        options: [
            "To maximize short-term profits",
            "To guide behavior in the business environment based on moral principles",
            "To avoid all legal requirements",
            "To ensure only the management is happy"
        ],
        answer: 1
    },
    {
        id: 2,
        question: "Which of the following is an example of corporate social responsibility?",
        options: [
            "Reducing the workforce to save costs",
            "Increasing product prices to maximize revenue",
            "Implementing sustainable environmental practices",
            "Ignoring local community needs"
        ],
        answer: 2
    },
    {
        id: 3,
        question: "What is a 'Whistleblower'?",
        options: [
            "A person who promotes the company's products",
            "An employee who reports unethical practices within the organization",
            "A manager who monitors employee performance",
            "A consultant hired for strategic planning"
        ],
        answer: 1
    },
    {
        id: 4,
        question: "Ethical behavior in business can lead to:",
        options: [
            "Decreased customer trust",
            "Lower employee morale",
            "Long-term sustainable growth and positive reputation",
            "Immediate legal action"
        ],
        answer: 2
    },
    {
        id: 5,
        question: "A conflict of interest occurs when:",
        options: [
            "An employee works overtime",
            "Personal interests interfere with professional duties",
            "Two departments have different goals",
            "A company competes with another"
        ],
        answer: 1
    }
];

// Test State Variables
let currentQuestionIndex = 0;
let userAnswers = new Array(testQuestions.length).fill(null);
let timeRemaining = 30 * 60; // 30 minutes in seconds

// DOM Elements
const questionContent = document.getElementById('question-content');
const optionsContainer = document.getElementById('options-container');
const currentNumSpan = document.getElementById('current-question-num');
const totalQuestionsSpan = document.getElementById('total-questions');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const paletteGrid = document.getElementById('palette-grid');
const timerDisplay = document.getElementById('timer-display');
const submitBtn = document.getElementById('submit-test');
const submitModal = document.getElementById('submit-modal');
const confirmSubmit = document.getElementById('confirm-submit');
const cancelSubmit = document.getElementById('cancel-submit');

// Initialize Test
function initTest() {
    // Load test name from localStorage
    const testName = localStorage.getItem('activeTestName') || "General Test";
    document.querySelector('.test-title h2').textContent = testName;
    
    totalQuestionsSpan.textContent = testQuestions.length;
    renderPalette();
    loadQuestion(0);
    startTimer();
}

// Load Question
function loadQuestion(index) {
    currentQuestionIndex = index;
    const q = testQuestions[index];
    
    // Update question text and number
    questionContent.textContent = q.question;
    currentNumSpan.textContent = index + 1;
    
    // Update options
    optionsContainer.innerHTML = '';
    q.options.forEach((option, i) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = `option-item ${userAnswers[index] === i ? 'selected' : ''}`;
        optionDiv.innerHTML = `
            <span class="option-letter">${String.fromCharCode(65 + i)}</span>
            <span class="option-text">${option}</span>
        `;
        optionDiv.addEventListener('click', () => selectOption(i));
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update buttons
    prevBtn.disabled = index === 0;
    nextBtn.textContent = index === testQuestions.length - 1 ? 'Finish' : 'Next';
    
    // Update palette
    updatePalette();
}

// Select Option
function selectOption(optionIndex) {
    userAnswers[currentQuestionIndex] = optionIndex;
    
    // Update option UI
    const options = document.querySelectorAll('.option-item');
    options.forEach((opt, i) => {
        if (i === optionIndex) opt.classList.add('selected');
        else opt.classList.remove('selected');
    });
    
    updatePalette();
}

// Render Palette
function renderPalette() {
    paletteGrid.innerHTML = '';
    testQuestions.forEach((_, i) => {
        const item = document.createElement('div');
        item.className = 'palette-item unanswered';
        item.textContent = i + 1;
        item.addEventListener('click', () => loadQuestion(i));
        paletteGrid.appendChild(item);
    });
}

// Update Palette Status
function updatePalette() {
    const items = paletteGrid.querySelectorAll('.palette-item');
    items.forEach((item, i) => {
        item.classList.remove('current', 'answered', 'unanswered');
        
        if (i === currentQuestionIndex) {
            item.classList.add('current');
        } else if (userAnswers[i] !== null) {
            item.classList.add('answered');
        } else {
            item.classList.add('unanswered');
        }
    });
}

// Timer Logic
function startTimer() {
    const interval = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeRemaining <= 300) { // Last 5 minutes warning
            timerDisplay.parentElement.classList.add('timer-warning');
        }
        
        if (timeRemaining <= 0) {
            clearInterval(interval);
            alert('Time is up! Submitting your test automatically.');
            submitTest();
        }
    }, 1000);
}

// Navigation Listeners
prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) loadQuestion(currentQuestionIndex - 1);
});

nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < testQuestions.length - 1) {
        loadQuestion(currentQuestionIndex + 1);
    } else {
        // Show submit modal
        submitModal.classList.add('active');
    }
});

// Modal Logic
submitBtn.addEventListener('click', () => {
    submitModal.classList.add('active');
});

cancelSubmit.addEventListener('click', () => {
    submitModal.classList.remove('active');
});

confirmSubmit.addEventListener('click', () => {
    submitTest();
});

// Submit Test Logic
function submitTest() {
    // Calculate Score
    let score = 0;
    userAnswers.forEach((ans, i) => {
        if (ans === testQuestions[i].answer) score++;
    });
    
    const percentage = (score / testQuestions.length) * 100;
    const testName = localStorage.getItem('activeTestName') || "General Test";
    const studentName = localStorage.getItem('studentName') || "Anonymous";
    const rollNumber = localStorage.getItem('rollNumber') || "N/A";

    const resultData = {
        type: "test",
        studentName,
        rollNumber,
        testName,
        score,
        total: testQuestions.length,
        percentage,
        submittedAt: new Date().toISOString()
        // Removed detailed answers for simplified logging
    };
    
    // Clear state
    localStorage.removeItem('testInProgress');
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving Results...";

    // Save to Google Sheets (FIRE AND FORGET)
    if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_SCRIPT")) {
        fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(resultData)
        });
    }

    // Immediate Alert and Redirect
    alert(`Test Submitted Successfully!\nYour Score: ${score}/${testQuestions.length} (${percentage}%)`);
    window.location.href = 'dashboard.html';
}

// Run Initializer
initTest();
