/**
 * Dhan Broker API Adapter
 * Implementation for fetching OHLC candles from Dhan API v2
 */

import { createBrokerFetch, type BrokerFetchFn } from '../fetch-wrapper';
import {
    type BrokerConfig,
    BrokerValidationError,
    type CandleInterval,
    type CandleRequest,
    type DhanExchangeSegment,
    INTERVAL_MINUTES,
    type NormalizedCandles,
    type OrderBrokerAdapter,
    type OrderRequest,
    type OrderResult,
    type ProductType,
} from '../types';

// ============================================================================
// Dhan API Constants
// ============================================================================

const DHAN_BASE_URL = 'https://api.dhan.co';

/**
 * Dhan exchange segment codes
 */
const EXCHANGE_SEGMENT_MAP: Record<DhanExchangeSegment, string> = {
    NSE_EQ: 'NSE_EQ',
    BSE_EQ: 'BSE_EQ',
    NSE_FNO: 'NSE_FNO',
    BSE_FNO: 'BSE_FNO',
    MCX_COMM: 'MCX_COMM',
    NSE_CURRENCY: 'NSE_CURRENCY',
    BSE_CURRENCY: 'BSE_CURRENCY',
};

/**
 * Map candle intervals to Dhan API resolution format
 */
const RESOLUTION_MAP: Record<CandleInterval, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '1d': 'D',
};

/**
 * Map order types to Dhan format
 */
const ORDER_TYPE_MAP = {
    MARKET: 'MARKET',
    LIMIT: 'LIMIT',
} as const;

/**
 * Map product types to Dhan format
 */
const PRODUCT_TYPE_MAP: Record<ProductType, string> = {
    CNC: 'CNC',
    INTRADAY: 'INTRADAY',
    MARGIN: 'MARGIN',
    MTF: 'MTF',
    BO: 'BO',
};

// ============================================================================
// Dhan API Response Types
// ============================================================================

interface DhanCandleResponse {
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
    timestamp: number[];
}

interface DhanHistoricalRequest {
    securityId: string;
    exchangeSegment: string;
    instrument: string;
    expiryCode: number;
    fromDate: string;
    toDate: string;
}

interface DhanIntradayRequest {
    securityId: string;
    exchangeSegment: string;
    instrument: string;
    interval: string;
    fromDate: string;
    toDate: string;
}

interface DhanOrderRequest {
    dhanClientId: string;
    transactionType: 'BUY' | 'SELL';
    exchangeSegment: string;
    productType: string;
    orderType: string;
    validity: string;
    securityId: string;
    quantity: number;
    price?: number;
    triggerPrice?: number;
    disclosedQuantity?: number;
}

interface DhanOrderResponse {
    orderId: string;
    orderStatus: string;
    remarks?: string;
}

// ============================================================================
// Dhan Adapter Implementation
// ============================================================================

/**
 * Create a Dhan broker adapter with order support
 * @param accessToken - Dhan API access token (from environment)
 * @param clientId - Dhan client ID (from environment)
 * @returns Configured broker adapter
 */
export function createDhanAdapter(
    accessToken: string,
    clientId?: string
): OrderBrokerAdapter {
    const config: BrokerConfig = {
        baseUrl: DHAN_BASE_URL,
        accessToken,
        timeoutMs: 30000,
    };

    const brokerFetch = createBrokerFetch(config);

    return {
        name: 'dhan',
        fetchCandles: (request) => fetchDhanCandles(brokerFetch, request),
        placeOrder: (request) => placeDhanOrder(brokerFetch, request, clientId ?? ''),
    };
}

/**
 * Fetch candle data from Dhan API
 */
async function fetchDhanCandles(
    brokerFetch: BrokerFetchFn,
    request: CandleRequest
): Promise<NormalizedCandles> {
    validateCandleRequest(request);

    const { interval, fromTimestamp, toTimestamp } = request;
    const isIntraday = interval !== '1d';

    // Default date range if not provided
    const now = Date.now();
    const defaultFromMs = now - getDurationMs(interval);
    const fromMs = fromTimestamp ?? defaultFromMs;
    const toMs = toTimestamp ?? now;

    // Format dates for Dhan API (YYYY-MM-DD format)
    const fromDate = formatDate(fromMs);
    const toDate = formatDate(toMs);

    if (isIntraday) {
        return fetchIntradayCandles(brokerFetch, request, fromDate, toDate);
    }

    return fetchHistoricalCandles(brokerFetch, request, fromDate, toDate);
}

/**
 * Place an order through Dhan API
 */
