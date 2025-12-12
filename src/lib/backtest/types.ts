/**
 * Backtest Types
 * Type definitions for the backtesting engine
 */

import type { WorkflowGraph } from '../workflow/types';
import type { BrokerName, NormalizedCandles, BrokerCreds } from '../broker/types';

// ============================================================================
// Request Types
// ============================================================================

export interface BacktestRequest {
    /** Workflow graph to backtest */
    workflow: WorkflowGraph;
    /** Symbol to backtest */
    symbol: string;
    /** Broker to use for historical data */
    broker: BrokerName;
    /** Candle interval (e.g., "1d", "15m") */
    interval: string;
    /** Start timestamp (ms) */
    from: number;
    /** End timestamp (ms) */
    to: number;
    /** Initial capital */
    initialCapital: number;
    /** Optional security ID */
    securityId?: string;
    /** Optional exchange segment */
    exchangeSegment?: string;
    /** Optional credentials */
    creds?: BrokerCreds;
}

// ============================================================================
// Trade and Position Types
// ============================================================================

export interface BacktestTrade {
    /** Trade type */
    type: 'BUY' | 'SELL';
    /** Quantity traded */
    quantity: number;
    /** Execution price */
    price: number;
    /** Timestamp of trade */
    timestamp: number;
    /** Realized PNL (for SELL trades) */
    pnl?: number;
}

export interface Position {
    /** Current quantity (positive = long, 0 = flat) */
    quantity: number;
    /** Average entry price */
    averagePrice: number;
}

// ============================================================================
// Log Types
// ============================================================================

export interface BacktestLog {
    /** Node that was executed */
    nodeId: string;
    /** Execution status */
    status: 'completed' | 'error' | 'skipped';
    /** Timestamp of execution */
    timestamp: number;
    /** Result data */
    result?: unknown;
    /** Error message if failed */
    error?: string;
}

// ============================================================================
// Equity and Metrics Types
// ============================================================================

export interface EquityPoint {
    /** Timestamp */
    timestamp: number;
    /** Total equity value */
    equity: number;
}

export interface BacktestMetrics {
    /** Total number of trades */
    totalTrades: number;
    /** Win rate (0-1) */
    winRate: number;
    /** Total realized PNL */
    totalPNL: number;
    /** Maximum drawdown (0-1) */
    maxDrawdown: number;
    /** Sharpe ratio (optional) */
    sharpe?: number;
    /** Profit factor (gross profit / gross loss) */
    profitFactor?: number;
    /** Average trade PNL */
    avgTradePNL?: number;
}

// ============================================================================
// Result Types
// ============================================================================

export interface BacktestResult {
    /** List of executed trades */
    trades: BacktestTrade[];
    /** Equity curve over time */
    equityCurve: EquityPoint[];
    /** Performance metrics */
    metrics: BacktestMetrics;
    /** Execution logs */
    logs: BacktestLog[];
    /** Configuration used */
    config: {
        symbol: string;
        broker: BrokerName;
        interval: string;
        from: number;
        to: number;
        initialCapital: number;
        candleCount: number;
    };
}

// ============================================================================
// Execution Options
// ============================================================================

export interface BacktestExecutionOptions {
    /** Execution mode */
    mode: 'backtest';
    /** Historical candles loaded upfront */
    historicalCandles: NormalizedCandles;
    /** Current candle index (for iterative execution) */
    index: number;
    /** Trade callback for order simulation */
    onTrade?: (trade: BacktestTrade) => void;
}
