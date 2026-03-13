// Advanced Admin Portal Logic for Chitkara University
// PASTE YOUR GOOGLE SCRIPT URL HERE
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzUl8o30CcyINAzDpAZrggmkkron8oX2cvkj-j37Pror9wCtY1eK612N8L5L49xfjeZ/exec";
const ADMIN_PASSWORD = "1234"; 

// State
let currentTab = 'dashboard';
let loginData = [];
let resultData = [];
let gpsData = [];
let studentStats = {}; // { roll: { name, scores: [], avg, profit, logins: 0, verified: 0 } }
let isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
let charts = {};
let currentJsonData = null; // Store current API response

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
    if (!json || json.result !== 'success') {
        throw new Error(json ? (json.error || "Malformed API response") : "Empty response from server");
    }

    console.log(`[Data Integration] Processing records from Google Sheets`);

    // Initialize data containers
    loginData = json.logins || [];
    gpsData = json.locations || [];
    resultData = json.tests || [];

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
        currentJsonData = json; // Store for later use
        
        if (json.result !== 'success') {
            throw new Error(json.error || "API returned error status");
        }
        
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

    // 1. Process Logins (only if data exists)
    if (loginData && loginData.length > 0) {
        loginData.forEach((row) => {
            const roll = row.rollnumber || row['rollnumber'];
            const name = row.studentname || row['studentname'];
            if (roll) {
                const s = getStudent(roll, name);
                s.logins++;
            }
        });
    }

    // 2. Process GPS/Location (only if data exists)
    if (gpsData && gpsData.length > 0) {
        gpsData.forEach((row) => {
            const roll = row.rollnumber || row['rollnumber'];
            const name = row.studentname || row['studentname'];
            if (roll) {
                const s = getStudent(roll, name);
                const status = String(row.status || '').toLowerCase();
                if (status === 'verified') s.verified++;
            }
        });
    }

    // 3. Process Test Results (only if data exists)
    if (resultData && resultData.length > 0) {
        resultData.forEach((row) => {
            const roll = row.rollnumber || row['rollnumber'];
            const name = row.studentname || row['studentname'];
            if (roll) {
                const s = getStudent(roll, name);
                const testName = row.testname || row['testname'] || '';

                if (testName.toLowerCase().includes('simulator')) {
                    // For simulator, extract profit from final ranking
                    const ranking = row.finalranking || row['finalranking'] || '';
                    const profitMatch = ranking.match(/Profit:\s*₹?([\d,]+)/);
                    if (profitMatch) {
                        const profit = parseFloat(profitMatch[1].replace(/,/g, '')) || 0;
                        s.totalProfit += profit;
                    }
                } else {
                    // For other tests, use score
                    const score = parseFloat(row.score || 0);
                    if (!isNaN(score)) s.scores.push(score);
                }
                s.testCount++;
            }
        });
    }

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
    // Use summary from API if available, otherwise calculate
    const summary = currentJsonData?.summary || {};
    document.getElementById('stat-total-logins').textContent = summary.total_logins || loginData.length;
    document.getElementById('stat-active-students').textContent = summary.unique_students || Object.keys(studentStats).length;

    const verifiedGps = gpsData.filter(r => (r.status || r.Status) === 'Verified').length;
    document.getElementById('stat-gps-verified').textContent = verifiedGps;

    const allScores = resultData.map(r => parseFloat(r.score || 0)).filter(s => !isNaN(s));
    const avg = allScores.length > 0 ? (allScores.reduce((a,b)=>a+b, 0) / allScores.length) : 0;
    document.getElementById('stat-avg-score').textContent = Math.round(avg) + '%';

    // Enhanced statistics
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logins24h = loginData.filter(r => new Date(r.timestamp) > last24h).length;
    document.getElementById('stat-logins-24h').textContent = logins24h;

    const highestScore = allScores.length > 0 ? Math.max(...allScores) : 0;
    document.getElementById('stat-highest-score').textContent = Math.round(highestScore) + '%';

    const totalGps = gpsData.length;
    const gpsRate = totalGps > 0 ? Math.round((verifiedGps / totalGps) * 100) : 0;
    document.getElementById('stat-gps-rate').textContent = gpsRate + '%';

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeThisWeek = new Set(
        [...loginData, ...resultData, ...gpsData]
            .filter(r => new Date(r.timestamp) > weekAgo)
            .map(r => r.rollnumber)
    ).size;
    document.getElementById('stat-active-week').textContent = activeThisWeek;

    // Generate activity feed
    generateActivityFeed();

    // Show/hide welcome message based on data availability
    const welcomeMessage = document.getElementById('welcome-message');
    const hasData = (loginData && loginData.length > 0) || (resultData && resultData.length > 0) || (gpsData && gpsData.length > 0);
    welcomeMessage.style.display = hasData ? 'none' : 'block';

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