async function placeDhanOrder(
    brokerFetch: BrokerFetchFn,
    request: OrderRequest,
    clientId: string
): Promise<OrderResult> {
    validateOrderRequest(request, clientId);

    const body: DhanOrderRequest = {
        dhanClientId: clientId,
        transactionType: request.side,
        exchangeSegment: EXCHANGE_SEGMENT_MAP[request.exchangeSegment],
        productType: PRODUCT_TYPE_MAP[request.productType ?? 'INTRADAY'],
        orderType: ORDER_TYPE_MAP[request.orderType],
        validity: 'DAY',
        securityId: request.securityId,
        quantity: request.quantity,
    };

    // Add price for LIMIT orders
    if (request.orderType === 'LIMIT') {
        if (!request.price) {
            throw new BrokerValidationError('Price is required for LIMIT orders');
        }
        body.price = request.price;
    }

    // Add trigger price if provided
    if (request.triggerPrice) {
        body.triggerPrice = request.triggerPrice;
    }

    const response = await brokerFetch<DhanOrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    return normalizeOrderResponse(response);
}

// ============================================================================
// Credential-based Order Execution
// ============================================================================

/**
 * Credentials for Dhan API
 */
export interface DhanApiCredentials {
    accessToken: string;
    clientId: string;
}

/**
 * Place an order with explicit credentials (not from env vars)
 *
 * @param request - Order request
 * @param creds - User's Dhan credentials
 * @returns Order result
 */
export async function placeOrderWithCredentials(
    request: OrderRequest,
    creds: DhanApiCredentials
): Promise<OrderResult> {
    console.log('[Dhan] Placing order with user credentials');

    // Validate credentials
    if (!creds.accessToken?.trim()) {
        throw new BrokerValidationError('Dhan access token is required');
    }
    if (!creds.clientId?.trim()) {
        throw new BrokerValidationError('Dhan client ID is required');
    }

    // Create broker fetch with user credentials
    const config: BrokerConfig = {
        baseUrl: DHAN_BASE_URL,
        accessToken: creds.accessToken,
        timeoutMs: 30000,
    };
    const brokerFetch = createBrokerFetch(config);

    // Validate order request
    validateOrderRequest(request, creds.clientId);

    // Build order body
    const body: DhanOrderRequest = {
        dhanClientId: creds.clientId,
        transactionType: request.side,
        exchangeSegment: EXCHANGE_SEGMENT_MAP[request.exchangeSegment],
        productType: PRODUCT_TYPE_MAP[request.productType ?? 'INTRADAY'],
        orderType: ORDER_TYPE_MAP[request.orderType],
        validity: 'DAY',
        securityId: request.securityId,
        quantity: request.quantity,
    };

    if (request.orderType === 'LIMIT') {
        if (!request.price) {
            throw new BrokerValidationError('Price is required for LIMIT orders');
        }
        body.price = request.price;
    }

    if (request.triggerPrice) {
        body.triggerPrice = request.triggerPrice;
    }

    const response = await brokerFetch<DhanOrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    return normalizeOrderResponse(response);
}

/**
 * Fetch intraday candles (1m, 5m, 15m, 30m, 1h)
 */
async function fetchIntradayCandles(
    brokerFetch: BrokerFetchFn,
    request: CandleRequest,
    fromDate: string,
    toDate: string
): Promise<NormalizedCandles> {
    const { securityId, exchangeSegment, interval } = request;

    const body: DhanIntradayRequest = {
        securityId,
        exchangeSegment: EXCHANGE_SEGMENT_MAP[exchangeSegment],
        instrument: 'EQUITY',
        interval: RESOLUTION_MAP[interval],
        fromDate,
        toDate,
    };

    const response = await brokerFetch<DhanCandleResponse>(
        '/v2/charts/intraday',
        {
            method: 'POST',
            body: JSON.stringify(body),
        }
    );

    return normalizeCandleResponse(response);
}

/**
 * Fetch historical daily candles
 */
