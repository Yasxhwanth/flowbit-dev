/**
 * Fyers Broker Adapter
 * Implementation for Fyers API v3
 *
 * @see https://myapi.fyers.in/docsv3
 *
 * Required Credentials:
 * - accessToken: OAuth access token
 * - appId: Fyers app ID (format: XXXX-100)
 */

import { createBrokerFetch, type BrokerFetchFn } from '../fetch-wrapper';
import {
    type BrokerConfig,
    type BrokerCreds,
    type CandleRequest,
    type CandleInterval,
    type NormalizedCandles,
    type OrderRequest,
    type OrderResult,
    BrokerAuthError,
    BrokerValidationError,
    BrokerAPIError,
} from '../types';

// ============================================================================
// Fyers API Constants
// ============================================================================

const FYERS_BASE_URL = 'https://api-t1.fyers.in/api/v3';
const FYERS_DATA_URL = 'https://api-t1.fyers.in/data';

/**
 * Map candle intervals to Fyers resolution format
 */
const RESOLUTION_MAP: Record<CandleInterval, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '1d': 'D',
};

// ============================================================================
// Fyers API Types
// ============================================================================

interface FyersCandleResponse {
    s: string; // status: "ok" or "error"
    candles: Array<[number, number, number, number, number, number]>;
    // [timestamp, open, high, low, close, volume]
}

interface FyersOrderRequest {
    symbol: string;
    qty: number;
    type: number; // 1=Limit, 2=Market, 3=SL-M, 4=SL-L
    side: number; // 1=Buy, -1=Sell
    productType: string;
    limitPrice?: number;
    stopPrice?: number;
    validity: string;
    disclosedQty?: number;
    offlineOrder: boolean;
}

interface FyersOrderResponse {
    s: string;
    code: number;
    message: string;
    id?: string;
}

// ============================================================================
// Dry Run Simulation
// ============================================================================

function generateSimulatedOrderId(): string {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `FYERS-SIM-${randomPart}`;
}

