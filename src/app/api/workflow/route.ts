/**
 * Workflow Execution API Route
 * Vercel API endpoint for executing trading pipelines
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
    executeWorkflow,
    WorkflowError,
    GraphValidationError,
    CycleDetectedError,
    NodeExecutionError,
} from '@/lib/workflow';

// ============================================================================
// Request Validation Schema
// ============================================================================

const nodeSchema = z.object({
    id: z.string().min(1, 'Node ID is required'),
    type: z.enum(['candles', 'indicators', 'condition', 'order', 'notify']),
    data: z.record(z.string(), z.unknown()),
});

const edgeSchema = z.object({
    source: z.string().min(1, 'Source node ID is required'),
    target: z.string().min(1, 'Target node ID is required'),
});

const workflowGraphSchema = z.object({
    nodes: z.array(nodeSchema).min(1, 'At least one node is required'),
    edges: z.array(edgeSchema),
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
 * POST /api/workflow
 * Execute a trading workflow pipeline
 *
 * Request body:
 * {
 *   nodes: [
 *     { id: "candles", type: "candles", data: {...} },
 *     { id: "indicators", type: "indicators", data: {...} },
 *     { id: "condition", type: "condition", data: {...} }
 *   ],
 *   edges: [
 *     { source: "candles", target: "indicators" },
 *     { source: "indicators", target: "condition" }
 *   ]
 * }
 *
 * Response:
 * {
 *   logs: [...],
 *   finalOutput: {...},
 *   success: true,
 *   totalDurationMs: 1234
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
        const parseResult = workflowGraphSchema.safeParse(body);

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

        // Execute workflow
        const result = await executeWorkflow(parseResult.data);

        return NextResponse.json(result);
    } catch (error) {
        // Handle known workflow errors
        if (error instanceof CycleDetectedError) {
            return createErrorResponse(error.message, 'CYCLE_DETECTED', 400);
        }

        if (error instanceof GraphValidationError) {
            return createErrorResponse(error.message, 'GRAPH_VALIDATION_ERROR', 400);
        }

        if (error instanceof NodeExecutionError) {
            return createErrorResponse(
                error.message,
                'NODE_EXECUTION_ERROR',
                500,
                `Node ${error.nodeId} (${error.nodeType}) failed`
            );
        }

        if (error instanceof WorkflowError) {
            return createErrorResponse(error.message, error.code, 500);
        }

        // Handle unexpected errors
        console.error('Unexpected error in /api/workflow:', error);

        return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
}
