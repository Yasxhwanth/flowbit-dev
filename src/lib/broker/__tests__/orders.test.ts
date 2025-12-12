/**
 * Dry Run Order Execution Tests
 *
 * Run with: npx vitest run src/lib/broker/__tests__/orders.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    executeOrderWithCredentials,
    createSimulatedOrderResult,
    type DhanCredentials,
} from '../orders';
import type { OrderRequest } from '../types';

// Mock the actual broker adapter to verify it's NOT called during dry run
vi.mock('../adapters/dhan', () => ({
    placeOrderWithCredentials: vi.fn().mockResolvedValue({
        orderId: 'REAL-123',
        status: 'PENDING',
        raw: { real: true },
    }),
}));

const mockCredentials: DhanCredentials = {
    accessToken: 'test-token',
    clientId: 'test-client',
};

const mockOrderRequest: OrderRequest = {
    symbol: 'RELIANCE',
    securityId: '2885',
    exchangeSegment: 'NSE_EQ',
    side: 'BUY',
    quantity: 1,
    orderType: 'MARKET',
};

describe('Dry Run Order Execution', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createSimulatedOrderResult', () => {
        it('should create a simulated order result', () => {
            const result = createSimulatedOrderResult(mockOrderRequest);

            expect(result.orderId).toMatch(/^SIM-[A-Z0-9]+$/);
            expect(result.status).toBe('SIMULATED');
            expect(result.filledPrice).toBeUndefined();
            expect(result.raw).toMatchObject({
                simulated: true,
                request: {
                    symbol: 'RELIANCE',
                    side: 'BUY',
                    quantity: 1,
                    orderType: 'MARKET',
                },
            });
            expect(result.raw.timestamp).toBeDefined();
        });

        it('should generate unique order IDs', () => {
            const result1 = createSimulatedOrderResult(mockOrderRequest);
            const result2 = createSimulatedOrderResult(mockOrderRequest);

            expect(result1.orderId).not.toBe(result2.orderId);
        });
    });

    describe('executeOrderWithCredentials with dryRun', () => {
        it('should return simulated result when dryRun is true', async () => {
            const { placeOrderWithCredentials } = await import('../adapters/dhan');

            const result = await executeOrderWithCredentials(
                mockOrderRequest,
                'dhan',
                mockCredentials,
                { dryRun: true }
            );

            expect(result.orderId).toMatch(/^SIM-/);
            expect(result.status).toBe('SIMULATED');
            expect(result.raw.simulated).toBe(true);

            // CRITICAL: Verify adapter was NOT called
            expect(placeOrderWithCredentials).not.toHaveBeenCalled();
        });

        it('should call adapter when dryRun is false', async () => {
            const { placeOrderWithCredentials } = await import('../adapters/dhan');

            const result = await executeOrderWithCredentials(
                mockOrderRequest,
                'dhan',
                mockCredentials,
                { dryRun: false }
            );

            expect(result.orderId).toBe('REAL-123');
            expect(result.status).toBe('PENDING');

            // Verify adapter WAS called
            expect(placeOrderWithCredentials).toHaveBeenCalledWith(
                mockOrderRequest,
                mockCredentials
            );
        });

        it('should call adapter when dryRun is not specified', async () => {
            const { placeOrderWithCredentials } = await import('../adapters/dhan');

            await executeOrderWithCredentials(
                mockOrderRequest,
                'dhan',
                mockCredentials
            );

            // Verify adapter WAS called (default behavior)
            expect(placeOrderWithCredentials).toHaveBeenCalled();
        });
    });
});
