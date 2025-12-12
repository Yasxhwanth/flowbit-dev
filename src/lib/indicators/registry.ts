/**
 * Indicator Registry
 * Extensible pattern for registering and retrieving indicator calculators
 */

import type { IndicatorCalculator, IndicatorConfig, IndicatorType } from './types';
import { smaCalculator } from './calculators/sma';
import { emaCalculator } from './calculators/ema';
import { rsiCalculator } from './calculators/rsi';
import { macdCalculator } from './calculators/macd';

/**
 * Registry of all available indicator calculators
 */
const indicatorRegistry = new Map<IndicatorType, IndicatorCalculator>();

// Register built-in calculators
indicatorRegistry.set('SMA', smaCalculator as IndicatorCalculator);
indicatorRegistry.set('EMA', emaCalculator as IndicatorCalculator);
indicatorRegistry.set('RSI', rsiCalculator as IndicatorCalculator);
indicatorRegistry.set('MACD', macdCalculator as IndicatorCalculator);

/**
 * Get calculator for a specific indicator type
 * @param type - Indicator type
 * @returns Calculator instance or undefined
 */
export function getCalculator(type: IndicatorType): IndicatorCalculator | undefined {
    return indicatorRegistry.get(type);
}

/**
 * Register a new indicator calculator
 * Allows extending with custom indicators
 * @param type - Indicator type identifier
 * @param calculator - Calculator implementation
 */
export function registerCalculator<T extends IndicatorConfig>(
    type: string,
    calculator: IndicatorCalculator<T>
): void {
    indicatorRegistry.set(type as IndicatorType, calculator as IndicatorCalculator);
}

/**
 * Get all registered indicator types
 * @returns Array of registered indicator types
 */
export function getRegisteredTypes(): IndicatorType[] {
    return Array.from(indicatorRegistry.keys());
}

/**
 * Check if an indicator type is registered
 * @param type - Indicator type to check
 * @returns True if registered
 */
export function isRegistered(type: string): type is IndicatorType {
    return indicatorRegistry.has(type as IndicatorType);
}
