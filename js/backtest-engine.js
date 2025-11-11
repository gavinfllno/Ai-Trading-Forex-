// Backtest Engine - Strategy Testing and Simulation
class BacktestEngine {
    constructor() {
        this.strategies = {
            moving_average: this.movingAverageStrategy,
            rsi: this.rsiStrategy,
            bollinger: this.bollingerBandsStrategy,
            macd: this.macdStrategy,
            custom: this.customStrategy
        };
        
        this.strategyParams = {
            moving_average: {
                fastMA: 10,
                slowMA: 20
            },
            rsi: {
                period: 14,
                overbought: 70,
                oversold: 30
            },
            bollinger: {
                period: 20,
                stdDev: 2
            },
            macd: {
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9
            },
            custom: {
                param1: 10,
                param2: 20
            }
        };
    }

    // Main backtest method
    async runBacktest(config) {
        const {
            strategy,
            currencyPair,
            timeframe,
            period,
            initialCapital,
            riskPerTrade,
            stopLossPips,
            takeProfitPips
        } = config;

        // Generate historical data
        const historicalData = this.generateHistoricalData(currencyPair, period, timeframe);
        
        // Initialize backtest state
        let state = {
            capital: initialCapital,
            position: null,
            trades: [],
            equity: [initialCapital],
            maxDrawdown: 0,
            peakEquity: initialCapital
        };

        // Execute strategy on historical data
        for (let i = 50; i < historicalData.length; i++) {
            const currentData = historicalData.slice(0, i + 1);
            const signal = this.strategies[strategy](currentData, config);
            
            // Update existing position
            if (state.position) {
                state = this.updatePosition(state, historicalData[i], config);
            }

            // Open new position if signal and no existing position
            if (signal && !state.position) {
                state = this.openPosition(state, historicalData[i], signal, config);
            }

            // Update equity curve
            const currentEquity = this.calculateCurrentEquity(state, historicalData[i]);
            state.equity.push(currentEquity);
            
            // Update max drawdown
            state = this.updateDrawdown(state, currentEquity);
        }

        // Close any open position at the end
        if (state.position) {
            state = this.closePosition(state, historicalData[historicalData.length - 1], 'END_OF_TEST');
        }

        return this.generateResults(state, config);
    }

    // Strategy: Moving Average Crossover
    movingAverageStrategy(data, config) {
        const params = config.params || this.strategyParams.moving_average;
        if (data.length < Math.max(params.fastMA, params.slowMA)) return null;

        const fastMA = this.calculateMA(data, params.fastMA);
        const slowMA = this.calculateMA(data, params.slowMA);
        
        const currentFast = fastMA[fastMA.length - 1];
        const currentSlow = slowMA[slowMA.length - 1];
        const prevFast = fastMA[fastMA.length - 2];
        const prevSlow = slowMA[slowMA.length - 2];

        if (prevFast < prevSlow && currentFast > currentSlow) {
            return 'BUY';
        } else if (prevFast > prevSlow && currentFast < currentSlow) {
            return 'SELL';
        }
        
        return null;
    }

    // Strategy: RSI Overbought/Oversold
    rsiStrategy(data, config) {
        const params = config.params || this.strategyParams.rsi;
        if (data.length < params.period + 1) return null;

        const rsi = this.calculateRSI(data, params.period);
        const currentRSI = rsi[rsi.length - 1];
        const prevRSI = rsi[rsi.length - 2];

        if (currentRSI < params.oversold && prevRSI >= params.oversold) {
            return 'BUY';
        } else if (currentRSI > params.overbought && prevRSI <= params.overbought) {
            return 'SELL';
        }
        
        return null;
    }

    // Strategy: Bollinger Bands
    bollingerBandsStrategy(data, config) {
        const params = config.params || this.strategyParams.bollinger;
        if (data.length < params.period) return null;

        const { upper, lower } = this.calculateBollingerBands(data, params.period, params.stdDev);
        const currentPrice = data[data.length - 1].close;
        const prevPrice = data[data.length - 2].close;

        if (prevPrice >= lower[lower.length - 2] && currentPrice < lower[lower.length - 1]) {
            return 'BUY';
        } else if (prevPrice <= upper[upper.length - 2] && currentPrice > upper[upper.length - 1]) {
            return 'SELL';
        }
        
        return null;
    }

