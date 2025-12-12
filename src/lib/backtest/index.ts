/**
 * Backtest Module Exports
 */

export { runBacktest } from './executor';
export { loadHistoricalCandles, sliceCandles } from './historical-loader';
export { simulateOrder, createInitialPosition } from './simulator';
export { computeMetrics, buildEquityCurve } from './metrics';

export type {
    BacktestRequest,
    BacktestResult,
    BacktestTrade,
    BacktestMetrics,
    BacktestLog,
    EquityPoint,
    Position,
    BacktestExecutionOptions,
} from './types';
