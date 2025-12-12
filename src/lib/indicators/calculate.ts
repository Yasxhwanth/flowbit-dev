/**
 * Indicator Calculation Service
 * Main entry point for calculating trading indicators
 */

import type {
    CandleData,
    IndicatorConfig,
    IndicatorResults,
    IndicatorValue,
} from './types';
import { IndicatorError } from './types';
import { getCalculator, isRegistered } from './registry';

/**
 * Calculate multiple indicators for the given candle data
 * 
 * @param candles - OHLCV candle data
 * @param configs - Array of indicator configurations
 * @returns Object with indicator results keyed by indicator name
 * 
 * @example
 * ```typescript
 * const results = calculateIndicators(candles, [
 *   { type: 'SMA', period: 20 },
 *   { type: 'RSI', period: 14 },
 *   { type: 'MACD' },
 * ]);
 * // Returns: { SMA_20: 150.5, RSI_14: 65.2, MACD: { line: 1.2, signal: 0.8, histogram: 0.4 } }
 * ```
 */
export function calculateIndicators(
    candles: CandleData,
    configs: IndicatorConfig[]
): IndicatorResults {
    validateCandleData(candles);

    const results: IndicatorResults = {};

    for (const config of configs) {
        const { type } = config;

        if (!isRegistered(type)) {
            throw new IndicatorError(
                `Unknown indicator type: ${type}`,
                type,
                'UNKNOWN_INDICATOR'
            );
        }

        const calculator = getCalculator(type);
        if (!calculator) {
            throw new IndicatorError(
                `Calculator not found for: ${type}`,
                type,
                'CALCULATOR_NOT_FOUND'
            );
        }

        try {
            const key = calculator.getKey(config);
            const value = calculator.getLatest(candles, config);
            results[key] = value;
        } catch (error) {
            if (error instanceof IndicatorError) {
                throw error;
            }
            throw new IndicatorError(
                `Failed to calculate ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                type,
                'CALCULATION_ERROR'
            );
        }
    }

    return results;
}

/**
 * Calculate full series for a single indicator
 * 
 * @param candles - OHLCV candle data
 * @param config - Indicator configuration
 * @returns Array of calculated values
 */
export function calculateIndicatorSeries(
    candles: CandleData,
    config: IndicatorConfig
): IndicatorValue[] {
    validateCandleData(candles);

    const { type } = config;

    if (!isRegistered(type)) {
        throw new IndicatorError(
            `Unknown indicator type: ${type}`,
            type,
            'UNKNOWN_INDICATOR'
        );
    }

    const calculator = getCalculator(type);
    if (!calculator) {
        throw new IndicatorError(
            `Calculator not found for: ${type}`,
            type,
            'CALCULATOR_NOT_FOUND'
        );
    }

    return calculator.calculate(candles, config) as IndicatorValue[];
}

/**
 * Validate candle data structure
 */
function validateCandleData(data: CandleData): void {
    const { open, high, low, close, volume, timestamps } = data;

    if (!Array.isArray(open) || !Array.isArray(high) || !Array.isArray(low) ||
        !Array.isArray(close) || !Array.isArray(volume) || !Array.isArray(timestamps)) {
        throw new IndicatorError(
            'Invalid candle data: all fields must be arrays',
            'validation',
            'INVALID_DATA'
        );
    }

    const length = close.length;
    if (open.length !== length || high.length !== length || low.length !== length ||
        volume.length !== length || timestamps.length !== length) {
        throw new IndicatorError(
            'Invalid candle data: all arrays must have the same length',
            'validation',
            'MISMATCHED_LENGTHS'
        );
    }

    if (length === 0) {
        throw new IndicatorError(
            'Invalid candle data: arrays cannot be empty',
            'validation',
            'EMPTY_DATA'
        );
    }
}
