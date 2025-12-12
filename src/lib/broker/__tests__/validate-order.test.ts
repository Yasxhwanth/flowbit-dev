/**
 * Order Validation Tests
 *
 * Run with: npx vitest run src/lib/broker/__tests__/validate-order.test.ts
 */

import { describe, it, expect } from 'vitest';
import { validateOrder } from '../validate-order';
import { BrokerValidationError, type OrderRequest } from '../types';

const baseOrder: OrderRequest = {
    symbol: 'RELIANCE',
    securityId: '2885',
    exchangeSegment: 'NSE_EQ',
    side: 'BUY',
    quantity: 1,
    orderType: 'MARKET',
};

describe('validateOrder', () => {
    describe('order type validation', () => {
        it('should accept MARKET orders for all brokers', () => {
            expect(() => validateOrder({ ...baseOrder, orderType: 'MARKET' }, 'dhan')).not.toThrow();
            expect(() => validateOrder({ ...baseOrder, orderType: 'MARKET' }, 'fyers')).not.toThrow();
            expect(() => validateOrder({ ...baseOrder, orderType: 'MARKET' }, 'angel')).not.toThrow();
        });

        it('should accept LIMIT orders for all brokers', () => {
            expect(() => validateOrder({ ...baseOrder, orderType: 'LIMIT', price: 100 }, 'dhan')).not.toThrow();
            expect(() => validateOrder({ ...baseOrder, orderType: 'LIMIT', price: 100 }, 'fyers')).not.toThrow();
            expect(() => validateOrder({ ...baseOrder, orderType: 'LIMIT', price: 100 }, 'angel')).not.toThrow();
        });
    });

    describe('product type validation', () => {
        it('should accept CNC for Dhan', () => {
            expect(() => validateOrder({ ...baseOrder, productType: 'CNC' }, 'dhan')).not.toThrow();
        });

        it('should reject DELIVERY for Dhan (Dhan uses CNC)', () => {
            expect(() => validateOrder({ ...baseOrder, productType: 'DELIVERY' }, 'dhan')).toThrow(BrokerValidationError);
        });

        it('should accept DELIVERY for Angel', () => {
            expect(() => validateOrder({ ...baseOrder, productType: 'DELIVERY' }, 'angel')).not.toThrow();
        });
    });

    describe('securityId requirement', () => {
        it('should require securityId for Dhan', () => {
            const order = { ...baseOrder, securityId: undefined };
            expect(() => validateOrder(order as OrderRequest, 'dhan')).toThrow(BrokerValidationError);
        });

        it('should not require securityId for Fyers', () => {
            const order = { ...baseOrder, securityId: undefined };
            expect(() => validateOrder(order as OrderRequest, 'fyers')).not.toThrow();
        });

        it('should not require securityId for Angel', () => {
            const order = { ...baseOrder, securityId: undefined };
            expect(() => validateOrder(order as OrderRequest, 'angel')).not.toThrow();
        });
    });

    describe('exchangeSegment requirement', () => {
        it('should require exchangeSegment for Dhan', () => {
            const order = { ...baseOrder, exchangeSegment: undefined };
            expect(() => validateOrder(order as OrderRequest, 'dhan')).toThrow(BrokerValidationError);
        });

        it('should not require exchangeSegment for Fyers', () => {
            const order = { ...baseOrder, exchangeSegment: undefined };
            expect(() => validateOrder(order as OrderRequest, 'fyers')).not.toThrow();
        });
    });

    describe('LIMIT order validation', () => {
        it('should require price for LIMIT orders', () => {
            expect(() => validateOrder({ ...baseOrder, orderType: 'LIMIT' }, 'dhan')).toThrow(BrokerValidationError);
        });

        it('should accept LIMIT orders with price', () => {
            expect(() => validateOrder({ ...baseOrder, orderType: 'LIMIT', price: 100 }, 'dhan')).not.toThrow();
        });
    });

    describe('quantity validation', () => {
        it('should reject zero quantity', () => {
            expect(() => validateOrder({ ...baseOrder, quantity: 0 }, 'dhan')).toThrow(BrokerValidationError);
        });

        it('should reject negative quantity', () => {
            expect(() => validateOrder({ ...baseOrder, quantity: -1 }, 'dhan')).toThrow(BrokerValidationError);
        });
    });
});
