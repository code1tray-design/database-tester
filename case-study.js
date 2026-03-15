// Viksit Bharat Corporate Intelligence Challenge - Logic Engine
// PASTE YOUR GOOGLE SCRIPT URL HERE
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbznNb3DwMQw8ieUJW1TIECGDkK7AJ6ZvbXJErUg_UYcMi2xytOJpWdVlGc7hxyasgvwBw/exec";

// State
let state = {
    studentName: localStorage.getItem('studentName') || "Student",
    rollNumber: localStorage.getItem('rollNumber') || "0000",
    currentQuestion: 0,
    startTime: Date.now(),
    answers: [],
    scores: {
        finance: 0,
        strategy: 0,
        esg: 0,
        risk: 0
    },
    randomizedData: {},
    timer: 0,
    timerInterval: null
};

// Randomized Case Data
function randomizeCase() {
    const baseRevenue = 200 + Math.floor(Math.random() * 50);
    const baseCost = 150 + Math.floor(Math.random() * 40);
    const baseDebt = 70 + Math.floor(Math.random() * 30);
    const baseProfit = baseRevenue - baseCost;
    
    state.randomizedData = {
        revenue: baseRevenue,
        cost: baseCost,
        profit: baseProfit,
        debt: baseDebt,
        cash: 20 + Math.floor(Math.random() * 20),
        ruralShare: 15 + Math.floor(Math.random() * 10),
        indShare: 8 + Math.floor(Math.random() * 5),
        microShare: 20 + Math.floor(Math.random() * 10),
        esgEnv: 8 + Math.floor(Math.random() * 2),
        esgSoc: 6 + Math.floor(Math.random() * 3),
        esgGov: 3 + Math.floor(Math.random() * 3),
        debtRatio: (baseDebt / baseProfit).toFixed(1)
    };

    // Update UI
    document.getElementById('val-revenue').textContent = `₹${state.randomizedData.revenue} Cr`;
    document.getElementById('val-cost').textContent = `₹${state.randomizedData.cost} Cr`;
    document.getElementById('val-profit').textContent = `₹${state.randomizedData.profit} Cr`;
    document.getElementById('val-debt').textContent = `₹${state.randomizedData.debt} Cr`;
    document.getElementById('val-cash').textContent = `₹${state.randomizedData.cash} Cr`;
    document.getElementById('val-share-rural').textContent = `${state.randomizedData.ruralShare}%`;
    document.getElementById('val-share-ind').textContent = `${state.randomizedData.indShare}%`;
    document.getElementById('val-share-micro').textContent = `${state.randomizedData.microShare}%`;
    
    renderESGChart();
}

function renderESGChart() {
    const ctx = document.getElementById('esgChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Environmental', 'Social', 'Governance'],
            datasets: [{
                label: 'Score (out of 10)',
                data: [state.randomizedData.esgEnv, state.randomizedData.esgSoc, state.randomizedData.esgGov],
                backgroundColor: ['#059669', '#2563eb', '#e11d48']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 10 } }
        }
    });
}

// Question Bank
const questions = [
    {
        id: 1,
        type: 'mcq',
        category: 'finance',
        text: "Which statement best describes Suryanet’s current financial position based on the data?",
        options: [
            "Profitability is strong but debt risk exists",
            "Revenue is declining year-over-year",
            "Company is currently loss-making",
            "Cash reserves exceed total revenue"
        ],
        correct: 0
    },
    {
        id: 2,
        type: 'mcq',
        category: 'strategy',
        text: "Looking at the market data, which segment should be the priority for expansion?",
        options: [
            "Industrial Solar (Low share, high potential)",
            "Rural Solar (Strong core, competitive)",
            "Microgrid Infrastructure (Market leader status)",
            "All segments simultaneously"
        ],
        correct: 2
    },
    {
        id: 3,
        type: 'ranking',
        category: 'finance',
        text: "Rank the following funding options from LOWEST cost (interest/dilution) to HIGHEST cost.",
        items: [
            "Development Bank Loan (6.5%)",
            "Corporate Bonds (8%)",
            "Equity Investment (15% Stake)"
        ],
        correctOrder: [0, 1, 2]
    },
    {
        id: 4,
        type: 'mcq',
        category: 'esg',
        text: "Which action would most effectively improve Suryanet’s Governance (G) score?",
        options: [
            "Increasing solar panel efficiency",
            "Appointing more independent directors to the board",
            "Expanding the workforce in Pune",
            "Increasing the marketing budget"
        ],
        correct: 1
    },
    {
        id: 5,
        type: 'mcq',
        category: 'risk',
        text: "If Suryanet enters 5 new states simultaneously, what risk increases most significantly?",
        options: [
            "Operational complexity and supply chain strain",
            "Carbon emissions from new offices",
            "Social responsibility score decline",
            "Market share loss in Pune"
        ],
        correct: 0
    },
    {
        id: 6,
        type: 'calculation',
        category: 'finance',
        text: "Calculate the Debt-to-Profit ratio (Debt / Net Profit). Which value is closest?",
        options: [], // Dynamic options
        correct: 0
    },
    {
        id: 7,
        type: 'rating',
        category: 'strategy',
        text: "Rate Suryanet's expansion plan (1-5) and justify your rating based on the funding structure.",
        options: ["1 - Very Poor", "2 - Poor", "3 - Neutral", "4 - Good", "5 - Excellent"],
        correct: 3 // Any rating above 3 is considered "strategic"
    },
    {
        id: 8,
        type: 'written',
        category: 'strategy',
        text: "As a corporate consultant, recommend a strategy for Suryanet to scale sustainably while maintaining financial stability (60 words max).",
        placeholder: "Enter your recommendation here..."
    },
    {
        id: 9,
        type: 'mcq',
        category: 'risk',
        text: "Which factor represents the biggest long-term risk to Suryanet's business model?",
        options: [
            "Governance weaknesses leading to investor withdrawal",
            "Strong environmental scores attracting ESG funds",
            "Growing solar demand in India",
            "Rural electrification programs by the government"
        ],
        correct: 0
    }
];

