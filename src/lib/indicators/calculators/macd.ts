/**
 * MACD - Moving Average Convergence Divergence Calculator
 * Formula:
 *   MACD Line = EMA(fast) - EMA(slow)
 *   Signal Line = EMA(signalPeriod) of MACD Line
 *   Histogram = MACD Line - Signal Line
 */

import type {
    CandleData,
    IndicatorCalculator,
    MACDConfig,
    MACDValue,
} from '../types';
import { InsufficientDataError } from '../types';
import { calculateEMA } from './ema';

/**
 * Default MACD parameters
 */
const DEFAULT_FAST_PERIOD = 12;
const DEFAULT_SLOW_PERIOD = 26;
const DEFAULT_SIGNAL_PERIOD = 9;

/**
 * Calculate MACD for an array of prices
 * @param prices - Array of price values (typically close prices)
 * @param fastPeriod - Fast EMA period (default: 12)
 * @param slowPeriod - Slow EMA period (default: 26)
 * @param signalPeriod - Signal line EMA period (default: 9)
 * @returns Array of MACD values
 */
export function calculateMACD(
    prices: number[],
    fastPeriod = DEFAULT_FAST_PERIOD,
    slowPeriod = DEFAULT_SLOW_PERIOD,
    signalPeriod = DEFAULT_SIGNAL_PERIOD
): MACDValue[] {
    const minLength = slowPeriod + signalPeriod - 1;

    if (prices.length < minLength) {
        return prices.map(() => ({
            line: NaN,
            signal: NaN,
            histogram: NaN,
        }));
    }

    // Calculate fast and slow EMAs
    const fastEMA = calculateEMA(prices, fastPeriod);
    const slowEMA = calculateEMA(prices, slowPeriod);

    // Calculate MACD line (fast EMA - slow EMA)
    const macdLine: number[] = [];
    for (let i = 0; i < prices.length; i++) {
        if (Number.isNaN(fastEMA[i]) || Number.isNaN(slowEMA[i])) {
            macdLine.push(NaN);
        } else {
            macdLine.push(fastEMA[i] - slowEMA[i]);
        }
    }

    // Calculate signal line (EMA of MACD line)
    const validMacdStart = slowPeriod - 1;
    const validMacdValues = macdLine.slice(validMacdStart);
    const signalEMA = calculateEMA(validMacdValues, signalPeriod);

    // Build result array
    const result: MACDValue[] = new Array(prices.length);

    for (let i = 0; i < prices.length; i++) {
        if (i < validMacdStart) {
            result[i] = { line: NaN, signal: NaN, histogram: NaN };
        } else {
            const macd = macdLine[i];
            const signalIdx = i - validMacdStart;
            const signal = signalEMA[signalIdx];

            result[i] = {
                line: macd,
                signal: signal,
                histogram: Number.isNaN(macd) || Number.isNaN(signal) ? NaN : macd - signal,
            };
        }
    }

    return result;
}

/**
 * MACD Calculator implementation
 */
export const macdCalculator: IndicatorCalculator<MACDConfig> = {
    calculate(data: CandleData, config: MACDConfig): MACDValue[] {
        const prices = data.close;
        const fastPeriod = config.fastPeriod ?? DEFAULT_FAST_PERIOD;
        const slowPeriod = config.slowPeriod ?? DEFAULT_SLOW_PERIOD;
        const signalPeriod = config.signalPeriod ?? DEFAULT_SIGNAL_PERIOD;

        const minLength = slowPeriod + signalPeriod - 1;

        if (prices.length < minLength) {
            throw new InsufficientDataError('MACD', minLength, prices.length);
        }

        return calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod);
    },

    getLatest(data: CandleData, config: MACDConfig): MACDValue {
        const prices = data.close;
        const fastPeriod = config.fastPeriod ?? DEFAULT_FAST_PERIOD;
        const slowPeriod = config.slowPeriod ?? DEFAULT_SLOW_PERIOD;
        const signalPeriod = config.signalPeriod ?? DEFAULT_SIGNAL_PERIOD;

        const minLength = slowPeriod + signalPeriod - 1;

        if (prices.length < minLength) {
            throw new InsufficientDataError('MACD', minLength, prices.length);
        }

        const values = calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod);
        const lastValid = values.filter((v) => !Number.isNaN(v.line)).pop();
        return lastValid ?? { line: NaN, signal: NaN, histogram: NaN };
    },

    getKey(config: MACDConfig): string {
        const fast = config.fastPeriod ?? DEFAULT_FAST_PERIOD;
        const slow = config.slowPeriod ?? DEFAULT_SLOW_PERIOD;
        const signal = config.signalPeriod ?? DEFAULT_SIGNAL_PERIOD;

        if (fast === 12 && slow === 26 && signal === 9) {
            return 'MACD';
        }
        return `MACD_${fast}_${slow}_${signal}`;
    },
};
