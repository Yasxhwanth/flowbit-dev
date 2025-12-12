/**
 * Order Execution API Route
 * Vercel API endpoint for placing BUY/SELL orders with user credentials
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
    executeOrderWithCredentials,
    BrokerError,
    BrokerAuthError,
    BrokerAPIError,
    BrokerValidationError,
    type OrderRequest,
} from '@/lib/broker';
import { getBrokerCredentials, CredentialNotFoundError, CredentialLoadError } from '@/lib/credentials/broker';

// ============================================================================
// Request Validation Schema
// ============================================================================

const orderRequestSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    broker: z.enum(['dhan']).default('dhan'),
    dryRun: z.boolean().default(false),
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
    ]),
    side: z.enum(['BUY', 'SELL']),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    orderType: z.enum(['MARKET', 'LIMIT']),
    price: z.number().positive().optional(),
    productType: z.enum(['CNC', 'INTRADAY', 'MARGIN', 'MTF', 'BO']).optional(),
    triggerPrice: z.number().positive().optional(),
});

// ============================================================================
// Error Response Helper
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
 * POST /api/orders
 * Place a BUY/SELL order through Dhan API using user credentials
 *
 * Request body:
 * {
 *   userId: "user123",
 *   broker: "dhan",
 *   symbol: "RELIANCE",
 *   securityId: "2885",
 *   exchangeSegment: "NSE_EQ",
 *   side: "BUY",
 *   quantity: 1,
 *   orderType: "MARKET"
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
        const parseResult = orderRequestSchema.safeParse(body);

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

        const { userId, broker, dryRun, ...orderData } = parseResult.data;
        const orderRequest = orderData as OrderRequest;

        // Validate LIMIT order has price
        if (orderRequest.orderType === 'LIMIT' && !orderRequest.price) {
            return createErrorResponse(
                'Price is required for LIMIT orders',
                'VALIDATION_ERROR',
                400
            );
        }

        // Fetch user credentials
        console.log(`[Orders API] Fetching credentials for userId: ${userId}, broker: ${broker}${dryRun ? ' (DRY RUN)' : ''}`);
        const creds = await getBrokerCredentials(userId, broker);

        // Execute order with credentials
        const result = await executeOrderWithCredentials(
            orderRequest,
            broker,
            creds as { accessToken: string; clientId: string },
            { dryRun }
        );

        return NextResponse.json(result);
    } catch (error) {
        // Handle credential errors
        if (error instanceof CredentialNotFoundError) {
            return createErrorResponse(error.message, 'CREDENTIALS_NOT_FOUND', 404);
        }

        if (error instanceof CredentialLoadError) {
            return createErrorResponse(error.message, 'CREDENTIALS_ERROR', 500);
        }

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
                'API_ERROR',
                error.statusCode ?? 500,
                error.brokerMessage
            );
        }

        if (error instanceof BrokerError) {
            return createErrorResponse(
                error.message,
                error.code,
                error.statusCode ?? 500
            );
        }

        // Handle unexpected errors
        console.error('Unexpected error in /api/orders:', error);

        return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
}

