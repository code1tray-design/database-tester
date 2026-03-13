// Advanced Admin Portal Logic for Chitkara University
// PASTE YOUR GOOGLE SCRIPT URL HERE
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxSc1O09OfhNkYU96lS2MwLv_9uueGkBGM-iq015LppNxFmhj8C0aVmIUN51_Ev0rjO/exec";
const ADMIN_PASSWORD = "1234"; 

// State
let currentTab = 'dashboard';
let loginData = [];
let resultData = [];
let gpsData = [];
let studentStats = {}; // { roll: { name, scores: [], avg, profit, logins: 0, verified: 0 } }
let isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
let charts = {};

// DOM Elements
const authOverlay = document.getElementById('admin-auth-overlay');
const loginForm = document.getElementById('admin-login-form');
const adminPasswordInput = document.getElementById('admin-password');
const adminError = document.getElementById('admin-error');
const mainContent = document.getElementById('main-admin-content');
const logoutBtn = document.getElementById('admin-logout');

const pageTitle = document.getElementById('page-title');
const refreshBtn = document.getElementById('refresh-data');
const loadingOverlay = document.getElementById('loading-overlay');
const navItems = document.querySelectorAll('.nav-item');

const gpsToggle = document.getElementById('gps-toggle');
const gpsStatusText = document.getElementById('gps-status-text');

// Views
const views = {
    dashboard: document.getElementById('view-dashboard'),
    table: document.getElementById('view-table'),
    analytics: document.getElementById('view-analytics')
};

/**
 * Advanced Data Integration and Processing Module
 * Implements robust parsing to handle varying API response structures.
 */
function processRawData(json) {
    if (!json || json.result !== 'success' || !json.data) {
        throw new Error(json ? (json.error || "Malformed API response") : "Empty response from server");
    }

    const data = json.data;
    console.log(`[Data Integration] Processing ${Array.isArray(data) ? data.length + ' records' : 'categorized sheets'}`);

    // Initialize data containers
    loginData = [];
    gpsData = [];
    let mcqResults = [];
    let simulatorResults = [];
    let caseStudyResults = [];

    // Categorization logic - handles both Object (sheet-based) and Array (flat) formats
    if (Array.isArray(data)) {
        // Flat array format (fallback)
        data.forEach(item => {
            const sheet = String(item._sheet || "").toLowerCase();
            if (sheet === 'logins') loginData.push(item);
            else if (sheet === 'attendance_gps') gpsData.push(item);
            else if (sheet === 'mcqresults') mcqResults.push(item);
            else if (sheet === 'simulatorresults') simulatorResults.push(item);
            else if (sheet === 'casestudy_test1') caseStudyResults.push(item);
            else {
                // Heuristic detection if _sheet is missing
                if (item.selfie || item.statusText) loginData.push(item);
                else if (item.latitude || item.distanceKm) gpsData.push(item);
                else if (item.totalProfit || item.profit) simulatorResults.push(item);
                else if (item.finance || item.strategy) caseStudyResults.push(item);
                else if (item.testName) mcqResults.push(item);
            }
        });
    } else {
        // Object/Sheet format (preferred)
        loginData = data['Logins'] || data['logins'] || [];
        gpsData = data['Attendance_GPS'] || data['attendance_gps'] || [];
        mcqResults = data['MCQResults'] || data['mcqresults'] || [];
        simulatorResults = data['SimulatorResults'] || data['simulatorresults'] || [];
        caseStudyResults = data['CaseStudy_Test1'] || data['casestudy_test1'] || [];

        // Update GPS Toggle Status if settings are embedded
        if (data._settings) {
            gpsToggle.checked = data._settings.location_check_enabled;
            updateGpsToggleUI(gpsToggle.checked);
        }
    }

    resultData = [...mcqResults, ...simulatorResults, ...caseStudyResults];
    console.log(`[Data Integration] Mapping Complete: Logins=${loginData.length}, GPS=${gpsData.length}, Results=${resultData.length}`);
}

function updateGpsToggleUI(enabled) {
    gpsStatusText.textContent = enabled ? "Enabled" : "Disabled";
    gpsStatusText.style.color = enabled ? "var(--success)" : "var(--danger)";
}