// UI Engine
function renderQuestion() {
    const q = questions[state.currentQuestion];
    const wrapper = document.getElementById('questions-wrapper');
    const nextBtn = document.getElementById('next-btn');
    nextBtn.disabled = true;

    // Update Progress
    document.getElementById('progress-text').textContent = `Question ${state.currentQuestion + 1} of ${questions.length}`;
    document.getElementById('current-progress').style.width = `${((state.currentQuestion + 1) / questions.length) * 100}%`;

    let html = `
        <div class="question-card active">
            <div class="question-type">${q.category.toUpperCase()} ANALYSIS</div>
            <div class="question-text">${q.text}</div>
            <div class="options-container">
    `;

    if (q.type === 'mcq') {
        html += `<div class="options-list">
            ${q.options.map((opt, i) => `
                <div class="option-item" onclick="selectOption(${i})">
                    <span class="option-bullet">${String.fromCharCode(65 + i)}</span>
                    ${opt}
                </div>
            `).join('')}
        </div>`;
    } else if (q.type === 'calculation') {
        // Generate dynamic options for calculation
        const correctRatio = parseFloat(state.randomizedData.debtRatio);
        const options = [
            correctRatio.toFixed(1),
            (correctRatio + 0.5).toFixed(1),
            (correctRatio - 0.4).toFixed(1),
            (correctRatio * 1.5).toFixed(1)
        ].sort(() => Math.random() - 0.5);
        
        q.options = options;
        q.correctValue = correctRatio.toFixed(1);

        html += `<div class="options-list">
            ${options.map((opt, i) => `
                <div class="option-item" onclick="selectOption(${i})">
                    <span class="option-bullet">${String.fromCharCode(65 + i)}</span>
                    ${opt}
                </div>
            `).join('')}
        </div>`;
    } else if (q.type === 'ranking') {
        html += `<div class="ranking-list" id="ranking-list">
            ${q.items.map((item, i) => `
                <div class="ranking-item" draggable="true" ondragstart="handleDragStart(event)" ondragover="handleDragOver(event)" ondrop="handleDrop(event)" data-index="${i}">
                    <i data-feather="menu"></i>
                    ${item}
                </div>
            `).join('')}
        </div>`;
        nextBtn.disabled = false; // Ranking can be submitted as is
    } else if (q.type === 'rating') {
        html += `<div class="options-list">
            ${q.options.map((opt, i) => `
                <div class="option-item" onclick="selectOption(${i})">
                    <span class="option-bullet">${i + 1}</span>
                    ${opt}
                </div>
            `).join('')}
        </div>`;
    } else if (q.type === 'written') {
        html += `
            <textarea class="written-box" id="written-answer" placeholder="${q.placeholder}" oninput="checkWritten()"></textarea>
            <div id="word-count" style="font-size: 0.8rem; margin-top: 8px; color: var(--text-main)">0 / 60 words</div>
        `;
    }

    html += `</div></div>`;
    wrapper.innerHTML = html;
    feather.replace();
    
    startTimer();
    updateConfidenceMeters();
}

function selectOption(index) {
    const items = document.querySelectorAll('.option-item');
    items.forEach(item => item.classList.remove('selected'));
    items[index].classList.add('selected');
    state.answers[state.currentQuestion] = index;
    document.getElementById('next-btn').disabled = false;
}

function checkWritten() {
    const text = document.getElementById('written-answer').value;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    document.getElementById('word-count').textContent = `${words.length} / 60 words`;
    state.answers[state.currentQuestion] = text;
    document.getElementById('next-btn').disabled = words.length < 5;
}

// Drag and Drop for Ranking
let dragSrcEl = null;
function handleDragStart(e) {
    dragSrcEl = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}
function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    return false;
}
function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (dragSrcEl !== e.currentTarget) {
        dragSrcEl.innerHTML = e.currentTarget.innerHTML;
        e.currentTarget.innerHTML = e.dataTransfer.getData('text/html');
        // Update state with new order
        const items = Array.from(document.querySelectorAll('.ranking-item')).map(el => parseInt(el.dataset.index));
        state.answers[state.currentQuestion] = items;
    }
    return false;
}

