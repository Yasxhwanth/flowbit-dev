/**
 * Workflow Node Executor
 * Executes individual nodes and orchestrates the workflow pipeline
 */

import {
    type WorkflowGraph,
    type WorkflowNode,
    type WorkflowEdge,
    type ExecutionLog,
    type WorkflowResult,
    type ExecutionContext,
    type NodeType,
    NodeExecutionError,
} from './types';
import {
    validateGraph,
    topoSort,
    getInputsForNode,
    getTerminalNodes,
} from './graph';

// Import actions
import { fetchCandles, executeOrderWithCredentials } from '../broker';
import { calculateIndicators } from '../indicators';
import { evaluateCondition } from '../conditions';
import { getBrokerCredentials } from '../credentials/broker';
import { attemptAICorrection } from './ai-correction';

// ============================================================================
// Node Executors
// ============================================================================

/**
 * Execute a candles node - fetches OHLCV data
 */
async function executeCandlesNode(
    data: Record<string, unknown>,
    _inputs: Record<string, unknown>
): Promise<unknown> {
    const request = {
        symbol: data.symbol as string,
        securityId: data.securityId as string,
        exchangeSegment: data.exchangeSegment as 'NSE_EQ' | 'BSE_EQ' | 'NSE_FNO' | 'BSE_FNO' | 'MCX_COMM' | 'NSE_CURRENCY' | 'BSE_CURRENCY',
        interval: data.interval as '1m' | '5m' | '15m' | '30m' | '1h' | '1d',
        fromTimestamp: data.fromTimestamp as number | undefined,
        toTimestamp: data.toTimestamp as number | undefined,
    };

    return fetchCandles(request);
}

/**
 * Execute an indicators node - calculates technical indicators
 */
async function executeIndicatorsNode(
    data: Record<string, unknown>,
    inputs: Record<string, unknown>
): Promise<unknown> {
    // Get candle data from upstream node
    const upstreamValues = Object.values(inputs);
    const candleData = upstreamValues[0] as {
        open: number[];
        high: number[];
        low: number[];
        close: number[];
        volume: number[];
        timestamps: number[];
    };

    if (!candleData?.close) {
        throw new Error('Indicators node requires candle data input');
    }

    const indicatorConfigs = data.indicators as Array<{
        type: string;
        period?: number;
        source?: string;
        fastPeriod?: number;
        slowPeriod?: number;
        signalPeriod?: number;
    }>;

    return calculateIndicators(candleData, indicatorConfigs as Parameters<typeof calculateIndicators>[1]);
}

/**
 * Execute a condition node - evaluates trading conditions
 */
async function executeConditionNode(
    data: Record<string, unknown>,
    inputs: Record<string, unknown>
): Promise<unknown> {
    // Get indicator values from upstream
    const upstreamValues = Object.values(inputs);
    const indicators = upstreamValues[0] as Record<string, number | { line: number; signal: number; histogram: number }>;

    if (!indicators) {
        throw new Error('Condition node requires indicator values input');
    }

    const expression = data.expression as string;
    if (!expression) {
        throw new Error('Condition node requires an expression');
    }

    try {
        return evaluateCondition(indicators, expression);
    } catch (error) {
        console.warn(`[Condition] Evaluation failed for "${expression}". Attempting AI correction...`);

        try {
            const availableIndicators = Object.keys(indicators);
            const corrected = await attemptAICorrection(expression, availableIndicators);

            if (corrected) {
                console.log(`[Condition] AI corrected "${expression}" to "${corrected}"`);
                // Retry with corrected expression
                const result = evaluateCondition(indicators, corrected);

                // Return result with metadata about correction (optional, but good for debugging)
                return {
                    ...result,
                    _correction: {
                        original: expression,
                        corrected: corrected
                    }
                };
            }
        } catch (aiError) {
            console.error("[Condition] AI correction failed:", aiError);
        }

        // Rethrow original error if AI fails or correction fails
        throw error;
    }
}

/**
 * Execute an order node - places a trade order with user credentials
 */
