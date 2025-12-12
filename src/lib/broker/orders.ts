/**
 * Order Execution Service
 * Main entry point for placing orders through broker APIs (uses brokerRouter)
 */

import { brokerRouter } from './router';
import { validateOrder } from './validate-order';
import {
    type BrokerName,
    type BrokerCreds,
    type OrderRequest,
    type OrderResult,
} from './types';

// ============================================================================
// Legacy Credential Types (for backward compatibility)
// ============================================================================

export interface DhanCredentials {
    accessToken: string;
    clientId: string;
}

export type BrokerCredentials = DhanCredentials | BrokerCreds;

export interface OrderExecutionOptions {
    dryRun?: boolean;
}

// ============================================================================
// Dry Run Simulation
// ============================================================================

function generateSimulatedOrderId(): string {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `SIM-${randomPart}`;
}

export function createSimulatedOrderResult(request: OrderRequest): OrderResult {
    return {
        orderId: generateSimulatedOrderId(),
        status: 'SIMULATED',
        filledPrice: undefined,
        raw: {
            simulated: true,
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
// Order Execution (via Router)
// ============================================================================

/**
 * Execute an order through the broker router
 *
 * @param request - Order request parameters
 * @param broker - Broker to use (defaults to 'dhan')
 * @param credentials - User's broker credentials
 * @param options - Execution options (dryRun, etc.)
 */
export async function executeOrderWithCredentials(
    request: OrderRequest,
    broker: BrokerName = 'dhan',
    credentials: BrokerCreds,
    options: OrderExecutionOptions = {}
): Promise<OrderResult> {
    const { dryRun = false } = options;

    // Validate order against broker capabilities (even for dryRun to catch config errors)
    validateOrder(request, broker);

    // Handle dry run - return simulated result without calling broker
    if (dryRun) {
        console.log(`[Orders] DRY RUN - Simulating order for broker: ${broker}`);
        return createSimulatedOrderResult(request);
    }

    console.log(`[Orders] Executing order via router: ${broker}`);

    return brokerRouter<OrderResult>({
        broker,
        action: 'placeOrder',
        payload: { ...request, dryRun },
        creds: credentials,
    });
}



