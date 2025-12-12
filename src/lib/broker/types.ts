/**
 * Broker API Types
 * Type definitions for OHLC candle data fetching from Indian broker APIs
 */

// ============================================================================
// Candle Intervals
// ============================================================================

/**
 * Supported candle intervals for historical data
 */
export type CandleInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '1d';

/**
 * Map of candle intervals to their duration in minutes
 */
export const INTERVAL_MINUTES: Record<CandleInterval, number> = {
  '1m': 1,
  '5m': 5,
  '15m': 15,
  '30m': 30,
  '1h': 60,
  '1d': 1440,
} as const;

// ============================================================================
// Exchange Segments
// ============================================================================

/**
 * Dhan exchange segment identifiers
 */
export type DhanExchangeSegment =
  | 'NSE_EQ'
  | 'BSE_EQ'
  | 'NSE_FNO'
  | 'BSE_FNO'
  | 'MCX_COMM'
  | 'NSE_CURRENCY'
  | 'BSE_CURRENCY';

// ============================================================================
// Request Types
// ============================================================================

/**
 * Request parameters for fetching candle data
 */
export interface CandleRequest {
  /** Trading symbol (e.g., "RELIANCE", "NIFTY") */
  symbol: string;
  /** Dhan security ID (numeric identifier) */
  securityId: string;
  /** Exchange segment for the security */
  exchangeSegment: DhanExchangeSegment;
  /** Candle interval/timeframe */
  interval: CandleInterval;
  /** Start timestamp (Unix milliseconds) - optional */
  fromTimestamp?: number;
  /** End timestamp (Unix milliseconds) - optional */
  toTimestamp?: number;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Normalized candle data output
 * Arrays are aligned by index - each index represents one candle
 */
export interface NormalizedCandles {
  /** Opening prices */
  open: number[];
  /** Highest prices */
  high: number[];
  /** Lowest prices */
  low: number[];
  /** Closing prices */
  close: number[];
  /** Trading volumes */
  volume: number[];
  /** Unix timestamps in milliseconds */
  timestamps: number[];
}

// ============================================================================
// Broker Configuration
// ============================================================================

/**
 * Broker configuration interface
 */
export interface BrokerConfig {
  /** API base URL */
  baseUrl: string;
  /** Bearer access token */
  accessToken: string;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Supported brokers
 */
export type BrokerType = 'dhan' | 'fyers' | 'angel';
export type BrokerName = BrokerType; // Alias for compatibility

/**
 * Broker credentials (adapter-specific fields)
 */
export interface BrokerCreds {
  /** Access token (Dhan, Fyers) */
  accessToken?: string;
  /** API key (Fyers) */
  apiKey?: string;
  /** Client ID (Dhan) */
  clientId?: string;
  /** App ID (Fyers) */
  appId?: string;
  /** Secret key (Fyers) */
  secretKey?: string;
  /** [index] Allow additional fields */
  [key: string]: string | undefined;
}

/**
 * Router action types
 */
export type RouterAction = 'marketData' | 'placeOrder';

// ============================================================================
// Broker Adapter Interface
// ============================================================================

/**
 * Interface for broker-specific implementations
 * Allows consistent API across different brokers
 */
export interface BrokerAdapter {
  /** Broker identifier */
  readonly name: BrokerType;

  /**
   * Fetch historical candle data
   * @param request - Candle request parameters
   * @returns Normalized candle data
   */
  fetchCandles(request: CandleRequest): Promise<NormalizedCandles>;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error class for broker API errors
 */
export class BrokerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'BrokerError';
  }
}

/**
 * Authentication error (invalid/expired token)
 */
export class BrokerAuthError extends BrokerError {
  constructor(message = 'Authentication failed. Check your access token.') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'BrokerAuthError';
  }
}

/**
 * API error from broker
 */
export class BrokerAPIError extends BrokerError {
  constructor(
    message: string,
    statusCode?: number,
    public readonly brokerMessage?: string
  ) {
    super(message, 'API_ERROR', statusCode);
    this.name = 'BrokerAPIError';
  }
}

/**
 * Network/connectivity error
 */
export class BrokerNetworkError extends BrokerError {
  constructor(message = 'Network error. Failed to reach broker API.') {
    super(message, 'NETWORK_ERROR');
    this.name = 'BrokerNetworkError';
  }
}

/**
 * Request validation error
 */
export class BrokerValidationError extends BrokerError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'BrokerValidationError';
  }
}

/**
 * Rate limit error
 */
export class BrokerRateLimitError extends BrokerError {
  constructor(message = 'Rate limit exceeded. Please try again later.', public retryAfterMs?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'BrokerRateLimitError';
  }
}

// ============================================================================
// Order Types
// ============================================================================

/**
 * Order side (buy or sell)
 */
export type OrderSide = 'BUY' | 'SELL';

/**
 * Order type
 */
export type OrderType = 'MARKET' | 'LIMIT';

/**
 * Product type for orders
 */
export type ProductType = 'CNC' | 'INTRADAY' | 'MARGIN' | 'MTF' | 'BO';

/**
 * Order request parameters
 */
export interface OrderRequest {
  /** Trading symbol (e.g., "RELIANCE") */
  symbol: string;
  /** Dhan security ID */
  securityId: string;
  /** Exchange segment */
  exchangeSegment: DhanExchangeSegment;
  /** Buy or Sell */
  side: OrderSide;
  /** Quantity to trade */
  quantity: number;
  /** Order type */
  orderType: OrderType;
  /** Price (required for LIMIT orders) */
  price?: number;
  /** Product type (default: INTRADAY) */
  productType?: ProductType;
  /** Trigger price for stop-loss orders */
  triggerPrice?: number;
}

/**
 * Normalized order result
 */
export interface OrderResult {
  /** Order ID from broker */
  orderId: string;
  /** Order status */
  status: string;
  /** Filled price (if available) */
  filledPrice?: number;
  /** Raw response from broker */
  raw: unknown;
}

/**
 * Extended broker adapter with order support
 */
export interface OrderBrokerAdapter extends BrokerAdapter {
  /**
   * Place an order
   * @param request - Order request parameters
   * @returns Order result
   */
  placeOrder(request: OrderRequest): Promise<OrderResult>;
}

