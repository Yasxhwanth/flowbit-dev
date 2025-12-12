/**
 * Trading Indicators Type Definitions
 * Extensible types for technical indicator calculations
 */

// ============================================================================
// Candle Data Input
// ============================================================================

/**
 * OHLCV candle data arrays
 * All arrays must have the same length and be time-aligned
 */
export interface CandleData {
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
    timestamps: number[];
}

// ============================================================================
// Indicator Configuration Types
// ============================================================================

/**
 * SMA - Simple Moving Average
 */
export interface SMAConfig {
    type: 'SMA';
    period: number;
    /** Optional: which price to use (default: 'close') */
    source?: 'open' | 'high' | 'low' | 'close';
}

/**
 * EMA - Exponential Moving Average
 */
export interface EMAConfig {
    type: 'EMA';
    period: number;
    /** Optional: which price to use (default: 'close') */
    source?: 'open' | 'high' | 'low' | 'close';
}

/**
 * RSI - Relative Strength Index
 */
export interface RSIConfig {
    type: 'RSI';
    period: number;
}

/**
 * MACD - Moving Average Convergence Divergence
 */
export interface MACDConfig {
    type: 'MACD';
    /** Fast EMA period (default: 12) */
    fastPeriod?: number;
    /** Slow EMA period (default: 26) */
    slowPeriod?: number;
    /** Signal line EMA period (default: 9) */
    signalPeriod?: number;
}

/**
 * Union of all indicator configurations
 */
export type IndicatorConfig = SMAConfig | EMAConfig | RSIConfig | MACDConfig;

/**
 * All supported indicator types
 */
export type IndicatorType = IndicatorConfig['type'];

// ============================================================================
// Indicator Result Types
// ============================================================================

/**
 * MACD output values
 */
export interface MACDValue {
    line: number;
    signal: number;
    histogram: number;
}

/**
 * Result value can be a number or MACD object
 */
export type IndicatorValue = number | MACDValue;

/**
 * Calculated indicator results
 * Keys are formatted as: TYPE_PERIOD (e.g., "SMA_20", "RSI_14", "MACD")
 */
export type IndicatorResults = Record<string, IndicatorValue>;

// ============================================================================
// Calculator Interface
// ============================================================================

/**
 * Interface for indicator calculators
 * Allows extensible registration of new indicators
 */
export interface IndicatorCalculator<T extends IndicatorConfig = IndicatorConfig> {
    /**
     * Calculate the indicator for the given candle data
     * @param data - OHLCV candle data
     * @param config - Indicator configuration
     * @returns Array of calculated values (same length as input) or single latest value
     */
    calculate(data: CandleData, config: T): number[] | MACDValue[];

    /**
     * Get the latest value of the indicator
     * @param data - OHLCV candle data
     * @param config - Indicator configuration
     * @returns Latest indicator value
     */
    getLatest(data: CandleData, config: T): IndicatorValue;

    /**
     * Generate the result key for this indicator
     * @param config - Indicator configuration
     * @returns Key string (e.g., "SMA_20")
     */
    getKey(config: T): string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error thrown when indicator calculation fails
 */
export class IndicatorError extends Error {
    constructor(
        message: string,
        public readonly indicatorType: string,
        public readonly code: string = 'INDICATOR_ERROR'
    ) {
        super(message);
        this.name = 'IndicatorError';
    }
}

/**
 * Error thrown when data is insufficient for calculation
 */
export class InsufficientDataError extends IndicatorError {
    constructor(indicatorType: string, required: number, provided: number) {
        super(
            `Insufficient data for ${indicatorType}: requires ${required} candles, got ${provided}`,
            indicatorType,
            'INSUFFICIENT_DATA'
        );
        this.name = 'InsufficientDataError';
    }
}
