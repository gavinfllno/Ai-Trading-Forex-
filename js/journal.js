// Journal Page Functionality
class JournalPage {
    constructor() {
        this.dataManager = dataManager;
        this.tradingEngine = tradingEngine;
        this.currentUser = this.dataManager.currentUser;
        this.currentEditId = null;
        this.filters = {
            time: 'all',
            pair: 'all',
            search: ''
        };
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadJournalData();
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

        // Add trade button
        document.getElementById('addTradeBtn').addEventListener('click', () => {
            this.showAddTradeModal();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportToCSV();
        });

        // Filters
        document.getElementById('timeFilter').addEventListener('change', (e) => {
            this.filters.time = e.target.value;
            this.applyFilters();
        });

        document.getElementById('pairFilter').addEventListener('change', (e) => {
            this.filters.pair = e.target.value;
            this.applyFilters();
        });

        document.getElementById('searchTrades').addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Trade form
        document.getElementById('tradeForm').addEventListener('submit', (e) => {
            this.handleTradeSubmit(e);
        });

        document.getElementById('tradeStatus').addEventListener('change', (e) => {
            this.toggleExitSection(e.target.value === 'CLOSED');
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('tradeModal')) {
                this.closeModal();
            }
        });
    }

    loadJournalData() {
        const userTrades = this.dataManager.getTrades(this.currentUser?.id);
        this.updateStats(userTrades);
        this.renderTradesTable(userTrades);
    }

    updateStats(trades) {
        const analysis = this.tradingEngine.analyzePerformance(trades);
        
        document.getElementById('totalTrades').textContent = analysis.totalTrades;
        document.getElementById('totalProfit').textContent = formatCurrency(analysis.totalProfit);
        document.getElementById('winRate').textContent = `${analysis.winRate.toFixed(1)}%`;
        document.getElementById('avgTrade').textContent = formatCurrency(
            analysis.totalTrades > 0 ? analysis.totalProfit / analysis.totalTrades : 0
        );
    }

    renderTradesTable(trades) {
        const tableBody = document.getElementById('tradesTableBody');
        const noTradesMessage = document.getElementById('noTradesMessage');

        if (trades.length === 0) {
            tableBody.innerHTML = '';
            noTradesMessage.style.display = 'block';
            return;
        }

        noTradesMessage.style.display = 'none';

        // Sort trades by date (newest first)
        const sortedTrades = trades.sort((a, b) => 
            new Date(b.entryDate || b.createdAt) - new Date(a.entryDate || a.createdAt)
        );

        tableBody.innerHTML = sortedTrades.map(trade => `
            <tr>
                <td>${this.formatDate(trade.entryDate || trade.createdAt)}</td>
                <td><strong>${trade.currencyPair}</strong></td>
                <td>
                    <span class="trade-${trade.direction.toLowerCase()}">
                        ${trade.direction}
                    </span>
                </td>
                <td>${trade.entryPrice}</td>
                <td>${trade.quantity}</td>
                <td>${trade.exitPrice || '-'}</td>
                <td>
                    <span class="profit-${trade.profitLoss >= 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(trade.profitLoss || 0)}
                    </span>
                </td>
                <td>
                    <span class="status-${trade.status?.toLowerCase() || 'open'}">
                        ${trade.status || 'OPEN'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="journalPage.editTrade('${trade.id}')">
                            ✏️
                        </button>
                        <button class="delete-btn" onclick="journalPage.deleteTrade('${trade.id}')">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    applyFilters() {
        let filteredTrades = this.dataManager.getTrades(this.currentUser?.id);

        // Apply time filter
        if (this.filters.time !== 'all') {
            filteredTrades = this.tradingEngine.filterTradesByPeriod(filteredTrades, this.filters.time);
        }

        // Apply pair filter
        if (this.filters.pair !== 'all') {
            filteredTrades = filteredTrades.filter(trade => 
                trade.currencyPair === this.filters.pair
            );
        }

        // Apply search filter
        if (this.filters.search) {
            filteredTrades = filteredTrades.filter(trade =>
                trade.currencyPair.toLowerCase().includes(this.filters.search) ||
                trade.direction.toLowerCase().includes(this.filters.search) ||
                (trade.notes && trade.notes.toLowerCase().includes(this.filters.search))
            );
        }

        this.updateStats(filteredTrades);
        this.renderTradesTable(filteredTrades);
    }

    clearFilters() {
        this.filters = {
            time: 'all',
            pair: 'all',
            search: ''
        };

        document.getElementById('timeFilter').value = 'all';
        document.getElementById('pairFilter').value = 'all';
        document.getElementById('searchTrades').value = '';

        this.loadJournalData();
    }

    showAddTradeModal() {
        this.currentEditId = null;
        document.getElementById('modalTitle').textContent = 'Add New Trade';
        document.getElementById('tradeForm').reset();
        this.toggleExitSection(false);
        document.getElementById('entryDate').value = this.getCurrentDateTime();
        document.getElementById('tradeModal').style.display = 'block';
    }

    editTrade(tradeId) {
        const trade = this.dataManager.trades.find(t => t.id == tradeId);
        if (!trade) return;

        this.currentEditId = tradeId;
        document.getElementById('modalTitle').textContent = 'Edit Trade';
        
        // Fill form with trade data
        document.getElementById('tradePair').value = trade.currencyPair;
        document.getElementById('tradeDirection').value = trade.direction;
        document.getElementById('entryPrice').value = trade.entryPrice;
        document.getElementById('quantity').value = trade.quantity;
        document.getElementById('tradeStatus').value = trade.status || 'OPEN';
        document.getElementById('stopLoss').value = trade.stopLoss || '';
        document.getElementById('takeProfit').value = trade.takeProfit || '';
        document.getElementById('tradeNotes').value = trade.notes || '';

        // Set dates
        if (trade.entryDate) {
            document.getElementById('entryDate').value = trade.entryDate.slice(0, 16);
        }
        if (trade.exitDate) {
            document.getElementById('exitDate').value = trade.exitDate.slice(0, 16);
        }

        this.toggleExitSection(trade.status === 'CLOSED');
        document.getElementById('tradeModal').style.display = 'block';
    }

    async handleTradeSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const tradeData = {
            currencyPair: document.getElementById('tradePair').value,
            direction: document.getElementById('tradeDirection').value,
            entryPrice: parseFloat(document.getElementById('entryPrice').value),
            quantity: parseFloat(document.getElementById('quantity').value),
            status: document.getElementById('tradeStatus').value,
            stopLoss: document.getElementById('stopLoss').value ? parseFloat(document.getElementById('stopLoss').value) : null,
            takeProfit: document.getElementById('takeProfit').value ? parseFloat(document.getElementById('takeProfit').value) : null,
            notes: document.getElementById('tradeNotes').value,
            entryDate: document.getElementById('entryDate').value ? new Date(document.getElementById('entryDate').value).toISOString() : new Date().toISOString()
        };

        // Add exit data if trade is closed
        if (tradeData.status === 'CLOSED') {
            tradeData.exitPrice = document.getElementById('exitPrice').value ? parseFloat(document.getElementById('exitPrice').value) : null;
            tradeData.exitDate = document.getElementById('exitDate').value ? new Date(document.getElementById('exitDate').value).toISOString() : new Date().toISOString();
            tradeData.profitLoss = this.tradingEngine.calculateProfitLoss(tradeData);
        }

        try {
            if (this.currentEditId) {
                // Update existing trade
                this.dataManager.updateTrade(this.currentEditId, tradeData);
                this.showNotification('Trade updated successfully!', 'success');
            } else {
                // Add new trade
                this.dataManager.addTrade(tradeData);
                this.showNotification('Trade added successfully!', 'success');
            }

            this.closeModal();
            this.loadJournalData();

        } catch (error) {
            this.showNotification('Error saving trade: ' + error.message, 'error');
        }
    }

    deleteTrade(tradeId) {
        if (confirm('Are you sure you want to delete this trade? This action cannot be undone.')) {
            this.dataManager.deleteTrade(tradeId);
            this.showNotification('Trade deleted successfully!', 'success');
            this.loadJournalData();
        }
    }

    toggleExitSection(show) {
        const exitSection = document.getElementById('exitSection');
        const exitInputs = exitSection.querySelectorAll('input');
        
        exitInputs.forEach(input => {
            input.required = show;
        });

        exitSection.style.display = show ? 'block' : 'none';
    }

    exportToCSV() {
        const trades = this.dataManager.getTrades(this.currentUser?.id);
        
        if (trades.length === 0) {
            this.showNotification('No trades to export', 'info');
            return;
        }

        const csvContent = this.tradingEngine.exportTradesToCSV(trades);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `trading-journal-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification('CSV exported successfully!', 'success');
    }

    closeModal() {
        document.getElementById('tradeModal').style.display = 'none';
        this.currentEditId = null;
    }

    setupRealTimeUpdates() {
        // Refresh data every 30 seconds if page is visible
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.loadJournalData();
            }
        }, 30000);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getCurrentDateTime() {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
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
        const authSystem = new AuthSystem();
        authSystem.logout();
    }
}

// Add CSS for journal-specific styles
const journalStyle = document.createElement('style');
journalStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .trade-buy {
        color: #27ae60;
        font-weight: bold;
    }
    
    .trade-sell {
        color: #e74c3c;
        font-weight: bold;
    }
    
    .status-open {
        background: #3498db;
        color: white;
        padding: 0.3rem 0.6rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: bold;
    }
    
    .status-closed {
        background: #27ae60;
        color: white;
        padding: 0.3rem 0.6rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: bold;
    }
`;
document.head.appendChild(journalStyle);

// Initialize journal page
let journalPage;

document.addEventListener('DOMContentLoaded', () => {
    journalPage = new JournalPage();
});
