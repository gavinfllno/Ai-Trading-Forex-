// Signals Page Functionality
class SignalsPage {
    constructor() {
        this.botScanner = botScanner;
        this.dataManager = dataManager;
        this.currentUser = this.dataManager.currentUser;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadSignals();
        this.setupEventListeners();
        this.setupRealTimeUpdates();
    }

    checkAuthentication() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        document.getElementById('userWelcome').textContent = 
            `Welcome, ${this.currentUser.name || 'Trader'}`;
    }

    setupEventListeners() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Scan buttons
        document.getElementById('scanBtn').addEventListener('click', () => {
            this.handleManualScan();
        });

        document.getElementById('autoScanBtn').addEventListener('click', () => {
            this.toggleAutoScan();
        });

        // Timeframe filter
        document.getElementById('timeframeFilter').addEventListener('change', (e) => {
            this.loadSignals(e.target.value);
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Execute trade button
        document.getElementById('executeTradeBtn').addEventListener('click', () => {
            this.executeTradeFromSignal();
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('signalModal')) {
                this.closeModal();
            }
        });
    }

    async handleManualScan() {
        const timeframe = document.getElementById('timeframeFilter').value;
        const signals = await this.botScanner.scanMarkets(timeframe);
        
        if (signals.length > 0) {
            this.showNotification(`Found ${signals.length} new signals!`, 'success');
            this.loadSignals();
        } else {
            this.showNotification('No new signals found', 'info');
        }
    }

    toggleAutoScan() {
        const autoScanBtn = document.getElementById('autoScanBtn');
        const isActive = this.botScanner.toggleAutoScan(30000); // 30 seconds
        
        if (isActive) {
            autoScanBtn.classList.add('active');
            autoScanBtn.textContent = '⏹️ Stop Auto Scan';
            this.showNotification('Auto scan started (30s interval)', 'success');
        } else {
            autoScanBtn.classList.remove('active');
            autoScanBtn.textContent = '⚡ Auto Scan';
            this.showNotification('Auto scan stopped', 'info');
        }
    }

    loadSignals(timeframe = null) {
        const selectedTimeframe = timeframe || document.getElementById('timeframeFilter').value;
        let signals = this.dataManager.getSignals(50); // Get last 50 signals
        
        // Filter by timeframe if specified
        if (timeframe) {
            signals = signals.filter(signal => signal.timeframe === timeframe);
        }
        
        this.renderSignals(signals);
    }

    renderSignals(signals) {
        const signalsGrid = document.getElementById('signalsGrid');
        
        if (signals.length === 0) {
            signalsGrid.innerHTML = `
                <div class="no-signals">
                    <h3>No Signals Available</h3>
                    <p>Click "Scan Markets" to generate AI trading signals</p>
                    <button onclick="signalsPage.handleManualScan()" class="scan-btn">
                        🔍 Scan Now
                    </button>
                </div>
            `;
            return;
        }

        signalsGrid.innerHTML = signals.map(signal => `
            <div class="signal-card ${signal.action.toLowerCase()} ${signal.strength.toLowerCase()}" 
                 onclick="signalsPage.showSignalDetails('${signal.id}')">
                <div class="signal-header">
                    <div class="signal-pair">${signal.pair}</div>
                    <div class="signal-action ${signal.action.toLowerCase()}">
                        ${signal.action}
                    </div>
                </div>
                
                <div class="signal-details">
                    <div class="signal-detail">
                        <span class="detail-label">Price</span>
                        <span class="detail-value">${signal.price}</span>
                    </div>
                    <div class="signal-detail">
                        <span class="detail-label">Strength</span>
                        <span class="detail-value">${signal.strength}</span>
                    </div>
                    <div class="signal-detail">
                        <span class="detail-label">Confidence</span>
                        <span class="detail-value">${signal.confidence.toFixed(1)}%</span>
                    </div>
                    <div class="signal-detail">
                        <span class="detail-label">Timeframe</span>
                        <span class="detail-value">${signal.timeframe}</span>
                    </div>
                </div>
                
                <div class="signal-strength">
                    <span class="detail-label">Signal Strength:</span>
                    <div class="strength-bar">
                        <div class="strength-fill ${signal.strength.toLowerCase()}"></div>
                    </div>
                </div>
                
                <div class="signal-footer">
                    <div class="signal-timestamp">
                        ${this.formatRelativeTime(signal.timestamp)}
                    </div>
                    <div class="signal-confidence">
                        ${signal.confidence.toFixed(1)}%
                    </div>
                </div>
            </div>
        `).join('');
    }

    showSignalDetails(signalId) {
        const signal = this.dataManager.signals.find(s => s.id == signalId);
        if (!signal) return;

        const modal = document.getElementById('signalModal');
        const detailsContainer = document.getElementById('signalDetails');
        
        detailsContainer.innerHTML = `
            <div class="signal-detail-full">
                <div class="detail-row">
                    <span>Currency Pair:</span>
                    <strong>${signal.pair}</strong>
                </div>
                <div class="detail-row">
                    <span>Action:</span>
                    <span class="signal-action ${signal.action.toLowerCase()}">
                        ${signal.action}
                    </span>
                </div>
                <div class="detail-row">
                    <span>Current Price:</span>
                    <strong>${signal.price}</strong>
                </div>
                <div class="detail-row">
                    <span>Strength:</span>
                    <span>${signal.strength}</span>
                </div>
                <div class="detail-row">
                    <span>Confidence:</span>
                    <span>${signal.confidence.toFixed(1)}%</span>
                </div>
                <div class="detail-row">
                    <span>Timeframe:</span>
                    <span>${signal.timeframe}</span>
                </div>
                <div class="detail-row">
                    <span>Risk Level:</span>
                    <span>${signal.risk}</span>
                </div>
                <div class="detail-row">
                    <span>Take Profit:</span>
                    <strong>${signal.takeProfit}</strong>
                </div>
                <div class="detail-row">
                    <span>Stop Loss:</span>
                    <strong>${signal.stopLoss}</strong>
                </div>
                <div class="detail-row">
                    <span>RSI:</span>
                    <span>${signal.indicators.rsi}</span>
                </div>
                <div class="detail-row">
                    <span>MACD:</span>
                    <span>${signal.indicators.macd}</span>
                </div>
                <div class="detail-row">
                    <span>Trend:</span>
                    <span>${signal.indicators.trend}</span>
                </div>
                <div class="detail-row">
                    <span>Generated:</span>
                    <span>${this.formatDateTime(signal.timestamp)}</span>
                </div>
            </div>
        `;

        // Store current signal for trade execution
        this.currentSignal = signal;
        modal.style.display = 'block';
    }

    executeTradeFromSignal() {
        if (!this.currentSignal) return;

        const tradeData = {
            currencyPair: this.currentSignal.pair,
            direction: this.currentSignal.action,
            entryPrice: this.currentSignal.price,
            quantity: 1,
            takeProfit: this.currentSignal.takeProfit,
            stopLoss: this.currentSignal.stopLoss,
            signalId: this.currentSignal.id,
            profitLoss: 0 // Will be updated when trade is closed
        };

        this.dataManager.addTrade(tradeData);
        this.showNotification('Trade executed successfully!', 'success');
        this.closeModal();
        
        // Redirect to journal to see the trade
        setTimeout(() => {
            window.location.href = 'journal.html';
        }, 1500);
    }

    closeModal() {
        document.getElementById('signalModal').style.display = 'none';
        this.currentSignal = null;
    }

    setupRealTimeUpdates() {
        // Simulate real-time signal updates every 60 seconds
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.loadSignals();
            }
        }, 60000);
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const signalTime = new Date(timestamp);
        const diffMs = now - signalTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    }

    formatDateTime(timestamp) {
        return new Date(timestamp).toLocaleString();
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
            background: ${type === 'success' ? '#27ae60' : 
                        type === 'error' ? '#e74c3c' : '#3498db'};
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
        // Stop any auto-scanning
        this.botScanner.stopAutoScan();
        
        // Use auth system logout
        const authSystem = new AuthSystem();
        authSystem.logout();
    }
}

// Add CSS for notifications
const signalsStyle = document.createElement('style');
signalsStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(signalsStyle);

// Initialize signals page
let signalsPage;

document.addEventListener('DOMContentLoaded', () => {
    signalsPage = new SignalsPage();
});
