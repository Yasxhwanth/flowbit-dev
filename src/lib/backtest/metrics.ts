/**
 * Backtest Metrics Calculator
 * Computes performance metrics from trade history
 */

import type { BacktestTrade, BacktestMetrics, EquityPoint } from './types';

/**
 * Compute performance metrics from trades
 *
 * @param trades - List of executed trades
 * @param initialCapital - Starting capital
 * @returns Performance metrics
 */
export function computeMetrics(
    trades: BacktestTrade[],
    initialCapital: number
): BacktestMetrics {
    if (trades.length === 0) {
        return {
            totalTrades: 0,
            winRate: 0,
            totalPNL: 0,
            maxDrawdown: 0,
        };
    }

    // Filter trades with PNL (only SELL trades)
    const closingTrades = trades.filter((t) => t.pnl !== undefined);
    const winningTrades = closingTrades.filter((t) => (t.pnl ?? 0) > 0);
    const losingTrades = closingTrades.filter((t) => (t.pnl ?? 0) < 0);

    // Total PNL
    const totalPNL = closingTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

    // Win rate
    const winRate = closingTrades.length > 0 ? winningTrades.length / closingTrades.length : 0;

    // Profit factor
    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    // Average trade PNL
    const avgTradePNL = closingTrades.length > 0 ? totalPNL / closingTrades.length : 0;

    // Max drawdown calculation
    const maxDrawdown = calculateMaxDrawdown(trades, initialCapital);

    // Sharpe ratio (simplified - using trade returns)
    const sharpe = calculateSharpe(closingTrades, initialCapital);

    return {
        totalTrades: trades.length,
        winRate,
        totalPNL,
        maxDrawdown,
        sharpe,
        profitFactor,
        avgTradePNL,
    };
}

/**
 * Build equity curve from trades
 *
 * @param trades - List of executed trades
 * @param initialCapital - Starting capital
 * @returns Equity curve points
 */
export function buildEquityCurve(
    trades: BacktestTrade[],
    initialCapital: number
): EquityPoint[] {
    const curve: EquityPoint[] = [];
    let equity = initialCapital;

    // Initial point
    if (trades.length > 0) {
        curve.push({
            timestamp: trades[0].timestamp,
            equity: initialCapital,
        });
    }

    // Build curve from trades
    for (const trade of trades) {
        if (trade.pnl !== undefined) {
            equity += trade.pnl;
        }
        curve.push({
            timestamp: trade.timestamp,
            equity,
        });
    }

    return curve;
}

/**
 * Calculate maximum drawdown from trades
 */
function calculateMaxDrawdown(trades: BacktestTrade[], initialCapital: number): number {
    let equity = initialCapital;
    let peak = initialCapital;
    let maxDrawdown = 0;

    for (const trade of trades) {
        if (trade.pnl !== undefined) {
            equity += trade.pnl;
        }

        if (equity > peak) {
            peak = equity;
        }

        const drawdown = peak > 0 ? (peak - equity) / peak : 0;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
}

/**
 * Calculate Sharpe ratio (simplified)
 */
function calculateSharpe(closingTrades: BacktestTrade[], initialCapital: number): number {
    if (closingTrades.length < 2) return 0;

    // Calculate returns
    const returns = closingTrades.map((t) => (t.pnl ?? 0) / initialCapital);

    // Mean return
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Standard deviation
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Sharpe (assuming risk-free rate = 0)
    return stdDev > 0 ? meanReturn / stdDev : 0;
}
