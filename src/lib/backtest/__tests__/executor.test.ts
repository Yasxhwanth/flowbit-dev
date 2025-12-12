/**
 * Executor Tests
 *
 * Run with: npx vitest run src/lib/backtest/__tests__/executor.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WorkflowGraph } from '../../workflow/types';

// Mock broker router
vi.mock('../../broker/router', () => ({
    brokerRouter: vi.fn().mockResolvedValue({
        open: [100, 102, 101, 103, 105, 104, 106, 108, 107, 109],
        high: [105, 107, 106, 108, 110, 109, 111, 113, 112, 114],
        low: [98, 100, 99, 101, 103, 102, 104, 106, 105, 107],
        close: [102, 101, 103, 105, 104, 106, 108, 107, 109, 111],
        volume: [1000, 1100, 1050, 1200, 1150, 1250, 1300, 1200, 1350, 1400],
        timestamps: [
            1700000000000, 1700086400000, 1700172800000, 1700259200000, 1700345600000,
            1700432000000, 1700518400000, 1700604800000, 1700691200000, 1700777600000,
        ],
    }),
}));

// Mock indicators
vi.mock('../../indicators', () => ({
    calculateIndicators: vi.fn().mockImplementation((candles, configs) => {
        return {
            sma_5: 105,
            sma_10: 103,
        };
    }),
}));

// Mock conditions
vi.mock('../../conditions', () => ({
    evaluateCondition: vi.fn().mockImplementation((indicators, expression) => {
        const sma5 = indicators.sma_5 as number;
        const sma10 = indicators.sma_10 as number;

        if (expression.includes('>') && sma5 > sma10) {
            return { conditionMet: true, action: 'BUY' };
        }
        if (expression.includes('<') && sma5 < sma10) {
            return { conditionMet: true, action: 'SELL' };
        }
        return { conditionMet: false, action: null };
    }),
}));

describe('runBacktest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should execute backtest and return results', async () => {
        const { runBacktest } = await import('../executor');

        const workflow: WorkflowGraph = {
            nodes: [
                { id: 'candles', type: 'candles', data: { symbol: 'RELIANCE', interval: '1d' } },
                { id: 'indicators', type: 'indicators', data: { indicators: [{ type: 'sma', period: 5 }] } },
                { id: 'condition', type: 'condition', data: { expression: 'sma_5 > sma_10' } },
                { id: 'order', type: 'order', data: { quantity: 1 } },
            ],
            edges: [
                { source: 'candles', target: 'indicators' },
                { source: 'indicators', target: 'condition' },
                { source: 'condition', target: 'order' },
            ],
        };

        const result = await runBacktest({
            workflow,
            symbol: 'RELIANCE',
            broker: 'dhan',
            interval: '1d',
            from: 1700000000000,
            to: 1700777600000,
            initialCapital: 100000,
            securityId: '2885',
            exchangeSegment: 'NSE_EQ',
        });

        expect(result).toBeDefined();
        expect(result.config.symbol).toBe('RELIANCE');
        expect(result.config.candleCount).toBe(10);
        expect(result.metrics).toBeDefined();
        expect(result.equityCurve).toBeDefined();
        expect(result.logs.length).toBeGreaterThan(0);
    });
});
