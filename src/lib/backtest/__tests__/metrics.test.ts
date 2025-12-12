/**
 * Metrics Tests
 *
 * Run with: npx vitest run src/lib/backtest/__tests__/metrics.test.ts
 */

import { describe, it, expect } from 'vitest';
import { computeMetrics, buildEquityCurve } from '../metrics';
import type { BacktestTrade } from '../types';

describe('computeMetrics', () => {
    it('should return zero metrics for empty trades', () => {
        const metrics = computeMetrics([], 100000);

        expect(metrics.totalTrades).toBe(0);
        expect(metrics.winRate).toBe(0);
        expect(metrics.totalPNL).toBe(0);
        expect(metrics.maxDrawdown).toBe(0);
    });

    it('should calculate correct metrics for profitable trades', () => {
        const trades: BacktestTrade[] = [
            { type: 'BUY', quantity: 10, price: 100, timestamp: 1000 },
            { type: 'SELL', quantity: 10, price: 120, timestamp: 2000, pnl: 200 },
            { type: 'BUY', quantity: 10, price: 110, timestamp: 3000 },
            { type: 'SELL', quantity: 10, price: 130, timestamp: 4000, pnl: 200 },
        ];

        const metrics = computeMetrics(trades, 100000);

        expect(metrics.totalTrades).toBe(4);
        expect(metrics.winRate).toBe(1); // All wins
        expect(metrics.totalPNL).toBe(400);
    });

    it('should calculate win rate correctly with mixed trades', () => {
        const trades: BacktestTrade[] = [
            { type: 'BUY', quantity: 10, price: 100, timestamp: 1000 },
            { type: 'SELL', quantity: 10, price: 120, timestamp: 2000, pnl: 200 },  // Win
            { type: 'BUY', quantity: 10, price: 130, timestamp: 3000 },
            { type: 'SELL', quantity: 10, price: 110, timestamp: 4000, pnl: -200 }, // Loss
        ];

        const metrics = computeMetrics(trades, 100000);

        expect(metrics.winRate).toBe(0.5); // 1 win, 1 loss
        expect(metrics.totalPNL).toBe(0);
    });

    it('should calculate max drawdown correctly', () => {
        const trades: BacktestTrade[] = [
            { type: 'SELL', quantity: 10, price: 100, timestamp: 1000, pnl: 100 },  // +100 -> 100100
            { type: 'SELL', quantity: 10, price: 100, timestamp: 2000, pnl: -200 }, // -200 -> 99900
            { type: 'SELL', quantity: 10, price: 100, timestamp: 3000, pnl: -100 }, // -100 -> 99800
            { type: 'SELL', quantity: 10, price: 100, timestamp: 4000, pnl: 500 },  // +500 -> 100300
        ];

        const metrics = computeMetrics(trades, 100000);

        // Peak was 100100, trough was 99800
        // Drawdown = (100100 - 99800) / 100100 ≈ 0.003
        expect(metrics.maxDrawdown).toBeGreaterThan(0);
        expect(metrics.maxDrawdown).toBeLessThan(0.01);
    });
});

describe('buildEquityCurve', () => {
    it('should build correct equity curve', () => {
        const trades: BacktestTrade[] = [
            { type: 'BUY', quantity: 10, price: 100, timestamp: 1000 },
            { type: 'SELL', quantity: 10, price: 120, timestamp: 2000, pnl: 200 },
            { type: 'BUY', quantity: 10, price: 110, timestamp: 3000 },
            { type: 'SELL', quantity: 10, price: 100, timestamp: 4000, pnl: -100 },
        ];

        const curve = buildEquityCurve(trades, 100000);

        expect(curve.length).toBe(5); // Initial + 4 trades
        expect(curve[0].equity).toBe(100000);
        expect(curve[curve.length - 1].equity).toBe(100100);
    });
});
