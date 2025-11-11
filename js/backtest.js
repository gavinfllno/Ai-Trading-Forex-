// Backtest Page Functionality
class BacktestPage {
    constructor() {
        this.backtestEngine = backtestEngine;
        this.tradingEngine = tradingEngine;
        this.dataManager = dataManager;
        this.currentUser = this.dataManager.currentUser;
        this.currentResults = null;
        this.isRunning = false;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadStrategyParams();
        this.setupEventListeners();
        this.initializeCharts();
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

        // Strategy selection
        document.getElementById('strategySelect').addEventListener('change', (e) => {
            this.loadStrategyParams(e.target.value);
        });

        // Run backtest
        document.getElementById('runBacktest').addEventListener('click', () => {
            this.runBacktest();
        });

        // Reset configuration
        document.getElementById('resetConfig').addEventListener('click', () => {
            this.resetConfiguration();
        });

        // Export results
        document.getElementById('exportResults').addEventListener('click', () => {
            this.exportResults();
        });

        // Save strategy
        document.getElementById('saveStrategy').addEventListener('click', () => {
            this.saveStrategy();
        });
    }

    loadStrategyParams(strategy = 'moving_average') {
        const params = this.backtestEngine.getStrategyParams(strategy);
        const paramsContainer = document.getElementById('strategyParams');
        
        let paramsHTML = '<h3>Strategy Parameters</h3><div class="param-grid">';
        
        Object.keys(params).forEach(param => {
            paramsHTML += `
                <div class="param-group">
                    <label for="${param}">${this.formatParamName(param)}</label>
                    <input type="number" id="${param}" value="${params[param]}" 
                           min="1" max="100" step="1">
                </div>
            `;
        });
        
        paramsHTML += '</div>';
        paramsContainer.innerHTML = paramsHTML;
    }

    formatParamName(param) {
        const names = {
            fastMA: 'Fast MA Period',
            slowMA: 'Slow MA Period',
            period: 'RSI Period',
            overbought: 'Overbought Level',
            oversold: 'Oversold Level',
            stdDev: 'Standard Deviation',
            fastPeriod: 'Fast Period',
            slowPeriod: 'Slow Period',
            signalPeriod: 'Signal Period',
            param1: 'Parameter 1',
            param2: 'Parameter 2'
        };
        return names[param] || param;
    }

    async runBacktest() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.showLoading(true);
        
