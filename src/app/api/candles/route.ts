/**
 * OHLC Candles API Route
 * Vercel API endpoint for fetching historical candle data
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
    fetchCandles,
    BrokerAPIError,
    BrokerAuthError,
    BrokerNetworkError,
    BrokerValidationError,
    type CandleInterval,
    type DhanExchangeSegment,
} from '@/lib/broker';

// ============================================================================
// Request Validation Schema
// ============================================================================

const candleRequestSchema = z.object({
    symbol: z.string().min(1, 'Symbol is required'),
    securityId: z.string().min(1, 'Security ID is required'),
    exchangeSegment: z.enum([
        'NSE_EQ',
        'BSE_EQ',
        'NSE_FNO',
        'BSE_FNO',
        'MCX_COMM',
        'NSE_CURRENCY',
        'BSE_CURRENCY',
    ] as const),
    interval: z.enum(['1m', '5m', '15m', '30m', '1h', '1d'] as const),
    fromTimestamp: z.number().optional(),
    toTimestamp: z.number().optional(),
});

// ============================================================================
// Error Response Helpers
// ============================================================================

interface ErrorResponse {
    error: string;
    code: string;
    details?: string;
}

function createErrorResponse(
    message: string,
    code: string,
    status: number,
    details?: string
): NextResponse<ErrorResponse> {
    return NextResponse.json({ error: message, code, details }, { status });
}

// ============================================================================
// API Handler
// ============================================================================

/**
 * POST /api/candles
 * Fetch OHLC candle data from broker API
 *
 * Request body:
 * {
 *   symbol: string,          // Trading symbol (e.g., "RELIANCE")
 *   securityId: string,      // Dhan security ID (e.g., "2885")
 *   exchangeSegment: string, // Exchange segment (e.g., "NSE_EQ")
 *   interval: string,        // Candle interval (e.g., "1d", "1h", "5m")
 *   fromTimestamp?: number,  // Start timestamp (Unix ms) - optional
 *   toTimestamp?: number     // End timestamp (Unix ms) - optional
 * }
 *
 * Response:
 * {
 *   open: number[],
 *   high: number[],
 *   low: number[],
 *   close: number[],
 *   volume: number[],
 *   timestamps: number[]
 * }
 */
export async function POST(request: Request) {
    try {
        // Parse request body
        const body = await request.json().catch(() => null);

        if (!body) {
            return createErrorResponse('Invalid JSON body', 'PARSE_ERROR', 400);
        }

        // Validate request
        const parseResult = candleRequestSchema.safeParse(body);

        if (!parseResult.success) {
            // Zod v4 uses .issues instead of .errors
            const errorMessages = parseResult.error.issues
                .map((issue) => `${issue.path.map(String).join('.')}: ${issue.message}`)
                .join(', ');

            return createErrorResponse(
                'Validation failed',
                'VALIDATION_ERROR',
                400,
                errorMessages
            );
        }

        const {
            symbol,
            securityId,
            exchangeSegment,
            interval,
            fromTimestamp,
            toTimestamp,
        } = parseResult.data;

        // Fetch candles
        const candles = await fetchCandles({
            symbol,
            securityId,
            exchangeSegment: exchangeSegment as DhanExchangeSegment,
            interval: interval as CandleInterval,
            fromTimestamp,
            toTimestamp,
        });

        return NextResponse.json(candles);
    } catch (error) {
        // Handle known broker errors
        if (error instanceof BrokerAuthError) {
            return createErrorResponse(error.message, 'AUTH_ERROR', 401);
        }

        if (error instanceof BrokerValidationError) {
            return createErrorResponse(error.message, 'VALIDATION_ERROR', 400);
        }

        if (error instanceof BrokerAPIError) {
            return createErrorResponse(
                error.message,
                'BROKER_API_ERROR',
                error.statusCode ?? 502,
                error.brokerMessage
            );
        }

        if (error instanceof BrokerNetworkError) {
            return createErrorResponse(error.message, 'NETWORK_ERROR', 503);
        }

        // Handle unexpected errors
        console.error('Unexpected error in /api/candles:', error);

        return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
}