async function executeOrderNode(
    data: Record<string, unknown>,
    inputs: Record<string, unknown>,
    userId?: string
): Promise<unknown> {
    // Check if condition was met (if connected to condition node)
    const upstreamValues = Object.values(inputs);
    const conditionResult = upstreamValues.find(
        (v) => v && typeof v === 'object' && 'conditionMet' in v
    ) as { conditionMet: boolean } | undefined;

    // If connected to a condition node and condition not met, skip order
    if (conditionResult && !conditionResult.conditionMet) {
        return {
            skipped: true,
            reason: 'Condition not met',
        };
    }

    // Require userId for credential lookup
    if (!userId) {
        throw new Error('Order node requires userId for credential lookup');
    }

    // Get broker and dryRun flag from node data
    const broker = (data.broker as 'dhan') ?? 'dhan';
    const dryRun = (data.dryRun as boolean) ?? false;

    // Fetch user's broker credentials
    console.log(`[Workflow] Fetching credentials for user: ${userId}, broker: ${broker}${dryRun ? ' (DRY RUN)' : ''}`);
    const creds = await getBrokerCredentials(userId, broker);

    const request = {
        symbol: data.symbol as string,
        securityId: data.securityId as string,
        exchangeSegment: data.exchangeSegment as 'NSE_EQ' | 'BSE_EQ' | 'NSE_FNO' | 'BSE_FNO' | 'MCX_COMM' | 'NSE_CURRENCY' | 'BSE_CURRENCY',
        side: data.side as 'BUY' | 'SELL',
        quantity: data.quantity as number,
        orderType: data.orderType as 'MARKET' | 'LIMIT',
        price: data.price as number | undefined,
        productType: data.productType as 'CNC' | 'INTRADAY' | 'MARGIN' | 'MTF' | 'BO' | undefined,
    };

    return executeOrderWithCredentials(
        request,
        broker,
        creds as { accessToken: string; clientId: string },
        { dryRun }
    );
}

/**
 * Execute a notify node - sends notifications (placeholder)
 */
async function executeNotifyNode(
    data: Record<string, unknown>,
    inputs: Record<string, unknown>
): Promise<unknown> {
    // Collect all upstream data for notification
    const message = data.message as string | undefined;
    const channel = data.channel as string | undefined;

    return {
        notified: true,
        message: message ?? 'Workflow completed',
        channel: channel ?? 'default',
        data: inputs,
        timestamp: new Date().toISOString(),
    };
}

// ============================================================================
// Main Executor
// ============================================================================

/**
 * Execute a single node
 */
async function executeNode(
    node: WorkflowNode,
    inputs: Record<string, unknown>,
    userId?: string
): Promise<unknown> {
    switch (node.type) {
        case 'candles':
            return executeCandlesNode(node.data, inputs);
        case 'indicators':
            return executeIndicatorsNode(node.data, inputs);
        case 'condition':
            return executeConditionNode(node.data, inputs);
        case 'order':
            return executeOrderNode(node.data, inputs, userId);
        case 'notify':
            return executeNotifyNode(node.data, inputs);
        default:
            throw new Error(`Unknown node type: ${node.type}`);
    }
}

/**
 * Execute a complete workflow graph
 * 
 * @param graph - Workflow graph with nodes and edges
 * @returns Execution result with logs and final output
 * 
 * @example
 * ```typescript
 * const result = await executeWorkflow({
 *   nodes: [
 *     { id: 'candles', type: 'candles', data: { symbol: 'RELIANCE', ... } },
 *     { id: 'indicators', type: 'indicators', data: { indicators: [...] } },
 *     { id: 'condition', type: 'condition', data: { expression: 'RSI_14 < 30' } },
 *   ],
 *   edges: [
 *     { source: 'candles', target: 'indicators' },
 *     { source: 'indicators', target: 'condition' },
 *   ],
 * });
 * ```
 */
export async function executeWorkflow(graph: WorkflowGraph): Promise<WorkflowResult> {
    const startTime = performance.now();
    const logs: ExecutionLog[] = [];
    const context: ExecutionContext = new Map();

    try {
        // Validate and sort graph
        validateGraph(graph.nodes, graph.edges);
        const sortedNodes = topoSort(graph.nodes, graph.edges);

        // Execute nodes in topological order
        for (const node of sortedNodes) {
            const nodeStartTime = performance.now();

            try {
                // Get inputs from upstream nodes
                const inputs = getInputsForNode(node.id, context, graph.edges);

                // Execute the node
                const output = await executeNode(node, inputs, graph.userId);

                // Store output in context
                context.set(node.id, output);

                // Log execution
                logs.push({
                    nodeId: node.id,
                    type: node.type,
                    input: inputs,
                    output,
                    durationMs: performance.now() - nodeStartTime,
                });
            } catch (error) {
                // Log the failed execution
                logs.push({
                    nodeId: node.id,
                    type: node.type,
                    input: getInputsForNode(node.id, context, graph.edges),
                    output: null,
                    durationMs: performance.now() - nodeStartTime,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });

                throw new NodeExecutionError(
                    node.id,
                    node.type,
                    error instanceof Error ? error : new Error(String(error))
                );
            }
        }

        // Get final output from terminal nodes
        const terminalNodes = getTerminalNodes(graph.nodes, graph.edges);
        const finalOutput =
            terminalNodes.length === 1
                ? context.get(terminalNodes[0].id)
                : Object.fromEntries(terminalNodes.map((n) => [n.id, context.get(n.id)]));

        return {
            logs,
            finalOutput,
            success: true,
            totalDurationMs: performance.now() - startTime,
        };
    } catch (error) {
        return {
            logs,
            finalOutput: null,
            success: false,
            totalDurationMs: performance.now() - startTime,
        };
    }
}
