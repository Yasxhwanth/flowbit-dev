/**
 * Broker Credentials API Route
 * Secure endpoint for managing encrypted broker credentials
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
    saveBrokerCredentials,
    getBrokerCredentials,
    CredentialStoreError,
    CredentialNotFoundError,
    CredentialLoadError,
} from '@/lib/credentials/broker';

// ============================================================================
// Request Validation
// ============================================================================

const saveCredentialsSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    broker: z.enum(['dhan', 'fyers', 'angel']),
    credentials: z.record(z.string(), z.unknown()),
});

// ============================================================================
// Error Response Helper
// ============================================================================

interface ErrorResponse {
    error: string;
    code: string;
}

function createErrorResponse(
    message: string,
    code: string,
    status: number
): NextResponse<ErrorResponse> {
    return NextResponse.json({ error: message, code }, { status });
}

// ============================================================================
// Security Headers
// ============================================================================

const securityHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'CDN-Cache-Control': 'no-store',
    Pragma: 'no-cache',
};

// ============================================================================
// POST Handler - Save Credentials
// ============================================================================

/**
 * POST /api/credentials/broker
 * Save encrypted broker credentials
 *
 * Request body:
 * {
 *   userId: "user123",
 *   broker: "dhan",
 *   credentials: { accessToken: "xxx", clientId: "yyy" }
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
        const parseResult = saveCredentialsSchema.safeParse(body);

        if (!parseResult.success) {
            const errorMessages = parseResult.error.issues
                .map((issue) => `${issue.path.map(String).join('.')}: ${issue.message}`)
                .join(', ');

            return createErrorResponse(errorMessages, 'VALIDATION_ERROR', 400);
        }

        const { userId, broker, credentials } = parseResult.data;

        // Save credentials (encrypted)
        const result = await saveBrokerCredentials(userId, broker, credentials);

        // Return success (no decrypted data)
        return NextResponse.json(
            {
                success: result.success,
                broker: result.broker,
                message: 'Credentials saved successfully',
            },
            { headers: securityHeaders }
        );
    } catch (error) {
        if (error instanceof CredentialStoreError) {
            return createErrorResponse(error.message, 'STORE_ERROR', 400);
        }

        console.error('Failed to save credentials:', error);
        return createErrorResponse('Failed to save credentials', 'INTERNAL_ERROR', 500);
    }
}

// ============================================================================
// GET Handler - Load Credentials (Server-only)
// ============================================================================

/**
 * GET /api/credentials/broker?userId=...&broker=...
 * Load decrypted broker credentials
 *
 * ⚠️ SERVER-SIDE ONLY - This endpoint should only be called from
 * server-side code (Vercel Vibe actions, API routes). Never expose
 * to client-side JavaScript.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const broker = searchParams.get('broker');

        // Validate query params
        if (!userId?.trim()) {
            return createErrorResponse('userId query parameter is required', 'VALIDATION_ERROR', 400);
        }

        if (!broker?.trim()) {
            return createErrorResponse('broker query parameter is required', 'VALIDATION_ERROR', 400);
        }

        const validBrokers = ['dhan', 'fyers', 'angel'];
        if (!validBrokers.includes(broker)) {
            return createErrorResponse(
                `broker must be one of: ${validBrokers.join(', ')}`,
                'VALIDATION_ERROR',
                400
            );
        }

        // Load and decrypt credentials
        const credentials = await getBrokerCredentials(userId, broker);

        // Return with security headers (no caching)
        return NextResponse.json(
            { credentials },
            { headers: securityHeaders }
        );
    } catch (error) {
        if (error instanceof CredentialNotFoundError) {
            return createErrorResponse(error.message, 'NOT_FOUND', 404);
        }

        if (error instanceof CredentialLoadError) {
            return createErrorResponse(error.message, 'LOAD_ERROR', 500);
        }

        console.error('Failed to load credentials:', error);
        return createErrorResponse('Failed to load credentials', 'INTERNAL_ERROR', 500);
    }
}
