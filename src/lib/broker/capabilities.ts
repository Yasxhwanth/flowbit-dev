/**
 * Broker Capabilities
 * Defines what each broker supports for validation
 */

import type { BrokerName } from './types';

// ============================================================================
// Capability Types
// ============================================================================

export interface BrokerCapability {
    /** Supported order types */
    supportedOrderTypes: Array<'MARKET' | 'LIMIT'>;
    /** Supported product types */
    supportedProducts: string[];
    /** Supported candle intervals (broker-specific format) */
    candleIntervals: string[];
    /** Symbol format identifier */
    symbolFormat: 'dhan' | 'fyers' | 'angel';
    /** Whether securityId is required */
    requiresSecurityId: boolean;
    /** Whether exchangeSegment is required */
    requiresExchangeSegment: boolean;
    /** Maximum order size (optional) */
    maxOrderSize?: number;
    /** Rate limits (optional) */
    rateLimit?: { perSecond?: number; perMinute?: number };
}

// ============================================================================
// Broker Capabilities
// ============================================================================

export const brokerCapabilities: Record<BrokerName, BrokerCapability> = {
    dhan: {
        supportedOrderTypes: ['MARKET', 'LIMIT'],
        supportedProducts: ['CNC', 'INTRADAY', 'MARGIN', 'MTF', 'BO'],
        candleIntervals: ['1m', '5m', '15m', '30m', '1h', '1d'],
        symbolFormat: 'dhan',
        requiresSecurityId: true,
        requiresExchangeSegment: true,
        rateLimit: { perSecond: 10, perMinute: 200 },
    },

    fyers: {
        supportedOrderTypes: ['MARKET', 'LIMIT'],
        supportedProducts: ['INTRADAY', 'CNC', 'MARGIN'],
        candleIntervals: ['1', '5', '15', '30', '60', 'D'],
        symbolFormat: 'fyers',
        requiresSecurityId: false,
        requiresExchangeSegment: false,
        rateLimit: { perSecond: 10, perMinute: 300 },
    },

    angel: {
        supportedOrderTypes: ['MARKET', 'LIMIT'],
        supportedProducts: ['INTRADAY', 'DELIVERY', 'MARGIN'],
        candleIntervals: ['ONE_MINUTE', 'FIVE_MINUTE', 'FIFTEEN_MINUTE', 'THIRTY_MINUTE', 'ONE_HOUR', 'ONE_DAY'],
        symbolFormat: 'angel',
        requiresSecurityId: false,
        requiresExchangeSegment: false,
        rateLimit: { perSecond: 5, perMinute: 100 },
    },
};

// ============================================================================
// Interval Mapping (internal format -> broker format)
// ============================================================================

/**
 * Map internal interval format to broker-specific format
 */
export const intervalMapping: Record<BrokerName, Record<string, string>> = {
    dhan: {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '30m': '30m',
        '1h': '1h',
        '1d': '1d',
    },
    fyers: {
        '1m': '1',
        '5m': '5',
        '15m': '15',
        '30m': '30',
        '1h': '60',
        '1d': 'D',
    },
    angel: {
        '1m': 'ONE_MINUTE',
        '5m': 'FIVE_MINUTE',
        '15m': 'FIFTEEN_MINUTE',
        '30m': 'THIRTY_MINUTE',
        '1h': 'ONE_HOUR',
        '1d': 'ONE_DAY',
    },
};

/**
 * Get broker-native interval format
 */
export function getBrokerInterval(interval: string, broker: BrokerName): string | null {
    return intervalMapping[broker]?.[interval] ?? null;
}

/**
 * Check if interval is supported by broker
 */
export function isIntervalSupported(interval: string, broker: BrokerName): boolean {
    const brokerInterval = getBrokerInterval(interval, broker);
    if (!brokerInterval) return false;
    return brokerCapabilities[broker].candleIntervals.includes(brokerInterval);
}
