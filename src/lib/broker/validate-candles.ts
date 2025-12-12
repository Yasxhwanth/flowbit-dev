/**
 * Candle Request Validation
 * Validates candle requests against broker capabilities before sending
 */

import { brokerCapabilities, isIntervalSupported } from './capabilities';
import { BrokerValidationError, type BrokerName, type CandleRequest } from './types';

/**
 * Validate candle request against broker capabilities
 *
 * @param request - Candle request to validate
 * @param broker - Target broker
 * @throws BrokerValidationError if validation fails
 */
export function validateCandleRequest(request: CandleRequest, broker: BrokerName): void {
    const caps = brokerCapabilities[broker];

    if (!caps) {
        throw new BrokerValidationError(`Unknown broker: ${broker}`);
    }

    // Validate interval is supported
    if (!isIntervalSupported(request.interval, broker)) {
        throw new BrokerValidationError(
            `Interval '${request.interval}' not supported for ${broker}. ` +
            `Use one of: 1m, 5m, 15m, 30m, 1h, 1d`
        );
    }

    // Validate security ID requirement
    if (caps.requiresSecurityId && !request.securityId?.trim()) {
        throw new BrokerValidationError(
            `securityId is required for ${broker} candle data. ` +
            `Please provide the broker-specific security identifier.`
        );
    }

    // Validate exchange segment requirement
    if (caps.requiresExchangeSegment && !request.exchangeSegment) {
        throw new BrokerValidationError(
            `exchangeSegment is required for ${broker} candle data. ` +
            `Please specify the exchange (e.g., NSE_EQ, BSE_EQ).`
        );
    }

    // Validate symbol is present
    if (!request.symbol?.trim()) {
        throw new BrokerValidationError(
            `Symbol is required for candle data.`
        );
    }

    // Validate symbol format for Fyers (NSE:SYMBOL-EQ format)
    if (broker === 'fyers') {
        validateFyersSymbolFormat(request.symbol);
    }

    // Validate date range if provided
    if (request.fromTimestamp && request.toTimestamp) {
        if (request.fromTimestamp > request.toTimestamp) {
            throw new BrokerValidationError(
                `fromTimestamp cannot be after toTimestamp.`
            );
        }
    }
}

/**
 * Validate Fyers symbol format (NSE:SYMBOL-EQ)
 */
function validateFyersSymbolFormat(symbol: string): void {
    // Fyers symbols should be in format: EXCHANGE:SYMBOL-SUFFIX
    // e.g., NSE:RELIANCE-EQ, NSE:NIFTY24DECFUT
    // We do a minimal check - if it contains ':', it's likely Fyers format
    // If not, it might need conversion
    if (!symbol.includes(':') && !symbol.includes('-')) {
        // Just a warning - the adapter will handle conversion
        console.warn(
            `[Validation] Fyers symbol '${symbol}' may need format conversion. ` +
            `Expected format: NSE:SYMBOL-EQ`
        );
    }
}