    // Strategy: MACD Crossover
    macdStrategy(data, config) {
        const params = config.params || this.strategyParams.macd;
        if (data.length < params.slowPeriod + params.signalPeriod) return null;

        const { macd, signal } = this.calculateMACD(data, params.fastPeriod, params.slowPeriod, params.signalPeriod);
        
        const currentMACD = macd[macd.length - 1];
        const currentSignal = signal[signal.length - 1];
        const prevMACD = macd[macd.length - 2];
        const prevSignal = signal[signal.length - 2];

        if (prevMACD < prevSignal && currentMACD > currentSignal) {
            return 'BUY';
        } else if (prevMACD > prevSignal && currentMACD < currentSignal) {
            return 'SELL';
        }
        
        return null;
    }

    // Custom Strategy (placeholder)
    customStrategy(data, config) {
        // Simple random strategy for demonstration
        if (Math.random() > 0.95) {
            return Math.random() > 0.5 ? 'BUY' : 'SELL';
        }
        return null;
    }

    // Technical Indicators
    calculateMA(data, period) {
        const ma = [];
        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
            ma.push(sum / period);
        }
        return ma;
    }

    calculateRSI(data, period) {
        const gains = [];
        const losses = [];
        
        for (let i = 1; i < data.length; i++) {
            const change = data[i].close - data[i - 1].close;
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }

        const rsi = [];
        for (let i = period; i < gains.length; i++) {
            const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b) / period;
            const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b) / period;
            
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            rsi.push(100 - (100 / (1 + rs)));
        }

        return rsi;
    }

    calculateBollingerBands(data, period, stdDev) {
        const ma = this.calculateMA(data, period);
        const bands = { upper: [], lower: [] };
        
        for (let i = period - 1; i < data.length; i++) {
            const slice = data.slice(i - period + 1, i + 1);
            const variance = slice.reduce((acc, val) => acc + Math.pow(val.close - ma[i - period + 1], 2), 0) / period;
            const standardDeviation = Math.sqrt(variance);
            
            bands.upper.push(ma[i - period + 1] + (standardDeviation * stdDev));
            bands.lower.push(ma[i - period + 1] - (standardDeviation * stdDev));
        }
        
        return bands;
    }

    calculateMACD(data, fastPeriod, slowPeriod, signalPeriod) {
        const fastEMA = this.calculateEMA(data, fastPeriod);
        const slowEMA = this.calculateEMA(data, slowPeriod);
        
        const macd = [];
        for (let i = 0; i < fastEMA.length; i++) {
            if (i < slowPeriod - fastPeriod) continue;
            macd.push(fastEMA[i] - slowEMA[i + slowPeriod - fastPeriod]);
        }
        
        const signal = this.calculateEMA(macd.map((val, idx) => ({ close: val })), signalPeriod);
        
        return { macd, signal: signal.slice(signalPeriod - 1) };
    }

    calculateEMA(data, period) {
        const ema = [];
        const multiplier = 2 / (period + 1);
        
        // Start with SMA
        let emaValue = data.slice(0, period).reduce((acc, val) => acc + val.close, 0) / period;
        ema.push(emaValue);
        
        // Calculate EMA for remaining points
        for (let i = period; i < data.length; i++) {
            emaValue = (data[i].close - emaValue) * multiplier + emaValue;
            ema.push(emaValue);
        }
        
        return ema;
    }

    // Position Management
    openPosition(state, data, direction, config) {
        const positionSize = this.calculatePositionSize(state.capital, config.riskPerTrade, data.close, config.stopLossPips);
        const stopLoss = direction === 'BUY' 
            ? data.close - (config.stopLossPips * 0.0001)
            : data.close + (config.stopLossPips * 0.0001);
            
        const takeProfit = direction === 'BUY'
            ? data.close + (config.takeProfitPips * 0.0001)
            : data.close - (config.takeProfitPips * 0.0001);

        const position = {
            id: Date.now() + Math.random(),
            direction,
            entryPrice: data.close,
            entryTime: data.timestamp,
            quantity: positionSize,
            stopLoss,
            takeProfit,
            status: 'OPEN'
        };

        return {
            ...state,
            position,
            capital: state.capital - (positionSize * data.close)
        };
    }

    updatePosition(state, data, config) {
        const { position } = state;
        if (!position) return state;

        // Check stop loss
        if ((position.direction === 'BUY' && data.low <= position.stopLoss) ||
            (position.direction === 'SELL' && data.high >= position.stopLoss)) {
            return this.closePosition(state, data, 'STOP_LOSS');
        }

        // Check take profit
        if ((position.direction === 'BUY' && data.high >= position.takeProfit) ||
            (position.direction === 'SELL' && data.low <= position.takeProfit)) {
            return this.closePosition(state, data, 'TAKE_PROFIT');
        }

        return state;
    }

    closePosition(state, data, reason) {
        const { position } = state;
        if (!position) return state;

        const exitPrice = this.getExitPrice(position, data, reason);
        const profitLoss = this.calculateProfitLoss(position, exitPrice);
        
        const trade = {
            ...position,
            exitPrice,
            exitTime: data.timestamp,
            profitLoss,
            closeReason: reason,
            status: 'CLOSED'
        };

        return {
            ...state,
            position: null,
            capital: state.capital + (position.quantity * exitPrice) + profitLoss,
            trades: [...state.trades, trade]
        };
    }

    getExitPrice(position, data, reason) {
        switch (reason) {
            case 'STOP_LOSS':
                return position.stopLoss;
            case 'TAKE_PROFIT':
                return position.takeProfit;
            default:
                return data.close;
        }
    }

    calculateProfitLoss(position, exitPrice) {
        const priceDifference = position.direction === 'BUY'
            ? exitPrice - position.entryPrice
            : position.entryPrice - exitPrice;
            
        return priceDifference * position.quantity;
    }

    calculatePositionSize(capital, riskPercent, entryPrice, stopLossPips) {
        const riskAmount = capital * (riskPercent / 100);
        const pipValue = 0.0001;
        const riskInPips = stopLossPips * pipValue;
        
        return riskAmount / riskInPips;
    }

    calculateCurrentEquity(state, data) {
        if (!state.position) return state.capital;
        
        const unrealizedPnL = this.calculateProfitLoss(state.position, data.close);
        return state.capital + (state.position.quantity * data.close) + unrealizedPnL;
    }

    updateDrawdown(state, currentEquity) {
        if (currentEquity > state.peakEquity) {
            state.peakEquity = currentEquity;
        }
        
        const drawdown = ((state.peakEquity - currentEquity) / state.peakEquity) * 100;
        state.maxDrawdown = Math.max(state.maxDrawdown, drawdown);
        
        return state;
    }

    // Results Generation
    generateResults(state, config) {
        const analysis = this.tradingEngine.analyzePerformance(state.trades);
        
        return {
            config,
            trades: state.trades,
            equity: state.equity,
            metrics: {
                totalTrades: analysis.totalTrades,
                winningTrades: analysis.winningTrades,
                losingTrades: analysis.losingTrades,
                winRate: analysis.winRate,
                totalProfit: analysis.totalProfit,
                profitFactor: analysis.profitFactor,
                maxDrawdown: state.maxDrawdown,
                sharpeRatio: this.calculateSharpeRatio(state.equity),
                finalEquity: state.equity[state.equity.length - 1],
                totalReturn: ((state.equity[state.equity.length - 1] - config.initialCapital) / config.initialCapital) * 100
            },
            monthlyPerformance: this.calculateMonthlyPerformance(state.trades),
            generatedAt: new Date().toISOString()
        };
    }

    calculateSharpeRatio(equity) {
        if (equity.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < equity.length; i++) {
            returns.push((equity[i] - equity[i - 1]) / equity[i - 1]);
        }
        
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const stdDev = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length);
        
        return stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
    }

    calculateMonthlyPerformance(trades) {
        const monthly = {};
        
        trades.forEach(trade => {
            const month = trade.entryTime.substring(0, 7); // YYYY-MM
            if (!monthly[month]) {
                monthly[month] = { profit: 0, trades: 0 };
            }
            monthly[month].profit += trade.profitLoss;
            monthly[month].trades++;
        });
        
        return monthly;
    }

    // Historical Data Generation
    generateHistoricalData(pair, days, timeframe) {
        const data = [];
        const basePrice = this.getBasePrice(pair);
        const volatility = 0.001; // 0.1% daily volatility
        
        let currentPrice = basePrice;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        for (let i = 0; i < days * 24 * 6; i++) { // 10-min intervals for 30 days
            const timestamp = new Date(startDate.getTime() + i * 10 * 60 * 1000);
            
            // Random walk with drift
            const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
            currentPrice += change;
            
            // Ensure price doesn't go negative
            currentPrice = Math.max(currentPrice, basePrice * 0.5);
            
            data.push({
                timestamp: timestamp.toISOString(),
                open: currentPrice - (Math.random() * volatility * currentPrice),
                high: currentPrice + (Math.random() * volatility * currentPrice),
                low: currentPrice - (Math.random() * volatility * currentPrice),
                close: currentPrice,
                volume: Math.random() * 1000
            });
        }
        
        return data;
    }

    getBasePrice(pair) {
        const prices = {
            'EUR/USD': 1.0850,
            'GBP/USD': 1.2650,
            'USD/JPY': 150.25,
            'AUD/USD': 0.6550
        };
        return prices[pair] || 1.0000;
    }

    // Get strategy parameters template
    getStrategyParams(strategy) {
        return this.strategyParams[strategy] || {};
    }
}

// Create global instance
const backtestEngine = new BacktestEngine();
