/**
 * Fyers Adapter Tests
 *
 * Run with: npx vitest run src/lib/broker/__tests__/fyers-adapter.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { marketData, placeOrder } from '../adapters/fyers';
import { BrokerAuthError } from '../types';

// Mock fetch-wrapper
vi.mock('../fetch-wrapper', () => ({
    createBrokerFetch: vi.fn().mockReturnValue(
        vi.fn().mockResolvedValue({
            s: 'ok',
            candles: [[1702300800, 100, 110, 95, 105, 1000]],
            id: 'FYERS-ORDER-123',
        })
    ),
}));

describe('Fyers Adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('marketData', () => {
        it('should throw if accessToken missing', async () => {
            await expect(
                marketData(
                    { symbol: 'RELIANCE', securityId: '2885', exchangeSegment: 'NSE_EQ', interval: '1d' },
                    { appId: 'app' }
                )
            ).rejects.toThrow(BrokerAuthError);
        });

        it('should throw if appId missing', async () => {
            await expect(
                marketData(
                    { symbol: 'RELIANCE', securityId: '2885', exchangeSegment: 'NSE_EQ', interval: '1d' },
                    { accessToken: 'token' }
                )
            ).rejects.toThrow(BrokerAuthError);
        });
    });

    describe('placeOrder', () => {
        it('should return simulated result when dryRun is true', async () => {
            const result = await placeOrder(
                { symbol: 'RELIANCE', side: 'BUY', quantity: 1, orderType: 'MARKET', dryRun: true },
                { accessToken: 'token', appId: 'app' }
            );

            expect(result.orderId).toMatch(/^FYERS-SIM-/);
            expect(result.status).toBe('SIMULATED');
            expect(result.raw.simulated).toBe(true);
        });

        it('should not call API when dryRun is true', async () => {
            const { createBrokerFetch } = await import('../fetch-wrapper');

            await placeOrder(
                { symbol: 'RELIANCE', side: 'BUY', quantity: 1, orderType: 'MARKET', dryRun: true },
                { accessToken: 'token', appId: 'app' }
            );

            expect(createBrokerFetch).not.toHaveBeenCalled();
        });

        it('should throw if accessToken missing for live order', async () => {
            await expect(
                placeOrder(
                    { symbol: 'RELIANCE', side: 'BUY', quantity: 1, orderType: 'MARKET' },
                    { appId: 'app' }
                )
            ).rejects.toThrow(BrokerAuthError);
        });
    });
});