function startTimer() {
    clearInterval(state.timerInterval);
    state.timer = 0;
    state.timerInterval = setInterval(() => {
        state.timer++;
        const mins = Math.floor(state.timer / 60);
        const secs = state.timer % 60;
        document.getElementById('question-timer').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

function updateConfidenceMeters() {
    const categories = ['finance', 'strategy', 'esg', 'risk'];
    categories.forEach(cat => {
        const completed = questions.slice(0, state.currentQuestion).filter(q => q.category === cat).length;
        const total = questions.filter(q => q.category === cat).length;
        const perc = total ? (completed / total) * 100 : 0;
        document.getElementById(`fill-${cat}`).style.width = `${perc}%`;
    });
}

// Breaking News Engine
const newsItems = [
    "Govt announces 20% subsidy for microgrid projects.",
    "Major competitor enters rural solar market in Pune.",
    "RBI increases repo rate by 0.25%, affecting debt costs.",
    "Supreme Court mandates 30% independent board representation.",
    "Monsoon forecast predicts surplus rainfall in Maharashtra."
];

function triggerNews() {
    const newsText = document.getElementById('news-text');
    const randomNews = newsItems[Math.floor(Math.random() * newsItems.length)];
    newsText.textContent = randomNews;
    newsText.style.color = "#e11d48";
    setTimeout(() => { newsText.style.color = "#4338ca"; }, 2000);
}

// Scoring Logic
function calculateFinalScore() {
    let totalScore = 0;
    state.answers.forEach((ans, i) => {
        const q = questions[i];
        let correct = false;

        if (q.type === 'mcq') {
            correct = (ans === q.correct);
        } else if (q.type === 'calculation') {
            correct = (q.options[ans] === q.correctValue);
        } else if (q.type === 'ranking') {
            // Check if current order matches correct order
            const currentOrder = ans || [0, 1, 2];
            correct = JSON.stringify(currentOrder) === JSON.stringify(q.correctOrder);
        } else if (q.type === 'rating') {
            correct = (ans >= q.correct);
        } else if (q.type === 'written') {
            correct = ans.length > 20; // Basic check
        }

        if (correct) {
            totalScore += 11; // Approx 100 total
            state.scores[q.category] += 25; // Out of 100 per category
        }
    });

    return Math.min(100, totalScore);
}

async function finishQuiz() {
    const finalScore = calculateFinalScore();
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('results-screen').style.display = 'block';
    document.getElementById('final-score-display').textContent = `Score: ${finalScore}/100`;

    let title = "Junior Consultant";
    if (finalScore >= 90) title = "Strategic Advisor";
    else if (finalScore >= 75) title = "Corporate Analyst";
    else if (finalScore < 60) title = "Needs Improvement";
    
    document.getElementById('final-title').textContent = title;

    renderRadarChart();
    await saveToCloud(finalScore, title);
}

function renderRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Finance', 'Strategy', 'ESG', 'Risk'],
            datasets: [{
                label: 'Analyst Profile',
                data: [state.scores.finance, state.scores.strategy, state.scores.esg, state.scores.risk],
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: '#2563eb',
                pointBackgroundColor: '#2563eb'
            }]
        },
        options: {
            scales: { r: { beginAtZero: true, max: 100 } }
        }
    });
}

async function saveToCloud(score, title) {
    const duration = Math.floor((Date.now() - state.startTime) / 1000);
    const m = Math.floor(duration / 60);
    const s = duration % 60;

    const data = {
        type: "test",
        testName: "CaseStudy_Test1",
        studentName: state.studentName,
        rollNumber: state.rollNumber,
        score: score,
        total: 100,
        percentage: title,
        duration: `${m}m ${s}s`
        // Removed detailed scores and answers for simplified logging
    };

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (e) {
        console.error("Cloud Save Error:", e);
    }
}

// Init
document.getElementById('next-btn').addEventListener('click', () => {
    state.currentQuestion++;
    if (state.currentQuestion < questions.length) {
        renderQuestion();
        if (state.currentQuestion % 3 === 0) triggerNews();
    } else {
        finishQuiz();
    }
});

window.onload = () => {
    // Pre-fill if already logged in
    const savedName = localStorage.getItem('studentName');
    const savedRoll = localStorage.getItem('rollNumber');
    
    if (savedName) document.getElementById('case-student-name').value = savedName;
    if (savedRoll) document.getElementById('case-roll-number').value = savedRoll;

    // Handle Registration
    document.getElementById('case-registration-form').onsubmit = (e) => {
        e.preventDefault();
        
        const name = document.getElementById('case-student-name').value.trim();
        const roll = document.getElementById('case-roll-number').value.trim();
        
        localStorage.setItem('studentName', name);
        localStorage.setItem('rollNumber', roll);
        state.studentName = name;
        state.rollNumber = roll;
        
        // Hide overlay and start
        document.getElementById('registration-overlay').style.display = 'none';
        state.startTime = Date.now();
        randomizeCase();
        renderQuestion();
        setInterval(triggerNews, 15000);
    };
};