function generateActivityFeed() {
    const activityFeed = document.getElementById('activity-feed');
    const allActivities = [];

    // Collect all activities (only if data exists)
    if (loginData && loginData.length > 0) {
        loginData.forEach(item => {
            allActivities.push({
                type: 'login',
                timestamp: new Date(item.timestamp),
                student: item.studentname,
                roll: item.rollnumber,
                action: 'logged in successfully',
                icon: 'login'
            });
        });
    }

    if (gpsData && gpsData.length > 0) {
        gpsData.forEach(item => {
            allActivities.push({
                type: 'location',
                timestamp: new Date(item.timestamp),
                student: item.studentname,
                roll: item.rollnumber,
                action: `location ${item.status.toLowerCase()}`,
                icon: 'location'
            });
        });
    }

    if (resultData && resultData.length > 0) {
        resultData.forEach(item => {
            allActivities.push({
                type: 'test',
                timestamp: new Date(item.timestamp),
                student: item.studentname,
                roll: item.rollnumber,
                action: `completed ${item.testname}`,
                icon: 'test'
            });
        });
    }

    // If no activities, show empty state
    if (allActivities.length === 0) {
        activityFeed.innerHTML = '<div class="activity-item"><div class="activity-content"><div class="student">No activity yet</div><div class="action">Student data will appear here once they start using the portal</div></div></div>';
        return;
    }

    // Sort by timestamp (most recent first) and take latest 20
    allActivities.sort((a, b) => b.timestamp - a.timestamp);
    const recentActivities = allActivities.slice(0, 20);

    activityFeed.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.icon}">
                <i data-feather="${activity.icon === 'login' ? 'user' : activity.icon === 'test' ? 'check-circle' : 'map-pin'}" style="width: 16px; height: 16px;"></i>
            </div>
            <div class="activity-content">
                <div class="student">${activity.student}</div>
                <div class="action">${activity.action}</div>
            </div>
            <div class="activity-time">${activity.timestamp.toLocaleTimeString()}</div>
        </div>
    `).join('');

    // Re-initialize feather icons for the new content
    feather.replace();
}

function initCharts() {
    // 1. Performance Trend Chart
    const ctxPerf = document.getElementById('performanceChart').getContext('2d');
    if (charts.perf) charts.perf.destroy();

    // Group results by date
    const dateGroups = {};
    if (resultData && resultData.length > 0) {
        resultData.forEach(r => {
            const timestamp = r.timestamp;
            if (!timestamp) return;
            const date = new Date(timestamp).toLocaleDateString();
            if (!dateGroups[date]) dateGroups[date] = [];
            const score = parseFloat(r.score || 0);
            if (!isNaN(score)) dateGroups[date].push(score);
        });
    }

    const labels = Object.keys(dateGroups).sort();
    const data = labels.length > 0 ? labels.map(l => {
        const scores = dateGroups[l];
        return scores.length > 0 ? (scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
    }) : [0];

    const chartLabels = labels.length > 0 ? labels : ['No Data'];

    charts.perf = new Chart(ctxPerf, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Avg Daily Score %',
                data: data,
                borderColor: '#d12026',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(209, 32, 38, 0.1)'
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // 2. Test Distribution Chart
    const ctxDist = document.getElementById('testDistributionChart').getContext('2d');
    if (charts.dist) charts.dist.destroy();

    const testTypes = {};
    if (resultData && resultData.length > 0) {
        resultData.forEach(r => {
            const testName = r.testname || 'Unknown';
            testTypes[testName] = (testTypes[testName] || 0) + 1;
        });
    }

    const testLabels = Object.keys(testTypes).length > 0 ? Object.keys(testTypes) : ['No Tests'];
    const testData = Object.values(testTypes).length > 0 ? Object.values(testTypes) : [1];

    charts.dist = new Chart(ctxDist, {
        type: 'doughnut',
        data: {
            labels: testLabels,
            datasets: [{
                data: testData,
                backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // 3. Time Analytics Chart
    const ctxTime = document.getElementById('timeAnalyticsChart').getContext('2d');
    if (charts.time) charts.time.destroy();

    // Group by hour of day
    const hourGroups = {};
    if (resultData && resultData.length > 0) {
        resultData.forEach(r => {
            const timestamp = r.timestamp;
            if (!timestamp) return;
            const hour = new Date(timestamp).getHours();
            if (!hourGroups[hour]) hourGroups[hour] = [];
            const timeTaken = r.timetaken || '0m 0s';
            // Extract minutes from time string
            const minutes = parseFloat(timeTaken.split('m')[0]) || 0;
            hourGroups[hour].push(minutes);
        });
    }

    const hours = Array.from({length: 24}, (_, i) => i);
    const avgTimes = hours.map(hour => {
        const times = hourGroups[hour] || [];
        return times.length > 0 ? (times.reduce((a,b)=>a+b,0)/times.length) : 0;
    });

    charts.time = new Chart(ctxTime, {
        type: 'bar',
        data: {
            labels: hours.map(h => `${h}:00`),
            datasets: [{
                label: 'Avg Time (minutes)',
                data: avgTimes,
                backgroundColor: 'rgba(139, 92, 246, 0.6)',
                borderColor: '#8b5cf6',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: { legend: { display: false } }
        }
    });

    // 4. Participation Chart (Doughnut) - for analytics
    const ctxPart = document.getElementById('participationChart');
    if (ctxPart) {
        if (charts.part) charts.part.destroy();
        const mcqCount = resultData.filter(r => !r.testname?.toLowerCase().includes('simulator') && !r.testname?.toLowerCase().includes('case')).length;
        const simCount = resultData.filter(r => r.testname?.toLowerCase().includes('simulator')).length;
        const caseCount = resultData.filter(r => r.testname?.toLowerCase().includes('case')).length;

        charts.part = new Chart(ctxPart, {
            type: 'doughnut',
            data: {
                labels: ['MCQ Tests', 'Simulator', 'Case Study'],
                datasets: [{
                    data: [mcqCount, simCount, caseCount],
                    backgroundColor: ['#10b981', '#f59e0b', '#3b82f6']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // 5. GPS Chart - for analytics
    const ctxGps = document.getElementById('gpsChart');
    if (ctxGps) {
        if (charts.gps) charts.gps.destroy();
        const verified = gpsData.filter(r => (r.status || '').toLowerCase() === 'verified').length;
        const denied = gpsData.filter(r => (r.status || '').toLowerCase() !== 'verified').length;

        charts.gps = new Chart(ctxGps, {
            type: 'pie',
            data: {
                labels: ['Verified', 'Outside/Denied'],
                datasets: [{
                    data: [verified, denied],
                    backgroundColor: ['#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // 6. Engagement Timeline Chart
    const ctxEngage = document.getElementById('engagementChart');
    if (ctxEngage) {
        if (charts.engage) charts.engage.destroy();

        // Group activities by day for the last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toLocaleDateString());
        }

        const activityCounts = {};
        last7Days.forEach(day => activityCounts[day] = 0);

        [...loginData, ...resultData, ...gpsData].forEach(item => {
            const date = new Date(item.timestamp).toLocaleDateString();
            if (activityCounts.hasOwnProperty(date)) {
                activityCounts[date]++;
            }
        });

        charts.engage = new Chart(ctxEngage, {
            type: 'line',
            data: {
                labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
                datasets: [{
                    label: 'Daily Activities',
                    data: last7Days.map(day => activityCounts[day]),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
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
    const searchInput = document.getElementById('table-search');

    console.log(`Rendering table for tab: ${currentTab}`);

    let data = [];
    let headers = [];
    let sortableColumns = [];

    if (currentTab === 'logins') {
        title.textContent = "Student Login Details";
        headers = ['Timestamp', 'Student Name', 'Roll Number', 'Status'];
        sortableColumns = [0, 1, 2]; // Timestamp, Name, Roll
        data = loginData.map(row => ({
            timestamp: row.timestamp,
            studentName: row.studentname,
            rollNumber: row.rollnumber,
            status: row.statustext || 'Success'
        }));
    } else if (currentTab === 'gps') {
        title.textContent = "GPS Location Verification";
        headers = ['Timestamp', 'Student Name', 'Roll Number', 'Distance', 'Status'];
        sortableColumns = [0, 1, 2, 3]; // Timestamp, Name, Roll, Distance
        data = gpsData.map(row => ({
            timestamp: row.timestamp,
            studentName: row.studentname,
            rollNumber: row.rollnumber,
            distance: row.distancekm ? `${row.distancekm} km` : 'N/A',
            status: row.status || 'Unknown'
        }));
    } else if (currentTab === 'results') {
        title.textContent = "Test Results & Performance";
        headers = ['Timestamp', 'Student Name', 'Roll Number', 'Test Name', 'Score', 'Time Taken', 'Final Ranking'];
        sortableColumns = [0, 1, 2, 4, 5]; // Timestamp, Name, Roll, Score, Time
        data = resultData.map(row => ({
            timestamp: row.timestamp,
            studentName: row.studentname,
            rollNumber: row.rollnumber,
            testName: row.testname,
            score: row.score || 'N/A',
            timeTaken: row.timetaken || 'N/A',
            finalRanking: row.finalranking || 'N/A'
        }));
    }

    // Create table header with sorting
    head.innerHTML = `<tr>${headers.map((header, index) =>
        sortableColumns.includes(index)
            ? `<th class="sortable" data-column="${index}">${header} <i data-feather="chevron-down" class="sort-icon"></i></th>`
            : `<th>${header}</th>`
    ).join('')}</tr>`;

    // Add sorting functionality
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.column, data));
    });

    // Render table body
    renderTableBody(data, headers.length);

    // Add search functionality
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredData = data.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(searchTerm)
            )
        );
        renderTableBody(filteredData, headers.length);
    });
}

function sortTable(columnIndex, data) {
    const sortIcon = document.querySelector(`[data-column="${columnIndex}"] .sort-icon`);
    const isAscending = sortIcon.classList.contains('asc');

    // Reset all sort icons
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.classList.remove('asc', 'desc');
    });

    // Set current sort direction
    sortIcon.classList.add(isAscending ? 'desc' : 'asc');

    // Sort data
    data.sort((a, b) => {
        const aVal = Object.values(a)[columnIndex];
        const bVal = Object.values(b)[columnIndex];

        // Handle different data types
        if (columnIndex === 0) { // Timestamp
            return isAscending
                ? new Date(aVal) - new Date(bVal)
                : new Date(bVal) - new Date(aVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            return isAscending ? aVal - bVal : bVal - aVal;
        } else {
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            return isAscending
                ? aStr.localeCompare(bStr)
                : bStr.localeCompare(aStr);
        }
    });

    // Re-render table body
    renderTableBody(data, Object.keys(data[0] || {}).length);
}

function renderTableBody(data, colspan) {
    const body = document.getElementById('admin-table-body');

    if (!data || data.length === 0) {
        body.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;padding:40px;color:var(--text-muted)">No records found in this category.</td></tr>`;
        return;
    }

    body.innerHTML = data.map(row => {
        const cells = Object.values(row).map(value => {
            // Format timestamp
            if (value && value.includes && value.includes('T')) {
                return new Date(value).toLocaleString();
            }
            // Format status badges
            if (currentTab === 'logins' && typeof value === 'string' && value.toLowerCase().includes('success')) {
                return `<span class="score-badge score-high">${value}</span>`;
            }
            if (currentTab === 'gps' && typeof value === 'string' && value.toLowerCase().includes('verified')) {
                return `<span class="score-badge score-high">${value}</span>`;
            }
            if (currentTab === 'gps' && typeof value === 'string' && !value.toLowerCase().includes('verified')) {
                return `<span class="score-badge score-low">${value}</span>`;
            }
            return value;
        });

        return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
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
        // Force hide overlay in case CSS class is not applied correctly
        authOverlay.classList.add('hidden');
        authOverlay.style.display = 'none';
        mainContent.classList.remove('hidden');
        mainContent.style.display = 'grid';
        adminError.style.display = 'none';
        fetchData();
    } else {
        authOverlay.classList.remove('hidden');
        authOverlay.style.display = 'grid';
        mainContent.classList.add('hidden');
        mainContent.style.display = 'none';
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