        try {
            const config = this.getConfiguration();
            const results = await this.backtestEngine.runBacktest(config);
            
            this.currentResults = results;
            this.displayResults(results);
            this.showNotification('Backtest completed successfully!', 'success');
            
        } catch (error) {
            console.error('Backtest error:', error);
            this.showNotification('Backtest failed: ' + error.message, 'error');
        } finally {
            this.isRunning = false;
            this.showLoading(false);
        }
    }

    getConfiguration() {
        const strategy = document.getElementById('strategySelect').value;
        const params = {};
        
        // Get strategy parameters
        const paramInputs = document.querySelectorAll('#strategyParams input');
        paramInputs.forEach(input => {
            params[input.id] = parseFloat(input.value);
        });

        return {
            strategy: strategy,
            currencyPair: document.getElementById('currencyPair').value,
            timeframe: document.getElementById('timeframe').value,
            period: parseInt(document.getElementById('period').value),
            initialCapital: parseFloat(document.getElementById('initialCapital').value),
            riskPerTrade: parseFloat(document.getElementById('riskPerTrade').value),
            stopLossPips: parseFloat(document.getElementById('stopLossPips').value),
            takeProfitPips: parseFloat(document.getElementById('takeProfitPips').value),
            params: params
        };
    }

    displayResults(results) {
        this.displayPerformanceSummary(results.metrics);
        this.displayEquityChart(results.equity);
        this.displayMonthlyPerformance(results.monthlyPerformance);
        this.displayTradesTable(results.trades);
    }

    displayPerformanceSummary(metrics) {
        const summaryHTML = `
            <div class="performance-stats">
                <div class="stat-card ${metrics.totalProfit >= 0 ? 'positive' : 'negative'}">
                    <div class="stat-value">${formatCurrency(metrics.totalProfit)}</div>
                    <div class="stat-label">Total Profit</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${metrics.totalTrades}</div>
                    <div class="stat-label">Total Trades</div>
                </div>
                <div class="stat-card ${metrics.winRate >= 50 ? 'positive' : 'negative'}">
                    <div class="stat-value">${metrics.winRate.toFixed(1)}%</div>
                    <div class="stat-label">Win Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${metrics.profitFactor.toFixed(2)}</div>
                    <div class="stat-label">Profit Factor</div>
                </div>
                <div class="stat-card ${metrics.maxDrawdown <= 10 ? 'positive' : 'negative'}">
                    <div class="stat-value">${metrics.maxDrawdown.toFixed(1)}%</div>
                    <div class="stat-label">Max Drawdown</div>
                </div>
                <div class="stat-card ${metrics.sharpeRatio >= 1 ? 'positive' : 'negative'}">
                    <div class="stat-value">${metrics.sharpeRatio.toFixed(2)}</div>
                    <div class="stat-label">Sharpe Ratio</div>
                </div>
                <div class="stat-card ${metrics.totalReturn >= 0 ? 'positive' : 'negative'}">
                    <div class="stat-value">${metrics.totalReturn.toFixed(1)}%</div>
                    <div class="stat-label">Total Return</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatCurrency(metrics.finalEquity)}</div>
                    <div class="stat-label">Final Equity</div>
                </div>
            </div>
            
            <div class="strategy-metrics">
                <div class="metric-item">
                    <div class="metric-value">${metrics.winningTrades}</div>
                    <div class="metric-label">Winning Trades</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${metrics.losingTrades}</div>
                    <div class="metric-label">Losing Trades</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${metrics.totalTrades > 0 ? (metrics.winningTrades / metrics.totalTrades * 100).toFixed(1) + '%' : '0%'}</div>
                    <div class="metric-label">Win Rate</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${metrics.totalTrades > 0 ? formatCurrency(metrics.totalProfit / metrics.totalTrades) : '$0'}</div>
                    <div class="metric-label">Avg. Trade</div>
                </div>
            </div>
        `;
        
        document.getElementById('performanceSummary').innerHTML = summaryHTML;
    }

    displayEquityChart(equity) {
        const chartContainer = document.getElementById('equityChart');
        
        // Simple text-based chart for demonstration
        // In a real implementation, you would use Chart.js or similar
        if (equity.length > 1) {
            const minEquity = Math.min(...equity);
            const maxEquity = Math.max(...equity);
            const range = maxEquity - minEquity;
            
            let chartHTML = '<div class="chart-canvas">';
            chartHTML += `<div style="height: 180px; background: linear-gradient(to top, #27ae60, #2ecc71); border-radius: 4px; position: relative;">`;
            
            // Add some simple visualization
            equity.forEach((value, index) => {
                const height = range > 0 ? ((value - minEquity) / range) * 160 : 80;
                chartHTML += `<div style="position: absolute; bottom: 0; left: ${(index / equity.length) * 100}%; width: 2px; height: ${height}px; background: #2c3e50;"></div>`;
            });
            
            chartHTML += `</div>`;
            chartHTML += `<div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.8rem; color: #7f8c8d;">`;
            chartHTML += `<span>Start: ${formatCurrency(equity[0])}</span>`;
            chartHTML += `<span>End: ${formatCurrency(equity[equity.length - 1])}</span>`;
            chartHTML += `</div>`;
            chartHTML += `</div>`;
            
            chartContainer.innerHTML = chartHTML;
        } else {
            chartContainer.innerHTML = '<p>Insufficient data for chart</p>';
        }
    }

    displayMonthlyPerformance(monthlyPerformance) {
        const chartContainer = document.getElementById('monthlyChart');
        const months = Object.keys(monthlyPerformance).sort();
        
        if (months.length > 0) {
            let chartHTML = '<div class="chart-canvas">';
            chartHTML += `<div style="height: 180px; display: flex; align-items: end; gap: 4px; padding: 10px 0;">`;
            
            months.forEach(month => {
                const profit = monthlyPerformance[month].profit;
                const height = Math.min(Math.abs(profit) / 100, 150);
                const color = profit >= 0 ? '#27ae60' : '#e74c3c';
                
                chartHTML += `
                    <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                        <div style="width: 20px; height: ${height}px; background: ${color}; border-radius: 2px;"></div>
                        <div style="font-size: 0.7rem; margin-top: 0.3rem; writing-mode: vertical-rl; transform: rotate(180deg);">
                            ${month.split('-')[1]}
                        </div>
                    </div>
                `;
            });
            
            chartHTML += `</div>`;
            chartHTML += `</div>`;
            
            chartContainer.innerHTML = chartHTML;
        } else {
            chartContainer.innerHTML = '<p>No monthly data available</p>';
        }
    }

    displayTradesTable(trades) {
        const tableBody = document.getElementById('backtestTradesBody');
        
        if (trades.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #7f8c8d;">No trades generated</td></tr>';
            return;
        }

        tableBody.innerHTML = trades.map(trade => `
            <tr>
                <td>${this.formatDate(trade.entryTime)}</td>
                <td>${trade.currencyPair || 'EUR/USD'}</td>
                <td>
                    <span class="trade-${trade.direction.toLowerCase()}">
                        ${trade.direction}
                    </span>
                </td>
                <td>${trade.entryPrice.toFixed(5)}</td>
                <td>${trade.exitPrice ? trade.exitPrice.toFixed(5) : '-'}</td>
                <td>
                    <span class="profit-${trade.profitLoss >= 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(trade.profitLoss)}
                    </span>
                </td>
                <td>
                    ${this.calculateRiskReward(trade).toFixed(2)}
                </td>
            </tr>
        `).join('');
    }

    calculateRiskReward(trade) {
        if (!trade.stopLoss || !trade.takeProfit) return 0;
        
        const risk = Math.abs(trade.entryPrice - trade.stopLoss);
        const reward = Math.abs(trade.takeProfit - trade.entryPrice);
        
        return risk > 0 ? reward / risk : 0;
    }

    resetConfiguration() {
        document.getElementById('strategySelect').value = 'moving_average';
        document.getElementById('currencyPair').value = 'EUR/USD';
        document.getElementById('timeframe').value = '4h';
        document.getElementById('period').value = '30';
        document.getElementById('initialCapital').value = '10000';
        document.getElementById('riskPerTrade').value = '2';
        document.getElementById('stopLossPips').value = '20';
        document.getElementById('takeProfitPips').value = '40';
        
        this.loadStrategyParams('moving_average');
        this.clearResults();
        
        this.showNotification('Configuration reset to defaults', 'info');
    }

    clearResults() {
        document.getElementById('performanceSummary').innerHTML = `
            <div class="summary-placeholder">
                <p>Configure and run backtest to see results</p>
            </div>
        `;
        
        document.getElementById('equityChart').innerHTML = '<p>Equity curve will be displayed here</p>';
        document.getElementById('monthlyChart').innerHTML = '<p>Monthly performance chart will be displayed here</p>';
        document.getElementById('backtestTradesBody').innerHTML = '';
        
        this.currentResults = null;
    }

    exportResults() {
        if (!this.currentResults) {
            this.showNotification('No results to export', 'info');
            return;
        }

        const csvContent = this.tradingEngine.exportTradesToCSV(this.currentResults.trades);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `backtest-results-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showNotification('Results exported successfully!', 'success');
    }

    saveStrategy() {
        if (!this.currentResults) {
            this.showNotification('No results to save', 'info');
            return;
        }

        const strategy = {
            id: Date.now(),
            name: `${document.getElementById('strategySelect').value} Strategy`,
            config: this.getConfiguration(),
            results: this.currentResults.metrics,
            savedAt: new Date().toISOString()
        };

        // Save to localStorage
        const savedStrategies = this.dataManager.storage.get('savedStrategies') || [];
        savedStrategies.push(strategy);
        this.dataManager.storage.set('savedStrategies', savedStrategies);

        this.showNotification('Strategy saved successfully!', 'success');
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        const runBtn = document.getElementById('runBacktest');
        
        if (show) {
            overlay.classList.add('active');
            runBtn.disabled = true;
            runBtn.textContent = '⏳ Running...';
        } else {
            overlay.classList.remove('active');
            runBtn.disabled = false;
            runBtn.textContent = '🚀 Run Backtest';
        }
    }

    initializeCharts() {
        // Initialize chart placeholders
        // In a real implementation, you would initialize Chart.js here
        console.log('Charts initialized');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

// Add CSS for backtest-specific styles
const backtestStyle = document.createElement('style');
backtestStyle.textContent = `
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
    
    .stat-card.positive {
        border-left-color: #27ae60;
    }
    
    .stat-card.negative {
        border-left-color: #e74c3c;
    }
`;
document.head.appendChild(backtestStyle);

// Initialize backtest page
let backtestPage;

document.addEventListener('DOMContentLoaded', () => {
    backtestPage = new BacktestPage();
});