function createSimulatedOrderResult(request: OrderRequest): OrderResult {
    return {
        orderId: generateSimulatedOrderId(),
        status: 'SIMULATED',
        filledPrice: undefined,
        raw: {
            simulated: true,
            broker: 'fyers',
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

// ============================================================================
// Market Data
// ============================================================================

/**
 * Fetch historical candle data from Fyers
 *
 * @param request - Candle request parameters
 * @param creds - Fyers credentials { accessToken, appId }
 * @returns Normalized candle data
 *
 * @see https://myapi.fyers.in/docsv3#tag/Data-Api/paths/~1data~1history/get
 */
export async function marketData(
    request: CandleRequest,
    creds?: BrokerCreds
): Promise<NormalizedCandles> {
    if (!creds?.accessToken) {
        throw new BrokerAuthError('Fyers: accessToken is required');
    }
    if (!creds?.appId) {
        throw new BrokerAuthError('Fyers: appId is required');
    }

    const config: BrokerConfig = {
        baseUrl: FYERS_DATA_URL,
        accessToken: `${creds.appId}:${creds.accessToken}`,
        timeoutMs: 30000,
    };

    const brokerFetch = createBrokerFetch(config);

    // Build Fyers symbol format (e.g., "NSE:RELIANCE-EQ")
    const fyersSymbol = buildFyersSymbol(request.symbol, request.exchangeSegment);

    // Calculate date range
    const now = Date.now();
    const defaultFrom = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago
    const fromTimestamp = Math.floor((request.fromTimestamp ?? defaultFrom) / 1000);
    const toTimestamp = Math.floor((request.toTimestamp ?? now) / 1000);

    const resolution = RESOLUTION_MAP[request.interval];

    const url = `/history?symbol=${encodeURIComponent(fyersSymbol)}&resolution=${resolution}&date_format=1&range_from=${fromTimestamp}&range_to=${toTimestamp}&cont_flag=1`;

    const response = await brokerFetch<FyersCandleResponse>(url);

    if (response.s !== 'ok') {
        throw new BrokerAPIError(`Fyers: Failed to fetch candles - ${response.s}`);
    }

    return normalizeFyersCandles(response);
}

/**
 * Build Fyers symbol format
 */
function buildFyersSymbol(symbol: string, exchangeSegment?: string): string {
    const exchange = exchangeSegment?.startsWith('NSE') ? 'NSE' : 'BSE';
    const suffix = exchangeSegment?.includes('FNO') ? '' : '-EQ';
    return `${exchange}:${symbol}${suffix}`;
}

/**
 * Normalize Fyers candle response
 */
function normalizeFyersCandles(response: FyersCandleResponse): NormalizedCandles {
    const candles = response.candles ?? [];

    return {
        timestamps: candles.map((c) => c[0] * 1000), // Convert to milliseconds
        open: candles.map((c) => c[1]),
        high: candles.map((c) => c[2]),
        low: candles.map((c) => c[3]),
        close: candles.map((c) => c[4]),
        volume: candles.map((c) => c[5]),
    };
}

// ============================================================================
// Order Placement
// ============================================================================

/**
 * Place an order through Fyers API
 *
 * @param request - Order request with optional dryRun flag
 * @param creds - Fyers credentials { accessToken, appId }
 * @returns Order result
 *
 * @see https://myapi.fyers.in/docsv3#tag/Order-Placement-Api/paths/~1orders/post
 */
export async function placeOrder(
    request: OrderRequest & { dryRun?: boolean },
    creds?: BrokerCreds
): Promise<OrderResult> {
    // Handle dry run
    if (request.dryRun) {
        console.log('[Fyers] DRY RUN - Simulating order');
        return createSimulatedOrderResult(request);
    }

    if (!creds?.accessToken) {
        throw new BrokerAuthError('Fyers: accessToken is required');
    }
    if (!creds?.appId) {
        throw new BrokerAuthError('Fyers: appId is required');
    }

    const config: BrokerConfig = {
        baseUrl: FYERS_BASE_URL,
        accessToken: `${creds.appId}:${creds.accessToken}`,
        timeoutMs: 30000,
    };

    const brokerFetch = createBrokerFetch(config);

    // Validate order
    validateOrderRequest(request);

    // Build Fyers order request
    const fyersSymbol = buildFyersSymbol(request.symbol, request.exchangeSegment);

    const orderBody: FyersOrderRequest = {
        symbol: fyersSymbol,
        qty: request.quantity,
        type: request.orderType === 'LIMIT' ? 1 : 2,
        side: request.side === 'BUY' ? 1 : -1,
        productType: mapProductType(request.productType),
        validity: 'DAY',
        offlineOrder: false,
    };

    if (request.orderType === 'LIMIT' && request.price) {
        orderBody.limitPrice = request.price;
    }

    if (request.triggerPrice) {
        orderBody.stopPrice = request.triggerPrice;
    }

    console.log('[Fyers] Placing order:', fyersSymbol);

    const response = await brokerFetch<FyersOrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify(orderBody),
    });

    if (response.s !== 'ok' || !response.id) {
        throw new BrokerAPIError(`Fyers: Order failed - ${response.message}`, response.code);
    }

    return {
        orderId: response.id,
        status: 'PENDING',
        raw: response,
    };
}

/**
 * Validate order request
 */
function validateOrderRequest(request: OrderRequest): void {
    if (!request.symbol?.trim()) {
        throw new BrokerValidationError('Fyers: Symbol is required');
    }
    if (!request.quantity || request.quantity <= 0) {
        throw new BrokerValidationError('Fyers: Quantity must be positive');
    }
    if (request.orderType === 'LIMIT' && !request.price) {
        throw new BrokerValidationError('Fyers: Price is required for LIMIT orders');
    }
}

/**
 * Map product type to Fyers format
 */
function mapProductType(productType?: string): string {
    switch (productType) {
        case 'CNC':
            return 'CNC';
        case 'INTRADAY':
            return 'INTRADAY';
        case 'MARGIN':
            return 'MARGIN';
        default:
            return 'INTRADAY';
    }
}
