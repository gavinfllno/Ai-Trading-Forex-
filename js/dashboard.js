// Dashboard Functionality - SIMPLE VERSION
class Dashboard {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.init();
    }

    init() {
        if (!this.checkAuth()) return;
        this.loadBasicStats();
        this.setupEventListeners();
    }

    checkAuth() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return false;
        }
        
        // Update welcome message
        const welcomeEl = document.getElementById('userWelcome');
        if (welcomeEl) {
            welcomeEl.textContent = `Welcome, ${this.currentUser.name || this.currentUser.email.split('@')[0]}`;
        }
        return true;
    }

    loadBasicStats() {
        // Simple stats calculation
        const trades = JSON.parse(localStorage.getItem('trades')) || [];
        const userTrades = trades.filter(t => t.userId === this.currentUser?.id);
        
        const totalTrades = userTrades.length;
        const totalProfit = userTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
        const winRate = totalTrades > 0 ? 
            (userTrades.filter(t => (t.profitLoss || 0) > 0).length / totalTrades * 100).toFixed(1) : 0;

        // Update UI elements
        this.updateElement('totalTrades', totalTrades);
        this.updateElement('totalProfit', `$${Math.abs(totalProfit).toFixed(2)}`);
        this.updateElement('winRate', `${winRate}%`);
        this.updateElement('activeSignals', 
            (JSON.parse(localStorage.getItem('signals')) || []).length
        );
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        }

        // Quick Actions
        const actionBtns = document.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.target.textContent.trim();
                this.handleQuickAction(text);
            });
        });

        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href');
                if (target) window.location.href = target;
            });
        });
    }

    handleQuickAction(action) {
        switch(action) {
            case '➕ Add Trade':
                window.location.href = 'journal.html';
                break;
            case '🤖 View Signals':
                window.location.href = 'signals.html';
                break;
            case '🔄 Run Backtest':
                window.location.href = 'backtest.html';
                break;
            case '📝 Quick Journal':
                this.showQuickTradeModal();
                break;
            default:
                console.log('Action:', action);
        }
    }

    showQuickTradeModal() {
        // Simple modal untuk quick trade
        alert('Quick Trade - Fitur akan datang! 🚀');
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});
