/**
 * Candles Service
 * Main entry point for fetching OHLC candle data (uses brokerRouter)
 */

import { brokerRouter } from './router';
import { validateCandleRequest } from './validate-candles';
import {
    type BrokerName,
    type BrokerCreds,
    type CandleRequest,
    type NormalizedCandles,
} from './types';

// ============================================================================
// Main API
// ============================================================================

/**
 * Fetch OHLC candle data via broker router
 *
 * @param request - Candle request parameters
 * @param broker - Broker to use (defaults to 'dhan')
 * @param creds - Optional user credentials
 * @returns Normalized candle data with aligned arrays
 *
 * @example
 * ```typescript
 * const candles = await fetchCandles({
 *   symbol: 'RELIANCE',
 *   securityId: '2885',
 *   exchangeSegment: 'NSE_EQ',
 *   interval: '1d',
 * }, 'dhan', { accessToken: '...' });
 * ```
 */
export async function fetchCandles(
    request: CandleRequest,
    broker: BrokerName = 'dhan',
    creds?: BrokerCreds
): Promise<NormalizedCandles> {
    // Validate request against broker capabilities
    validateCandleRequest(request, broker);

    console.log(`[Candles] Fetching via router: ${broker}`);

    return brokerRouter<NormalizedCandles>({
        broker,
        action: 'marketData',
        payload: request,
        creds,
    });
}

/**
 * Legacy: Get a broker adapter for advanced usage
 * @deprecated Use fetchCandles with broker parameter instead
 */
export function getBrokerAdapter(broker: BrokerName = 'dhan') {
    console.warn('[Candles] getBrokerAdapter is deprecated, use fetchCandles with broker parameter');

    // Return a minimal adapter-like object for backward compatibility
    return {
        name: broker,
        fetchCandles: (request: CandleRequest) => fetchCandles(request, broker),
    };
}

