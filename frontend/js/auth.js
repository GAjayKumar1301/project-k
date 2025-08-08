// API Configuration - Using relative URLs since frontend is served from backend
const API_BASE_URL = '/api';

let currentUserType = '';

function showLoginForm(userType) {
    currentUserType = userType;
    const initialOptions = document.getElementById('initial-options');
    const loginFormContainer = document.getElementById('login-form-container');
    const formTitle = document.getElementById('form-title');

    initialOptions.classList.add('hidden');
    loginFormContainer.classList.remove('hidden');
    formTitle.textContent = `${userType} Login`;
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userType: currentUserType, email, password })
        });

        const data = await response.json();
        const messageElement = document.getElementById('message');

        messageElement.textContent = data.message;

        if (response.ok) {
            messageElement.className = 'success';
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userType', data.userType);
            
            if (data.userType === 'Student') {
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            }
        } else {
            messageElement.className = 'error';
        }
    } catch (error) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = 'Network error. Please try again.';
        messageElement.className = 'error';
    }
});
