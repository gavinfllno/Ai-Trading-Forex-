// Data Management System
class DataManager {
    constructor() {
        this.users = storage.get('users') || [];
        this.currentUser = storage.get('currentUser');
        this.trades = storage.get('trades') || [];
        this.signals = storage.get('signals') || [];
    }

    // Trade Management
    addTrade(tradeData) {
        const trade = {
            id: Date.now(),
            ...tradeData,
            createdAt: new Date().toISOString(),
            userId: this.currentUser?.id
        };
        
        this.trades.push(trade);
        storage.set('trades', this.trades);
        return trade;
    }

    getTrades(userId = null) {
        if (userId) {
            return this.trades.filter(trade => trade.userId === userId);
        }
        return this.trades;
    }

    updateTrade(tradeId, updates) {
        const index = this.trades.findIndex(trade => trade.id === tradeId);
        if (index !== -1) {
            this.trades[index] = { ...this.trades[index], ...updates };
            storage.set('trades', this.trades);
            return this.trades[index];
        }
        return null;
    }

    deleteTrade(tradeId) {
        this.trades = this.trades.filter(trade => trade.id !== tradeId);
        storage.set('trades', this.trades);
    }

    // Signal Management
    addSignal(signalData) {
        const signal = {
            id: Date.now(),
            ...signalData,
            timestamp: new Date().toISOString()
        };
        
        this.signals.push(signal);
        storage.set('signals', this.signals);
        return signal;
    }

    getSignals(limit = 10) {
        return this.signals.slice(-limit).reverse();
    }

    // Analytics
    getTradingStats(userId = null) {
        const userTrades = this.getTrades(userId);
        const totalTrades = userTrades.length;
        const winningTrades = userTrades.filter(t => t.profitLoss > 0).length;
        const losingTrades = userTrades.filter(t => t.profitLoss < 0).length;
        const totalProfit = userTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
        
        return {
            totalTrades,
            winningTrades,
            losingTrades,
            totalProfit,
            winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
        };
    }

    // User Management
    updateUserProfile(userId, updates) {
        const userIndex = this.users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            storage.set('users', this.users);
            
            // Update current user if it's the same user
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser = { ...this.currentUser, ...updates };
                storage.set('currentUser', this.currentUser);
            }
        }
    }
}

// Create global instance
const dataManager = new DataManager();
