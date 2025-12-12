/**
 * AngelOne Adapter Tests
 *
 * Run with: npx vitest run src/lib/broker/__tests__/angel-adapter.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { marketData, placeOrder } from '../adapters/angel';
import { BrokerAuthError } from '../types';

// Mock fetch-wrapper
vi.mock('../fetch-wrapper', () => ({
    createBrokerFetch: vi.fn().mockReturnValue(
        vi.fn().mockResolvedValue({
            status: true,
            message: 'SUCCESS',
            errorcode: '',
            data: [
                { timestamp: '2024-01-01 09:15', open: 100, high: 110, low: 95, close: 105, volume: 1000 },
            ],
        })
    ),
}));

describe('Angel Adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('marketData', () => {
        it('should throw if accessToken missing', async () => {
            await expect(
                marketData(
                    { symbol: 'RELIANCE', securityId: '2885', exchangeSegment: 'NSE_EQ', interval: '1d' },
                    { apiKey: 'key' }
                )
            ).rejects.toThrow(BrokerAuthError);
        });

        it('should throw if apiKey missing', async () => {
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
                { accessToken: 'token', apiKey: 'key' }
            );

            expect(result.orderId).toMatch(/^ANGEL-SIM-/);
            expect(result.status).toBe('SIMULATED');
            expect(result.raw.simulated).toBe(true);
            expect(result.raw.broker).toBe('angel');
        });

        it('should not call API when dryRun is true', async () => {
            const { createBrokerFetch } = await import('../fetch-wrapper');

            await placeOrder(
                { symbol: 'RELIANCE', side: 'BUY', quantity: 1, orderType: 'MARKET', dryRun: true },
                { accessToken: 'token', apiKey: 'key' }
            );

            expect(createBrokerFetch).not.toHaveBeenCalled();
        });

        it('should throw if accessToken missing for live order', async () => {
            await expect(
                placeOrder(
                    { symbol: 'RELIANCE', side: 'BUY', quantity: 1, orderType: 'MARKET' },
                    { apiKey: 'key' }
                )
            ).rejects.toThrow(BrokerAuthError);
        });

        it('should throw if apiKey missing for live order', async () => {
            await expect(
                placeOrder(
                    { symbol: 'RELIANCE', side: 'BUY', quantity: 1, orderType: 'MARKET' },
                    { accessToken: 'token' }
                )
            ).rejects.toThrow(BrokerAuthError);
        });
    });
});
