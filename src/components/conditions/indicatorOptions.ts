/**
 * Indicator Options for Condition Builder
 */

export interface IndicatorOption {
    label: string;
    value: string;
}

// Default price fields always available
export const priceOptions: IndicatorOption[] = [
    { label: 'Close', value: 'close' },
    { label: 'Open', value: 'open' },
    { label: 'High', value: 'high' },
    { label: 'Low', value: 'low' },
    { label: 'Volume', value: 'volume' },
];

/**
 * Generate indicator options from indicator configurations
 */
export function generateIndicatorOptions(
    indicators: Array<{ type: string; period?: number; fastPeriod?: number; slowPeriod?: number; signalPeriod?: number }>
): IndicatorOption[] {
    const options: IndicatorOption[] = [...priceOptions];

    for (const ind of indicators) {
        const type = ind.type.toLowerCase();

        switch (type) {
            case 'sma':
            case 'ema':
            case 'rsi':
            case 'atr':
                if (ind.period) {
                    const name = `${type}_${ind.period}`;
                    options.push({
                        label: `${type.toUpperCase()}(${ind.period})`,
                        value: name,
                    });
                }
                break;

            case 'macd':
                options.push(
                    { label: 'MACD Line', value: 'macd.line' },
                    { label: 'MACD Signal', value: 'macd.signal' },
                    { label: 'MACD Histogram', value: 'macd.histogram' }
                );
                break;

            case 'bb':
            case 'bollinger':
                options.push(
                    { label: 'BB Upper', value: 'bb.upper' },
                    { label: 'BB Middle', value: 'bb.middle' },
                    { label: 'BB Lower', value: 'bb.lower' }
                );
                break;

            default:
                if (ind.period) {
                    options.push({
                        label: `${type.toUpperCase()}(${ind.period})`,
                        value: `${type}_${ind.period}`,
                    });
                }
        }
    }

    return options;
}
