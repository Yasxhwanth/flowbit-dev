/**
 * Backtest Executor
 * Main backtesting engine that runs workflows over historical data
 */

import type {
    BacktestRequest,
    BacktestResult,
    BacktestTrade,
    BacktestLog,
    Position,
} from './types';
import type { WorkflowNode, WorkflowGraph } from '../workflow/types';
import { loadHistoricalCandles, sliceCandles } from './historical-loader';
import { simulateOrder, createInitialPosition } from './simulator';
import { computeMetrics, buildEquityCurve } from './metrics';
import { calculateIndicators } from '../indicators';
import { evaluateCondition } from '../conditions';


// ============================================================================
// Backtest Executor
// ============================================================================

/**
 * Run a backtest on a workflow
 *
 * @param request - Backtest request parameters
 * @returns Backtest result with trades, metrics, and equity curve
 */
export async function runBacktest(request: BacktestRequest): Promise<BacktestResult> {
    const {
        workflow,
        symbol,
        broker,
        interval,
        from,
        to,
        initialCapital,
        securityId,
        exchangeSegment,
        creds,
    } = request;

    console.log(`[Backtest] Starting backtest for ${symbol} (${interval})`);
    console.log(`[Backtest] Period: ${new Date(from).toISOString()} to ${new Date(to).toISOString()}`);

    // Load historical candles
    const candles = await loadHistoricalCandles({
        symbol,
        interval,
        from,
        to,
        broker,
        securityId,
        exchangeSegment,
        creds,
    });

    if (candles.close.length === 0) {
        throw new Error('No historical candles available for the specified period');
    }

    // Initialize state
    const trades: BacktestTrade[] = [];
    const logs: BacktestLog[] = [];
    let position: Position = createInitialPosition();

    // Parse workflow to find nodes
    const candlesNode = findNodeByType(workflow, 'candles');
    const indicatorsNode = findNodeByType(workflow, 'indicators');
    const conditionNode = findNodeByType(workflow, 'condition');
    const orderNode = findNodeByType(workflow, 'order');

    // Determine minimum lookback period
    const lookbackPeriod = getLookbackPeriod(indicatorsNode);

    console.log(`[Backtest] Running ${candles.close.length} candles with lookback ${lookbackPeriod}`);

    // Iterate through each candle
    for (let i = lookbackPeriod; i < candles.close.length; i++) {
        const timestamp = candles.timestamps[i];
        const currentPrice = candles.close[i];

        // Slice candles up to current index
        const candleSlice = sliceCandles(candles, i);

        try {
            // Calculate indicators
            const indicatorConfigs = indicatorsNode?.data?.indicators as Parameters<typeof calculateIndicators>[1] || [];
            const indicators = await calculateIndicators(candleSlice, indicatorConfigs);

            // Evaluate condition
            const expression = conditionNode?.data?.expression as string;
            let conditionMet = false;

            if (expression) {
                const result = evaluateCondition(indicators, expression);
                conditionMet = result.conditionMet;
            }

            // Get action from order node config
            const orderAction = (orderNode?.data?.side as 'BUY' | 'SELL') || 'BUY';

            // Log execution
            logs.push({
                nodeId: conditionNode?.id || 'condition',
                status: 'completed',
                timestamp: Date.now(),
                result: { conditionMet, action: orderAction },
            });

            // Execute order if condition met
            if (conditionMet) {
                const orderType = orderAction;
                const quantity = (orderNode?.data?.quantity as number) || 1;

                // Only BUY if not already in position, only SELL if in position
                const canExecute =
                    (orderType === 'BUY' && position.quantity === 0) ||
                    (orderType === 'SELL' && position.quantity > 0);

                if (canExecute) {
                    const result = simulateOrder({
                        type: orderType,
                        quantity,
                        price: currentPrice,
                        timestamp,
                        position,
                        trades,
                    });

                    position = result.position;

                    logs.push({
                        nodeId: orderNode?.id || 'order',
                        status: 'completed',
                        timestamp: Date.now(),
                        result: {
                            trade: result.trade,
                            realizedPNL: result.realizedPNL,
                        },
                    });

                    console.log(`[Backtest] ${orderType} at ${currentPrice} on ${new Date(timestamp).toISOString()}`);
                }
            }
        } catch (error) {
            logs.push({
                nodeId: 'backtest',
                status: 'error',
                timestamp: Date.now(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    // Close any open position at the end
    if (position.quantity > 0) {
        const lastPrice = candles.close[candles.close.length - 1];
        const lastTimestamp = candles.timestamps[candles.timestamps.length - 1];

        simulateOrder({
            type: 'SELL',
            quantity: position.quantity,
            price: lastPrice,
            timestamp: lastTimestamp,
            position,
            trades,
        });

        console.log(`[Backtest] Closing position at ${lastPrice}`);
    }

    // Compute metrics
    const metrics = computeMetrics(trades, initialCapital);
    const equityCurve = buildEquityCurve(trades, initialCapital);

    console.log(`[Backtest] Completed: ${trades.length} trades, PNL: ${metrics.totalPNL.toFixed(2)}`);

    return {
        trades,
        equityCurve,
        metrics,
        logs,
        config: {
            symbol,
            broker,
            interval,
            from,
            to,
            initialCapital,
            candleCount: candles.close.length,
        },
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a node by type in the workflow
 */
function findNodeByType(workflow: WorkflowGraph, type: string): WorkflowNode | undefined {
    return workflow.nodes.find((node) => node.type === type);
}

/**
 * Get lookback period from indicator configs
 */
function getLookbackPeriod(indicatorsNode: WorkflowNode | undefined): number {
    if (!indicatorsNode?.data?.indicators) return 50;

    const indicators = indicatorsNode.data.indicators as Array<{
        type: string;
        period?: number;
        slowPeriod?: number;
    }>;

    let maxPeriod = 0;

    for (const ind of indicators) {
        const period = ind.slowPeriod || ind.period || 14;
        maxPeriod = Math.max(maxPeriod, period);
    }

    return Math.max(maxPeriod, 1);
}