async function fetchData() {
    if (!isAuthenticated) return;
    
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_SCRIPT")) {
        alert("Action Required: Configure GOOGLE_SCRIPT_URL in admin.js");
        return;
    }

    console.log("[Network] Synchronizing with Google Sheets Cloud...");
    loadingOverlay.style.display = 'grid';
    
    try {
        const cacheBuster = `&_cb=${Date.now()}`;
        const url = `${GOOGLE_SCRIPT_URL}?type=all${cacheBuster}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const json = await response.json();
        processRawData(json);

        processStudentStats();
        updateDashboardStats();
        renderActiveView();
        
        console.log("[Sync] Dashboard state updated successfully.");
    } catch (error) {
        console.error("[Critical Failure] Data Synchronization Interrupted:", error);
        alert(`Data Sync Error: ${error.message}. Ensure your Google Script is deployed correctly.`);
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * Process data for statistical analysis
 * Uses clean header keys (lowercase, no spaces) for robustness.
 */
function processStudentStats() {
    studentStats = {};

    console.log("Starting statistical processing...");

    // Helper to get or create student entry
    const getStudent = (roll, name) => {
        const cleanRoll = String(roll || 'unknown').trim().toUpperCase();
        if (!studentStats[cleanRoll]) {
            studentStats[cleanRoll] = { 
                name: name || 'Unknown Student', 
                scores: [], 
                totalProfit: 0, 
                logins: 0, 
                verified: 0, 
                testCount: 0 
            };
        }
        return studentStats[cleanRoll];
    };

    // 1. Process Logins
    loginData.forEach((row, idx) => {
        const roll = row.rollnumber || row['Roll Number'] || row.roll;
        const name = row.studentname || row['Student Name'] || row.name;
        if (roll) {
            const s = getStudent(roll, name);
            s.logins++;
        } else if (idx === 0) {
            console.warn("Login row missing roll number:", row);
        }
    });

    // 2. Process GPS
    gpsData.forEach((row, idx) => {
        const roll = row.rollnumber || row['Roll Number'] || row.roll;
        const name = row.studentname || row['Student Name'] || row.name;
        if (roll) {
            const s = getStudent(roll, name);
            const status = String(row.status || row.Status || '').toLowerCase();
            if (status === 'verified') s.verified++;
        }
    });

    // 3. Process Test Results
    resultData.forEach((row, idx) => {
        const roll = row.rollnumber || row['Roll Number'] || row.roll;
        const name = row.studentname || row['Student Name'] || row.name;
        if (roll) {
            const s = getStudent(roll, name);
            const isSimulator = row._sheet === 'SimulatorResults' || row.totalprofit !== undefined || row['Total Profit'] !== undefined;
            
            if (isSimulator) {
                const profitStr = String(row.totalprofit || row['Total Profit'] || 0);
                const profit = parseFloat(profitStr.replace(/[₹,]/g, '')) || 0;
                s.totalProfit += profit;
            } else {
                const scoreStr = String(row.percentage || row.Percentage || row.score || row.Score || 0);
                const score = parseFloat(scoreStr);
                if (!isNaN(score)) s.scores.push(score);
            }
            s.testCount++;
        }
    });

    // Calculate Averages and Ranking Score
    const statsArray = Object.values(studentStats);
    statsArray.forEach(s => {
        s.avgScore = s.scores.length > 0 ? (s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0;
        // Rank score: Average score + normalized profit bonus (1 pt per 100,000 profit)
        s.rankScore = s.avgScore + (s.totalProfit / 100000); 
    });

    console.log(`Processed stats for ${statsArray.length} students.`);
}

function updateDashboardStats() {
    document.getElementById('stat-total-logins').textContent = loginData.length;
    document.getElementById('stat-active-students').textContent = Object.keys(studentStats).length;
    
    const verifiedGps = gpsData.filter(r => (r.status || r.Status) === 'Verified').length;
    document.getElementById('stat-gps-verified').textContent = verifiedGps;

    const allScores = Object.values(studentStats).flatMap(s => s.scores);
    const avg = allScores.length > 0 ? (allScores.reduce((a,b)=>a+b, 0) / allScores.length) : 0;
    document.getElementById('stat-avg-score').textContent = Math.round(avg) + '%';

    // Sort for top performers
    const sorted = Object.values(studentStats).sort((a, b) => b.rankScore - a.rankScore);
    
    const topList = document.getElementById('top-performers-list');
    if (sorted.length === 0) {
        topList.innerHTML = '<li class="rank-item"><div class="student-meta">No data yet</div></li>';
    } else {
        topList.innerHTML = sorted.slice(0, 5).map((s, i) => `
            <li class="rank-item">
                <div class="student-meta">
                    <span class="rank-number">#${i+1}</span>
                    <div>
                        <div style="font-weight:700">${s.name}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted)">${s.testCount} tests completed</div>
                    </div>
                </div>
                <span class="score-badge score-high">${Math.round(s.rankScore)} pts</span>
            </li>
        `).join('');
    }

    const bottomList = document.getElementById('bottom-performers-list');
    if (sorted.length === 0) {
        bottomList.innerHTML = '<li class="rank-item"><div class="student-meta">No data yet</div></li>';
    } else {
        // Reverse for bottom performers
        const bottom = [...sorted].reverse();
        bottomList.innerHTML = bottom.slice(0, 5).map((s, i) => `
            <li class="rank-item">
                <div class="student-meta">
                    <span class="rank-number" style="color:var(--danger)">#${sorted.length - i}</span>
                    <div>
                        <div style="font-weight:700">${s.name}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted)">Avg: ${Math.round(s.avgScore)}%</div>
                    </div>
                </div>
                <span class="score-badge score-low">${Math.round(s.rankScore)} pts</span>
            </li>
        `).join('');
    }

    initCharts();
}

function initCharts() {
    // 1. Performance Trend Chart
    const ctxPerf = document.getElementById('performanceChart').getContext('2d');
    if (charts.perf) charts.perf.destroy();
    
    // Group results by date
    const dateGroups = {};
    resultData.forEach(r => {
        const timestamp = r.timestamp || r.Timestamp;
        if (!timestamp) return;
        const date = new Date(timestamp).toLocaleDateString();
        if (!dateGroups[date]) dateGroups[date] = [];
        const score = parseFloat(r.percentage || r.Percentage || 0);
        if (!isNaN(score)) dateGroups[date].push(score);
    });
    
    const labels = Object.keys(dateGroups).sort();
    const data = labels.map(l => {
        const scores = dateGroups[l];
        return scores.length > 0 ? (scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
    });

    charts.perf = new Chart(ctxPerf, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Avg Daily Score %',
                data,
                borderColor: '#d12026',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(209, 32, 38, 0.1)'
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // 2. Participation Chart (Doughnut)
    const ctxPart = document.getElementById('participationChart').getContext('2d');
    if (charts.part) charts.part.destroy();
    const mcqCount = resultData.filter(r => r._sheet === 'MCQResults').length;
    const simCount = resultData.filter(r => r._sheet === 'SimulatorResults').length;
    const caseCount = resultData.filter(r => r._sheet === 'CaseStudy_Test1').length;

    charts.part = new Chart(ctxPart, {
        type: 'doughnut',
        data: {
            labels: ['MCQ', 'Simulator', 'Case Study'],
            datasets: [{
                data: [mcqCount, simCount, caseCount],
                backgroundColor: ['#10b981', '#f59e0b', '#3b82f6']
            }]
        }
    });

    // 3. GPS Chart
    const ctxGps = document.getElementById('gpsChart').getContext('2d');
    if (charts.gps) charts.gps.destroy();
    const verified = gpsData.filter(r => (r.status || r.Status) === 'Verified').length;
    const denied = gpsData.filter(r => (r.status || r.Status) !== 'Verified').length;

    charts.gps = new Chart(ctxGps, {
        type: 'pie',
        data: {
            labels: ['Verified', 'Outside/Denied'],
            datasets: [{
                data: [verified, denied],
                backgroundColor: ['#10b981', '#ef4444']
            }]
        }
    });
}

function renderActiveView() {
    // Hide all views
    Object.values(views).forEach(v => v.classList.add('hidden'));
    
    if (currentTab === 'dashboard') {
        views.dashboard.classList.remove('hidden');
        pageTitle.textContent = "Dashboard Overview";
    } else if (currentTab === 'analytics') {
        views.analytics.classList.remove('hidden');
        pageTitle.textContent = "Detailed Analytics";
    } else {
        views.table.classList.remove('hidden');
        renderTable();
    }
}

function renderTable() {
    const head = document.getElementById('admin-table-head');
    const body = document.getElementById('admin-table-body');
    const title = document.getElementById('table-title');
    
    console.log(`Rendering table for tab: ${currentTab}`);
    
    let data = [];
    if (currentTab === 'logins') {
        title.textContent = "Recent Student Logins";
        head.innerHTML = `<tr><th>Timestamp</th><th>Student</th><th>Roll</th><th>Selfie</th><th>Status</th></tr>`;
        data = loginData;
    } else if (currentTab === 'gps') {
        title.textContent = "GPS Attendance Logs";
        head.innerHTML = `<tr><th>Timestamp</th><th>Student</th><th>Roll</th><th>Distance</th><th>Status</th></tr>`;
        data = gpsData;
    } else if (currentTab === 'results') {
        title.textContent = "Consolidated Test Results";
        head.innerHTML = `<tr><th>Timestamp</th><th>Student</th><th>Test Type</th><th>Score/Profit</th><th>Performance</th></tr>`;
        data = resultData;
    }

    if (!data || data.length === 0) {
        body.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No records found in this category.</td></tr>`;
        return;
    }

    body.innerHTML = data.map(row => {
        const timestampRaw = row.timestamp || row.Timestamp;
        const timestamp = timestampRaw ? new Date(timestampRaw).toLocaleString() : 'N/A';
        const studentName = row.studentname || row['Student Name'] || row.name || 'N/A';
        const rollNumber = row.rollnumber || row['Roll Number'] || row.roll || 'N/A';

        if (currentTab === 'logins') {
            const selfieData = row.selfie || row.Selfie;
            const selfie = selfieData && selfieData.length > 50 ? `<img src="${selfieData}" style="height:32px;border-radius:4px;cursor:pointer" onclick="window.open('${selfieData}')">` : 'None';
            const status = row.status || row.Status || 'Login';
            return `<tr><td>${timestamp}</td><td>${studentName}</td><td>${rollNumber}</td><td>${selfie}</td><td><span class="score-badge score-high">${status}</span></td></tr>`;
        } else if (currentTab === 'gps') {
            const distVal = row['distance(km)'] || row['Distance (km)'] || row.distance || 0;
            const distKm = parseFloat(distVal);
            const dist = (distKm * 1000).toFixed(0) + 'm';
            const status = row.status || row.Status || 'N/A';
            const statusClass = String(status).toLowerCase() === 'verified' ? 'score-high' : 'score-low';
            return `<tr><td>${timestamp}</td><td>${studentName}</td><td>${rollNumber}</td><td>${dist}</td><td><span class="score-badge ${statusClass}">${status}</span></td></tr>`;
        } else {
            const isSim = row._sheet === 'SimulatorResults' || row.totalprofit !== undefined || row['Total Profit'] !== undefined;
            const isCase = row._sheet === 'CaseStudy_Test1' || row.finance !== undefined;
            const type = isSim ? 'Simulator' : (isCase ? 'Case Study' : 'MCQ');
            
            let scoreText = '';
            if (isSim) {
                const profit = row.totalprofit || row['Total Profit'] || 0;
                scoreText = `<b>Simulator</b>: ₹${Number(profit).toLocaleString('en-IN')}`;
            } else {
                const score = row.score || row.Score || 0;
                scoreText = `<b>${type}</b>: ${score}`;
            }

            const perf = row.ranking || row.Ranking || row.percentage || row.Percentage || row.title || row.Title || 'N/A';
            return `<tr><td>${timestamp}</td><td>${studentName}</td><td>${rollNumber}</td><td>${scoreText}</td><td><span class="score-badge score-high">${perf}</span></td></tr>`;
        }
    }).join('');
}

