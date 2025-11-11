// Simple Auth System - PASTI WORK
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingSession();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        // Simple validation - accept any email/password
        const user = {
            id: Date.now(),
            name: email.split('@')[0],
            email: email,
            joinedDate: new Date().toISOString()
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUser = user;
        
        this.showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }

    handleRegister() {
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!fullName || !email || !password || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        // Create user
        const user = {
            id: Date.now(),
            name: fullName,
            email: email,
            joinedDate: new Date().toISOString()
        };

        // Save to users list
        const users = JSON.parse(localStorage.getItem('users')) || [];
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        this.showMessage('Registration successful! Redirecting...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }

    checkExistingSession() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
            window.location.href = 'dashboard.html';
        }
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMsg = document.querySelector('.auth-message');
        if (existingMsg) existingMsg.remove();

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `auth-message auth-message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            padding: 12px;
            margin: 15px 0;
            border-radius: 8px;
            text-align: center;
            font-weight: 500;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
        `;

        // Insert message
        const form = document.querySelector('.auth-form');
        if (form) {
            form.insertBefore(messageEl, form.firstChild);
            
            // Remove message after 5 seconds
            setTimeout(() => {
                messageEl.remove();
            }, 5000);
        }
    }

    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// Initialize auth system
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});
