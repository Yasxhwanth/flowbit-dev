'use client';

/**
 * OrderTable Component
 * Displays order history with filters
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
    id: string;
    workflowId: string;
    workflowName: string;
    executionId: string;
    timestamp: string;
    side: string;
    quantity: number;
    price: number;
    broker: string;
    status: string;
    symbol: string;
}

interface OrderTableProps {
    orders: Order[];
}

const statusStyles: Record<string, string> = {
    FILLED: 'bg-green-500/10 text-green-500 border-green-500/30',
    REJECTED: 'bg-red-500/10 text-red-500 border-red-500/30',
    PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    SIMULATED: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
};

export function OrderTable({ orders }: OrderTableProps) {
    const router = useRouter();
    const [symbolFilter, setSymbolFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [brokerFilter, setBrokerFilter] = useState('all');

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            if (symbolFilter && !order.symbol.toLowerCase().includes(symbolFilter.toLowerCase())) {
                return false;
            }
            if (statusFilter !== 'all' && order.status !== statusFilter) {
                return false;
            }
            if (brokerFilter !== 'all' && order.broker !== brokerFilter) {
                return false;
            }
            return true;
        });
    }, [orders, symbolFilter, statusFilter, brokerFilter]);

    const uniqueBrokers = Array.from(new Set(orders.map((o) => o.broker)));

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ArrowUpDown className="h-12 w-12 mb-4 opacity-50" />
                <p>No orders found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <Input
                    placeholder="Filter by symbol..."
                    value={symbolFilter}
                    onChange={(e) => setSymbolFilter(e.target.value)}
                    className="max-w-xs"
                />

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="FILLED">Filled</SelectItem>
                        <SelectItem value="SIMULATED">Simulated</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={brokerFilter} onValueChange={setBrokerFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Broker" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Brokers</SelectItem>
                        {uniqueBrokers.map((broker) => (
                            <SelectItem key={broker} value={broker} className="capitalize">
                                {broker}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(symbolFilter || statusFilter !== 'all' || brokerFilter !== 'all') && (
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setSymbolFilter('');
                            setStatusFilter('all');
                            setBrokerFilter('all');
                        }}
                    >
                        Clear Filters
                    </Button>
                )}
            </div>

            <div className="text-sm text-muted-foreground">
                Showing {filteredOrders.length} of {orders.length} orders
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Workflow</TableHead>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Side</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead>Broker</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="text-sm">
                                    {format(new Date(order.timestamp), 'MMM d, HH:mm')}
                                </TableCell>
                                <TableCell>
                                    <button
                                        onClick={() => router.push(`/workflows/${order.workflowId}`)}
                                        className="text-sm hover:underline text-primary"
                                    >
                                        {order.workflowName}
                                    </button>
                                </TableCell>
                                <TableCell className="font-mono font-medium">
                                    {order.symbol}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={
                                            order.side === 'BUY'
                                                ? 'bg-green-500/10 text-green-500'
                                                : 'bg-red-500/10 text-red-500'
                                        }
                                    >
                                        {order.side === 'BUY' ? (
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                        ) : (
                                            <TrendingDown className="h-3 w-3 mr-1" />
                                        )}
                                        {order.side}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{order.quantity}</TableCell>
                                <TableCell className="text-right font-mono">
                                    ₹{order.price.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="capitalize">
                                        {order.broker}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={statusStyles[order.status] || ''}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push(`/executions/${order.executionId}`)}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
