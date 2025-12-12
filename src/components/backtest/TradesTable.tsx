'use client';

/**
 * Trades Table Component
 * Displays backtest trades in a table
 */

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Trade {
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    timestamp: number;
    pnl?: number;
}

interface TradesTableProps {
    trades: Trade[];
}

export function TradesTable({ trades }: TradesTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Trade History ({trades.length} trades)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">P&L</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trades.map((trade, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-mono text-sm">
                                        {new Date(trade.timestamp).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={trade.type === 'BUY' ? 'default' : 'secondary'}
                                            className={
                                                trade.type === 'BUY'
                                                    ? 'bg-green-500/20 text-green-500'
                                                    : 'bg-red-500/20 text-red-500'
                                            }
                                        >
                                            {trade.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {trade.quantity}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        ₹{trade.price.toFixed(2)}
                                    </TableCell>
                                    <TableCell
                                        className={`text-right font-mono ${trade.pnl !== undefined
                                                ? trade.pnl >= 0
                                                    ? 'text-green-500'
                                                    : 'text-red-500'
                                                : ''
                                            }`}
                                    >
                                        {trade.pnl !== undefined
                                            ? `${trade.pnl >= 0 ? '+' : ''}₹${trade.pnl.toFixed(2)}`
                                            : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
