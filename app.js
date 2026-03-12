// Student Database (To be populated by the user)
const students = [
    { name: "John Doe", rollNumber: "123456" },
    { name: "Jane Smith", rollNumber: "654321" },
    // Add more student data here
];

const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('student-name').value.trim();
    const roll = document.getElementById('roll-number').value.trim();

    const student = students.find(s => s.name.toLowerCase() === name.toLowerCase() && s.rollNumber === roll);

    if (student) {
        // Successful login
        errorMessage.textContent = "";
        alert(`Welcome, ${student.name}! Redirecting to dashboard...`);
        // Redirect logic would go here, e.g., window.location.href = 'dashboard.html';
    } else {
        // Failed login
        errorMessage.textContent = "Invalid Name or Roll Number. Please try again.";
        // Clear inputs for better UX
        document.getElementById('student-name').value = '';
        document.getElementById('roll-number').value = '';
    }
});
