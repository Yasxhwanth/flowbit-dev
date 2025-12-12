/**
 * Simulator Tests
 *
 * Run with: npx vitest run src/lib/backtest/__tests__/simulator.test.ts
 */

import { describe, it, expect } from 'vitest';
import { simulateOrder, createInitialPosition } from '../simulator';
import type { BacktestTrade, Position } from '../types';

describe('simulateOrder', () => {
    describe('BUY orders', () => {
        it('should open a new long position on BUY', () => {
            const trades: BacktestTrade[] = [];
            const position = createInitialPosition();

            const result = simulateOrder({
                type: 'BUY',
                quantity: 10,
                price: 100,
                timestamp: Date.now(),
                position,
                trades,
            });

            expect(result.position.quantity).toBe(10);
            expect(result.position.averagePrice).toBe(100);
            expect(result.realizedPNL).toBe(0);
            expect(trades.length).toBe(1);
            expect(trades[0].type).toBe('BUY');
        });

        it('should add to existing position and update average price', () => {
            const trades: BacktestTrade[] = [];
            const position: Position = { quantity: 10, averagePrice: 100 };

            const result = simulateOrder({
                type: 'BUY',
                quantity: 10,
                price: 120,
                timestamp: Date.now(),
                position,
                trades,
            });

            expect(result.position.quantity).toBe(20);
            expect(result.position.averagePrice).toBe(110); // (10*100 + 10*120) / 20 = 110
        });
    });

    describe('SELL orders', () => {
        it('should close position and calculate profit', () => {
            const trades: BacktestTrade[] = [];
            const position: Position = { quantity: 10, averagePrice: 100 };

            const result = simulateOrder({
                type: 'SELL',
                quantity: 10,
                price: 120,
                timestamp: Date.now(),
                position,
                trades,
            });

            expect(result.position.quantity).toBe(0);
            expect(result.realizedPNL).toBe(200); // (120-100) * 10
            expect(trades[0].pnl).toBe(200);
        });

        it('should close position and calculate loss', () => {
            const trades: BacktestTrade[] = [];
            const position: Position = { quantity: 10, averagePrice: 100 };

            const result = simulateOrder({
                type: 'SELL',
                quantity: 10,
                price: 80,
                timestamp: Date.now(),
                position,
                trades,
            });

            expect(result.position.quantity).toBe(0);
            expect(result.realizedPNL).toBe(-200); // (80-100) * 10
        });

        it('should handle partial close', () => {
            const trades: BacktestTrade[] = [];
            const position: Position = { quantity: 10, averagePrice: 100 };

            const result = simulateOrder({
                type: 'SELL',
                quantity: 5,
                price: 120,
                timestamp: Date.now(),
                position,
                trades,
            });

            expect(result.position.quantity).toBe(5);
            expect(result.position.averagePrice).toBe(100);
            expect(result.realizedPNL).toBe(100); // (120-100) * 5
        });
    });
});

describe('createInitialPosition', () => {
    it('should return flat position', () => {
        const position = createInitialPosition();

        expect(position.quantity).toBe(0);
        expect(position.averagePrice).toBe(0);
    });
});
