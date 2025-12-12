/**
 * Trading Indicators API Route
 * Vercel API endpoint for calculating technical indicators
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
    calculateIndicators,
    IndicatorError,
    InsufficientDataError,
    type IndicatorConfig,
} from '@/lib/indicators';

// ============================================================================
// Request Validation Schema
// ============================================================================

const candleDataSchema = z.object({
    open: z.array(z.number()),
    high: z.array(z.number()),
    low: z.array(z.number()),
    close: z.array(z.number()),
    volume: z.array(z.number()),
    timestamps: z.array(z.number()),
});

const smaConfigSchema = z.object({
    type: z.literal('SMA'),
    period: z.number().int().positive(),
    source: z.enum(['open', 'high', 'low', 'close']).optional(),
});

const emaConfigSchema = z.object({
    type: z.literal('EMA'),
    period: z.number().int().positive(),
    source: z.enum(['open', 'high', 'low', 'close']).optional(),
});

const rsiConfigSchema = z.object({
    type: z.literal('RSI'),
    period: z.number().int().positive(),
});

const macdConfigSchema = z.object({
    type: z.literal('MACD'),
    fastPeriod: z.number().int().positive().optional(),
    slowPeriod: z.number().int().positive().optional(),
    signalPeriod: z.number().int().positive().optional(),
});

const indicatorConfigSchema = z.discriminatedUnion('type', [
    smaConfigSchema,
    emaConfigSchema,
    rsiConfigSchema,
    macdConfigSchema,
]);

const requestSchema = z.object({
    candles: candleDataSchema,
    indicators: z.array(indicatorConfigSchema).min(1),
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
 * POST /api/indicators
 * Calculate trading indicators from candle data
 *
 * Request body:
 * {
 *   candles: { open, high, low, close, volume, timestamps },
 *   indicators: [
 *     { type: 'SMA', period: 20 },
 *     { type: 'EMA', period: 50 },
 *     { type: 'RSI', period: 14 },
 *     { type: 'MACD' }
 *   ]
 * }
 *
 * Response:
 * {
 *   SMA_20: 150.5,
 *   EMA_50: 148.2,
 *   RSI_14: 65.3,
 *   MACD: { line: 1.2, signal: 0.8, histogram: 0.4 }
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
        const parseResult = requestSchema.safeParse(body);

        if (!parseResult.success) {
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

        const { candles, indicators } = parseResult.data;

        // Calculate indicators
        const results = calculateIndicators(
            candles,
            indicators as IndicatorConfig[]
        );

        return NextResponse.json(results);
    } catch (error) {
        // Handle known indicator errors
        if (error instanceof InsufficientDataError) {
            return createErrorResponse(
                error.message,
                'INSUFFICIENT_DATA',
                400
            );
        }

        if (error instanceof IndicatorError) {
            return createErrorResponse(
                error.message,
                error.code,
                400
            );
        }

        // Handle unexpected errors
        console.error('Unexpected error in /api/indicators:', error);

        return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
}
