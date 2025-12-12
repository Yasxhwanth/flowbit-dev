/**
 * Candle Validation Tests
 *
 * Run with: npx vitest run src/lib/broker/__tests__/validate-candles.test.ts
 */

import { describe, it, expect } from 'vitest';
import { validateCandleRequest } from '../validate-candles';
import { BrokerValidationError, type CandleRequest } from '../types';

const baseRequest: CandleRequest = {
    symbol: 'RELIANCE',
    securityId: '2885',
    exchangeSegment: 'NSE_EQ',
    interval: '1d',
};

describe('validateCandleRequest', () => {
    describe('interval validation', () => {
        it('should accept valid intervals for Dhan', () => {
            expect(() => validateCandleRequest({ ...baseRequest, interval: '1m' }, 'dhan')).not.toThrow();
            expect(() => validateCandleRequest({ ...baseRequest, interval: '1d' }, 'dhan')).not.toThrow();
        });

        it('should accept valid intervals for Fyers', () => {
            expect(() => validateCandleRequest({ ...baseRequest, interval: '1m' }, 'fyers')).not.toThrow();
            expect(() => validateCandleRequest({ ...baseRequest, interval: '1d' }, 'fyers')).not.toThrow();
        });

        it('should accept valid intervals for Angel', () => {
            expect(() => validateCandleRequest({ ...baseRequest, interval: '1m' }, 'angel')).not.toThrow();
            expect(() => validateCandleRequest({ ...baseRequest, interval: '1d' }, 'angel')).not.toThrow();
        });

        it('should reject invalid intervals', () => {
            expect(() => validateCandleRequest({ ...baseRequest, interval: '2m' as '1m' }, 'dhan')).toThrow(BrokerValidationError);
            expect(() => validateCandleRequest({ ...baseRequest, interval: 'invalid' as '1m' }, 'fyers')).toThrow(BrokerValidationError);
        });
    });

    describe('securityId requirement', () => {
        it('should require securityId for Dhan', () => {
            const request = { ...baseRequest, securityId: undefined };
            expect(() => validateCandleRequest(request as CandleRequest, 'dhan')).toThrow(BrokerValidationError);
        });

        it('should not require securityId for Fyers', () => {
            const request = { ...baseRequest, securityId: undefined };
            expect(() => validateCandleRequest(request as CandleRequest, 'fyers')).not.toThrow();
        });

        it('should not require securityId for Angel', () => {
            const request = { ...baseRequest, securityId: undefined };
            expect(() => validateCandleRequest(request as CandleRequest, 'angel')).not.toThrow();
        });
    });

    describe('exchangeSegment requirement', () => {
        it('should require exchangeSegment for Dhan', () => {
            const request = { ...baseRequest, exchangeSegment: undefined };
            expect(() => validateCandleRequest(request as CandleRequest, 'dhan')).toThrow(BrokerValidationError);
        });

        it('should not require exchangeSegment for Fyers', () => {
            const request = { ...baseRequest, exchangeSegment: undefined };
            expect(() => validateCandleRequest(request as CandleRequest, 'fyers')).not.toThrow();
        });
    });

    describe('symbol validation', () => {
        it('should require symbol', () => {
            const request = { ...baseRequest, symbol: '' };
            expect(() => validateCandleRequest(request, 'dhan')).toThrow(BrokerValidationError);
        });
    });

    describe('date range validation', () => {
        it('should reject fromTimestamp after toTimestamp', () => {
            const request = {
                ...baseRequest,
                fromTimestamp: Date.now(),
                toTimestamp: Date.now() - 1000,
            };
            expect(() => validateCandleRequest(request, 'dhan')).toThrow(BrokerValidationError);
        });
    });
});
