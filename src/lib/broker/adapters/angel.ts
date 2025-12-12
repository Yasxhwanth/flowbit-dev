/**
 * AngelOne Broker Adapter
 * Implementation for AngelOne SmartAPI
 *
 * @see https://smartapi.angelbroking.com/docs
 *
 * Required Credentials:
 * - apiKey: SmartAPI key
 * - accessToken: JWT token from login
 * - clientId: Angel client code
 */

import { createBrokerFetch } from '../fetch-wrapper';
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
    BrokerRateLimitError,
} from '../types';

// ============================================================================
// AngelOne API Constants
// ============================================================================

const ANGEL_BASE_URL = 'https://apiconnect.angelbroking.com';

/**
 * Map candle intervals to Angel resolution format
 */
const RESOLUTION_MAP: Record<CandleInterval, string> = {
    '1m': 'ONE_MINUTE',
    '5m': 'FIVE_MINUTE',
    '15m': 'FIFTEEN_MINUTE',
    '30m': 'THIRTY_MINUTE',
    '1h': 'ONE_HOUR',
    '1d': 'ONE_DAY',
};

/**
 * Map exchange segments to Angel format
 */
const EXCHANGE_MAP: Record<string, string> = {
    'NSE_EQ': 'NSE',
    'BSE_EQ': 'BSE',
    'NSE_FNO': 'NFO',
    'BSE_FNO': 'BFO',
    'MCX_COMM': 'MCX',
    'NSE_CURRENCY': 'CDS',
    'BSE_CURRENCY': 'BCD',
};

// ============================================================================
// AngelOne API Types
// ============================================================================

interface AngelCandleResponse {
    status: boolean;
    message: string;
    errorcode: string;
    data: Array<{
        timestamp: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    }>;
}

interface AngelOrderRequest {
    variety: string;
    tradingsymbol: string;
    symboltoken: string;
    transactiontype: string;
    exchange: string;
    ordertype: string;
    producttype: string;
    duration: string;
    price: number;
    squareoff: number;
    stoploss: number;
    quantity: number;
}

interface AngelOrderResponse {
    status: boolean;
    message: string;
    errorcode: string;
    data: {
        script: string;
        orderid: string;
        uniqueorderid: string;
    };
}

// ============================================================================
// Dry Run Simulation
// ============================================================================

function generateSimulatedOrderId(): string {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `ANGEL-SIM-${randomPart}`;
}

