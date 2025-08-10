// auth.js - Enhanced login functionality with better UX

let currentUserType = null;

function showLoginForm(userType) {
    currentUserType = userType;
    
    // Hide initial options and show login form with animation
    const initialOptions = document.getElementById('initial-options');
    const loginContainer = document.getElementById('login-form-container');
    
    initialOptions.style.transform = 'translateX(-100%)';
    initialOptions.style.opacity = '0';
    
    setTimeout(() => {
        initialOptions.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        loginContainer.style.transform = 'translateX(0)';
        loginContainer.style.opacity = '1';
        
        // Focus on email input
        document.getElementById('email').focus();
    }, 300);
    
    // Update form title with appropriate icon
    const icons = {
        'Admin': '👨‍💼',
        'Staff': '👨‍🏫', 
        'Student': '🎓'
    };
    
    document.getElementById('form-title').innerHTML = `${icons[userType]} ${userType} Login`;
    
    // Store user type for form submission
    const form = document.getElementById('login-form');
    form.dataset.userType = userType;

    // Set up form submission handler if not already set
    if (!form.hasListener) {
        form.addEventListener('submit', handleLogin);
        form.hasListener = true;
    }
    
    // Clear any previous messages
    clearMessage();
}

function showMessage(message, type = 'error') {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.className = type;
    messageElement.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(clearMessage, 3000);
    }
}

function clearMessage() {
    const messageElement = document.getElementById('message');
    messageElement.textContent = '';
    messageElement.className = '';
    messageElement.style.display = 'none';
}

function setLoadingState(isLoading) {
    const submitBtn = document.querySelector('.submit-btn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Logging in...';
        emailInput.disabled = true;
        passwordInput.disabled = true;
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Login';
        emailInput.disabled = false;
        passwordInput.disabled = false;
    }
}

function validateForm(email, password) {
    const errors = [];
    
    if (!email) {
        errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!password) {
        errors.push('Password is required');
    } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    
    return errors;
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const userType = event.target.dataset.userType;
    
    // Validate form
    const errors = validateForm(email, password);
    if (errors.length > 0) {
        showMessage(errors.join('. '), 'error');
        return;
    }
    
    setLoadingState(true);
    clearMessage();
    
    try {
        const response = await fetch('/api/auth/login', {
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
            throw new Error(data.message || 'Login failed. Please check your credentials.');
        }

        // Store auth token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('userInfo', JSON.stringify(data.user));
        
        // Show success message
        showMessage('Login successful! Redirecting...', 'success');

        // Redirect based on user type after a short delay
        setTimeout(() => {
            switch (userType.toLowerCase()) {
                case 'admin':
                    window.location.href = '/admin/dashboard';
                    break;
                case 'staff':
                    window.location.href = '/staff/dashboard';
                    break;
                case 'student':
                    window.location.href = '/student/home';
                    break;
                default:
                    throw new Error('Invalid user type');
            }
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = error.message;
        
        // Handle specific error cases
        if (error.message.includes('fetch')) {
            errorMessage = 'Unable to connect to server. Please check your connection.';
        } else if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please try again.';
        }
        
        showMessage(errorMessage, 'error');
        
        // Shake animation for error
        const form = document.getElementById('login-form');
        form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            form.style.animation = '';
        }, 500);
        
    } finally {
        setLoadingState(false);
    }
}

// Add back button functionality
function addBackButton() {
    const loginContainer = document.getElementById('login-form-container');
    
    if (!document.getElementById('back-btn')) {
        const backBtn = document.createElement('button');
        backBtn.id = 'back-btn';
        backBtn.type = 'button';
        backBtn.innerHTML = '← Back';
        backBtn.className = 'back-btn';
        backBtn.onclick = showInitialOptions;
        
        const form = document.getElementById('login-form');
        form.insertBefore(backBtn, form.firstChild);
    }
}

function showInitialOptions() {
    const initialOptions = document.getElementById('initial-options');
    const loginContainer = document.getElementById('login-form-container');
    
    loginContainer.style.transform = 'translateX(100%)';
    loginContainer.style.opacity = '0';
    
    setTimeout(() => {
        loginContainer.classList.add('hidden');
        initialOptions.classList.remove('hidden');
        initialOptions.style.transform = 'translateX(0)';
        initialOptions.style.opacity = '1';
    }, 300);
    
    // Clear form
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    clearMessage();
}

// Auto-logout on token expiration
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
        // If user is already logged in, redirect to appropriate dashboard
        const user = JSON.parse(userInfo);
        switch (user.userType) {
            case 'Admin':
                window.location.href = '/admin/dashboard';
                break;
            case 'Staff':
                window.location.href = '/staff/dashboard';
                break;
            case 'Student':
                window.location.href = '/student/home';
                break;
        }
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    // Add enter key support for option buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                this.click();
            }
        });
    });
    
    // Add form validation on input
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    emailInput.addEventListener('input', function() {
        this.setCustomValidity('');
        if (this.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)) {
            this.setCustomValidity('Please enter a valid email address');
        }
    });
    
    passwordInput.addEventListener('input', function() {
        this.setCustomValidity('');
        if (this.value && this.value.length < 6) {
            this.setCustomValidity('Password must be at least 6 characters');
        }
    });
});

// Add CSS for animations and back button
const style = document.createElement('style');
style.textContent = `
    #login-form-container {
        transition: all 0.3s ease;
    }
    
    #initial-options {
        transition: all 0.3s ease;
    }
    
    .back-btn {
        background: none;
        border: 2px solid #667eea;
        color: #667eea;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 0.9rem;
        cursor: pointer;
        margin-bottom: 20px;
        transition: all 0.3s ease;
        align-self: flex-start;
    }
    
    .back-btn:hover {
        background: #667eea;
        color: white;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .loading {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff40;
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
