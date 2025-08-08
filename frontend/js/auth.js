// auth.js - Handles login functionality

function showLoginForm(userType) {
    // Hide initial options and show login form
    document.getElementById('initial-options').classList.add('hidden');
    document.getElementById('login-form-container').classList.remove('hidden');
    
    // Update form title
    document.getElementById('form-title').textContent = `${userType} Login`;
    
    // Store user type for form submission
    const form = document.getElementById('login-form');
    form.dataset.userType = userType.toLowerCase();

    // Set up form submission handler if not already set
    if (!form.hasListener) {
        form.addEventListener('submit', handleLogin);
        form.hasListener = true;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userType = event.target.dataset.userType;
    const messageElement = document.getElementById('message');
    
    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                userType: userType.charAt(0).toUpperCase() + userType.slice(1)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store auth token
        localStorage.setItem('token', data.token);
        localStorage.setItem('userInfo', JSON.stringify(data.user));

        // Redirect based on user type
        switch (userType) {
            case 'admin':
                window.location.href = '/pages/admin/dashboard';
                break;
            case 'staff':
                window.location.href = '/pages/staff/dashboard';
                break;
            case 'student':
                window.location.href = '/pages/student/dashboard';
                break;
            default:
                throw new Error('Invalid user type');
        }

    } catch (error) {
        messageElement.textContent = error.message;
        messageElement.style.color = 'red';
    }
}
