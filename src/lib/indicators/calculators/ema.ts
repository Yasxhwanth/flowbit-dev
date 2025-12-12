/**
 * EMA - Exponential Moving Average Calculator
 * Formula: EMA = Price × k + EMA(prev) × (1 − k)
 * where k = 2 / (period + 1)
 */

import type {
    CandleData,
    IndicatorCalculator,
    EMAConfig,
} from '../types';
import { InsufficientDataError } from '../types';

/**
 * Calculate Exponential Moving Average for an array of prices
 * @param prices - Array of price values
 * @param period - Number of periods for the EMA
 * @returns Array of EMA values (NaN for indices before period-1)
 */
export function calculateEMA(prices: number[], period: number): number[] {
    if (prices.length < period) {
        return prices.map(() => NaN);
    }

    const result: number[] = new Array(prices.length).fill(NaN);
    const multiplier = 2 / (period + 1);

    // Use SMA as seed value for the first EMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += prices[i];
    }
    let ema = sum / period;
    result[period - 1] = ema;

    // Calculate subsequent EMAs
    for (let i = period; i < prices.length; i++) {
        ema = prices[i] * multiplier + ema * (1 - multiplier);
        result[i] = ema;
    }

    return result;
}

/**
 * EMA Calculator implementation
 */
export const emaCalculator: IndicatorCalculator<EMAConfig> = {
    calculate(data: CandleData, config: EMAConfig): number[] {
        const source = config.source ?? 'close';
        const prices = data[source];

        if (prices.length < config.period) {
            throw new InsufficientDataError('EMA', config.period, prices.length);
        }

        return calculateEMA(prices, config.period);
    },

    getLatest(data: CandleData, config: EMAConfig): number {
        const source = config.source ?? 'close';
        const prices = data[source];

        if (prices.length < config.period) {
            throw new InsufficientDataError('EMA', config.period, prices.length);
        }

        const values = calculateEMA(prices, config.period);
        const lastValid = values.filter((v) => !Number.isNaN(v)).pop();
        return lastValid ?? NaN;
    },

    getKey(config: EMAConfig): string {
        return `EMA_${config.period}`;
    },
};
