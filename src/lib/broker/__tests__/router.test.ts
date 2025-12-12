/**
 * Broker Router Tests
 *
 * Run with: npx vitest run src/lib/broker/__tests__/router.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { brokerRouter } from '../router';
import { BrokerValidationError } from '../types';

// Mock adapters
vi.mock('../adapters/dhan', () => ({
    marketData: vi.fn().mockResolvedValue({
        open: [100], high: [110], low: [95], close: [105], volume: [1000], timestamps: [Date.now()],
    }),
    placeOrder: vi.fn().mockResolvedValue({
        orderId: 'DHAN-123', status: 'PENDING', raw: {},
    }),
}));

vi.mock('../adapters/fyers', () => ({
    marketData: vi.fn().mockResolvedValue({
        open: [100], high: [110], low: [95], close: [105], volume: [1000], timestamps: [Date.now()],
    }),
    placeOrder: vi.fn().mockResolvedValue({
        orderId: 'FYERS-123', status: 'PENDING', raw: {},
    }),
}));

describe('brokerRouter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('routing', () => {
        it('should route marketData to dhan adapter', async () => {
            const dhan = await import('../adapters/dhan');

            const result = await brokerRouter({
                broker: 'dhan',
                action: 'marketData',
                payload: { symbol: 'RELIANCE', securityId: '2885', exchangeSegment: 'NSE_EQ', interval: '1d' },
                creds: { accessToken: 'token' },
            });

            expect(dhan.marketData).toHaveBeenCalled();
            expect(result).toHaveProperty('open');
        });

        it('should route placeOrder to fyers adapter', async () => {
            const fyers = await import('../adapters/fyers');

            const result = await brokerRouter({
                broker: 'fyers',
                action: 'placeOrder',
                payload: { symbol: 'RELIANCE', side: 'BUY', quantity: 1, orderType: 'MARKET' },
                creds: { accessToken: 'token', appId: 'app' },
            });

            expect(fyers.placeOrder).toHaveBeenCalled();
            expect(result).toHaveProperty('orderId');
        });

        it('should pass credentials to adapter', async () => {
            const dhan = await import('../adapters/dhan');
            const creds = { accessToken: 'test-token', clientId: 'test-client' };

            await brokerRouter({
                broker: 'dhan',
                action: 'marketData',
                payload: { symbol: 'RELIANCE', securityId: '2885', exchangeSegment: 'NSE_EQ', interval: '1d' },
                creds,
            });

            expect(dhan.marketData).toHaveBeenCalledWith(
                expect.any(Object),
                creds
            );
        });
    });

    describe('validation', () => {
        it('should throw for unsupported broker', async () => {
            await expect(
                brokerRouter({
                    broker: 'unsupported' as 'dhan',
                    action: 'marketData',
                    payload: {},
                })
            ).rejects.toThrow(BrokerValidationError);
        });

        it('should throw for unsupported action', async () => {
            await expect(
                brokerRouter({
                    broker: 'dhan',
                    action: 'unsupported' as 'marketData',
                    payload: {},
                })
            ).rejects.toThrow(BrokerValidationError);
        });
    });
});
