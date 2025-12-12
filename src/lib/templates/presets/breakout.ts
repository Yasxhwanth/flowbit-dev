/**
 * Breakout Strategy Template
 * Buy when price breaks above recent high
 */

import type { StrategyTemplate } from '../types';

export const breakoutTemplate: StrategyTemplate = {
    id: 'high-breakout',
    name: 'High Breakout',
    description: 'Buy when price breaks above the highest high of the lookback period.',
    category: 'breakout',
    parameters: [
        {
            key: 'lookbackPeriod',
            label: 'Lookback Period',
            type: 'number',
            defaultValue: 20,
            min: 5,
            max: 50,
        },
    ],
    buildWorkflow: (params) => {
        const lookbackPeriod = params.lookbackPeriod as number;

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
                            { type: 'highest', period: lookbackPeriod, source: 'high' },
                        ],
                    },
                },
                {
                    id: 'condition',
                    type: 'condition',
                    data: {
                        // Close breaks above highest high
                        expression: `close > highest_${lookbackPeriod}`,
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

export const nr7BreakoutTemplate: StrategyTemplate = {
    id: 'nr7-breakout',
    name: 'NR7 Breakout',
    description: 'Trade when today has the narrowest range of the last 7 days.',
    category: 'breakout',
    parameters: [
        {
            key: 'lookbackPeriod',
            label: 'Lookback Period',
            type: 'number',
            defaultValue: 7,
            min: 5,
            max: 14,
        },
    ],
    buildWorkflow: (params) => {
        const lookbackPeriod = params.lookbackPeriod as number;

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
                            { type: 'atr', period: lookbackPeriod },
                            { type: 'lowest', period: lookbackPeriod, source: 'atr' },
                        ],
                    },
                },
                {
                    id: 'condition',
                    type: 'condition',
                    data: {
                        // ATR at lowest = narrow range day
                        expression: `atr_${lookbackPeriod} == lowest_atr_${lookbackPeriod}`,
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
