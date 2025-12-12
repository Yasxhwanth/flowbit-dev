/**
 * Broker Library Exports
 * Re-exports all types, functions, and adapters for external use
 */

// Router (main abstraction)
export { brokerRouter } from './router';

// Core candles API
export { fetchCandles, getBrokerAdapter } from './candles';

// Core orders API (credential-based only)
export { executeOrderWithCredentials, createSimulatedOrderResult } from './orders';
export type { DhanCredentials, BrokerCredentials, OrderExecutionOptions } from './orders';

// Types
export type {
    BrokerAdapter,
    BrokerConfig,
    BrokerCreds,
    BrokerName,
    BrokerType,
    CandleInterval,
    CandleRequest,
    DhanExchangeSegment,
    NormalizedCandles,
    OrderBrokerAdapter,
    OrderRequest,
    OrderResult,
    OrderSide,
    OrderType,
    ProductType,
    RouterAction,
} from './types';

// Constants
export { INTERVAL_MINUTES } from './types';

// Error classes
export {
    BrokerAPIError,
    BrokerAuthError,
    BrokerError,
    BrokerNetworkError,
    BrokerRateLimitError,
    BrokerValidationError,
} from './types';

// Adapters (for advanced usage)
export { createDhanAdapter, marketData as dhanMarketData, placeOrder as dhanPlaceOrder } from './adapters/dhan';
export { marketData as fyersMarketData, placeOrder as fyersPlaceOrder } from './adapters/fyers';
export { marketData as angelMarketData, placeOrder as angelPlaceOrder } from './adapters/angel';

// Fetch utilities (for advanced usage)
export { createBrokerFetch, type BrokerFetchFn } from './fetch-wrapper';