function createSimulatedOrderResult(request: OrderRequest): OrderResult {
    return {
        orderId: generateSimulatedOrderId(),
        status: 'SIMULATED',
        filledPrice: undefined,
        raw: {
            simulated: true,
            broker: 'angel',
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
// Auth Headers
// ============================================================================

function getAuthHeaders(creds: BrokerCreds): Record<string, string> {
    return {
        'Authorization': `Bearer ${creds.accessToken}`,
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': creds.apiKey || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
}

// ============================================================================
// Market Data
// ============================================================================

/**
 * Fetch historical candle data from AngelOne
 *
 * @param request - Candle request parameters
 * @param creds - Angel credentials { apiKey, accessToken, clientId }
 * @returns Normalized candle data
 *
 * @see https://smartapi.angelbroking.com/docs/Historical
 */
export async function marketData(
    request: CandleRequest,
    creds?: BrokerCreds
): Promise<NormalizedCandles> {
    if (!creds?.accessToken) {
        throw new BrokerAuthError('Angel: accessToken is required');
    }
    if (!creds?.apiKey) {
        throw new BrokerAuthError('Angel: apiKey is required');
    }

    const config: BrokerConfig = {
        baseUrl: ANGEL_BASE_URL,
        accessToken: creds.accessToken,
        timeoutMs: 30000,
    };

    const brokerFetch = createBrokerFetch(config);

    // Calculate date range
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = request.fromTimestamp ? new Date(request.fromTimestamp) : defaultFrom;
    const toDate = request.toTimestamp ? new Date(request.toTimestamp) : now;

    const exchange = EXCHANGE_MAP[request.exchangeSegment] || 'NSE';
    const interval = RESOLUTION_MAP[request.interval];

    const body = {
        exchange,
        symboltoken: request.securityId,
        interval,
        fromdate: formatAngelDate(fromDate),
        todate: formatAngelDate(toDate),
    };

    try {
        const response = await brokerFetch<AngelCandleResponse>('/rest/secure/angelbroking/historical/v1/getCandleData', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: getAuthHeaders(creds),
        });

        if (!response.status) {
            handleAngelError(response.errorcode, response.message);
        }

        return normalizeAngelCandles(response);
    } catch (error) {
        if (error instanceof BrokerAPIError || error instanceof BrokerAuthError) {
            throw error;
        }
        throw new BrokerAPIError(`Angel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Format date for Angel API (YYYY-MM-DD HH:MM)
 */
function formatAngelDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${mins}`;
}

/**
 * Normalize Angel candle response
 */
function normalizeAngelCandles(response: AngelCandleResponse): NormalizedCandles {
    const candles = response.data ?? [];

    return {
        timestamps: candles.map((c) => new Date(c.timestamp).getTime()),
        open: candles.map((c) => c.open),
        high: candles.map((c) => c.high),
        low: candles.map((c) => c.low),
        close: candles.map((c) => c.close),
        volume: candles.map((c) => c.volume),
    };
}

// ============================================================================
// Order Placement
// ============================================================================

/**
 * Place an order through AngelOne SmartAPI
 *
 * @param request - Order request with optional dryRun flag
 * @param creds - Angel credentials { apiKey, accessToken, clientId }
 * @returns Order result
 *
 * @see https://smartapi.angelbroking.com/docs/Orders
 */
export async function placeOrder(
    request: OrderRequest & { dryRun?: boolean },
    creds?: BrokerCreds
): Promise<OrderResult> {
    // Handle dry run
    if (request.dryRun) {
        console.log('[Angel] DRY RUN - Simulating order');
        return createSimulatedOrderResult(request);
    }

    if (!creds?.accessToken) {
        throw new BrokerAuthError('Angel: accessToken is required');
    }
    if (!creds?.apiKey) {
        throw new BrokerAuthError('Angel: apiKey is required');
    }

    const config: BrokerConfig = {
        baseUrl: ANGEL_BASE_URL,
        accessToken: creds.accessToken,
        timeoutMs: 30000,
    };

    const brokerFetch = createBrokerFetch(config);

    // Validate order
    validateOrderRequest(request);

    const exchange = EXCHANGE_MAP[request.exchangeSegment || 'NSE_EQ'] || 'NSE';

    const orderBody: AngelOrderRequest = {
        variety: 'NORMAL',
        tradingsymbol: request.symbol,
        symboltoken: request.securityId || '',
        transactiontype: request.side,
        exchange,
        ordertype: request.orderType,
        producttype: mapProductType(request.productType),
        duration: 'DAY',
        price: request.price || 0,
        squareoff: 0,
        stoploss: 0,
        quantity: request.quantity,
    };

    console.log('[Angel] Placing order:', request.symbol);

    try {
        const response = await brokerFetch<AngelOrderResponse>('/rest/secure/angelbroking/order/v1/placeOrder', {
            method: 'POST',
            body: JSON.stringify(orderBody),
            headers: getAuthHeaders(creds),
        });

        if (!response.status || !response.data?.orderid) {
            handleAngelError(response.errorcode, response.message);
        }

        return {
            orderId: response.data.orderid,
            status: 'PENDING',
            raw: response,
        };
    } catch (error) {
        if (error instanceof BrokerAPIError || error instanceof BrokerAuthError) {
            throw error;
        }
        throw new BrokerAPIError(`Angel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Validate order request
 */
function validateOrderRequest(request: OrderRequest): void {
    if (!request.symbol?.trim()) {
        throw new BrokerValidationError('Angel: Symbol is required');
    }
    if (!request.quantity || request.quantity <= 0) {
        throw new BrokerValidationError('Angel: Quantity must be positive');
    }
    if (request.orderType === 'LIMIT' && !request.price) {
        throw new BrokerValidationError('Angel: Price is required for LIMIT orders');
    }
}

/**
 * Map product type to Angel format
 */
function mapProductType(productType?: string): string {
    switch (productType) {
        case 'CNC':
            return 'DELIVERY';
        case 'INTRADAY':
            return 'INTRADAY';
        case 'MARGIN':
            return 'MARGIN';
        default:
            return 'INTRADAY';
    }
}

/**
 * Handle Angel API errors
 */
function handleAngelError(errorcode: string, message: string): never {
    const code = errorcode?.toUpperCase() || '';

    // Auth errors
    if (code.includes('AUTH') || code === 'AB1010' || code === 'AB1004') {
        throw new BrokerAuthError(`Angel: ${message}`);
    }

    // Rate limit
    if (code.includes('RATE') || code === 'AB429') {
        throw new BrokerRateLimitError(`Angel: ${message}`);
    }

    throw new BrokerAPIError(`Angel: ${message}`, undefined, errorcode);
}
