/**
 * RSI Strategy Template
 * Buy when RSI is oversold, sell when overbought
 */

import type { StrategyTemplate } from '../types';

export const rsiTemplate: StrategyTemplate = {
    id: 'rsi-strategy',
    name: 'RSI Oversold/Overbought',
    description: 'Buy when RSI dips below oversold level, sell when above overbought.',
    category: 'momentum',
    parameters: [
        {
            key: 'period',
            label: 'RSI Period',
            type: 'number',
            defaultValue: 14,
            min: 7,
            max: 28,
        },
        {
            key: 'oversold',
            label: 'Oversold Level',
            type: 'number',
            defaultValue: 30,
            min: 10,
            max: 40,
        },
        {
            key: 'overbought',
            label: 'Overbought Level',
            type: 'number',
            defaultValue: 70,
            min: 60,
            max: 90,
        },
    ],
    buildWorkflow: (params) => {
        const period = params.period as number;
        const oversold = params.oversold as number;

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
                        indicators: [{ type: 'rsi', period }],
                    },
                },
                {
                    id: 'condition',
                    type: 'condition',
                    data: {
                        expression: `rsi_${period} < ${oversold}`,
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
