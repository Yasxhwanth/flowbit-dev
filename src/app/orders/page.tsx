'use client';

/**
 * Order History Page
 * Shows all orders from workflow executions
 */

import { useEffect, useState } from 'react';
import { RefreshCw, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderTable } from '@/components/orders';

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

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    async function fetchOrders() {
        try {
            const res = await fetch('/api/orders/list');
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        fetchOrders();
    }, []);

    function handleRefresh() {
        setRefreshing(true);
        fetchOrders();
    }

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingCart className="h-6 w-6" />
                        Order History
                    </h1>
                    <p className="text-muted-foreground">
                        View all orders placed by your trading strategies
                    </p>
                </div>
                <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Orders Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Orders</CardTitle>
                    <CardDescription>
                        History of all buy and sell orders executed by workflows
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <OrderTable orders={orders} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
