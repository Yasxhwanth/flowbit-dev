'use client';

/**
 * Backtest Viewer Page
 * Displays backtest results with charts and metrics
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MetricsCard, EquityCurveChart, TradesTable } from '@/components/backtest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIExplanationPanel } from "@/components/ai/AIExplanationPanel";

interface BacktestData {
    id: string;
    userId: string;
    createdAt: string;
    workflowJson: {
        nodes: any[];
        edges: any[];
    };
    params: {
        symbol: string;
        broker: string;
        interval: string;
        from: number;
        to: number;
        initialCapital: number;
    };
    result: {
        trades: Array<{
            type: 'BUY' | 'SELL';
            quantity: number;
            price: number;
            timestamp: number;
            pnl?: number;
        }>;
        equityCurve: Array<{
            timestamp: number;
            equity: number;
        }>;
        metrics: {
            totalTrades: number;
            winRate: number;
            totalPNL: number;
            maxDrawdown: number;
            sharpe?: number;
            profitFactor?: number;
            avgTradePNL?: number;
        };
        config: {
            symbol: string;
            broker: string;
            interval: string;
            from: number;
            to: number;
            initialCapital: number;
            candleCount: number;
        };
    };
}

export default function BacktestViewerPage() {
    const params = useParams();
    const id = params.id as string;

    const [data, setData] = useState<BacktestData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showJson, setShowJson] = useState(false);

    useEffect(() => {
        async function fetchBacktest() {
            try {
                const response = await fetch(`/api/backtest/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch backtest');
                }
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchBacktest();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-red-500">{error || 'Backtest not found'}</p>
                <Link href="/workflows">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Workflows
                    </Button>
                </Link>
            </div>
        );
    }

    const { params: btParams, result, workflowJson } = data;
    const fromDate = new Date(btParams.from).toLocaleDateString();
    const toDate = new Date(btParams.to).toLocaleDateString();

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <Link href="/workflows">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </Link>

                <div className="flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">
                            Backtest: {btParams.symbol}
                        </h1>
                        <div className="flex items-center gap-4 text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {fromDate} - {toDate}
                            </span>
                            <span>{btParams.interval}</span>
                            <span className="uppercase">{btParams.broker}</span>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="explanation">AI Explanation</TabsTrigger>
                    <TabsTrigger value="trades">Trades</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    {/* Metrics */}
                    <div className="mb-8">
                        <MetricsCard
                            metrics={result.metrics}
                            initialCapital={btParams.initialCapital}
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid gap-6 mb-8">
                        <EquityCurveChart
                            equityCurve={result.equityCurve}
                            initialCapital={btParams.initialCapital}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="explanation" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Strategy Explanation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AIExplanationPanel
                                executionId={data.id}
                                workflowName={`Backtest: ${btParams.symbol}`}
                                nodes={workflowJson?.nodes || []}
                                edges={workflowJson?.edges || []}
                                trades={result.trades}
                                logs={[]} // Backtest logs might be large, omitting for now
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trades">
                    {/* Trades Table */}
                    <div className="mb-8">
                        <TradesTable trades={result.trades} />
                    </div>
                </TabsContent>
            </Tabs>

            {/* Debug JSON */}
            <Card className="mt-8">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Debug Info</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowJson(!showJson)}
                        >
                            {showJson ? 'Hide' : 'Show'} JSON
                        </Button>
                    </div>
                </CardHeader>
                {showJson && (
                    <CardContent>
                        <pre className="text-xs overflow-auto max-h-[400px] bg-muted p-4 rounded-lg">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
