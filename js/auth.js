// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        this.checkExistingSession();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form handler
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form handler
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!this.validateLogin(email, password)) {
            return;
        }

        // Simulate login process
        this.loginUser(email, password);
    }

    handleRegister(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!this.validateRegister(fullName, email, password, confirmPassword)) {
            return;
        }

        // Simulate registration process
        this.registerUser(fullName, email, password);
    }

    validateLogin(email, password) {
        if (!email || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return false;
        }

        if (!isValidEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return false;
        }

        return true;
    }

    validateRegister(fullName, email, password, confirmPassword) {
        if (!fullName || !email || !password || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error');
            return false;
        }

        if (!isValidEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return false;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters long', 'error');
            return false;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return false;
        }

        return true;
    }

    loginUser(email, password) {
        // Simulate API call
        setTimeout(() => {
            const user = {
                id: Date.now(),
                name: email.split('@')[0],
                email: email,
                joinedDate: new Date().toISOString()
            };

            storage.set('currentUser', user);
            this.currentUser = user;
            
            this.showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }, 1000);
    }

    registerUser(fullName, email, password) {
        // Simulate API call
        setTimeout(() => {
            const user = {
                id: Date.now(),
                name: fullName,
                email: email,
                joinedDate: new Date().toISOString()
            };

            // Save user to "database"
            const users = storage.get('users') || [];
            users.push(user);
            storage.set('users', users);
            storage.set('currentUser', user);
            
            this.currentUser = user;
            
            this.showMessage('Registration successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }, 1000);
    }

    checkExistingSession() {
        const user = storage.get('currentUser');
        if (user && window.location.pathname.includes('auth')) {
            window.location.href = 'dashboard.html';
        }
    }

    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `auth-message auth-message-${type}`;
        messageEl.textContent = message;

        // Add styles if not exists
        if (!document.querySelector('#auth-message-styles')) {
            const styles = document.createElement('style');
            styles.id = 'auth-message-styles';
            styles.textContent = `
                .auth-message {
                    padding: 12px;
                    margin: 15px 0;
                    border-radius: 8px;
                    text-align: center;
                    font-weight: 500;
                }
                .auth-message-success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .auth-message-error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
            `;
            document.head.appendChild(styles);
        }

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
        storage.remove('currentUser');
        this.currentUser = null;
        window.location.href = 'index.html';
    }
}

// Initialize auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});
