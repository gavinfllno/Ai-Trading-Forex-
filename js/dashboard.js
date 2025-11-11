// Dashboard Functionality
class Dashboard {
    constructor() {
        this.dataManager = dataManager;
        this.currentUser = this.dataManager.currentUser;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadDashboardData();
        this.setupEventListeners();
        this.generateSampleData();
    }

    checkAuthentication() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        // Update welcome message
        document.getElementById('userWelcome').textContent = 
            `Welcome, ${this.currentUser.name || 'Trader'}`;
    }

    setupEventListeners() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Modal functionality
        const modal = document.getElementById('tradeModal');
        const closeBtn = document.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Quick trade form
        document.getElementById('quickTradeForm').addEventListener('submit', (e) => {
            this.handleQuickTrade(e);
        });
    }

    loadDashboardData() {
        this.updateStats();
        this.loadRecentTrades();
        this.loadLiveSignals();
    }

    updateStats() {
        const stats = this.dataManager.getTradingStats(this.currentUser?.id);
        
        document.getElementById('totalTrades').textContent = stats.totalTrades;
        document.getElementById('totalProfit').textContent = 
            formatCurrency(stats.totalProfit);
        document.getElementById('winRate').textContent = 
            `${stats.winRate.toFixed(1)}%`;
        document.getElementById('activeSignals').textContent = 
            this.dataManager.getSignals().length;
    }

    loadRecentTrades() {
        const trades = this.dataManager.getTrades(this.currentUser?.id)
            .slice(-5)
            .reverse();
        
        const tradesList = document.getElementById('recentTradesList');
        
        if (trades.length === 0) {
            tradesList.innerHTML = '<p class="no-data">No trades yet. Add your first trade!</p>';
            return;
        }

        tradesList.innerHTML = trades.map(trade => `
            <div class="trade-item">
                <div class="trade-info">
                    <strong>${trade.currencyPair}</strong>
                    <span class="trade-direction ${trade.direction?.toLowerCase()}">
                        ${trade.direction}
                    </span>
                </div>
                <div class="trade-details">
                    <span>${formatCurrency(trade.entryPrice)}</span>
                    <span class="trade-profit ${trade.profitLoss >= 0 ? 'profit-positive' : 'profit-negative'}">
                        ${formatCurrency(trade.profitLoss || 0)}
                    </span>
                </div>
            </div>
        `).join('');
    }

    loadLiveSignals() {
        const signals = this.dataManager.getSignals(5);
        const signalsList = document.getElementById('signalsList');
        
        if (signals.length === 0) {
            signalsList.innerHTML = '<p class="no-data">No signals available. Check back later!</p>';
            return;
        }

        signalsList.innerHTML = signals.map(signal => `
            <div class="signal-item">
                <div class="signal-info">
                    <strong>${signal.pair}</strong>
                    <span class="signal-action ${signal.action?.toLowerCase()}">
                        ${signal.action}
                    </span>
                </div>
                <div class="signal-details">
                    <span>${formatCurrency(signal.price)}</span>
                    <small>${formatDate(signal.timestamp)}</small>
                </div>
            </div>
        `).join('');
    }

    handleQuickTrade(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const tradeData = {
            currencyPair: document.getElementById('currencyPair').value,
            direction: document.getElementById('tradeDirection').value,
            entryPrice: parseFloat(document.getElementById('entryPrice').value),
            quantity: parseInt(document.getElementById('tradeQuantity').value),
            profitLoss: this.calculateRandomPnL()
        };

        this.dataManager.addTrade(tradeData);
        
        // Show success message
        this.showNotification('Trade added successfully!', 'success');
        
        // Close modal and refresh data
        document.getElementById('tradeModal').style.display = 'none';
        this.loadDashboardData();
        e.target.reset();
    }

    calculateRandomPnL() {
        // Simulate random PnL between -500 and 500
        return (Math.random() * 1000 - 500).toFixed(2);
    }

    generateSampleData() {
        // Generate sample data if no trades exist
        if (this.dataManager.getTrades(this.currentUser?.id).length === 0) {
            const sampleTrades = [
                {
                    currencyPair: 'EUR/USD',
                    direction: 'BUY',
                    entryPrice: 1.0850,
                    quantity: 1,
                    profitLoss: 125.50
                },
                {
                    currencyPair: 'GBP/USD', 
                    direction: 'SELL',
                    entryPrice: 1.2650,
                    quantity: 1,
                    profitLoss: -87.25
                },
                {
                    currencyPair: 'USD/JPY',
                    direction: 'BUY',
                    entryPrice: 150.25,
                    quantity: 1,
                    profitLoss: 45.75
                }
            ];

            sampleTrades.forEach(trade => {
                this.dataManager.addTrade(trade);
            });

            // Generate sample signals
            const sampleSignals = [
                {
                    pair: 'EUR/USD',
                    action: 'BUY',
                    price: 1.0950,
                    strength: 'STRONG'
                },
                {
                    pair: 'GBP/USD',
                    action: 'SELL', 
                    price: 1.2550,
                    strength: 'MEDIUM'
                },
                {
                    pair: 'USD/JPY',
                    action: 'BUY',
                    price: 151.00,
                    strength: 'WEAK'
                }
            ];

            sampleSignals.forEach(signal => {
                this.dataManager.addSignal(signal);
            });
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            border-radius: 8px;
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    logout() {
        // Use the auth system logout
        const authSystem = new AuthSystem();
        authSystem.logout();
    }
}

// Global function to show modal
function showAddTradeModal() {
    document.getElementById('tradeModal').style.display = 'block';
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .no-data {
        text-align: center;
        color: #7f8c8d;
        padding: 2rem;
    }
    
    .trade-direction.buy,
    .signal-action.buy {
        color: #27ae60;
        font-weight: bold;
    }
    
    .trade-direction.sell,
    .signal-action.sell {
        color: #e74c3c;
        font-weight: bold;
    }
`;
document.head.appendChild(style);

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});
