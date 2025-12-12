/**
 * SMA Crossover Strategy Template
 * Buy when fast SMA crosses above slow SMA
 * Sell when fast SMA crosses below slow SMA
 */

import type { StrategyTemplate } from '../types';

export const smaCrossoverTemplate: StrategyTemplate = {
    id: 'sma-crossover',
    name: 'SMA Crossover',
    description: 'Buy when fast SMA crosses above slow SMA, sell when it crosses below.',
    category: 'trend',
    parameters: [
        {
            key: 'fastPeriod',
            label: 'Fast Period',
            type: 'number',
            defaultValue: 20,
            min: 5,
            max: 50,
        },
        {
            key: 'slowPeriod',
            label: 'Slow Period',
            type: 'number',
            defaultValue: 50,
            min: 20,
            max: 200,
        },
    ],
    buildWorkflow: (params) => {
        const fastPeriod = params.fastPeriod as number;
        const slowPeriod = params.slowPeriod as number;

        return {
            nodes: [
                {
                    id: 'candles',
                    type: 'candles',
                    data: {
                        symbol: '',
                        interval: '1d',
                    },
                },
                {
                    id: 'indicators',
                    type: 'indicators',
                    data: {
                        indicators: [
                            { type: 'sma', period: fastPeriod },
                            { type: 'sma', period: slowPeriod },
                        ],
                    },
                },
                {
                    id: 'condition',
                    type: 'condition',
                    data: {
                        expression: `sma_${fastPeriod} > sma_${slowPeriod}`,
                    },
                },
                {
                    id: 'order',
                    type: 'order',
                    data: {
                        side: 'BUY',
                        quantity: 1,
                        orderType: 'MARKET',
                        productType: 'CNC',
                    },
                },
            ],
            edges: [
                { source: 'candles', target: 'indicators' },
                { source: 'indicators', target: 'condition' },
                { source: 'condition', target: 'order' },
            ],
        };
    },
};
