// Trading Engine - Core Trading Logic and Analytics
class TradingEngine {
    constructor() {
        this.dataManager = dataManager;
    }

    // Calculate profit/loss for a trade
    calculateProfitLoss(trade) {
        if (trade.status === 'OPEN' || !trade.exitPrice) {
            return 0;
        }

        const priceDifference = trade.direction === 'BUY' 
            ? trade.exitPrice - trade.entryPrice
            : trade.entryPrice - trade.exitPrice;
            
        return priceDifference * trade.quantity;
    }

    // Calculate current unrealized PnL for open trades
    calculateUnrealizedPnL(trade, currentPrice) {
        if (trade.status === 'CLOSED') {
            return 0;
        }

        const priceDifference = trade.direction === 'BUY'
            ? currentPrice - trade.entryPrice
            : trade.entryPrice - currentPrice;
            
        return priceDifference * trade.quantity;
    }

    // Analyze trading performance
    analyzePerformance(trades) {
        const analysis = {
            totalTrades: trades.length,
            winningTrades: 0,
            losingTrades: 0,
            breakEvenTrades: 0,
            totalProfit: 0,
            largestWin: 0,
            largestLoss: 0,
            avgWin: 0,
            avgLoss: 0,
            winRate: 0,
            profitFactor: 0,
            expectancy: 0
        };

        let totalWins = 0;
        let totalLosses = 0;

        trades.forEach(trade => {
            const pnl = trade.profitLoss || this.calculateProfitLoss(trade);
            analysis.totalProfit += pnl;

            if (pnl > 0) {
                analysis.winningTrades++;
                totalWins += pnl;
                analysis.largestWin = Math.max(analysis.largestWin, pnl);
            } else if (pnl < 0) {
                analysis.losingTrades++;
                totalLosses += Math.abs(pnl);
                analysis.largestLoss = Math.min(analysis.largestLoss, pnl);
            } else {
                analysis.breakEvenTrades++;
            }
        });

        // Calculate derived metrics
        analysis.winRate = analysis.totalTrades > 0 
            ? (analysis.winningTrades / analysis.totalTrades) * 100 
            : 0;

        analysis.avgWin = analysis.winningTrades > 0 
            ? totalWins / analysis.winningTrades 
            : 0;

        analysis.avgLoss = analysis.losingTrades > 0 
            ? totalLosses / analysis.losingTrades 
            : 0;

        analysis.profitFactor = totalLosses > 0 
            ? totalWins / totalLosses 
            : totalWins > 0 ? Infinity : 0;

        analysis.expectancy = analysis.totalTrades > 0
            ? (analysis.winRate / 100 * analysis.avgWin) - ((100 - analysis.winRate) / 100 * analysis.avgLoss)
            : 0;

        return analysis;
    }

    // Calculate risk/reward ratio
    calculateRiskRewardRatio(entryPrice, stopLoss, takeProfit, direction) {
        if (!stopLoss || !takeProfit) return null;

        const risk = direction === 'BUY' 
            ? entryPrice - stopLoss
            : stopLoss - entryPrice;

        const reward = direction === 'BUY'
            ? takeProfit - entryPrice
            : entryPrice - takeProfit;

        return risk > 0 ? reward / risk : null;
    }

    // Generate trading statistics by pair
    analyzeByPair(trades) {
        const pairAnalysis = {};

        trades.forEach(trade => {
            const pair = trade.currencyPair;
            if (!pairAnalysis[pair]) {
                pairAnalysis[pair] = {
                    pair: pair,
                    totalTrades: 0,
                    winningTrades: 0,
                    totalProfit: 0,
                    avgProfit: 0
                };
            }

            const pnl = trade.profitLoss || this.calculateProfitLoss(trade);
            pairAnalysis[pair].totalTrades++;
            pairAnalysis[pair].totalProfit += pnl;

            if (pnl > 0) {
                pairAnalysis[pair].winningTrades++;
            }
        });

        // Calculate averages and win rates
        Object.keys(pairAnalysis).forEach(pair => {
            const analysis = pairAnalysis[pair];
            analysis.winRate = (analysis.winningTrades / analysis.totalTrades) * 100;
            analysis.avgProfit = analysis.totalProfit / analysis.totalTrades;
        });

        return pairAnalysis;
    }

