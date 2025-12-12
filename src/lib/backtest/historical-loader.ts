/**
 * Historical Candle Loader
 * Loads historical candles for backtesting
 */

import { brokerRouter } from '../broker/router';
import type { BrokerName, BrokerCreds, NormalizedCandles, CandleRequest } from '../broker/types';

export interface LoadHistoricalOptions {
    symbol: string;
    interval: string;
    from: number;
    to: number;
    broker: BrokerName;
    securityId?: string;
    exchangeSegment?: string;
    creds?: BrokerCreds;
}

/**
 * Load historical candles for backtesting
 *
 * @param options - Historical data options
 * @returns Normalized candles
 */
export async function loadHistoricalCandles(
    options: LoadHistoricalOptions
): Promise<NormalizedCandles> {
    const { symbol, interval, from, to, broker, securityId, exchangeSegment, creds } = options;

    console.log(`[Backtest] Loading historical candles: ${symbol} (${interval}) from ${new Date(from).toISOString()} to ${new Date(to).toISOString()}`);

    const request: CandleRequest = {
        symbol,
        securityId: securityId || symbol,
        exchangeSegment: (exchangeSegment || 'NSE_EQ') as CandleRequest['exchangeSegment'],
        interval: interval as CandleRequest['interval'],
        fromTimestamp: from,
        toTimestamp: to,
    };

    const candles = await brokerRouter<NormalizedCandles>({
        broker,
        action: 'marketData',
        payload: request,
        creds,
    });

    console.log(`[Backtest] Loaded ${candles.close.length} candles`);

    return candles;
}

/**
 * Slice candles up to a specific index (inclusive)
 * Used for iterative backtesting
 *
 * @param candles - Full candle dataset
 * @param endIndex - Last candle index to include (inclusive)
 * @returns Sliced candles
 */
export function sliceCandles(candles: NormalizedCandles, endIndex: number): NormalizedCandles {
    const idx = Math.min(endIndex + 1, candles.close.length);

    return {
        open: candles.open.slice(0, idx),
        high: candles.high.slice(0, idx),
        low: candles.low.slice(0, idx),
        close: candles.close.slice(0, idx),
        volume: candles.volume.slice(0, idx),
        timestamps: candles.timestamps.slice(0, idx),
    };
}
