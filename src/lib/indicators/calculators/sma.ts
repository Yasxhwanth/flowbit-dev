/**
 * SMA - Simple Moving Average Calculator
 * Formula: SMA = (P1 + P2 + ... + Pn) / n
 */

import type {
    CandleData,
    IndicatorCalculator,
    SMAConfig,
} from '../types';
import { InsufficientDataError } from '../types';

/**
 * Calculate Simple Moving Average for an array of prices
 * @param prices - Array of price values
 * @param period - Number of periods for the SMA
 * @returns Array of SMA values (NaN for indices before period-1)
 */
export function calculateSMA(prices: number[], period: number): number[] {
    if (prices.length < period) {
        return prices.map(() => NaN);
    }

    const result: number[] = new Array(prices.length).fill(NaN);

    // Calculate first SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += prices[i];
    }
    result[period - 1] = sum / period;

    // Calculate subsequent SMAs using sliding window
    for (let i = period; i < prices.length; i++) {
        sum = sum - prices[i - period] + prices[i];
        result[i] = sum / period;
    }

    return result;
}

/**
 * SMA Calculator implementation
 */
export const smaCalculator: IndicatorCalculator<SMAConfig> = {
    calculate(data: CandleData, config: SMAConfig): number[] {
        const source = config.source ?? 'close';
        const prices = data[source];

        if (prices.length < config.period) {
            throw new InsufficientDataError('SMA', config.period, prices.length);
        }

        return calculateSMA(prices, config.period);
    },

    getLatest(data: CandleData, config: SMAConfig): number {
        const source = config.source ?? 'close';
        const prices = data[source];

        if (prices.length < config.period) {
            throw new InsufficientDataError('SMA', config.period, prices.length);
        }

        const values = calculateSMA(prices, config.period);
        const lastValid = values.filter((v) => !Number.isNaN(v)).pop();
        return lastValid ?? NaN;
    },

    getKey(config: SMAConfig): string {
        return `SMA_${config.period}`;
    },
};
