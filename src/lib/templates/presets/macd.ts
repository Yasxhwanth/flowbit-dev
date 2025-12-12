/**
 * MACD Strategy Template
 * Buy when MACD line crosses above signal line
 */

import type { StrategyTemplate } from '../types';

export const macdTemplate: StrategyTemplate = {
    id: 'macd-crossover',
    name: 'MACD Crossover',
    description: 'Buy when MACD line crosses above signal line.',
    category: 'momentum',
    parameters: [
        {
            key: 'fastPeriod',
            label: 'Fast Period',
            type: 'number',
            defaultValue: 12,
            min: 8,
            max: 20,
        },
        {
            key: 'slowPeriod',
            label: 'Slow Period',
            type: 'number',
            defaultValue: 26,
            min: 20,
            max: 40,
        },
        {
            key: 'signalPeriod',
            label: 'Signal Period',
            type: 'number',
            defaultValue: 9,
            min: 5,
            max: 15,
        },
    ],
    buildWorkflow: (params) => {
        const fastPeriod = params.fastPeriod as number;
        const slowPeriod = params.slowPeriod as number;
        const signalPeriod = params.signalPeriod as number;

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
                            {
                                type: 'macd',
                                fastPeriod,
                                slowPeriod,
                                signalPeriod,
                            },
                        ],
                    },
                },
                {
                    id: 'condition',
                    type: 'condition',
                    data: {
                        expression: 'macd.line > macd.signal',
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
