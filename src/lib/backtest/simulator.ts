/**
 * Order Simulator
 * Simulates order execution for backtesting
 */

import type { BacktestTrade, Position } from './types';

export interface SimulateOrderParams {
    /** Order type */
    type: 'BUY' | 'SELL';
    /** Order quantity */
    quantity: number;
    /** Execution price */
    price: number;
    /** Execution timestamp */
    timestamp: number;
    /** Current position */
    position: Position;
    /** Trade log to append to */
    trades: BacktestTrade[];
}

export interface SimulateOrderResult {
    /** Updated position */
    position: Position;
    /** New trade entry */
    trade: BacktestTrade;
    /** Realized PNL (if closing position) */
    realizedPNL: number;
}

/**
 * Simulate an order execution
 *
 * @param params - Order parameters
 * @returns Updated position and trade
 */
export function simulateOrder(params: SimulateOrderParams): SimulateOrderResult {
    const { type, quantity, price, timestamp, position, trades } = params;

    let realizedPNL = 0;
    let newPosition: Position;
    let trade: BacktestTrade;

    if (type === 'BUY') {
        // Buying: Add to position
        const totalCost = position.quantity * position.averagePrice + quantity * price;
        const totalQty = position.quantity + quantity;
        const newAvgPrice = totalQty > 0 ? totalCost / totalQty : 0;

        newPosition = {
            quantity: totalQty,
            averagePrice: newAvgPrice,
        };

        trade = {
            type: 'BUY',
            quantity,
            price,
            timestamp,
        };
    } else {
        // Selling: Close or reduce position
        const sellQty = Math.min(quantity, position.quantity);

        if (sellQty > 0 && position.averagePrice > 0) {
            realizedPNL = (price - position.averagePrice) * sellQty;
        }

        const remainingQty = position.quantity - sellQty;

        newPosition = {
            quantity: remainingQty,
            averagePrice: remainingQty > 0 ? position.averagePrice : 0,
        };

        trade = {
            type: 'SELL',
            quantity: sellQty,
            price,
            timestamp,
            pnl: realizedPNL,
        };
    }

    // Append trade to log
    trades.push(trade);

    return {
        position: newPosition,
        trade,
        realizedPNL,
    };
}

/**
 * Create an initial flat position
 */
export function createInitialPosition(): Position {
    return {
        quantity: 0,
        averagePrice: 0,
    };
}