// GPS Toggle Logic
gpsToggle.addEventListener('change', async () => {
    const isEnabled = gpsToggle.checked;
    updateGpsToggleUI(isEnabled);

    try {
        console.log(`[Settings] Updating GPS Geofencing: ${isEnabled}`);
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'update_settings', enabled: isEnabled })
        });
        console.log("[Settings] GPS update request dispatched.");
    } catch (err) {
        console.error("[Settings] Update failed:", err);
        alert("Failed to update remote settings. Check connection.");
    }
});

/**
 * Enterprise Health Check & Diagnostic Tool
 * Provides automated verification of system components.
 */
function runSystemDiagnostics() {
    console.group("System Health Check");
    const report = {
        auth: isAuthenticated ? "PASSED" : "FAILED",
        dom: !!mainContent ? "PASSED" : "FAILED",
        api_url: GOOGLE_SCRIPT_URL.includes("macros/s/") ? "PASSED" : "FAILED",
        charts_lib: typeof Chart !== 'undefined' ? "PASSED" : "FAILED",
        data_state: (loginData.length + gpsData.length + resultData.length) > 0 ? "HEALTHY" : "EMPTY"
    };
    console.table(report);
    console.groupEnd();
    return report;
}

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentTab = item.dataset.tab;
        
        // Audit log for navigation
        console.log(`[Navigation] Switched to view: ${currentTab}`);
        renderActiveView();
    });
});

// Search functionality
document.getElementById('table-search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#admin-table-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
});

// Authentication
function checkAuth() {
    if (isAuthenticated) {
        authOverlay.classList.add('hidden');
        mainContent.classList.remove('hidden');
        fetchData();
    } else {
        authOverlay.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
}

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (adminPasswordInput.value === ADMIN_PASSWORD) {
        isAuthenticated = true;
        sessionStorage.setItem('adminAuth', 'true');
        checkAuth();
    } else {
        adminError.style.display = 'block';
    }
});

logoutBtn.addEventListener('click', () => {
    isAuthenticated = false;
    sessionStorage.removeItem('adminAuth');
    checkAuth();
});

refreshBtn.addEventListener('click', fetchData);
checkAuth();
feather.replace();