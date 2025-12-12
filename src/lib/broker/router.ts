/**
 * Broker Router
 * Central routing layer for multi-broker support
 *
 * Supported Brokers:
 * - dhan: Requires { accessToken, clientId }
 * - fyers: Requires { accessToken, appId } or { apiKey, secretKey }
 * - angel: Requires { apiKey, accessToken, clientId }
 */

import {
    type BrokerName,
    type BrokerCreds,
    type RouterAction,
    type NormalizedCandles,
    type OrderResult,
    type CandleRequest,
    type OrderRequest,
    BrokerAPIError,
    BrokerAuthError,
    BrokerNetworkError,
    BrokerRateLimitError,
    BrokerValidationError,
} from './types';

// ============================================================================
// Router Request Types
// ============================================================================

export interface RouterRequest<T = unknown> {
    /** Target broker */
    broker: BrokerName;
    /** Action to perform */
    action: RouterAction;
    /** Request payload */
    payload: T;
    /** User credentials (required for order actions) */
    creds?: BrokerCreds;
}

export type MarketDataPayload = CandleRequest;
export type PlaceOrderPayload = OrderRequest & { dryRun?: boolean };

// ============================================================================
// Error Normalization
// ============================================================================

/**
 * Normalize adapter errors to Broker*Error classes
 */
function normalizeError(error: unknown, broker: BrokerName): never {
    if (error instanceof BrokerAPIError ||
        error instanceof BrokerAuthError ||
        error instanceof BrokerNetworkError ||
        error instanceof BrokerRateLimitError ||
        error instanceof BrokerValidationError) {
        throw error;
    }

    if (error instanceof Error) {
        const msg = error.message.toLowerCase();

        // Detect auth errors
        if (msg.includes('unauthorized') || msg.includes('401') || msg.includes('invalid token')) {
            throw new BrokerAuthError(`${broker}: Authentication failed`);
        }

        // Detect rate limit
        if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
            throw new BrokerRateLimitError(`${broker}: Rate limit exceeded`);
        }

        // Detect network errors
        if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('timeout')) {
            throw new BrokerNetworkError(`${broker}: ${error.message}`);
        }

        throw new BrokerAPIError(`${broker}: ${error.message}`);
    }

    throw new BrokerAPIError(`${broker}: Unknown error occurred`);
}

// ============================================================================
// Broker Router
// ============================================================================

/**
 * Route request to appropriate broker adapter
 */
export async function brokerRouter<T = NormalizedCandles | OrderResult>(
    request: RouterRequest
): Promise<T> {
    const { broker, action, payload, creds } = request;

    // Validate broker
    const validBrokers: BrokerName[] = ['dhan', 'fyers', 'angel'];
    if (!validBrokers.includes(broker)) {
        throw new BrokerValidationError(`Unsupported broker: ${broker}`);
    }

    // Validate action
    const validActions: RouterAction[] = ['marketData', 'placeOrder'];
    if (!validActions.includes(action)) {
        throw new BrokerValidationError(`Unsupported action: ${action}`);
    }

    console.log(`[Router] ${broker}/${action}`);

    try {
        switch (broker) {
            case 'dhan':
                return await routeDhan<T>(action, payload, creds);

            case 'fyers':
                return await routeFyers<T>(action, payload, creds);

            case 'angel':
                return await routeAngel<T>(action, payload, creds);

            default:
                throw new BrokerValidationError(`Unsupported broker: ${broker}`);
        }
    } catch (error) {
        normalizeError(error, broker);
    }
}

// ============================================================================
// Broker-specific Routing
// ============================================================================

/**
 * Route to Dhan adapter
 */
async function routeDhan<T>(
    action: RouterAction,
    payload: unknown,
    creds?: BrokerCreds
): Promise<T> {
    const dhan = await import('./adapters/dhan');

    switch (action) {
        case 'marketData':
            return dhan.marketData(payload as CandleRequest, creds) as Promise<T>;

        case 'placeOrder':
            return dhan.placeOrder(payload as PlaceOrderPayload, creds) as Promise<T>;

        default:
            throw new BrokerValidationError(`Dhan: Unsupported action: ${action}`);
    }
}

/**
 * Route to Fyers adapter
 */
async function routeFyers<T>(
    action: RouterAction,
    payload: unknown,
    creds?: BrokerCreds
): Promise<T> {
    const fyers = await import('./adapters/fyers');

    switch (action) {
        case 'marketData':
            return fyers.marketData(payload as CandleRequest, creds) as Promise<T>;

        case 'placeOrder':
            return fyers.placeOrder(payload as PlaceOrderPayload, creds) as Promise<T>;

        default:
            throw new BrokerValidationError(`Fyers: Unsupported action: ${action}`);
    }
}

/**
 * Route to Angel adapter
 */
async function routeAngel<T>(
    action: RouterAction,
    payload: unknown,
    creds?: BrokerCreds
): Promise<T> {
    const angel = await import('./adapters/angel');

    switch (action) {
        case 'marketData':
            return angel.marketData(payload as CandleRequest, creds) as Promise<T>;

        case 'placeOrder':
            return angel.placeOrder(payload as PlaceOrderPayload, creds) as Promise<T>;

        default:
            throw new BrokerValidationError(`Angel: Unsupported action: ${action}`);
    }
}

