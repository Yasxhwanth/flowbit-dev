/**
 * RSI - Relative Strength Index Calculator
 * Formula: RSI = 100 - (100 / (1 + RS))
 * RS = Average Gain / Average Loss
 * Uses Wilder's smoothing method
 */

import type {
    CandleData,
    IndicatorCalculator,
    RSIConfig,
} from '../types';
import { InsufficientDataError } from '../types';

/**
 * Calculate Relative Strength Index for an array of prices
 * @param prices - Array of price values (typically close prices)
 * @param period - Number of periods for RSI (typically 14)
 * @returns Array of RSI values (NaN for indices before period)
 */
export function calculateRSI(prices: number[], period: number): number[] {
    if (prices.length < period + 1) {
        return prices.map(() => NaN);
    }

    const result: number[] = new Array(prices.length).fill(NaN);
    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calculate initial average gain and loss
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < period; i++) {
        avgGain += gains[i];
        avgLoss += losses[i];
    }
    avgGain /= period;
    avgLoss /= period;

    // Calculate first RSI
    if (avgLoss === 0) {
        result[period] = 100;
    } else {
        const rs = avgGain / avgLoss;
        result[period] = 100 - 100 / (1 + rs);
    }

    // Calculate subsequent RSI using Wilder's smoothing
    for (let i = period; i < gains.length; i++) {
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

        if (avgLoss === 0) {
            result[i + 1] = 100;
        } else {
            const rs = avgGain / avgLoss;
            result[i + 1] = 100 - 100 / (1 + rs);
        }
    }

    return result;
}

/**
 * RSI Calculator implementation
 */
export const rsiCalculator: IndicatorCalculator<RSIConfig> = {
    calculate(data: CandleData, config: RSIConfig): number[] {
        const prices = data.close;

        if (prices.length < config.period + 1) {
            throw new InsufficientDataError('RSI', config.period + 1, prices.length);
        }

        return calculateRSI(prices, config.period);
    },

    getLatest(data: CandleData, config: RSIConfig): number {
        const prices = data.close;

        if (prices.length < config.period + 1) {
            throw new InsufficientDataError('RSI', config.period + 1, prices.length);
        }

        const values = calculateRSI(prices, config.period);
        const lastValid = values.filter((v) => !Number.isNaN(v)).pop();
        return lastValid ?? NaN;
    },

    getKey(config: RSIConfig): string {
        return `RSI_${config.period}`;
    },
};
