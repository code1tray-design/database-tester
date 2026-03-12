// Initialize Feather Icons
feather.replace();

// Check if user is logged in
const studentName = localStorage.getItem('studentName');
if (!studentName) {
    // If no student name found, redirect back to login
    window.location.href = 'index.html';
} else {
    // Update UI with student data
    document.getElementById('user-greeting').textContent = studentName;
    document.getElementById('profile-name').textContent = studentName;
    
    // Generate avatar URL
    const avatarImg = document.getElementById('avatar-img');
    if (avatarImg) {
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=d12026&color=fff`;
    }
}

// Logout logic
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('studentName');
        window.location.href = 'index.html';
    });
}

// Sidebar Navigation Active State Toggle
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', function() {
        if (!this.classList.contains('logout')) {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// Subject Card "Go to Course" button logic (Placeholder)
const courseButtons = document.querySelectorAll('.btn-secondary');
courseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const courseName = btn.parentElement.querySelector('h3').textContent;
        alert(`Navigating to ${courseName} course materials...`);
    });
});

// Start Test button logic
const testButtons = document.querySelectorAll('.start-test');
testButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const testName = btn.parentElement.querySelector('h3').textContent;
        if (confirm(`Are you ready to start the "${testName}"?`)) {
            // Store test name to show in test.html
            localStorage.setItem('activeTestName', testName);
            window.location.href = 'test.html';
        }
    });
});
