/**
 * Order Request Validation
 * Validates orders against broker capabilities before sending
 */

import { brokerCapabilities } from './capabilities';
import { BrokerValidationError, type BrokerName, type OrderRequest } from './types';

/**
 * Validate order request against broker capabilities
 *
 * @param request - Order request to validate
 * @param broker - Target broker
 * @throws BrokerValidationError if validation fails
 */
export function validateOrder(request: OrderRequest, broker: BrokerName): void {
    const caps = brokerCapabilities[broker];

    if (!caps) {
        throw new BrokerValidationError(`Unknown broker: ${broker}`);
    }

    // Validate order type
    if (!caps.supportedOrderTypes.includes(request.orderType)) {
        throw new BrokerValidationError(
            `Order type '${request.orderType}' not supported for ${broker}. ` +
            `Supported: ${caps.supportedOrderTypes.join(', ')}`
        );
    }

    // Validate product type (if specified)
    if (request.productType && !caps.supportedProducts.includes(request.productType)) {
        throw new BrokerValidationError(
            `Product type '${request.productType}' not supported for ${broker}. ` +
            `Supported: ${caps.supportedProducts.join(', ')}`
        );
    }

    // Validate security ID requirement
    if (caps.requiresSecurityId && !request.securityId?.trim()) {
        throw new BrokerValidationError(
            `securityId is required for ${broker}. ` +
            `Please provide the broker-specific security identifier.`
        );
    }

    // Validate exchange segment requirement
    if (caps.requiresExchangeSegment && !request.exchangeSegment) {
        throw new BrokerValidationError(
            `exchangeSegment is required for ${broker}. ` +
            `Please specify the exchange (e.g., NSE_EQ, BSE_EQ).`
        );
    }

    // Validate order size limit
    if (caps.maxOrderSize && request.quantity > caps.maxOrderSize) {
        throw new BrokerValidationError(
            `Order quantity ${request.quantity} exceeds maximum ${caps.maxOrderSize} for ${broker}.`
        );
    }

    // Validate LIMIT order has price
    if (request.orderType === 'LIMIT' && (request.price === undefined || request.price <= 0)) {
        throw new BrokerValidationError(
            `Price is required for LIMIT orders and must be positive.`
        );
    }

    // Validate quantity is positive
    if (!request.quantity || request.quantity <= 0) {
        throw new BrokerValidationError(
            `Quantity must be a positive number.`
        );
    }

    // Validate symbol is present
    if (!request.symbol?.trim()) {
        throw new BrokerValidationError(
            `Symbol is required.`
        );
    }
}
