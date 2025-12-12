/**
 * Indicators Library Exports
 * Re-exports all types, functions, and calculators for external use
 */

// Main calculation API
export { calculateIndicators, calculateIndicatorSeries } from './calculate';

// Registry (for extending with custom indicators)
export {
    getCalculator,
    registerCalculator,
    getRegisteredTypes,
    isRegistered,
} from './registry';

// Types
export type {
    CandleData,
    IndicatorConfig,
    IndicatorResults,
    IndicatorValue,
    IndicatorCalculator,
    IndicatorType,
    SMAConfig,
    EMAConfig,
    RSIConfig,
    MACDConfig,
    MACDValue,
} from './types';

// Error classes
export { IndicatorError, InsufficientDataError } from './types';

// Individual calculators (for advanced usage)
export { smaCalculator, calculateSMA } from './calculators/sma';
export { emaCalculator, calculateEMA } from './calculators/ema';
export { rsiCalculator, calculateRSI } from './calculators/rsi';
export { macdCalculator, calculateMACD } from './calculators/macd';