    // Analyze performance by time period
    analyzeByTimePeriod(trades, period = 'month') {
        const periodAnalysis = {};

        trades.forEach(trade => {
            const date = new Date(trade.entryDate || trade.createdAt);
            let periodKey;

            switch (period) {
                case 'day':
                    periodKey = date.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    periodKey = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'year':
                    periodKey = date.getFullYear().toString();
                    break;
                default:
                    periodKey = date.toISOString().split('T')[0];
            }

            if (!periodAnalysis[periodKey]) {
                periodAnalysis[periodKey] = {
                    period: periodKey,
                    totalTrades: 0,
                    totalProfit: 0,
                    winningTrades: 0
                };
            }

            const pnl = trade.profitLoss || this.calculateProfitLoss(trade);
            periodAnalysis[periodKey].totalTrades++;
            periodAnalysis[periodKey].totalProfit += pnl;

            if (pnl > 0) {
                periodAnalysis[periodKey].winningTrades++;
            }
        });

        return periodAnalysis;
    }

    // Generate trading recommendations based on performance
    generateRecommendations(analysis) {
        const recommendations = [];

        if (analysis.winRate < 40) {
            recommendations.push({
                type: 'WARNING',
                message: 'Low win rate detected. Consider reviewing your strategy.',
                priority: 'HIGH'
            });
        }

        if (analysis.profitFactor < 1) {
            recommendations.push({
                type: 'WARNING',
                message: 'Profit factor below 1. Your losses exceed your wins.',
                priority: 'HIGH'
            });
        }

        if (analysis.largestLoss < analysis.avgLoss * 2) {
            recommendations.push({
                type: 'POSITIVE',
                message: 'Good risk management - no outlier losses detected.',
                priority: 'LOW'
            });
        }

        if (analysis.totalTrades < 10) {
            recommendations.push({
                type: 'INFO',
                message: 'More trade data needed for accurate analysis.',
                priority: 'MEDIUM'
            });
        }

        if (analysis.winRate > 60 && analysis.profitFactor > 2) {
            recommendations.push({
                type: 'SUCCESS',
                message: 'Excellent performance! Keep following your strategy.',
                priority: 'LOW'
            });
        }

        return recommendations;
    }

    // Simulate trade outcome based on strategy
    simulateTrade(entryPrice, direction, stopLoss, takeProfit, quantity = 1) {
        if (!stopLoss || !takeProfit) return null;

        const simulation = {
            entryPrice,
            direction,
            stopLoss,
            takeProfit,
            quantity,
            riskAmount: 0,
            rewardAmount: 0,
            riskRewardRatio: 0
        };

        simulation.riskAmount = direction === 'BUY'
            ? (entryPrice - stopLoss) * quantity
            : (stopLoss - entryPrice) * quantity;

        simulation.rewardAmount = direction === 'BUY'
            ? (takeProfit - entryPrice) * quantity
            : (entryPrice - takeProfit) * quantity;

        simulation.riskRewardRatio = simulation.riskAmount > 0
            ? simulation.rewardAmount / simulation.riskAmount
            : 0;

        return simulation;
    }

    // Calculate position size based on risk management
    calculatePositionSize(accountBalance, riskPercent, entryPrice, stopLoss) {
        const riskAmount = accountBalance * (riskPercent / 100);
        const priceRisk = Math.abs(entryPrice - stopLoss);
        
        return priceRisk > 0 ? riskAmount / priceRisk : 0;
    }

    // Generate performance report
    generatePerformanceReport(trades, period = 'all') {
        const filteredTrades = this.filterTradesByPeriod(trades, period);
        const analysis = this.analyzePerformance(filteredTrades);
        const pairAnalysis = this.analyzeByPair(filteredTrades);
        const timeAnalysis = this.analyzeByTimePeriod(filteredTrades, 'month');
        const recommendations = this.generateRecommendations(analysis);

        return {
            period,
            summary: analysis,
            byPair: pairAnalysis,
            byTime: timeAnalysis,
            recommendations,
            generatedAt: new Date().toISOString()
        };
    }

    // Filter trades by time period
    filterTradesByPeriod(trades, period) {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                return trades;
        }

        return trades.filter(trade => {
            const tradeDate = new Date(trade.entryDate || trade.createdAt);
            return tradeDate >= startDate;
        });
    }

    // Export trades to CSV format
    exportTradesToCSV(trades) {
        const headers = ['Date', 'Pair', 'Direction', 'Entry', 'Exit', 'Quantity', 'P&L', 'Status', 'Notes'];
        const csvRows = [headers.join(',')];

        trades.forEach(trade => {
            const row = [
                trade.entryDate || trade.createdAt,
                trade.currencyPair,
                trade.direction,
                trade.entryPrice,
                trade.exitPrice || '',
                trade.quantity,
                trade.profitLoss || this.calculateProfitLoss(trade),
                trade.status,
                `"${(trade.notes || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }
}

// Create global instance
const tradingEngine = new TradingEngine();
