// auth.js - Handles authentication and authorization for student pages

class Auth {
    constructor() {
        this.apiUrl = 'http://localhost:3001/api'; // Replace with your actual API URL
        this.init();
    }

    init() {
        // Check if user is logged in when page loads
        this.checkAuthStatus();
        
        // Add logout event listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.redirectToLogin();
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Token verification failed');
            }

            const data = await response.json();
            
            // Check if user is a student
            if (data.user.userType !== 'Student') {
                this.redirectToLogin();
                return;
            }

            // Update UI with user info
            this.updateUserInfo(data.user);
            
            // Hide loader
            document.getElementById('loader').style.display = 'none';

        } catch (error) {
            console.error('Auth check failed:', error);
            this.redirectToLogin();
        }
    }

    updateUserInfo(user) {
        const studentNameElement = document.getElementById('studentName');
        if (studentNameElement) {
            studentNameElement.textContent = user.name;
        }

        // Store user info in localStorage for other pages
        localStorage.setItem('userInfo', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            userType: user.userType
        }));
    }

    logout() {
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        
        // Redirect to login page
        this.redirectToLogin();
    }

    redirectToLogin() {
        window.location.href = '/login.html';
    }

    // Helper method to get auth token
    static getToken() {
        return localStorage.getItem('token');
    }

    // Helper method to get user info
    static getUserInfo() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    }
}

// Initialize authentication
const auth = new Auth();