async function fetchHistoricalCandles(
    brokerFetch: BrokerFetchFn,
    request: CandleRequest,
    fromDate: string,
    toDate: string
): Promise<NormalizedCandles> {
    const { securityId, exchangeSegment } = request;

    const body: DhanHistoricalRequest = {
        securityId,
        exchangeSegment: EXCHANGE_SEGMENT_MAP[exchangeSegment],
        instrument: 'EQUITY',
        expiryCode: 0,
        fromDate,
        toDate,
    };

    const response = await brokerFetch<DhanCandleResponse>(
        '/v2/charts/historical',
        {
            method: 'POST',
            body: JSON.stringify(body),
        }
    );

    return normalizeCandleResponse(response);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate candle request parameters
 */
function validateCandleRequest(request: CandleRequest): void {
    const { symbol, securityId, exchangeSegment, interval } = request;

    if (!symbol?.trim()) {
        throw new BrokerValidationError('Symbol is required');
    }

    if (!securityId?.trim()) {
        throw new BrokerValidationError('Security ID is required');
    }

    if (!exchangeSegment || !(exchangeSegment in EXCHANGE_SEGMENT_MAP)) {
        throw new BrokerValidationError(
            `Invalid exchange segment. Must be one of: ${Object.keys(EXCHANGE_SEGMENT_MAP).join(', ')}`
        );
    }

    if (!interval || !(interval in RESOLUTION_MAP)) {
        throw new BrokerValidationError(
            `Invalid interval. Must be one of: ${Object.keys(RESOLUTION_MAP).join(', ')}`
        );
    }
}

/**
 * Validate order request parameters
 */
function validateOrderRequest(request: OrderRequest, clientId: string): void {
    if (!clientId?.trim()) {
        throw new BrokerValidationError('DHAN_CLIENT_ID environment variable is required');
    }

    if (!request.securityId?.trim()) {
        throw new BrokerValidationError('Security ID is required');
    }

    if (!request.exchangeSegment || !(request.exchangeSegment in EXCHANGE_SEGMENT_MAP)) {
        throw new BrokerValidationError(
            `Invalid exchange segment. Must be one of: ${Object.keys(EXCHANGE_SEGMENT_MAP).join(', ')}`
        );
    }

    if (!['BUY', 'SELL'].includes(request.side)) {
        throw new BrokerValidationError('Side must be BUY or SELL');
    }

    if (!request.quantity || request.quantity <= 0) {
        throw new BrokerValidationError('Quantity must be a positive number');
    }

    if (!['MARKET', 'LIMIT'].includes(request.orderType)) {
        throw new BrokerValidationError('Order type must be MARKET or LIMIT');
    }
}

/**
 * Normalize Dhan candle response to common format
 */
function normalizeCandleResponse(response: DhanCandleResponse): NormalizedCandles {
    if (!response || !response.timestamp || response.timestamp.length === 0) {
        return {
            open: [],
            high: [],
            low: [],
            close: [],
            volume: [],
            timestamps: [],
        };
    }

    return {
        open: response.open ?? [],
        high: response.high ?? [],
        low: response.low ?? [],
        close: response.close ?? [],
        volume: response.volume ?? [],
        timestamps: (response.timestamp ?? []).map((ts) => ts * 1000),
    };
}

/**
 * Normalize Dhan order response
 */
function normalizeOrderResponse(response: DhanOrderResponse): OrderResult {
    return {
        orderId: response.orderId,
        status: response.orderStatus,
        raw: response,
    };
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDate(timestampMs: number): string {
    const date = new Date(timestampMs);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get default duration in milliseconds based on interval
 */
function getDurationMs(interval: CandleInterval): number {
    const minutes = INTERVAL_MINUTES[interval];

    if (minutes < 1440) {
        return 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    return 365 * 24 * 60 * 60 * 1000; // 365 days
}

// ============================================================================
// Router-compatible Exports (matches brokerRouter contract)
// ============================================================================

import { type BrokerCreds, BrokerAuthError } from '../types';

/**
 * Dry run simulation for Dhan
 */
function generateSimulatedOrderId(): string {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `DHAN-SIM-${randomPart}`;
}

function createSimulatedOrderResult(request: OrderRequest): OrderResult {
    return {
        orderId: generateSimulatedOrderId(),
        status: 'SIMULATED',
        filledPrice: undefined,
        raw: {
            simulated: true,
            broker: 'dhan',
            request: {
                symbol: request.symbol,
                side: request.side,
                quantity: request.quantity,
                orderType: request.orderType,
            },
            timestamp: new Date().toISOString(),
        },
    };
}

/**
 * Fetch market data (router-compatible)
 *
 * @param request - Candle request
 * @param creds - Broker credentials { accessToken }
 */
export async function marketData(
    request: CandleRequest,
    creds?: BrokerCreds
): Promise<NormalizedCandles> {
    // For market data, we allow env-based fallback (public data)
    const accessToken = creds?.accessToken ?? process.env.DHAN_ACCESS_TOKEN;

    if (!accessToken) {
        throw new BrokerAuthError('Dhan: accessToken is required');
    }

    const config: BrokerConfig = {
        baseUrl: DHAN_BASE_URL,
        accessToken,
        timeoutMs: 30000,
    };

    const brokerFetch = createBrokerFetch(config);

    const now = Date.now();
    const durationMs = getDurationMs(request.interval);
    const fromTimestamp = request.fromTimestamp ?? now - durationMs;
    const toTimestamp = request.toTimestamp ?? now;

    const fromDate = formatDate(fromTimestamp);
    const toDate = formatDate(toTimestamp);

    if (request.interval === '1d') {
        return fetchHistoricalCandles(brokerFetch, request, fromDate, toDate);
    }

    return fetchIntradayCandles(brokerFetch, request, fromDate, toDate);
}

/**
 * Place order (router-compatible)
 *
 * @param request - Order request with optional dryRun
 * @param creds - Broker credentials { accessToken, clientId }
 */
export async function placeOrder(
    request: OrderRequest & { dryRun?: boolean },
    creds?: BrokerCreds
): Promise<OrderResult> {
    // Handle dry run
    if (request.dryRun) {
        console.log('[Dhan] DRY RUN - Simulating order');
        return createSimulatedOrderResult(request);
    }

    if (!creds?.accessToken) {
        throw new BrokerAuthError('Dhan: accessToken is required');
    }
    if (!creds?.clientId) {
        throw new BrokerAuthError('Dhan: clientId is required');
    }

    return placeOrderWithCredentials(request, {
        accessToken: creds.accessToken,
        clientId: creds.clientId,
    });
}



